# SPEC-002: System Email OAuth2 Authentication

## Status: Draft
## Priority: High (Gmail SMTP password auth deprecated)
## Epic: Infrastructure

---

## Problem Statement

Twenty CRM's system email service (used for workspace invitations, password resets, email verification, and workspace cleanup notifications) currently uses SMTP with username/password authentication via environment variables:

```
EMAIL_DRIVER=SMTP
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=noreply@phos-ind.com
EMAIL_SMTP_PASSWORD=<app-password>
```

**Google has deprecated "less secure app" password authentication** for Gmail SMTP. To continue sending system emails via Gmail, we must use OAuth2 authentication with:
- Client ID
- Client Secret
- Refresh Token (obtained via OAuth consent flow)

### Current Architecture

```
EmailService (queues)
    → MessageQueue (BullMQ)
    → EmailSenderJob (processes)
    → EmailSenderService
    → EmailDriverFactory
    → SmtpDriver (nodemailer with user/pass auth)
```

### Target Architecture

```
EmailService (queues)
    → MessageQueue (BullMQ)
    → EmailSenderJob (processes)
    → EmailSenderService
    → EmailDriverFactory
    → GmailOAuth2Driver (nodemailer with OAuth2 auth)  ← NEW
```

---

## Requirements

### Functional Requirements

1. **FR-1**: Add new `GMAIL_OAUTH2` email driver option alongside existing `SMTP` and `LOGGER` drivers
2. **FR-2**: Support OAuth2 authentication via:
   - `AUTH_GOOGLE_CLIENT_ID` (already exists in config)
   - `AUTH_GOOGLE_CLIENT_SECRET` (already exists in config)
   - `EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN` (new - obtained from OAuth consent)
   - `EMAIL_GMAIL_OAUTH2_USER` (new - the sending email address)
3. **FR-3**: Nodemailer OAuth2 transport configuration must match Gmail requirements
4. **FR-4**: Automatic token refresh handling (nodemailer handles this internally)
5. **FR-5**: Fallback to SMTP driver if OAuth2 configuration is incomplete

### Non-Functional Requirements

1. **NFR-1**: No changes to EmailService, EmailSenderJob, or EmailSenderService APIs
2. **NFR-2**: Maintain backward compatibility - existing SMTP configurations continue to work
3. **NFR-3**: Clear error messages when OAuth2 configuration is missing or invalid
4. **NFR-4**: Feature flag disabled by default until OAuth2 is configured

---

## Technical Design

### 1. New Environment Variables

**File**: `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`

```typescript
// Add to EMAIL_SETTINGS group (around line 305-371)

@ConfigVariable({
  group: ConfigVariablesGroup.EMAIL_SETTINGS,
  description: 'Gmail OAuth2 user email address for sending system emails',
  isSensitive: true,
})
@ValidateIf((env) => env.EMAIL_DRIVER === 'GMAIL_OAUTH2')
@IsString()
EMAIL_GMAIL_OAUTH2_USER: string;

@ConfigVariable({
  group: ConfigVariablesGroup.EMAIL_SETTINGS,
  description: 'Gmail OAuth2 refresh token for sending system emails',
  isSensitive: true,
})
@ValidateIf((env) => env.EMAIL_DRIVER === 'GMAIL_OAUTH2')
@IsString()
EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN: string;
```

### 2. Update Email Driver Enum

**File**: `packages/twenty-server/src/engine/core-modules/email/enums/email-driver.enum.ts`

```typescript
export enum EmailDriver {
  LOGGER = 'LOGGER',
  SMTP = 'SMTP',
  GMAIL_OAUTH2 = 'GMAIL_OAUTH2',  // NEW
}
```

### 3. Create Gmail OAuth2 Driver

**File**: `packages/twenty-server/src/engine/core-modules/email/drivers/gmail-oauth2.driver.ts`

```typescript
import { Logger } from '@nestjs/common';
import {
  createTransport,
  type SendMailOptions,
  type Transporter,
} from 'nodemailer';
import { type EmailDriverInterface } from './interfaces/email-driver.interface';

export type GmailOAuth2Options = {
  user: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export class GmailOAuth2Driver implements EmailDriverInterface {
  private readonly logger = new Logger(GmailOAuth2Driver.name);
  private transport: Transporter;

  constructor(options: GmailOAuth2Options) {
    this.transport = createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: options.user,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        refreshToken: options.refreshToken,
      },
    });
  }

  async send(sendMailOptions: SendMailOptions): Promise<void> {
    try {
      await this.transport.sendMail(sendMailOptions);
      this.logger.log(
        `Email to '${sendMailOptions.to}' successfully sent via Gmail OAuth2`,
      );
    } catch (err) {
      this.logger.error(
        `Error sending email to '${sendMailOptions.to}' via Gmail OAuth2: ${err}`,
      );
      throw err;
    }
  }
}
```

### 4. Update Email Driver Factory

**File**: `packages/twenty-server/src/engine/core-modules/email/email-driver.factory.ts`

```typescript
import { GmailOAuth2Driver, type GmailOAuth2Options } from './drivers/gmail-oauth2.driver';

// In buildConfigKey():
case EmailDriver.GMAIL_OAUTH2: {
  const emailConfigHash = this.getConfigGroupHash(
    ConfigVariablesGroup.EMAIL_SETTINGS,
  );
  return `gmail-oauth2|${emailConfigHash}`;
}

// In createDriver():
case EmailDriver.GMAIL_OAUTH2: {
  const user = this.twentyConfigService.get('EMAIL_GMAIL_OAUTH2_USER');
  const clientId = this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_ID');
  const clientSecret = this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_SECRET');
  const refreshToken = this.twentyConfigService.get('EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN');

  if (!user || !clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Gmail OAuth2 driver requires EMAIL_GMAIL_OAUTH2_USER, ' +
      'AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET, and ' +
      'EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN to be defined'
    );
  }

  const options: GmailOAuth2Options = {
    user,
    clientId,
    clientSecret,
    refreshToken,
  };

  return new GmailOAuth2Driver(options);
}
```

---

## Obtaining the Refresh Token

### One-Time Setup Process

Since system emails are sent from a single "noreply" account, the refresh token only needs to be obtained once during initial setup:

1. **Create OAuth2 credentials** in Google Cloud Console:
   - Create a project (or use existing)
   - Enable Gmail API
   - Create OAuth2 Client ID (Web application type)
   - Add authorized redirect URI: `https://developers.google.com/oauthplayground`

2. **Get refresh token via OAuth Playground**:
   - Go to https://developers.google.com/oauthplayground
   - Click gear icon → "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - In Step 1, add scope: `https://mail.google.com/`
   - Click "Authorize APIs" and sign in with the noreply account
   - In Step 2, click "Exchange authorization code for tokens"
   - Copy the **Refresh Token**

3. **Configure environment variables**:
   ```bash
   EMAIL_DRIVER=GMAIL_OAUTH2
   EMAIL_GMAIL_OAUTH2_USER=noreply@phos-ind.com
   EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN=<refresh-token-from-playground>
   AUTH_GOOGLE_CLIENT_ID=<your-client-id>
   AUTH_GOOGLE_CLIENT_SECRET=<your-client-secret>
   EMAIL_FROM_ADDRESS=noreply@phos-ind.com
   EMAIL_FROM_NAME=Phos Industries
   ```

### Token Lifetime

- Google OAuth2 refresh tokens **do not expire** unless:
  - User revokes access
  - Token is unused for 6 months
  - Max token limit reached (50 per user/client pair)

For system email accounts that send regularly, the token will remain valid indefinitely.

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `packages/twenty-server/src/engine/core-modules/email/drivers/gmail-oauth2.driver.ts` | Gmail OAuth2 driver implementation |

### Modified Files

| File | Changes |
|------|---------|
| `packages/twenty-server/src/engine/core-modules/email/enums/email-driver.enum.ts` | Add `GMAIL_OAUTH2` enum value |
| `packages/twenty-server/src/engine/core-modules/email/email-driver.factory.ts` | Add `GMAIL_OAUTH2` case in switch |
| `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts` | Add `EMAIL_GMAIL_OAUTH2_USER` and `EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN` |

---

## Testing Plan

### Unit Tests

1. **GmailOAuth2Driver**:
   - Mock nodemailer createTransport
   - Verify correct OAuth2 config passed
   - Verify error handling

2. **EmailDriverFactory**:
   - Test GMAIL_OAUTH2 driver creation
   - Test error when missing config
   - Test config key generation

### Integration Tests

1. **Manual Testing**:
   - Send workspace invitation email
   - Send password reset email
   - Send email verification email
   - Verify emails arrive and render correctly

### Environment Validation

```bash
# Test configuration validity on server startup
npx nx run twenty-server:command config:validate
```

---

## Rollout Plan

### Phase 1: Development (This Sprint)
- [ ] Implement `GmailOAuth2Driver`
- [ ] Update `EmailDriverFactory`
- [ ] Add config variables
- [ ] Add unit tests
- [ ] Test locally with OAuth Playground token

### Phase 2: Staging
- [ ] Deploy to staging environment
- [ ] Create staging OAuth credentials
- [ ] Verify all email types work
- [ ] Monitor for token refresh issues

### Phase 3: Production
- [ ] Create production OAuth credentials in GCP
- [ ] Obtain production refresh token
- [ ] Deploy with `EMAIL_DRIVER=GMAIL_OAUTH2`
- [ ] Verify emails sending
- [ ] Remove legacy SMTP credentials

---

## Alternatives Considered

### Option A: Use Connected Account OAuth (Rejected)

Could reuse the connected account OAuth infrastructure, but:
- Connected accounts are per-workspace-member
- System emails need a global sending account
- Would require creating a "system" workspace member
- Over-complicated for the use case

### Option B: Use SendGrid/AWS SES (Future Consideration)

Third-party email services with API keys:
- Simpler authentication (API keys)
- Better deliverability tracking
- Additional cost
- Could be added as separate drivers later

### Option C: SMTP with Google App Password (Not Recommended)

Google App Passwords still work but:
- Requires 2FA on the account
- Less secure than OAuth2
- May be deprecated in future
- Not recommended by Google

---

## Security Considerations

1. **Refresh Token Storage**: Must be stored securely (environment variable marked as sensitive)
2. **Client Secret**: Already marked sensitive in config
3. **Scope Limitation**: Only request `https://mail.google.com/` scope (minimal permissions)
4. **Token Rotation**: Consider periodic token rotation as best practice (manual process)

---

## Related Documentation

- [Nodemailer OAuth2 Documentation](https://nodemailer.com/smtp/oauth2/)
- [Google OAuth2 for SMTP](https://developers.google.com/gmail/imap/xoauth2-protocol)
- [OAuth2 Playground](https://developers.google.com/oauthplayground)
- [Twenty Email Architecture](./email-architecture.md) (internal)

---

## Acceptance Criteria

- [ ] `EMAIL_DRIVER=GMAIL_OAUTH2` creates Gmail OAuth2 transport
- [ ] Workspace invitation emails send successfully
- [ ] Password reset emails send successfully
- [ ] Email verification emails send successfully
- [ ] Clear error message if OAuth2 config is incomplete
- [ ] Existing `EMAIL_DRIVER=SMTP` configurations continue to work
- [ ] Unit tests pass
- [ ] No changes required to email sending services/jobs

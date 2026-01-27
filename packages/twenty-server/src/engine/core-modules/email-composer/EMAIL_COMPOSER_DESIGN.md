# Email Composer Module - High-Level Design Document

> **Version:** 1.1.0
> **Status:** In Development (Services Wired)
> **Feature Flag:** `IS_EMAIL_COMPOSER_ENABLED`

## Overview

A modular, decoupled email composition system for Twenty CRM that supports templates, rich text editing, and file attachments. Designed for eventual extraction as a standalone package.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
├─────────────────────────────────────────────────────────────────────┤
│  EmailComposeModal ──► useSendEmail ──► GraphQL Mutation            │
│         │                                                            │
│         ├── EmailTemplateSelector ──► useEmailTemplates              │
│         ├── BlockEditor (Rich Text)                                  │
│         └── Attachments                                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ GraphQL
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
├─────────────────────────────────────────────────────────────────────┤
│  EmailComposerResolver                                               │
│         │                                                            │
│         ▼                                                            │
│  EmailComposerService (Orchestrator)                                 │
│         │                                                            │
│         ├── EmailTemplateService (Template CRUD + Variables)         │
│         │                                                            │
│         └── SendEmailTool (Core Email Sending)                       │
│                    │                                                 │
│                    ├── MessagingSendMessageService                   │
│                    └── FileService (Attachments)                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Backend (`packages/twenty-server/src/engine/core-modules/email-composer/`)

```
email-composer/
├── EMAIL_COMPOSER_DESIGN.md          # This document
├── email-composer.module.ts          # NestJS module definition
├── email-composer.resolver.ts        # GraphQL resolver (sendEmail mutation)
│
├── dtos/
│   ├── send-email.input.ts           # SendEmailInput, EmailFileInput, EmailTemplateContextInput
│   ├── send-email.output.ts          # SendEmailOutput
│   ├── validate-template.dto.ts      # ValidateTemplateInput/Output
│   └── index.ts                      # Barrel exports
│
└── services/
    ├── email-composer.service.ts     # Orchestrates template + sending
    └── email-template.service.ts     # Template variable resolution
```

### Frontend (`packages/twenty-front/src/modules/email-composer/`)

```
email-composer/
├── index.ts                          # Public exports
│
├── components/
│   ├── EmailComposeModal.tsx         # Main composer modal
│   ├── EmailTemplateSelector.tsx     # Template dropdown
│   ├── EmailRecipientField.tsx       # To/CC/BCC input (future)
│   └── EmailEditorContainer.tsx      # BlockNote wrapper (future)
│
├── hooks/
│   ├── useEmailComposer.ts           # Modal open/close
│   ├── useSendEmail.ts               # GraphQL mutation
│   └── useEmailTemplates.ts          # Fetch templates
│
├── graphql/
│   └── mutations/
│       └── sendEmail.ts              # SEND_EMAIL_MUTATION
│
└── types/
    └── EmailComposerTypes.ts         # TypeScript interfaces
```

---

## Data Flow

### 1. Compose & Send Email

```
User Action                 Frontend                      Backend
───────────────────────────────────────────────────────────────────
Click "Compose"     ──►  openModal(EMAIL_COMPOSE_MODAL_ID)
                              │
Select Template     ──►  useEmailTemplates.templates
                              │
                         handleTemplateSelect()
                              │ (frontend variable substitution)
                              ▼
Edit Content        ──►  BlockEditor state
                              │
Click "Send"        ──►  useSendEmail.sendEmail({
                           email, subject, body,
                           connectedAccountId, files
                         })
                              │
                              ▼ GraphQL
                         EmailComposerResolver.sendEmail()
                              │
                              ▼
                         EmailComposerService.send()
                              │
                              ├── Resolve template variables
                              ├── Parse BlockNote → HTML
                              ├── Sanitize content
                              └── SendEmailTool.execute()
                                       │
                                       ▼
                              MessagingSendMessageService
                                       │
                                       ▼
                              SMTP / Gmail API
```

### 2. Template Resolution

```
Input                           Process                         Output
─────────────────────────────────────────────────────────────────────
Template Body:              EmailTemplateService
"Hi {{person.firstName}}"   .resolveTemplate(body, context)
                                   │
Context:                           ├── extractVariables()
{ person: {                        ├── validateVariables()
    firstName: "John"              └── substituteValues()
  }                                        │
}                                          ▼
                                   "Hi John"
```

---

## Key Interfaces

### SendEmailInput (GraphQL)

```typescript
@InputType()
class SendEmailInput {
  @Field() email: string;           // Primary recipient
  @Field() subject: string;
  @Field() body: string;            // BlockNote JSON or HTML
  @Field({ nullable: true }) connectedAccountId?: string;
  @Field(() => [EmailFileInput], { nullable: true }) files?: EmailFileInput[];
  // Future: cc, bcc as EmailRecipientInput[]
}
```

### EmailTemplateContext (Backend)

```typescript
interface EmailTemplateContext {
  person?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  company?: {
    id?: string;
    name?: string;
  };
  sender?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  custom?: Record<string, unknown>;
}
```

### EmailComposeContext (Frontend)

```typescript
type EmailComposeContext = {
  personId?: string;
  personFirstName?: string;
  personLastName?: string;
  personEmail?: string;
  companyName?: string;
};
```

---

## Feature Flag

```typescript
// Backend: FeatureFlagKey enum
IS_EMAIL_COMPOSER_ENABLED = 'IS_EMAIL_COMPOSER_ENABLED'

// Frontend usage:
const isEnabled = useIsFeatureEnabled(FeatureFlagKey.IS_EMAIL_COMPOSER_ENABLED);
```

---

## Supported Template Variables

| Variable | Description |
|----------|-------------|
| `{{person.firstName}}` | Recipient's first name |
| `{{person.lastName}}` | Recipient's last name |
| `{{person.email}}` | Recipient's email |
| `{{company.name}}` | Company name |
| `{{sender.firstName}}` | Sender's first name |
| `{{sender.lastName}}` | Sender's last name |
| `{{sender.email}}` | Sender's email |
| `{{custom.*}}` | Custom variables |

---

## Dependencies

### Backend
- `@nestjs/common`, `@nestjs/graphql` - Framework
- `class-validator` - Input validation
- `dompurify` - HTML sanitization
- Twenty Core: `SendEmailTool`, `MessagingSendMessageService`, `FileService`

### Frontend
- `@apollo/client` - GraphQL
- `@blocknote/react` - Rich text editor
- `@emotion/styled` - Styling
- Twenty UI: `Select`, `Button`, `Modal`, `FormTextFieldInput`

---

## Migration Path to External Package

When extracting to `@phos/email-composer`:

1. **Backend**: Export `EmailComposerModule` with factory for dependency injection
2. **Frontend**: Export components with prop-based configuration (no Twenty context required)
3. **Shared**: Extract types to `@phos/email-composer-types`
4. **Adapters**: Create Twenty-specific adapter that wires dependencies

```typescript
// Future external usage
import { EmailComposerModule } from '@phos/email-composer';

@Module({
  imports: [
    EmailComposerModule.forRoot({
      messagingService: MyMessagingService,
      fileService: MyFileService,
    }),
  ],
})
export class AppModule {}
```

---

## Roadmap

- [x] Basic send email mutation
- [x] BlockNote rich text editor
- [x] File attachments
- [x] Template selector (frontend)
- [x] Backend template variable resolution (v1.1.0)
- [x] Decoupled service architecture (v1.1.0)
- [x] Template validation query (v1.1.0)
- [ ] CC/BCC support (frontend ready, backend pending)
- [ ] Template CRUD operations
- [ ] Email scheduling/queue
- [ ] Delivery tracking
- [ ] react-email HTML rendering

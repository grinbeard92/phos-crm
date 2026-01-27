# Epic 000: Email Composer & Templates Module

**Epic ID**: EPIC-000
**Phase**: Phase 0 (CRITICAL - Before all other Epics)
**Priority**: P0 (BLOCKER - Sales velocity depends on this)
**Status**: In Progress (Stories 0.1-0.5 Complete - Core Email Send Working)
**Owner**: CRM-Forge
**Created**: 2026-01-26
**Target Completion**: Week 1

---

## Epic Overview

Build a threaded email composition system integrated with Twenty's existing messaging infrastructure. This module extends the current email sync (Gmail API) with outbound composition capabilities, leveraging react-email for templating and the existing nodemailer/Gmail API connection for sending.

**Why Critical:** You can't close deals without sending emails. The current system syncs inbound emails but lacks a user-facing composer. This is the #1 blocker for sales velocity.

---

## Business Value

- **Sales Velocity**: Reps can compose and send emails directly from opportunity/person/company records
- **Context Preservation**: Threaded replies maintain conversation history
- **Template Efficiency**: Reusable templates for common sales scenarios (intro, follow-up, quote delivery)
- **Attribution**: All sent emails logged in CRM timeline
- **Consistency**: Professional templates ensure brand consistency

---

## Success Criteria

- [ ] Can compose new emails from any Person/Company/Opportunity record
- [ ] Can reply to existing email threads (maintaining threading)
- [ ] Email templates work with variable substitution ({{firstName}}, {{companyName}}, etc.)
- [ ] Templates manageable via Settings page
- [ ] Sent emails appear in record timeline immediately
- [ ] Gmail OAuth scope includes send permission
- [ ] Rich text editor with formatting (bold, italic, links, lists)
- [ ] File attachments supported

---

## Technical Architecture

### Existing Infrastructure (Leverage These)

| Component | Location | Purpose |
|-----------|----------|---------|
| `MessagingSendMessageService` | `twenty-server/src/modules/messaging/` | Core send logic via nodemailer |
| `SendEmailTool` | `twenty-server/src/engine/core-modules/tool/tools/send-email-tool/` | Standalone email send |
| `Email Renderer` | `twenty-emails/src/email-renderer/` | TipTap JSON → HTML |
| `WorkflowEditActionSendEmail` | `twenty-front/src/modules/workflow/` | Workflow email composer (reference) |
| Message Schema | `messageChannel`, `message`, `messageThread`, `messageParticipant` | Standard objects |
| Gmail Driver | `twenty-server/src/modules/messaging/message-import-manager/drivers/gmail/` | Gmail API integration |

### New Components to Build

```
packages/twenty-front/src/modules/email-composer/
├── components/
│   ├── EmailComposerModal.tsx           # Main composer modal
│   ├── EmailComposerForm.tsx            # Form with to/cc/bcc/subject/body
│   ├── EmailComposerRichText.tsx        # TipTap-based rich text editor
│   ├── EmailRecipientInput.tsx          # Autocomplete for recipients
│   ├── EmailTemplateSelector.tsx        # Template dropdown with preview
│   ├── EmailAttachmentUploader.tsx      # Drag-drop file attachments
│   └── EmailThreadReplyButton.tsx       # "Reply" button on email threads
├── hooks/
│   ├── useEmailComposer.ts              # Composer state management
│   ├── useEmailTemplates.ts             # Template CRUD operations
│   ├── useSendEmail.ts                  # Send mutation wrapper
│   └── useRecipientSearch.ts            # Person/contact search
├── states/
│   ├── emailComposerState.ts            # Recoil atoms for composer
│   └── emailTemplateState.ts            # Template cache state
├── graphql/
│   ├── mutations/sendEmail.ts           # Send email mutation
│   ├── mutations/createEmailTemplate.ts
│   ├── mutations/updateEmailTemplate.ts
│   ├── mutations/deleteEmailTemplate.ts
│   └── queries/emailTemplates.ts
└── types/
    └── emailComposer.types.ts           # TypeScript types

packages/twenty-front/src/modules/settings/email-templates/
├── components/
│   ├── SettingsEmailTemplatesPage.tsx   # Settings page for templates
│   ├── SettingsEmailTemplateForm.tsx    # Create/edit template form
│   ├── SettingsEmailTemplateList.tsx    # Template list with actions
│   └── SettingsEmailTemplatePreview.tsx # Live preview panel
└── hooks/
    └── useEmailTemplateSettings.ts

packages/twenty-server/src/modules/email-template/
├── email-template.module.ts
├── email-template.resolver.ts
├── email-template.service.ts
├── dtos/
│   ├── create-email-template.input.ts
│   └── update-email-template.input.ts
└── entities/
    └── email-template.entity.ts         # Custom object via metadata API
```

---

## Data Model

### EmailTemplate Custom Object

Create via Twenty metadata API (not raw TypeORM):

```typescript
// Object: emailTemplate
{
  nameSingular: 'emailTemplate',
  namePlural: 'emailTemplates',
  labelSingular: 'Email Template',
  labelPlural: 'Email Templates',
  isCustom: true,
  fields: [
    { name: 'name', type: 'TEXT', label: 'Template Name', isRequired: true },
    { name: 'subject', type: 'TEXT', label: 'Subject Line', isRequired: true },
    { name: 'body', type: 'RICH_TEXT', label: 'Email Body', isRequired: true },
    { name: 'category', type: 'SELECT', label: 'Category', options: [
      { label: 'Sales', value: 'SALES', color: 'blue' },
      { label: 'Follow-up', value: 'FOLLOW_UP', color: 'green' },
      { label: 'Quote', value: 'QUOTE', color: 'orange' },
      { label: 'Invoice', value: 'INVOICE', color: 'purple' },
      { label: 'Support', value: 'SUPPORT', color: 'yellow' },
      { label: 'General', value: 'GENERAL', color: 'gray' }
    ]},
    { name: 'isActive', type: 'BOOLEAN', label: 'Active', defaultValue: true },
    { name: 'variables', type: 'TEXT', label: 'Available Variables (JSON)', description: 'JSON array of variable names' }
  ]
}
```

### Variable Substitution System

Templates support Handlebars-style variables:

```
{{firstName}}      - Recipient first name
{{lastName}}       - Recipient last name
{{fullName}}       - Recipient full name
{{email}}          - Recipient email
{{companyName}}    - Company name
{{opportunityName}} - Opportunity name
{{amount}}         - Opportunity amount (formatted)
{{senderName}}     - Current user's name
{{senderEmail}}    - Current user's email
{{today}}          - Current date
{{quoteNumber}}    - Quote number (if from quote context)
{{invoiceNumber}}  - Invoice number (if from invoice context)
```

---

## User Stories

### Story 0.1: Create EmailTemplate Custom Object ✅ COMPLETE
**Estimate**: 1 hour | **Priority**: P0 | **Completed**: 2026-01-26

**Implementation**:
- EmailTemplate object ID: 734f2377-6fc0-4011-8e85-986872e975bf
- Fields: name, subject (TEXT), body (RICH_TEXT), category (SELECT), isActive (BOOLEAN), variables (TEXT)
- Commit: f24c11fceb

**Acceptance Criteria**:
- [x] EmailTemplate object created via metadata API
- [x] All fields defined (name, subject, body, category, isActive, variables)
- [x] Object visible in Settings > Data Model
- [x] GraphQL queries/mutations working
- [ ] Default templates seeded (Intro, Follow-up, Quote Delivery)

**Technical Notes**:
- Use existing pattern from Priority 1 field creation
- API Key: Use crm-forge key from sidecar memory

---

### Story 0.2: Build Email Composer Modal Component ✅ COMPLETE
**Estimate**: 4 hours | **Priority**: P0 | **Completed**: 2026-01-26

**Implementation**:
- EmailComposeModal component with full form
- EmailTemplateSelector component for template dropdown
- useEmailComposer hook for modal control
- useEmailTemplates hook for fetching templates
- Commits: 0d351a7b5d, 1c7ccc997f

**Acceptance Criteria**:
- [x] Modal opens from "Compose Email" button on Person/Company/Opportunity
- [x] To field with autocomplete (searches People, auto-fills from context)
- [ ] CC/BCC fields (collapsible, optional) - Deferred to 0.2.1
- [x] Subject line input
- [x] Rich text body editor (TipTap-based like existing)
- [x] Template selector dropdown
- [x] Attachment upload zone
- [x] Send button with loading state
- [x] Cancel closes modal with confirmation if unsaved

**UI/UX Design**:
```
┌─────────────────────────────────────────────────────────┐
│ Compose Email                                      [X]  │
├─────────────────────────────────────────────────────────┤
│ From: ben@phos-ind.com (connected account dropdown)     │
│                                                         │
│ To:   [john@customer.com                    ] [+ CC/BCC]│
│                                                         │
│ Subject: [Re: Laser Consulting Quote                  ] │
│                                                         │
│ Template: [Select template... ▼] or start from scratch  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ B I U  • ≡  🔗  📎                                  │ │
│ │                                                     │ │
│ │ Hi {{firstName}},                                   │ │
│ │                                                     │ │
│ │ Thank you for your interest in our consulting      │ │
│ │ services. I've attached the quote we discussed.    │ │
│ │                                                     │ │
│ │ Best regards,                                       │ │
│ │ {{senderName}}                                      │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 📎 quote-Q-2026-001.pdf (245 KB)              [Remove]  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Send Email →]   │
└─────────────────────────────────────────────────────────┘
```

**Technical Notes**:
- Use Twenty-UI components (Modal, TextInput, Button, etc.)
- Reference: `WorkflowEditActionSendEmail.tsx` for rich text pattern
- Recoil state for composer form data
- Emotion for styling consistency

---

### Story 0.3: Implement Send Email GraphQL Mutation
**Estimate**: 3 hours | **Priority**: P0

**Acceptance Criteria**:
- [ ] GraphQL mutation: `sendEmail(input: SendEmailInput!): SendEmailOutput!`
- [ ] Input includes: to, cc, bcc, subject, body (TipTap JSON), attachmentIds, messageThreadId (for replies)
- [ ] Uses `MessagingSendMessageService` under the hood
- [ ] Returns sent message ID and success status
- [ ] Creates Message record in database
- [ ] Links to MessageThread (new or existing)
- [ ] Creates MessageParticipant records
- [ ] Triggers timeline activity update

**GraphQL Schema**:
```graphql
input SendEmailInput {
  connectedAccountId: ID!
  to: [String!]!
  cc: [String!]
  bcc: [String!]
  subject: String!
  body: JSON!  # TipTap JSON format
  attachmentIds: [ID!]
  replyToMessageThreadId: ID  # For threaded replies
}

type SendEmailOutput {
  success: Boolean!
  messageId: ID
  error: String
}

extend type Mutation {
  sendEmail(input: SendEmailInput!): SendEmailOutput!
}
```

**Technical Notes**:
- Create resolver in `packages/twenty-server/src/modules/messaging/resolvers/`
- Use existing `SendEmailTool` logic as reference
- Handle OAuth token refresh if needed
- Validate connected account has send scope

---

### Story 0.4: Build Thread Reply Functionality
**Estimate**: 2 hours | **Priority**: P0

**Acceptance Criteria**:
- [ ] "Reply" button visible on email thread messages
- [ ] Clicking Reply opens composer with:
  - To: pre-filled with original sender
  - Subject: "Re: [original subject]"
  - Body: quoted original message at bottom
  - messageThreadId: linked for threading
- [ ] "Reply All" includes all original participants
- [ ] Sent reply appears in thread immediately (optimistic update)

**Technical Notes**:
- Add reply button to `EmailThreadMessage.tsx`
- Use `In-Reply-To` and `References` headers for threading
- Gmail API requires proper threading headers

---

### Story 0.5: Build Email Template Settings Page
**Estimate**: 3 hours | **Priority**: P0

**Acceptance Criteria**:
- [ ] Settings page at `/settings/email-templates`
- [ ] List view shows all templates with name, category, actions
- [ ] Create new template button
- [ ] Edit/Delete actions on each template
- [ ] Template form with:
  - Name, Subject, Category, Active toggle
  - Rich text body editor
  - Variable helper (shows available variables)
  - Live preview panel
- [ ] Duplicate template action
- [ ] Search/filter by category

**UI/UX Design**:
```
┌─────────────────────────────────────────────────────────┐
│ Settings > Email Templates                              │
├─────────────────────────────────────────────────────────┤
│ [+ New Template]                    [Search...] [All ▼] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🟢 Sales Intro                         [Sales]      │ │
│ │ Subject: Introduction from Phos Industries          │ │
│ │                                    [Edit] [Dup] [×] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🟢 Quote Follow-up                     [Follow-up]  │ │
│ │ Subject: Following up on Quote {{quoteNumber}}      │ │
│ │                                    [Edit] [Dup] [×] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🟢 Quote Delivery                      [Quote]      │ │
│ │ Subject: Your Quote from Phos Industries            │ │
│ │                                    [Edit] [Dup] [×] │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Technical Notes**:
- Follow Settings page patterns from Twenty
- Location: `packages/twenty-front/src/pages/settings/email-templates/`
- Route: Add to settings routes

---

### Story 0.6: Implement Variable Substitution Engine
**Estimate**: 2 hours | **Priority**: P0

**Acceptance Criteria**:
- [ ] Variables in template (`{{firstName}}`) replaced with actual values
- [ ] Context-aware: different variables available based on source (Person, Company, Opportunity, Quote, Invoice)
- [ ] Fallback for missing values (empty string or configurable default)
- [ ] Preview mode shows substituted values
- [ ] Server-side substitution before sending (security)

**Variable Sources**:
```typescript
type EmailContext = {
  person?: Person;
  company?: Company;
  opportunity?: Opportunity;
  quote?: Quote;
  invoice?: Invoice;
  sender: WorkspaceMember;
};

function substituteVariables(template: string, context: EmailContext): string {
  return template
    .replace(/\{\{firstName\}\}/g, context.person?.name?.firstName || '')
    .replace(/\{\{lastName\}\}/g, context.person?.name?.lastName || '')
    .replace(/\{\{companyName\}\}/g, context.company?.name || '')
    // ... etc
}
```

---

### Story 0.7: Add Compose Email Entry Points
**Estimate**: 2 hours | **Priority**: P0

**Acceptance Criteria**:
- [ ] "Compose Email" button on Person detail page
- [ ] "Compose Email" button on Company detail page
- [ ] "Compose Email" button on Opportunity detail page
- [ ] Quick action in command menu (Cmd+K → "Compose email to...")
- [ ] Context passed to composer (pre-fill recipient, available variables)

**Technical Notes**:
- Add buttons to record detail pages
- Use existing button patterns
- Pass recordId and objectType to composer modal

---

### Story 0.8: Seed Default Email Templates
**Estimate**: 1 hour | **Priority**: P1

**Acceptance Criteria**:
- [ ] 5 default templates created on workspace init
- [ ] Templates cover common sales scenarios:
  1. Sales Introduction
  2. Quote Delivery
  3. Quote Follow-up (7 days)
  4. Invoice Delivery
  5. Thank You / Deal Won

**Default Templates**:

**Sales Introduction**:
```
Subject: Introduction from Phos Industries

Hi {{firstName}},

I'm {{senderName}} from Phos Industries. I specialize in laser consulting
and technical solutions for manufacturing challenges.

I noticed {{companyName}} might benefit from our expertise in [specific area].
Would you have 15 minutes this week for a quick call?

Best regards,
{{senderName}}
{{senderEmail}}
```

**Quote Follow-up**:
```
Subject: Following up on Quote {{quoteNumber}}

Hi {{firstName}},

I wanted to follow up on the quote I sent over for {{opportunityName}}.

Do you have any questions I can help answer? I'm happy to jump on a quick
call to discuss the details.

Looking forward to hearing from you.

Best,
{{senderName}}
```

---

## Dependencies

- **Requires**: Gmail OAuth with send scope (already configured)
- **Requires**: Connected Account (user must have linked Gmail)
- **Blocks**: Epic 002 (Quote/Invoice email delivery uses this)
- **Blocks**: Epic 006 (Workflow email automation uses this)

---

## Technical Risks

1. **Gmail OAuth Scope**: Current OAuth may not include send scope
   - **Mitigation**: Check scope on connected accounts, prompt for re-auth if needed
   - **Location**: `MessagingAccountAuthenticationService.ensureRefreshTokenValidity()`

2. **Threading Headers**: Gmail requires specific headers for thread matching
   - **Mitigation**: Use `In-Reply-To` and `References` headers correctly
   - **Reference**: `gmail-create-message.util.ts`

3. **Rich Text Compatibility**: TipTap JSON → Email HTML conversion
   - **Mitigation**: Use existing `email-renderer` from twenty-emails
   - **Test**: Verify rendering in Gmail, Outlook, Apple Mail

4. **Rate Limits**: Gmail API has sending limits (100/day for free, 2000/day for Workspace)
   - **Mitigation**: Queue emails, show rate limit warnings

---

## Testing Strategy

1. **Unit Tests**: Variable substitution, template CRUD
2. **Integration Tests**: Send email mutation with mocked Gmail API
3. **E2E Tests**: Full flow - compose, template select, send, verify in timeline
4. **Manual Testing**: Send test emails to @phos-ind.com addresses only

---

## Feature Flags

```typescript
// packages/twenty-server/src/engine/core-modules/feature-flag/
export enum FeatureFlagKey {
  // ... existing flags
  IS_EMAIL_COMPOSER_ENABLED = 'IS_EMAIL_COMPOSER_ENABLED',
  IS_EMAIL_TEMPLATES_ENABLED = 'IS_EMAIL_TEMPLATES_ENABLED',
}
```

Enable via:
```sql
INSERT INTO core."featureFlag" ("key", "value", "workspaceId")
VALUES ('IS_EMAIL_COMPOSER_ENABLED', true, '572a2b40-3011-4a15-bff4-376f817b88e7');
```

---

## Documentation Needs

- [ ] User guide: How to compose and send emails
- [ ] User guide: How to create email templates
- [ ] User guide: Available template variables
- [ ] Developer guide: Email composer architecture
- [ ] Admin guide: Gmail OAuth setup for sending

---

## Notes

This epic is **P0 CRITICAL** because:
1. Sales velocity requires outbound email capability
2. Quote/Invoice delivery (Epic 002) depends on this
3. Workflow automations (Epic 006) need email sending
4. Current system is "read-only" for emails - can't close deals that way

**Implementation Order**:
1. Create EmailTemplate object (Story 0.1)
2. Build backend sendEmail mutation (Story 0.3)
3. Build composer UI (Story 0.2)
4. Add entry points (Story 0.7)
5. Build templates settings (Story 0.5)
6. Add reply functionality (Story 0.4)
7. Variable substitution (Story 0.6)
8. Seed defaults (Story 0.8)

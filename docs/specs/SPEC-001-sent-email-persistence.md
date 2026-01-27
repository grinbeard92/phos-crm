# Technical Specification: Sent Email Persistence

**Spec ID**: SPEC-001
**Epic**: Epic 000 - Email Composer & Templates
**Status**: Draft
**Author**: Claude (with greer92)
**Date**: 2026-01-27

---

## 1. Problem Statement

When users send emails through Twenty CRM's email composer, the emails are successfully delivered to recipients but are **not persisted** in the database. This creates several critical issues:

1. **No audit trail** - Sent emails disappear from the CRM after sending
2. **Broken threading** - Replies from recipients appear as orphaned messages
3. **Incomplete timeline** - Person/Company activity timelines only show received emails
4. **No sent folder** - Users cannot review what they've sent through the CRM

### Current Flow (Broken)

```
User clicks Send → GraphQL mutation → SendEmailTool.execute()
    ↓
MessagingSendMessageService.sendMessage()
    ↓
Email sent via Gmail/Outlook/SMTP ✅
    ↓
Returns { messageId, externalMessageId, threadExternalId }
    ↓
*** NOTHING IS PERSISTED TO DATABASE *** ❌
    ↓
Email vanishes from CRM
```

---

## 2. Goals

1. **Persist sent emails** in the Message table immediately after sending
2. **Prevent duplicates** when provider's Sent folder is synced later
3. **Enable threading** by wiring up In-Reply-To and References headers
4. **Link to entities** - Connect sent emails to Person, Company, Opportunity
5. **Show in timeline** - Sent emails appear in activity feeds with "Outgoing" indicator

---

## 3. Technical Architecture

### 3.1 Deduplication Strategy

Twenty CRM uses a multi-layer deduplication approach:

| Layer | Key | Purpose |
|-------|-----|---------|
| Message | `headerMessageId` | RFC 5322 Message-ID header (canonical identifier) |
| Association | `messageExternalId` | Provider-specific ID (Gmail ID, Outlook ID, IMAP UID) |
| Constraint | `(messageChannelId, messageId)` | Unique index prevents double associations |

**Critical Insight**: When we persist a sent email, we MUST store:
- `headerMessageId` = The Message-ID we generated (e.g., `<1706400000.abc123@phos-ind.com>`)
- `messageExternalId` = Provider's ID if returned (Gmail: response.data.id, Outlook: response.id)

When the Sent folder syncs later:
1. Import checks `messageExternalId` against existing associations → **Already exists, skip**
2. Or import checks `headerMessageId` against Message table → **Already exists, reuse Message.id**
3. Unique constraint prevents duplicate associations

### 3.2 Data Model

No schema changes required. Using existing entities:

```typescript
// Message - Core email record
Message {
  id: uuid
  headerMessageId: string    // RFC 5322 Message-ID (our dedup key)
  subject: string
  text: string               // Plain text body
  receivedAt: Date           // For sent: this is sentAt
  messageThreadId: uuid      // Links to thread
}

// MessageThread - Groups related messages
MessageThread {
  id: uuid
}

// MessageChannelMessageAssociation - Links message to channel
MessageChannelMessageAssociation {
  id: uuid
  messageChannelId: uuid
  messageId: uuid
  messageExternalId: string  // Provider's ID (for dedup)
  messageThreadExternalId: string
  direction: 'INCOMING' | 'OUTGOING'  // KEY: marks as sent
}

// MessageParticipant - Who sent/received
MessageParticipant {
  id: uuid
  messageId: uuid
  role: 'FROM' | 'TO' | 'CC' | 'BCC'
  handle: string             // Email address
  displayName: string
  personId: uuid | null      // Link to Person record
  workspaceMemberId: uuid | null  // Link to sender
}
```

### 3.3 New Service: SentMessagePersistenceService

**Location**: `/packages/twenty-server/src/modules/messaging/message-import-manager/services/sent-message-persistence.service.ts`

```typescript
@Injectable()
export class SentMessagePersistenceService {

  /**
   * Persists a sent email to the database.
   * Called immediately after MessagingSendMessageService.sendMessage() succeeds.
   */
  async persistSentMessage(params: {
    // From send result
    messageId: string;           // RFC 5322 Message-ID we generated
    externalMessageId?: string;  // Provider's ID (Gmail/Outlook)
    threadExternalId?: string;   // Provider's thread ID

    // From send input
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    textBody: string;
    htmlBody: string;

    // Threading (if replying)
    inReplyTo?: string;          // Message-ID of email being replied to
    references?: string[];       // Chain of Message-IDs

    // Context
    connectedAccountId: string;
    messageChannelId: string;
    workspaceId: string;
    workspaceMemberId: string;   // The sender
  }): Promise<{ messageId: string; threadId: string }>;
}
```

### 3.4 Implementation Flow

```
SendEmailTool.execute()
    ↓
1. Validate & prepare email
    ↓
2. MessagingSendMessageService.sendMessage()
    ↓
3. On success, call SentMessagePersistenceService.persistSentMessage()
    │
    ├─► Create/Find MessageThread
    │   - If inReplyTo: find existing thread by original message's threadId
    │   - Else: create new thread
    │
    ├─► Create Message record
    │   - headerMessageId = sendResult.messageId
    │   - subject, text = from input
    │   - receivedAt = now
    │   - messageThreadId = thread.id
    │
    ├─► Create MessageChannelMessageAssociation
    │   - messageExternalId = sendResult.externalMessageId (if available)
    │   - messageThreadExternalId = sendResult.threadExternalId
    │   - direction = 'OUTGOING'
    │
    └─► Create MessageParticipants
        - FROM: workspaceMemberId (sender)
        - TO: parse recipients, link to Person if exists
        - CC: same
        - BCC: same
```

---

## 4. Detailed Implementation

### 4.1 SentMessagePersistenceService

```typescript
// sent-message-persistence.service.ts

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

interface PersistSentMessageParams {
  messageId: string;
  externalMessageId?: string;
  threadExternalId?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  textBody: string;
  inReplyTo?: string;
  references?: string[];
  connectedAccountId: string;
  messageChannelId: string;
  workspaceId: string;
  workspaceMemberId: string;
  senderEmail: string;
  senderName?: string;
}

@Injectable()
export class SentMessagePersistenceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async persistSentMessage(params: PersistSentMessageParams): Promise<{
    messageDbId: string;
    threadId: string;
  }> {
    const {
      messageId,
      externalMessageId,
      threadExternalId,
      to,
      cc,
      bcc,
      subject,
      textBody,
      inReplyTo,
      messageChannelId,
      workspaceId,
      workspaceMemberId,
      senderEmail,
      senderName,
    } = params;

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      { workspaceId },
      async () => {
        const messageRepository = await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'message',
        );
        const messageThreadRepository = await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'messageThread',
        );
        const associationRepository = await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'messageChannelMessageAssociation',
        );
        const participantRepository = await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'messageParticipant',
        );
        const personRepository = await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'person',
        );

        // 1. Find or create thread
        let threadId: string;

        if (inReplyTo) {
          // Find existing thread by the original message's headerMessageId
          const originalMessage = await messageRepository.findOne({
            where: { headerMessageId: inReplyTo },
          });

          if (originalMessage?.messageThreadId) {
            threadId = originalMessage.messageThreadId;
          } else {
            // Original not found, create new thread
            threadId = uuidv4();
            await messageThreadRepository.save({ id: threadId });
          }
        } else {
          // New conversation, create thread
          threadId = uuidv4();
          await messageThreadRepository.save({ id: threadId });
        }

        // 2. Create Message record
        const messageDbId = uuidv4();
        await messageRepository.save({
          id: messageDbId,
          headerMessageId: messageId,
          subject,
          text: textBody,
          receivedAt: new Date(),
          messageThreadId: threadId,
        });

        // 3. Create MessageChannelMessageAssociation
        await associationRepository.save({
          id: uuidv4(),
          messageChannelId,
          messageId: messageDbId,
          messageExternalId: externalMessageId ?? null,
          messageThreadExternalId: threadExternalId ?? null,
          direction: MessageDirection.OUTGOING,
        });

        // 4. Create MessageParticipants
        // FROM (sender)
        await participantRepository.save({
          id: uuidv4(),
          messageId: messageDbId,
          role: 'from',
          handle: senderEmail,
          displayName: senderName ?? senderEmail,
          workspaceMemberId,
          personId: null,
        });

        // TO recipients
        const toAddresses = this.parseEmailAddresses(to);
        for (const addr of toAddresses) {
          const person = await this.findPersonByEmail(personRepository, addr.email);
          await participantRepository.save({
            id: uuidv4(),
            messageId: messageDbId,
            role: 'to',
            handle: addr.email,
            displayName: addr.name ?? addr.email,
            personId: person?.id ?? null,
            workspaceMemberId: null,
          });
        }

        // CC recipients
        if (cc) {
          const ccAddresses = this.parseEmailAddresses(cc);
          for (const addr of ccAddresses) {
            const person = await this.findPersonByEmail(personRepository, addr.email);
            await participantRepository.save({
              id: uuidv4(),
              messageId: messageDbId,
              role: 'cc',
              handle: addr.email,
              displayName: addr.name ?? addr.email,
              personId: person?.id ?? null,
              workspaceMemberId: null,
            });
          }
        }

        // BCC recipients (don't link to Person for privacy)
        if (bcc) {
          const bccAddresses = this.parseEmailAddresses(bcc);
          for (const addr of bccAddresses) {
            await participantRepository.save({
              id: uuidv4(),
              messageId: messageDbId,
              role: 'bcc',
              handle: addr.email,
              displayName: addr.name ?? addr.email,
              personId: null,
              workspaceMemberId: null,
            });
          }
        }

        return { messageDbId, threadId };
      },
    );
  }

  private parseEmailAddresses(input: string): Array<{ email: string; name?: string }> {
    // Parse "Name <email>" or just "email" formats
    return input.split(',').map((part) => {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }
      return { email: trimmed };
    });
  }

  private async findPersonByEmail(repository: any, email: string) {
    return repository.findOne({
      where: { email: { primaryEmail: email } },
    });
  }
}
```

### 4.2 Update SendEmailTool

```typescript
// send-email-tool.ts - Add to execute() after sendResult

// After line 313 (after sendMessageService.sendMessage())
// Add persistence call:

// Persist sent message to database for timeline/inbox view
try {
  await this.sentMessagePersistenceService.persistSentMessage({
    messageId: sendResult.messageId,
    externalMessageId: sendResult.externalMessageId,
    threadExternalId: sendResult.threadExternalId,
    to: email,
    cc: parameters.cc,
    bcc: parameters.bcc,
    subject: safeSubject,
    textBody,
    inReplyTo: parameters.inReplyTo,
    references: parameters.references,
    connectedAccountId,
    messageChannelId,
    workspaceId,
    workspaceMemberId: context.workspaceMemberId,
    senderEmail: connectedAccount.handle,
    senderName: context.userName,
  });
} catch (persistError) {
  // Log but don't fail - email was already sent successfully
  this.logger.warn(
    `Failed to persist sent message to database: ${persistError}`,
  );
}
```

### 4.3 Update SendEmailInput Schema

```typescript
// send-email-tool.schema.ts - Add threading fields

export const SendEmailInputZodSchema = z.object({
  email: z.string(),
  subject: z.string().optional(),
  body: z.string().optional(),
  connectedAccountId: z.string().optional(),
  files: z.array(/* ... */).optional(),

  // NEW: Threading support
  inReplyTo: z.string().optional(),      // Message-ID of email being replied to
  references: z.array(z.string()).optional(), // Chain of Message-IDs
  cc: z.string().optional(),             // CC recipients
  bcc: z.string().optional(),            // BCC recipients
});
```

### 4.4 Frontend: Pass Threading Context

When composing a reply, the frontend must pass:

```typescript
// EmailComposeModal - when replying to a thread
const handleSend = async () => {
  await sendEmail({
    email: toEmail,
    subject,
    body: htmlBody,
    connectedAccountId,

    // Threading - only when replying
    inReplyTo: originalMessage?.headerMessageId,
    references: originalThread?.references ?? [],

    // CC/BCC
    cc: ccEmail || undefined,
    bcc: bccEmail || undefined,
  });
};
```

---

## 5. Deduplication Scenarios

### Scenario 1: Normal Send + Later Sync

1. User sends email via CRM at 10:00 AM
2. We persist: `headerMessageId = <123.abc@phos-ind.com>`, `externalMessageId = gmail_id_456`
3. Gmail sync runs at 10:05 AM, finds message in Sent folder
4. Import checks: `messageExternalId = gmail_id_456` already exists → **Skip**

### Scenario 2: IMAP (No External ID Available)

1. User sends email via IMAP/SMTP
2. We persist: `headerMessageId = <123.abc@phos-ind.com>`, `externalMessageId = null`
3. IMAP sync finds message in Sent folder with UID 789
4. Import checks `headerMessageId` → **Already exists**
5. Creates association with `externalMessageId = "Sent:789"` (folder:uid format)
6. Unique constraint allows this (different external ID, same message)

### Scenario 3: Reply Threading

1. Received email from contact: `headerMessageId = <original@contact.com>`
2. User replies via CRM
3. We set: `inReplyTo = <original@contact.com>`, generate new Message-ID
4. Find original message's thread, attach reply to same thread
5. Contact replies back → their reply auto-threads via In-Reply-To

---

## 6. Timeline Query Updates

The timeline service needs to include outgoing messages:

```sql
-- Current (only incoming):
SELECT * FROM message_thread
WHERE EXISTS (
  SELECT 1 FROM message_participant
  WHERE person_id = :targetPersonId
);

-- Updated (incoming + outgoing):
SELECT DISTINCT mt.* FROM message_thread mt
JOIN message m ON m.message_thread_id = mt.id
JOIN message_channel_message_association mcma ON mcma.message_id = m.id
WHERE EXISTS (
  SELECT 1 FROM message_participant mp
  WHERE mp.message_id = m.id
  AND (
    mp.person_id = :targetPersonId  -- Person is participant
    OR (
      mcma.direction = 'OUTGOING'   -- Or it's an outgoing message
      AND mp.role = 'to'            -- And person is recipient
      AND mp.person_id = :targetPersonId
    )
  )
);
```

---

## 7. Testing Plan

### Unit Tests

1. `SentMessagePersistenceService.persistSentMessage()`
   - Creates Message, Thread, Association, Participants
   - Links to existing thread when inReplyTo provided
   - Finds and links Person records for recipients

2. Deduplication
   - Same `headerMessageId` → reuses existing Message
   - Same `messageExternalId` → skips association creation

### Integration Tests

1. Send email → verify Message record exists
2. Send reply → verify same thread as original
3. Send email → sync Sent folder → verify no duplicates
4. Send email to existing Person → verify participant links to Person

### E2E Tests

1. Compose and send email from People record
2. Verify email appears in timeline immediately
3. Verify email shows "Outgoing" indicator
4. Verify threading works for replies

---

## 8. Migration Notes

- No database migrations required (using existing schema)
- Existing sent emails (before this feature) won't appear in timeline
- Optional: Trigger manual Sent folder sync to backfill

---

## 9. Dependencies

| Component | Status | Notes |
|-----------|--------|-------|
| Message entity | ✅ Exists | No changes |
| MessageThread entity | ✅ Exists | No changes |
| MessageChannelMessageAssociation | ✅ Exists | direction field ready |
| MessageParticipant | ✅ Exists | workspaceMemberId field ready |
| MessagingSendMessageService | ✅ Exists | Returns needed IDs |
| SendEmailTool | 🔧 Modify | Add persistence call |
| Timeline queries | 🔧 Modify | Include outgoing |
| EmailComposeModal | 🔧 Modify | Pass threading context |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Persistence fails after send | Email sent but not tracked | Log warning, don't fail - email was delivered |
| Thread lookup fails | Reply becomes orphan | Create new thread as fallback |
| Person lookup slow | Performance impact | Cache or batch lookups |
| BCC privacy leak | Security issue | Never link BCC to Person records |

---

## 11. Future Enhancements

1. **Sent folder sync backfill** - Import historical sent emails
2. **Draft persistence** - Save drafts to database and provider
3. **Scheduled sends** - Queue emails for later delivery
4. **Read receipts** - Track when recipients open emails
5. **Bounce handling** - Detect and surface delivery failures

---

## 12. Implementation Checklist

- [ ] Create `SentMessagePersistenceService`
- [ ] Update `SendEmailTool` to call persistence service
- [ ] Update `SendEmailInputZodSchema` with threading fields
- [ ] Uncomment threading params in `SendEmailTool`
- [ ] Update `EmailComposeModal` to pass inReplyTo/references
- [ ] Update timeline queries to include outgoing
- [ ] Add "Outgoing" indicator to timeline UI
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Document API changes

# Calendar Integration Enhancement Specification

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Author:** Phos Industries Development Team

---

## Executive Summary

This specification defines the enhanced Calendar Integration module for Phos CRM (built on Twenty CRM). The current implementation provides read-only calendar synchronization from Google Calendar, Microsoft Calendar, and CalDAV providers. This enhancement adds **bidirectional calendar capabilities** including event creation, editing, and meeting invite integration with the email composer.

---

## Current State Analysis

### What Exists Today

| Capability | Status | Notes |
|------------|--------|-------|
| Calendar Event Sync (Import) | ✅ Complete | Google, Microsoft, CalDAV |
| Event Display on Timelines | ✅ Complete | Person, Company, Opportunity records |
| Participant Tracking | ✅ Complete | With response status (ACCEPTED, DECLINED, etc.) |
| Visibility Controls | ✅ Complete | METADATA vs SHARE_EVERYTHING |
| Contact Auto-Creation | ✅ Complete | From event participants |
| Calendar Channel Settings | ✅ Complete | Sync status, visibility, auto-creation policies |
| Multiple Provider Support | ✅ Complete | Google, Microsoft, CalDAV drivers |

### What's Missing

| Capability | Status | Priority |
|------------|--------|----------|
| Event Creation from CRM | ❌ Missing | **P0 - Critical** |
| Google Meet Integration | ❌ Missing | **P0 - Critical** |
| Event Editing | ❌ Missing | P1 - High |
| Event Deletion | ❌ Missing | P1 - High |
| Meeting Invite in Email | ❌ Missing | **P0 - Critical** |
| RSVP Response | ❌ Missing | P2 - Medium |
| Recurring Event Management | ❌ Missing | P2 - Medium |
| Microsoft Teams Integration | ❌ Missing | P3 - Future |

---

## Requirements

### Functional Requirements

#### FR-1: Calendar Event Creation (P0)

**FR-1.1** Users SHALL be able to create calendar events directly from the CRM interface.

**FR-1.2** Event creation SHALL support the following fields:
- Title (required)
- Description (optional)
- Location (optional, supports physical address or virtual meeting link)
- Start Date/Time (required)
- End Date/Time (required)
- All-Day Event toggle
- Attendees (email addresses)
- Conference type (None, Google Meet, custom link)

**FR-1.3** Created events SHALL be pushed to the user's connected calendar (Google/Microsoft/CalDAV).

**FR-1.4** Event creation SHALL be available from:
- Dedicated "Calendar" section in navigation
- Person record page (quick action)
- Company record page (quick action)
- Opportunity record page (quick action)
- Email composer (meeting invite attachment)

#### FR-2: Google Meet Integration (P0)

**FR-2.1** When creating an event with Google Calendar connected, users SHALL be able to add a Google Meet video conference link.

**FR-2.2** The system SHALL automatically generate a unique Google Meet link using the Google Calendar API's `conferenceData.createRequest`.

**FR-2.3** The generated Meet link SHALL be:
- Displayed in the event details
- Included in calendar invitations sent to attendees
- Stored in the `conferenceLink` field of the CalendarEvent entity

**FR-2.4** Meet link generation SHALL handle the asynchronous nature of Google's API (status: pending → success).

#### FR-3: Meeting Invite in Email Composer (P0)

**FR-3.1** The email composer SHALL include an "Add Meeting Invite" button/action.

**FR-3.2** Clicking "Add Meeting Invite" SHALL open a calendar event creation modal pre-populated with:
- Attendees: Current email recipient(s) + CC recipients
- Description: Context from email subject/body (optional)

**FR-3.3** Upon confirming the meeting invite:
- A calendar event SHALL be created
- A `.ics` file attachment SHALL be added to the email
- The meeting link (if Google Meet) SHALL be inserted into the email body

**FR-3.4** The email recipient SHALL receive:
- The email with meeting details in body
- An `.ics` calendar attachment for one-click calendar addition

#### FR-4: Event Editing (P1)

**FR-4.1** Users SHALL be able to edit calendar events they created from the CRM.

**FR-4.2** Editable fields SHALL include all fields from FR-1.2.

**FR-4.3** Changes SHALL be synchronized back to the connected calendar provider.

**FR-4.4** The system SHALL handle conflicts when events are modified in both CRM and provider.

#### FR-5: Event Deletion (P1)

**FR-5.1** Users SHALL be able to delete calendar events they created from the CRM.

**FR-5.2** Deletion SHALL propagate to the connected calendar provider.

**FR-5.3** Deletion SHALL trigger notification to attendees (via provider).

#### FR-6: RSVP Response (P2)

**FR-6.1** Users SHALL be able to respond to meeting invitations (Accept, Decline, Tentative) from within the CRM.

**FR-6.2** Response status SHALL be synchronized to the calendar provider.

### Non-Functional Requirements

**NFR-1** Event creation SHALL complete within 3 seconds under normal conditions.

**NFR-2** Google Meet link generation SHALL handle the asynchronous API response gracefully with loading states.

**NFR-3** Calendar operations SHALL respect user permissions and connected account scopes.

**NFR-4** The system SHALL gracefully degrade when calendar provider is unavailable.

**NFR-5** All calendar operations SHALL be protected by Twenty's feature flag system (`IS_CALENDAR_COMPOSE_ENABLED`).

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  CalendarEventCreateModal  │  EmailComposer + MeetingInvite     │
│  CalendarEventEditModal    │  CalendarEventsCard (enhanced)     │
│  useCalendarComposer hook  │  useCreateCalendarEvent hook       │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GraphQL API Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Mutation: createCalendarEvent                                   │
│  Mutation: updateCalendarEvent                                   │
│  Mutation: deleteCalendarEvent                                   │
│  Mutation: respondToCalendarEvent                                │
│  Query: getCalendarEventById (enhanced)                          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services (NestJS)                     │
├─────────────────────────────────────────────────────────────────┤
│  CalendarEventCreateService                                      │
│  CalendarEventUpdateService                                      │
│  CalendarEventDeleteService                                      │
│  GoogleMeetLinkService                                           │
│  IcsFileGeneratorService                                         │
│  CalendarEventPushService (bidirectional sync)                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Provider Drivers                              │
├─────────────────────────────────────────────────────────────────┤
│  GoogleCalendarCreateEventDriver                                 │
│  MicrosoftCalendarCreateEventDriver                              │
│  CalDAVCreateEventDriver                                         │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External APIs                                 │
├─────────────────────────────────────────────────────────────────┤
│  Google Calendar API v3                                          │
│  Microsoft Graph Calendar API                                    │
│  CalDAV Server                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Changes

#### CalendarEvent Entity Enhancements

```typescript
// Existing fields remain unchanged
// Add new fields:

@WorkspaceField({
  standardId: CALENDAR_EVENT_STANDARD_FIELD_IDS.createdFromCrm,
  type: FieldMetadataType.BOOLEAN,
  label: 'Created from CRM',
  description: 'Whether event was created from within the CRM',
  defaultValue: false,
})
createdFromCrm: boolean;

@WorkspaceField({
  standardId: CALENDAR_EVENT_STANDARD_FIELD_IDS.crmCreatorId,
  type: FieldMetadataType.UUID,
  label: 'CRM Creator',
  description: 'Workspace member who created this event',
})
crmCreatorId: string;

@WorkspaceField({
  standardId: CALENDAR_EVENT_STANDARD_FIELD_IDS.conferenceType,
  type: FieldMetadataType.SELECT,
  label: 'Conference Type',
  description: 'Type of video conference',
  options: [
    { label: 'None', value: 'NONE', color: 'gray' },
    { label: 'Google Meet', value: 'GOOGLE_MEET', color: 'green' },
    { label: 'Microsoft Teams', value: 'MICROSOFT_TEAMS', color: 'blue' },
    { label: 'Custom Link', value: 'CUSTOM', color: 'purple' },
  ],
})
conferenceType: string;

// Existing conferenceLink and conferenceSolution fields used for storage
```

### API Design

#### GraphQL Mutations

```graphql
type Mutation {
  """
  Create a new calendar event and push to connected calendar provider
  """
  createCalendarEvent(input: CreateCalendarEventInput!): CalendarEventResult!

  """
  Update an existing calendar event (must be CRM-created or owned)
  """
  updateCalendarEvent(
    eventId: ID!
    input: UpdateCalendarEventInput!
  ): CalendarEventResult!

  """
  Delete a calendar event
  """
  deleteCalendarEvent(eventId: ID!): DeleteCalendarEventResult!

  """
  Respond to a calendar event invitation
  """
  respondToCalendarEvent(
    eventId: ID!
    response: CalendarEventResponseStatus!
  ): CalendarEventResult!
}

input CreateCalendarEventInput {
  title: String!
  description: String
  location: String
  startsAt: DateTime!
  endsAt: DateTime!
  isFullDay: Boolean
  attendees: [CalendarAttendeeInput!]
  conferenceType: ConferenceType
  connectedAccountId: ID!

  # Optional: Link to CRM records
  linkedPersonIds: [ID!]
  linkedCompanyId: ID
  linkedOpportunityId: ID
}

input CalendarAttendeeInput {
  email: String!
  displayName: String
  isOrganizer: Boolean
}

enum ConferenceType {
  NONE
  GOOGLE_MEET
  MICROSOFT_TEAMS
  CUSTOM
}

type CalendarEventResult {
  success: Boolean!
  calendarEvent: CalendarEvent
  conferenceLink: String
  icsFileUrl: String
  error: String
}
```

### Frontend Components

#### New Components

```
packages/twenty-front/src/modules/calendar-composer/
├── components/
│   ├── CalendarEventCreateModal.tsx      # Main creation modal
│   ├── CalendarEventEditModal.tsx        # Edit existing events
│   ├── CalendarAttendeeInput.tsx         # Attendee email input
│   ├── CalendarDateTimePicker.tsx        # Date/time selection
│   ├── ConferenceTypeSelector.tsx        # Meet/Teams/None selector
│   └── MeetingInviteButton.tsx           # Button for email composer
├── hooks/
│   ├── useCalendarComposer.ts            # Recoil state management
│   ├── useCreateCalendarEvent.ts         # GraphQL mutation hook
│   ├── useUpdateCalendarEvent.ts         # GraphQL mutation hook
│   └── useDeleteCalendarEvent.ts         # GraphQL mutation hook
├── states/
│   └── calendarComposerState.ts          # Recoil atoms
└── types/
    └── CalendarComposerTypes.ts          # TypeScript types
```

#### Integration Points

**Email Composer Integration:**
```typescript
// In EmailComposeModal.tsx
const handleAddMeetingInvite = () => {
  openCalendarComposer({
    defaultAttendees: [toEmail, ...ccRecipients],
    defaultTitle: `Meeting: ${subject}`,
    onEventCreated: (event) => {
      // Add .ics attachment to email
      addAttachment(event.icsFile);
      // Insert meeting link into email body
      insertMeetingLink(event.conferenceLink);
    },
  });
};
```

### Backend Services

#### CalendarEventCreateService

```typescript
@Injectable()
export class CalendarEventCreateService {
  async createEvent(
    workspaceId: string,
    userId: string,
    input: CreateCalendarEventInput,
  ): Promise<CalendarEventResult> {
    // 1. Validate connected account
    const connectedAccount = await this.validateConnectedAccount(
      input.connectedAccountId,
      userId,
    );

    // 2. Build provider-specific event payload
    const providerPayload = await this.buildProviderPayload(
      input,
      connectedAccount.provider,
    );

    // 3. If Google Meet requested, add conference data
    if (input.conferenceType === 'GOOGLE_MEET') {
      providerPayload.conferenceData = {
        createRequest: {
          requestId: generateUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    // 4. Push to provider
    const providerResult = await this.calendarPushService.createEvent(
      connectedAccount,
      providerPayload,
    );

    // 5. Save to local database
    const calendarEvent = await this.saveCalendarEvent(
      workspaceId,
      input,
      providerResult,
    );

    // 6. Generate .ics file
    const icsFile = await this.icsGenerator.generate(calendarEvent);

    return {
      success: true,
      calendarEvent,
      conferenceLink: providerResult.conferenceLink,
      icsFileUrl: icsFile.url,
    };
  }
}
```

#### GoogleCalendarCreateEventDriver

```typescript
@Injectable()
export class GoogleCalendarCreateEventDriver {
  async createEvent(
    connectedAccount: ConnectedAccount,
    payload: GoogleCalendarEventPayload,
  ): Promise<GoogleCalendarEventResult> {
    const calendar = google.calendar({ version: 'v3', auth: oauthClient });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: payload.conferenceData ? 1 : 0,
      sendUpdates: 'all', // Send invitations to attendees
      requestBody: {
        summary: payload.title,
        description: payload.description,
        location: payload.location,
        start: {
          dateTime: payload.startsAt,
          timeZone: payload.timeZone,
        },
        end: {
          dateTime: payload.endsAt,
          timeZone: payload.timeZone,
        },
        attendees: payload.attendees.map(a => ({
          email: a.email,
          displayName: a.displayName,
        })),
        conferenceData: payload.conferenceData,
      },
    });

    // Handle async Meet link generation
    let conferenceLink = response.data.conferenceData?.entryPoints?.[0]?.uri;
    if (
      payload.conferenceData &&
      response.data.conferenceData?.createRequest?.status?.statusCode === 'pending'
    ) {
      // Poll for Meet link (or use webhook)
      conferenceLink = await this.pollForConferenceLink(
        response.data.id,
        connectedAccount,
      );
    }

    return {
      externalId: response.data.id,
      iCalUid: response.data.iCalUID,
      conferenceLink,
      htmlLink: response.data.htmlLink,
    };
  }
}
```

### ICS File Generation

```typescript
@Injectable()
export class IcsFileGeneratorService {
  generate(event: CalendarEvent): IcsFileResult {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Phos CRM//Calendar//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${event.iCalUid}`,
      `DTSTAMP:${this.formatDate(new Date())}`,
      `DTSTART:${this.formatDate(event.startsAt)}`,
      `DTEND:${this.formatDate(event.endsAt)}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${this.escapeIcs(event.description)}` : '',
      event.location ? `LOCATION:${this.escapeIcs(event.location)}` : '',
      `ORGANIZER:mailto:${event.organizerEmail}`,
      ...event.attendees.map(a => `ATTENDEE:mailto:${a.email}`),
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    return {
      content: icsContent,
      filename: `meeting-${event.id}.ics`,
      mimeType: 'text/calendar',
    };
  }
}
```

---

## User Interface Design

### Calendar Event Creation Modal

```
┌────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════╗│
│  ║ 📅  New Calendar Event                           ✕  ║│
│  ╠═══════════════════════════════════════════════════════╣│
│  ║                                                       ║│
│  ║  Title *                                              ║│
│  ║  ┌─────────────────────────────────────────────────┐ ║│
│  ║  │ Project Kickoff Meeting                         │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║                                                       ║│
│  ║  Date & Time *                                        ║│
│  ║  ┌──────────────────┐  ┌──────────────────┐         ║│
│  ║  │ Jan 28, 2026     │  │ 10:00 AM         │         ║│
│  ║  └──────────────────┘  └──────────────────┘         ║│
│  ║  to                                                   ║│
│  ║  ┌──────────────────┐  ┌──────────────────┐         ║│
│  ║  │ Jan 28, 2026     │  │ 11:00 AM         │         ║│
│  ║  └──────────────────┘  └──────────────────┘         ║│
│  ║  ☐ All day                                           ║│
│  ║                                                       ║│
│  ║  Attendees                                            ║│
│  ║  ┌─────────────────────────────────────────────────┐ ║│
│  ║  │ john@example.com ✕ │ sarah@company.co ✕ │ +     │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║                                                       ║│
│  ║  Video Conference                                     ║│
│  ║  ┌─────────────────────────────────────────────────┐ ║│
│  ║  │ ◉ Google Meet  ○ None  ○ Custom Link           │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║                                                       ║│
│  ║  Location                                             ║│
│  ║  ┌─────────────────────────────────────────────────┐ ║│
│  ║  │ Conference Room A                               │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║                                                       ║│
│  ║  Description                                          ║│
│  ║  ┌─────────────────────────────────────────────────┐ ║│
│  ║  │ Discuss project timeline and deliverables...   │ ║│
│  ║  │                                                 │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║                                                       ║│
│  ╠═══════════════════════════════════════════════════════╣│
│  ║                      [Cancel]  [Create Event]        ║│
│  ╚═══════════════════════════════════════════════════════╝│
└────────────────────────────────────────────────────────────┘
```

### Email Composer with Meeting Invite

```
┌────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════╗│
│  ║ ✉️  New Email                                     ✕  ║│
│  ╠═══════════════════════════════════════════════════════╣│
│  ║  From: [greer@phos-ind.com           ▼]              ║│
│  ║  To:   [john@client.com                ]              ║│
│  ║  Subject: [Project Discussion                 ]       ║│
│  ║                                                       ║│
│  ║  ┌─────────────────────────────────────────────────┐ ║│
│  ║  │ Hi John,                                        │ ║│
│  ║  │                                                 │ ║│
│  ║  │ I'd like to schedule a meeting to discuss...   │ ║│
│  ║  │                                                 │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║                                                       ║│
│  ║  Attachments: [meeting.ics ✕]                        ║│
│  ║                                                       ║│
│  ╠═══════════════════════════════════════════════════════╣│
│  ║  [📎 Attach] [📅 Add Meeting Invite]    [Send ➤]     ║│
│  ╚═══════════════════════════════════════════════════════╝│
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Event Creation (Week 1-2)

**Backend:**
- [ ] Create `CalendarEventCreateService`
- [ ] Create `GoogleCalendarCreateEventDriver`
- [ ] Add GraphQL mutation `createCalendarEvent`
- [ ] Implement ICS file generation
- [ ] Add feature flag `IS_CALENDAR_COMPOSE_ENABLED`

**Frontend:**
- [ ] Create `CalendarEventCreateModal` component
- [ ] Create `useCalendarComposer` hook
- [ ] Add Recoil state management
- [ ] Add "New Event" button to calendar card

### Phase 2: Google Meet Integration (Week 2-3)

**Backend:**
- [ ] Implement `conferenceData` handling in Google driver
- [ ] Handle async Meet link generation (polling/webhook)
- [ ] Store conference links in CalendarEvent

**Frontend:**
- [ ] Add `ConferenceTypeSelector` component
- [ ] Display Meet link after event creation
- [ ] Show loading state during Meet link generation

### Phase 3: Email Composer Integration (Week 3-4)

**Backend:**
- [ ] Enhance ICS generation with full attendee support
- [ ] Add file attachment endpoint for ICS files

**Frontend:**
- [ ] Add "Add Meeting Invite" button to `EmailComposeModal`
- [ ] Implement modal flow for meeting creation from email
- [ ] Auto-insert meeting link into email body
- [ ] Attach ICS file to email

### Phase 4: Edit & Delete (Week 4-5)

**Backend:**
- [ ] Create `CalendarEventUpdateService`
- [ ] Create `CalendarEventDeleteService`
- [ ] Handle bidirectional sync conflicts

**Frontend:**
- [ ] Create `CalendarEventEditModal`
- [ ] Add edit/delete actions to event display
- [ ] Implement optimistic updates

### Phase 5: Polish & Testing (Week 5-6)

- [ ] End-to-end testing
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Documentation

---

## Testing Strategy

### Unit Tests
- CalendarEventCreateService
- IcsFileGeneratorService
- Google Calendar driver
- Frontend hooks and components

### Integration Tests
- GraphQL mutation tests
- Provider API mocking
- Database persistence

### E2E Tests
- Full event creation flow
- Email + meeting invite flow
- Edit/delete flows

---

## Feature Flag

```typescript
// Feature flag for calendar compose functionality
FeatureFlagKey.IS_CALENDAR_COMPOSE_ENABLED

// Usage in frontend
const isCalendarComposeEnabled = useIsFeatureEnabled(
  FeatureFlagKey.IS_CALENDAR_COMPOSE_ENABLED,
);
```

---

## Security Considerations

1. **OAuth Scopes**: Ensure connected accounts have calendar write permissions
2. **Permission Checks**: Only allow editing/deleting events user created or owns
3. **Rate Limiting**: Implement rate limits on calendar API calls
4. **Input Validation**: Sanitize all user inputs before sending to providers
5. **Attendee Privacy**: Respect visibility settings when displaying attendees

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Event creation success rate | > 99% |
| Average event creation time | < 3 seconds |
| Meet link generation success | > 98% |
| User adoption (events created/week) | Track growth |

---

## Dependencies

- Google Calendar API v3
- Microsoft Graph Calendar API (future)
- `ical-generator` or custom ICS library
- Existing OAuth infrastructure
- Email composer module

---

## Open Questions

1. Should we support recurring events in Phase 1 or defer to Phase 2+?
2. How should we handle timezone differences between users and attendees?
3. Should the ICS file be stored permanently or generated on-demand?
4. Do we need a calendar "quick view" in the navigation sidebar?

---

## References

- [Google Calendar API - Create Events](https://developers.google.com/workspace/calendar/api/guides/create-events)
- [Google Meet in Calendar API](https://workspace.google.com/blog/product-announcements/hangouts-meet-now-available-in-google)
- [iCalendar Specification (RFC 5545)](https://datatracker.ietf.org/doc/html/rfc5545)
- [Twenty CRM Documentation](https://docs.twenty.com/)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Phos Dev Team | Initial draft |

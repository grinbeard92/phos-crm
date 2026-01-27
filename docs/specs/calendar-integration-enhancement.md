# Calendar Integration Enhancement Specification

**Version:** 1.1
**Date:** January 2026
**Status:** Draft
**Author:** Phos Industries Development Team

---

## Executive Summary

This specification defines the enhanced Calendar Integration module for Phos CRM (built on Twenty CRM). The current implementation provides read-only calendar synchronization from Google Calendar, Microsoft Calendar, and CalDAV providers. This enhancement adds **bidirectional calendar capabilities** including event creation, editing, and meeting invite integration with the email composer.

### Design Philosophy: Modularity First

> **CRITICAL**: This module MUST be designed with maximum modularity to support future extensibility. Every component should be independently testable, replaceable, and extendable without affecting other parts of the system.

**Key Modularity Principles:**
1. **Provider Abstraction** - All calendar providers (Google, Microsoft, CalDAV, future Zoom, etc.) implement a common interface
2. **Conference Provider Abstraction** - Video conferencing (Meet, Teams, Zoom, custom) is separate from calendar logic
3. **Feature Flag Isolation** - Each capability can be independently enabled/disabled
4. **Pluggable Architecture** - New providers can be added without modifying existing code
5. **Separation of Concerns** - ICS generation, provider sync, and UI are completely decoupled
6. **Twenty-Native Patterns** - Follow Twenty's established module patterns for potential upstream contribution

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
| Zoom Integration | ❌ Missing | P3 - Future |
| Custom Video Link Support | ❌ Missing | P3 - Future |

---

## Modularity & Extensibility Requirements

### MR-1: Provider Abstraction Layer

**MR-1.1** All calendar provider interactions MUST go through a common `CalendarProviderInterface`.

**MR-1.2** Adding a new calendar provider (e.g., Apple Calendar, Zoho) SHALL require:
- Only implementing the provider interface
- Registering in the provider registry
- No modifications to core calendar logic

**MR-1.3** Provider implementations SHALL be isolated in their own directories:
```
calendar-event-push-manager/
├── drivers/
│   ├── google-calendar/
│   │   ├── google-calendar-push.driver.ts
│   │   ├── google-calendar-push.module.ts
│   │   └── types/
│   ├── microsoft-calendar/
│   │   ├── microsoft-calendar-push.driver.ts
│   │   └── ...
│   ├── caldav/
│   │   └── ...
│   └── [future-provider]/     # Easy to add
│       └── ...
├── interfaces/
│   └── calendar-provider.interface.ts  # Common contract
└── services/
    └── calendar-push.service.ts        # Provider-agnostic orchestration
```

### MR-2: Conference Provider Abstraction

**MR-2.1** Video conferencing MUST be a separate, pluggable system independent of calendar providers.

**MR-2.2** Conference providers SHALL implement `ConferenceProviderInterface`:
```typescript
interface ConferenceProviderInterface {
  readonly providerId: ConferenceProviderId;
  readonly displayName: string;
  readonly icon: string;

  isAvailable(connectedAccount: ConnectedAccount): boolean;
  createConference(options: CreateConferenceOptions): Promise<ConferenceResult>;
  deleteConference?(conferenceId: string): Promise<void>;
}
```

**MR-2.3** Supported conference providers SHALL be extensible:
- Google Meet (Phase 1)
- Microsoft Teams (Phase 2)
- Zoom (Future)
- Custom/Manual Link (Phase 1)
- Cisco WebEx (Future)
- Around/Whereby/etc. (Future)

**MR-2.4** Conference selection SHALL be dynamic based on:
- Connected account capabilities
- User preferences
- Workspace settings

### MR-3: Feature Flag Granularity

**MR-3.1** Each capability SHALL have its own feature flag for independent rollout:

| Feature Flag | Controls |
|--------------|----------|
| `IS_CALENDAR_COMPOSE_ENABLED` | Master toggle for all calendar write operations |
| `IS_CALENDAR_EVENT_CREATE_ENABLED` | Event creation |
| `IS_CALENDAR_EVENT_EDIT_ENABLED` | Event editing |
| `IS_CALENDAR_EVENT_DELETE_ENABLED` | Event deletion |
| `IS_CALENDAR_MEET_INTEGRATION_ENABLED` | Google Meet link generation |
| `IS_CALENDAR_TEAMS_INTEGRATION_ENABLED` | Microsoft Teams integration |
| `IS_CALENDAR_EMAIL_INVITE_ENABLED` | Meeting invite from email composer |
| `IS_CALENDAR_RSVP_ENABLED` | RSVP response functionality |

**MR-3.2** Feature flags SHALL follow Twenty's existing feature flag patterns for potential upstream contribution.

### MR-4: Module Boundaries

**MR-4.1** The calendar compose module SHALL be completely independent from:
- Email composer (communicates via well-defined interfaces)
- Calendar sync/import (separate read vs write paths)
- Person/Company/Opportunity modules (uses standard record linking)

**MR-4.2** Cross-module communication SHALL use:
- Recoil state for frontend UI coordination
- GraphQL for frontend-backend communication
- Event emitters for backend cross-module events
- Dependency injection for service composition

### MR-5: ICS Generation Abstraction

**MR-5.1** ICS file generation SHALL be a standalone service usable by:
- Calendar event creation
- Email meeting invites
- Calendar export (future)
- API integrations (future)

**MR-5.2** ICS generation SHALL support extensible components:
```typescript
interface IcsComponentGenerator {
  generateVEvent(event: CalendarEvent): string;
  generateVAlarm?(alarm: CalendarAlarm): string;      // Future: reminders
  generateVTodo?(todo: CalendarTodo): string;         // Future: tasks
  generateVJournal?(journal: CalendarJournal): string; // Future: notes
}
```

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
- Conference type (extensible: None, Google Meet, custom link, future providers)

**FR-1.3** Created events SHALL be pushed to the user's connected calendar via the provider abstraction layer.

**FR-1.4** Event creation SHALL be available from:
- Dedicated "Calendar" section in navigation
- Person record page (quick action)
- Company record page (quick action)
- Opportunity record page (quick action)
- Email composer (meeting invite attachment)
- Command menu (future)

#### FR-2: Conference Provider Integration (P0)

**FR-2.1** When creating an event, users SHALL be able to select from available conference providers.

**FR-2.2** The system SHALL dynamically show only conference options available for the user's connected accounts.

**FR-2.3** Google Meet integration (Phase 1):
- Automatically generate unique Meet link using Google Calendar API
- Handle asynchronous link generation (status: pending → success)
- Store link in `conferenceLink` field

**FR-2.4** Conference provider selection SHALL be extensible for future providers without code changes to the selection UI.

#### FR-3: Meeting Invite in Email Composer (P0)

**FR-3.1** The email composer SHALL include an "Add Meeting Invite" button/action.

**FR-3.2** Clicking "Add Meeting Invite" SHALL open a calendar event creation modal pre-populated with:
- Attendees: Current email recipient(s) + CC recipients
- Description: Context from email subject/body (optional)

**FR-3.3** Upon confirming the meeting invite:
- A calendar event SHALL be created via the calendar module
- A `.ics` file attachment SHALL be added to the email via the ICS service
- The meeting link (if conference provider selected) SHALL be inserted into the email body

**FR-3.4** The email-calendar integration SHALL be loosely coupled:
- Email module calls calendar module through defined interface
- Calendar module returns structured result (event, ics, conference link)
- Email module handles its own attachment/body insertion

#### FR-4: Event Editing (P1)

**FR-4.1** Users SHALL be able to edit calendar events they created from the CRM.

**FR-4.2** Editable fields SHALL include all fields from FR-1.2.

**FR-4.3** Changes SHALL be synchronized back to the connected calendar provider via the same provider abstraction.

**FR-4.4** The system SHALL handle conflicts when events are modified in both CRM and provider using a configurable conflict resolution strategy.

#### FR-5: Event Deletion (P1)

**FR-5.1** Users SHALL be able to delete calendar events they created from the CRM.

**FR-5.2** Deletion SHALL propagate to the connected calendar provider.

**FR-5.3** Deletion SHALL trigger notification to attendees (via provider).

#### FR-6: RSVP Response (P2)

**FR-6.1** Users SHALL be able to respond to meeting invitations (Accept, Decline, Tentative) from within the CRM.

**FR-6.2** Response status SHALL be synchronized to the calendar provider.

### Non-Functional Requirements

**NFR-1** Event creation SHALL complete within 3 seconds under normal conditions.

**NFR-2** Conference link generation SHALL handle asynchronous API responses gracefully with loading states.

**NFR-3** Calendar operations SHALL respect user permissions and connected account scopes.

**NFR-4** The system SHALL gracefully degrade when calendar provider is unavailable.

**NFR-5** All calendar operations SHALL be protected by Twenty's feature flag system.

**NFR-6** New providers SHALL be addable without modifying existing provider code (Open/Closed Principle).

**NFR-7** All services SHALL be independently unit-testable with mocked dependencies.

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │ CalendarComposer    │  │ EmailComposer       │  │ CalendarEventsCard  │ │
│  │ Module              │  │ Module              │  │ (enhanced)          │ │
│  │                     │  │                     │  │                     │ │
│  │ - CreateModal       │◄─┤ - MeetingInvite     │  │ - Quick actions     │ │
│  │ - EditModal         │  │   Button (calls     │  │ - Edit/Delete       │ │
│  │ - ConferenceSelect  │  │   calendar module)  │  │                     │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│            │                                                                 │
│            ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    Recoil State (Decoupled)                             ││
│  │  calendarComposerState  │  emailComposerState  │  modalState           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GraphQL API Layer                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Mutations:                          │  Queries:                             │
│  - createCalendarEvent               │  - getCalendarEventById               │
│  - updateCalendarEvent               │  - getAvailableConferenceProviders    │
│  - deleteCalendarEvent               │                                       │
│  - respondToCalendarEvent            │                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Backend Services (NestJS) - MODULAR                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    CalendarEventPushManager Module                    │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                    │  │
│  │  │ CalendarPushService │  │ CalendarPushService │  (Orchestrator)    │  │
│  │  │ (Provider-agnostic) │  │ uses ProviderRegistry                    │  │
│  │  └─────────────────────┘  └─────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    ConferenceProvider Module                          │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                    │  │
│  │  │ ConferenceService   │  │ ProviderRegistry    │                    │  │
│  │  │ (Provider-agnostic) │  │ (Pluggable)         │                    │  │
│  │  └─────────────────────┘  └─────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    IcsGenerator Module (Standalone)                   │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                    │  │
│  │  │ IcsFileGenerator    │  │ IcsComponentBuilder │                    │  │
│  │  │ Service             │  │ (Extensible)        │                    │  │
│  │  └─────────────────────┘  └─────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Provider Drivers (Pluggable)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ Google        │  │ Microsoft     │  │ CalDAV        │  │ [Future]    │  │
│  │ Calendar      │  │ Calendar      │  │               │  │ Provider    │  │
│  │ Driver        │  │ Driver        │  │ Driver        │  │             │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘  │
│         │                   │                  │                  │         │
│         ▼                   ▼                  ▼                  ▼         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ Google Meet   │  │ MS Teams      │  │ N/A           │  │ Zoom        │  │
│  │ Conference    │  │ Conference    │  │               │  │ Conference  │  │
│  │ Driver        │  │ Driver        │  │               │  │ Driver      │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘  │
│                                                                              │
│  ALL DRIVERS IMPLEMENT COMMON INTERFACES - NO CORE CODE CHANGES TO ADD NEW  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    External APIs                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Google Calendar API v3  │  Microsoft Graph  │  CalDAV  │  Zoom API  │ ... │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Provider Interface Definitions

#### Calendar Provider Interface

```typescript
// packages/twenty-server/src/modules/calendar/calendar-event-push-manager/interfaces/calendar-provider.interface.ts

export interface CalendarProviderInterface {
  /**
   * Unique identifier for this provider
   */
  readonly providerId: CalendarProviderId;

  /**
   * Human-readable name
   */
  readonly displayName: string;

  /**
   * Check if this provider can handle the given connected account
   */
  canHandle(connectedAccount: ConnectedAccount): boolean;

  /**
   * Create a new calendar event
   */
  createEvent(
    connectedAccount: ConnectedAccount,
    event: CalendarEventCreatePayload,
  ): Promise<CalendarProviderEventResult>;

  /**
   * Update an existing calendar event
   */
  updateEvent(
    connectedAccount: ConnectedAccount,
    externalEventId: string,
    event: CalendarEventUpdatePayload,
  ): Promise<CalendarProviderEventResult>;

  /**
   * Delete a calendar event
   */
  deleteEvent(
    connectedAccount: ConnectedAccount,
    externalEventId: string,
  ): Promise<void>;

  /**
   * Respond to an event invitation (optional)
   */
  respondToEvent?(
    connectedAccount: ConnectedAccount,
    externalEventId: string,
    response: CalendarEventResponseStatus,
  ): Promise<void>;
}

// Provider type enum - extensible
export enum CalendarProviderId {
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  CALDAV = 'CALDAV',
  // Future: APPLE = 'APPLE',
  // Future: ZOHO = 'ZOHO',
}
```

#### Conference Provider Interface

```typescript
// packages/twenty-server/src/modules/calendar/conference-provider/interfaces/conference-provider.interface.ts

export interface ConferenceProviderInterface {
  /**
   * Unique identifier for this conference provider
   */
  readonly providerId: ConferenceProviderId;

  /**
   * Human-readable display name
   */
  readonly displayName: string;

  /**
   * Icon identifier for UI
   */
  readonly iconKey: string;

  /**
   * Check if this provider is available for the given connected account
   */
  isAvailable(connectedAccount: ConnectedAccount): boolean;

  /**
   * Create a new conference and return meeting details
   */
  createConference(
    connectedAccount: ConnectedAccount,
    options: CreateConferenceOptions,
  ): Promise<ConferenceResult>;

  /**
   * Delete/cancel a conference (optional)
   */
  deleteConference?(
    connectedAccount: ConnectedAccount,
    conferenceId: string,
  ): Promise<void>;
}

export interface CreateConferenceOptions {
  title: string;
  startsAt: Date;
  endsAt: Date;
  attendees: string[];
}

export interface ConferenceResult {
  conferenceId: string;
  conferenceLink: string;
  dialInInfo?: string;
  passcode?: string;
  /** Provider-specific raw data for future use */
  providerData?: Record<string, unknown>;
}

// Conference provider types - extensible
export enum ConferenceProviderId {
  NONE = 'NONE',
  GOOGLE_MEET = 'GOOGLE_MEET',
  MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
  CUSTOM_LINK = 'CUSTOM_LINK',
  // Future: ZOOM = 'ZOOM',
  // Future: WEBEX = 'WEBEX',
  // Future: WHEREBY = 'WHEREBY',
}
```

#### Provider Registry Pattern

```typescript
// packages/twenty-server/src/modules/calendar/calendar-event-push-manager/services/calendar-provider-registry.service.ts

@Injectable()
export class CalendarProviderRegistry {
  private providers = new Map<CalendarProviderId, CalendarProviderInterface>();

  /**
   * Register a new provider - called during module initialization
   * This is the ONLY place new providers need to be added
   */
  registerProvider(provider: CalendarProviderInterface): void {
    this.providers.set(provider.providerId, provider);
  }

  /**
   * Get provider for a connected account
   */
  getProviderForAccount(
    connectedAccount: ConnectedAccount,
  ): CalendarProviderInterface {
    for (const provider of this.providers.values()) {
      if (provider.canHandle(connectedAccount)) {
        return provider;
      }
    }
    throw new CalendarProviderNotFoundError(connectedAccount.provider);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): CalendarProviderInterface[] {
    return Array.from(this.providers.values());
  }
}
```

### Module Structure (Following Twenty Patterns)

```
packages/twenty-server/src/modules/calendar/
├── calendar.module.ts                          # Main module aggregator
│
├── calendar-event-push-manager/                # NEW: Event creation/edit/delete
│   ├── calendar-event-push-manager.module.ts
│   ├── interfaces/
│   │   └── calendar-provider.interface.ts      # Provider contract
│   ├── services/
│   │   ├── calendar-push.service.ts            # Provider-agnostic orchestration
│   │   ├── calendar-provider-registry.service.ts
│   │   └── calendar-event-create.service.ts
│   ├── drivers/                                # PLUGGABLE PROVIDERS
│   │   ├── google-calendar/
│   │   │   ├── google-calendar-push.driver.ts
│   │   │   ├── google-calendar-push.module.ts
│   │   │   └── services/
│   │   │       └── google-calendar-create-event.service.ts
│   │   ├── microsoft-calendar/
│   │   │   ├── microsoft-calendar-push.driver.ts
│   │   │   └── ...
│   │   └── caldav/
│   │       └── ...
│   └── jobs/                                   # Background jobs if needed
│
├── conference-provider/                        # NEW: Video conferencing abstraction
│   ├── conference-provider.module.ts
│   ├── interfaces/
│   │   └── conference-provider.interface.ts    # Provider contract
│   ├── services/
│   │   ├── conference.service.ts               # Provider-agnostic service
│   │   └── conference-provider-registry.service.ts
│   ├── drivers/                                # PLUGGABLE CONFERENCE PROVIDERS
│   │   ├── google-meet/
│   │   │   ├── google-meet.driver.ts
│   │   │   └── google-meet.module.ts
│   │   ├── microsoft-teams/
│   │   │   └── ...
│   │   └── custom-link/
│   │       └── custom-link.driver.ts
│   └── types/
│
├── ics-generator/                              # NEW: Standalone ICS service
│   ├── ics-generator.module.ts
│   ├── services/
│   │   ├── ics-file-generator.service.ts
│   │   └── ics-component-builder.service.ts
│   └── types/
│       └── ics.types.ts
│
├── calendar-event-import-manager/              # EXISTING: Import/sync (unchanged)
│   └── ...
│
├── common/                                     # EXISTING: Shared entities/types
│   └── ...
│
└── resolvers/                                  # GraphQL resolvers
    └── calendar-event.resolver.ts
```

### Frontend Module Structure

```
packages/twenty-front/src/modules/calendar-composer/
├── components/
│   ├── CalendarEventCreateModal.tsx            # Main creation modal
│   ├── CalendarEventEditModal.tsx              # Edit existing events
│   ├── CalendarAttendeeInput.tsx               # Reusable attendee input
│   ├── CalendarDateTimePicker.tsx              # Reusable date/time picker
│   ├── ConferenceTypeSelector.tsx              # Dynamic provider selector
│   └── MeetingInviteButton.tsx                 # Button for email composer integration
├── hooks/
│   ├── useCalendarComposer.ts                  # Recoil state management
│   ├── useCreateCalendarEvent.ts               # GraphQL mutation wrapper
│   ├── useUpdateCalendarEvent.ts               # GraphQL mutation wrapper
│   ├── useDeleteCalendarEvent.ts               # GraphQL mutation wrapper
│   ├── useAvailableConferenceProviders.ts      # Query available providers
│   └── useCalendarEventFromEmail.ts            # Integration hook for email
├── states/
│   └── calendarComposerState.ts                # Recoil atoms (isolated)
├── types/
│   └── CalendarComposerTypes.ts
└── index.ts                                    # Public module exports
```

### Database Schema Changes

#### CalendarEvent Entity Enhancements

```typescript
// Existing fields remain unchanged
// Add new fields following Twenty's standard object patterns:

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
  standardId: CALENDAR_EVENT_STANDARD_FIELD_IDS.conferenceProviderId,
  type: FieldMetadataType.SELECT,
  label: 'Conference Provider',
  description: 'Video conference provider used',
  options: [
    { label: 'None', value: 'NONE', color: 'gray' },
    { label: 'Google Meet', value: 'GOOGLE_MEET', color: 'green' },
    { label: 'Microsoft Teams', value: 'MICROSOFT_TEAMS', color: 'blue' },
    { label: 'Zoom', value: 'ZOOM', color: 'blue' },           // Future
    { label: 'Custom Link', value: 'CUSTOM_LINK', color: 'purple' },
  ],
})
conferenceProviderId: string;

// Existing conferenceLink and conferenceSolution fields used for storage
```

### API Design

#### GraphQL Schema

```graphql
type Mutation {
  """
  Create a new calendar event and push to connected calendar provider.
  Uses provider abstraction - works with any registered provider.
  """
  createCalendarEvent(input: CreateCalendarEventInput!): CalendarEventResult!

  """
  Update an existing calendar event (must be CRM-created or owned).
  Changes sync back to provider via abstraction layer.
  """
  updateCalendarEvent(
    eventId: ID!
    input: UpdateCalendarEventInput!
  ): CalendarEventResult!

  """
  Delete a calendar event. Propagates to provider.
  """
  deleteCalendarEvent(eventId: ID!): DeleteCalendarEventResult!

  """
  Respond to a calendar event invitation.
  """
  respondToCalendarEvent(
    eventId: ID!
    response: CalendarEventResponseStatus!
  ): CalendarEventResult!
}

type Query {
  """
  Get available conference providers for the current user's connected accounts.
  Dynamic based on what providers are registered and what accounts are connected.
  """
  getAvailableConferenceProviders: [ConferenceProviderInfo!]!
}

input CreateCalendarEventInput {
  title: String!
  description: String
  location: String
  startsAt: DateTime!
  endsAt: DateTime!
  isFullDay: Boolean
  attendees: [CalendarAttendeeInput!]

  # Conference provider - uses abstraction layer
  conferenceProviderId: ConferenceProviderId
  customConferenceLink: String  # For CUSTOM_LINK provider

  connectedAccountId: ID!

  # Optional: Link to CRM records (extensible)
  linkedPersonIds: [ID!]
  linkedCompanyId: ID
  linkedOpportunityId: ID
}

input CalendarAttendeeInput {
  email: String!
  displayName: String
  isOrganizer: Boolean
}

"""
Extensible conference provider enum.
New providers can be added without changing GraphQL schema consumers.
"""
enum ConferenceProviderId {
  NONE
  GOOGLE_MEET
  MICROSOFT_TEAMS
  CUSTOM_LINK
  # Future: ZOOM, WEBEX, WHEREBY, etc.
}

type CalendarEventResult {
  success: Boolean!
  calendarEvent: CalendarEvent
  conferenceLink: String
  icsFileUrl: String
  error: String
}

type ConferenceProviderInfo {
  providerId: ConferenceProviderId!
  displayName: String!
  iconKey: String!
  isAvailable: Boolean!
}
```

### Integration Pattern: Email Composer ↔ Calendar

The email composer and calendar modules communicate through a well-defined interface, maintaining loose coupling:

```typescript
// packages/twenty-front/src/modules/calendar-composer/types/CalendarComposerTypes.ts

/**
 * Interface for email composer to request meeting creation.
 * Calendar module owns this interface - email module consumes it.
 */
export type CreateMeetingFromEmailOptions = {
  defaultAttendees: string[];
  defaultTitle?: string;
  defaultDescription?: string;
  onEventCreated: (result: MeetingCreatedResult) => void;
  onCancel: () => void;
};

export type MeetingCreatedResult = {
  calendarEvent: CalendarEvent;
  conferenceLink?: string;
  icsFileContent: string;
  icsFileName: string;
};

// In EmailComposeModal.tsx - email module uses calendar module's interface
const { openCalendarComposerForEmail } = useCalendarComposer();

const handleAddMeetingInvite = () => {
  openCalendarComposerForEmail({
    defaultAttendees: [toEmail, ...ccRecipients.split(',').map(e => e.trim())],
    defaultTitle: subject ? `Meeting: ${subject}` : undefined,
    onEventCreated: (result) => {
      // Add ICS attachment - email module's responsibility
      addAttachment({
        content: result.icsFileContent,
        name: result.icsFileName,
        type: 'text/calendar',
      });
      // Insert meeting link - email module's responsibility
      if (result.conferenceLink) {
        insertIntoBody(`\n\nJoin meeting: ${result.conferenceLink}`);
      }
    },
    onCancel: () => {
      // User cancelled - no action needed
    },
  });
};
```

### ICS Generator Service (Standalone & Reusable)

```typescript
// packages/twenty-server/src/modules/calendar/ics-generator/services/ics-file-generator.service.ts

@Injectable()
export class IcsFileGeneratorService {
  constructor(
    private readonly componentBuilder: IcsComponentBuilder,
  ) {}

  /**
   * Generate ICS file for a calendar event.
   * Standalone service - can be used by any module.
   */
  generate(event: CalendarEvent, options?: IcsGeneratorOptions): IcsFileResult {
    const vEvent = this.componentBuilder.buildVEvent(event);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Phos CRM//Calendar//EN',
      'METHOD:REQUEST',
      vEvent,
      'END:VCALENDAR',
    ].join('\r\n');

    return {
      content: icsContent,
      filename: `meeting-${event.id}.ics`,
      mimeType: 'text/calendar',
    };
  }

  /**
   * Generate ICS for multiple events (calendar export - future)
   */
  generateMultiple(events: CalendarEvent[]): IcsFileResult {
    // Future extensibility
    throw new NotImplementedError('Calendar export not yet implemented');
  }
}

@Injectable()
export class IcsComponentBuilder {
  /**
   * Build VEVENT component. Extensible for additional components.
   */
  buildVEvent(event: CalendarEvent): string {
    const lines = [
      'BEGIN:VEVENT',
      `UID:${event.iCalUid || generateUUID()}`,
      `DTSTAMP:${this.formatDateTime(new Date())}`,
      `DTSTART:${this.formatDateTime(event.startsAt)}`,
      `DTEND:${this.formatDateTime(event.endsAt)}`,
      `SUMMARY:${this.escapeText(event.title)}`,
    ];

    if (event.description) {
      lines.push(`DESCRIPTION:${this.escapeText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${this.escapeText(event.location)}`);
    }
    if (event.conferenceLink) {
      lines.push(`URL:${event.conferenceLink}`);
    }

    // Add attendees
    for (const participant of event.participants || []) {
      lines.push(`ATTENDEE;CN=${participant.displayName}:mailto:${participant.handle}`);
    }

    lines.push('END:VEVENT');
    return lines.join('\r\n');
  }

  // Future extensibility
  buildVAlarm?(alarm: CalendarAlarm): string;
  buildVTodo?(todo: CalendarTodo): string;
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
│  ║  Video Conference         (Dynamic based on account) ║│
│  ║  ┌─────────────────────────────────────────────────┐ ║│
│  ║  │ ◉ Google Meet  ○ Custom Link  ○ None           │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║  (MS Teams, Zoom shown when those accounts connected)║│
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
│  ║  │ Join meeting: https://meet.google.com/abc-xyz  │ ║│
│  ║  │                                                 │ ║│
│  ║  └─────────────────────────────────────────────────┘ ║│
│  ║                                                       ║│
│  ║  Attachments: [📅 meeting.ics ✕]                     ║│
│  ║                                                       ║│
│  ╠═══════════════════════════════════════════════════════╣│
│  ║  [📎 Attach] [📅 Add Meeting Invite]    [Send ➤]     ║│
│  ╚═══════════════════════════════════════════════════════╝│
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Infrastructure & Event Creation (Week 1-2)

**Backend:**
- [ ] Define `CalendarProviderInterface` and `ConferenceProviderInterface`
- [ ] Implement `CalendarProviderRegistry` and `ConferenceProviderRegistry`
- [ ] Create `GoogleCalendarPushDriver` implementing provider interface
- [ ] Create `IcsFileGeneratorService` as standalone module
- [ ] Add GraphQL mutations with feature flag protection
- [ ] Add feature flags: `IS_CALENDAR_COMPOSE_ENABLED`, `IS_CALENDAR_EVENT_CREATE_ENABLED`

**Frontend:**
- [ ] Create `calendar-composer` module structure
- [ ] Create `CalendarEventCreateModal` component
- [ ] Create `useCalendarComposer` hook with Recoil state
- [ ] Add "New Event" button to calendar card
- [ ] Implement `useAvailableConferenceProviders` query

### Phase 2: Google Meet Integration (Week 2-3)

**Backend:**
- [ ] Create `GoogleMeetConferenceDriver` implementing conference interface
- [ ] Handle async Meet link generation (polling/webhook)
- [ ] Register Google Meet in conference provider registry
- [ ] Add feature flag: `IS_CALENDAR_MEET_INTEGRATION_ENABLED`

**Frontend:**
- [ ] Create `ConferenceTypeSelector` component (dynamic based on query)
- [ ] Display Meet link after event creation
- [ ] Show loading state during Meet link generation

### Phase 3: Email Composer Integration (Week 3-4)

**Backend:**
- [ ] Ensure ICS service is accessible to email module
- [ ] Add endpoint for ICS file download if needed

**Frontend:**
- [ ] Create `MeetingInviteButton` component
- [ ] Implement `useCalendarEventFromEmail` integration hook
- [ ] Add "Add Meeting Invite" button to `EmailComposeModal`
- [ ] Auto-insert meeting link into email body
- [ ] Attach ICS file to email
- [ ] Add feature flag: `IS_CALENDAR_EMAIL_INVITE_ENABLED`

### Phase 4: Edit, Delete & Additional Providers (Week 4-5)

**Backend:**
- [ ] Implement `updateEvent` and `deleteEvent` in provider interface
- [ ] Add update/delete to Google driver
- [ ] Create `MicrosoftCalendarPushDriver` (following same interface)
- [ ] Create `MicrosoftTeamsConferenceDriver`
- [ ] Add feature flags: `IS_CALENDAR_EVENT_EDIT_ENABLED`, `IS_CALENDAR_EVENT_DELETE_ENABLED`

**Frontend:**
- [ ] Create `CalendarEventEditModal`
- [ ] Add edit/delete actions to event display
- [ ] Implement optimistic updates

### Phase 5: Polish, Testing & Documentation (Week 5-6)

- [ ] End-to-end testing for all flows
- [ ] Unit tests for all services (provider mocking)
- [ ] Integration tests for provider drivers
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Documentation for adding new providers
- [ ] Twenty contribution preparation (if applicable)

---

## Adding New Providers (Extensibility Guide)

### Adding a New Calendar Provider (e.g., Apple Calendar)

1. **Create driver directory:**
   ```
   calendar-event-push-manager/drivers/apple-calendar/
   ├── apple-calendar-push.driver.ts
   ├── apple-calendar-push.module.ts
   └── services/
   ```

2. **Implement the interface:**
   ```typescript
   @Injectable()
   export class AppleCalendarPushDriver implements CalendarProviderInterface {
     readonly providerId = CalendarProviderId.APPLE;
     readonly displayName = 'Apple Calendar';

     canHandle(connectedAccount: ConnectedAccount): boolean {
       return connectedAccount.provider === 'APPLE';
     }

     async createEvent(...) { /* implementation */ }
     async updateEvent(...) { /* implementation */ }
     async deleteEvent(...) { /* implementation */ }
   }
   ```

3. **Register in module:**
   ```typescript
   @Module({
     providers: [AppleCalendarPushDriver],
     exports: [AppleCalendarPushDriver],
   })
   export class AppleCalendarPushModule implements OnModuleInit {
     constructor(
       private registry: CalendarProviderRegistry,
       private driver: AppleCalendarPushDriver,
     ) {}

     onModuleInit() {
       this.registry.registerProvider(this.driver);
     }
   }
   ```

4. **Import in calendar module:**
   ```typescript
   @Module({
     imports: [
       GoogleCalendarPushModule,
       MicrosoftCalendarPushModule,
       AppleCalendarPushModule,  // Just add here
     ],
   })
   export class CalendarEventPushManagerModule {}
   ```

**No changes required to:**
- Core calendar services
- GraphQL schema
- Frontend components
- Other providers

### Adding a New Conference Provider (e.g., Zoom)

Same pattern as calendar providers - implement `ConferenceProviderInterface`, register in `ConferenceProviderRegistry`.

---

## Testing Strategy

### Unit Tests (Isolated)
- Each provider driver with mocked external APIs
- IcsFileGeneratorService with various event types
- Registry services
- Frontend hooks with mocked GraphQL

### Integration Tests
- GraphQL mutation tests with mocked providers
- Provider registration and discovery
- Cross-module communication (email ↔ calendar)

### E2E Tests
- Full event creation flow
- Email + meeting invite flow
- Edit/delete flows
- Provider switching

---

## Feature Flags

```typescript
// All feature flags follow Twenty's patterns for potential upstream contribution

FeatureFlagKey.IS_CALENDAR_COMPOSE_ENABLED          // Master toggle
FeatureFlagKey.IS_CALENDAR_EVENT_CREATE_ENABLED     // Event creation
FeatureFlagKey.IS_CALENDAR_EVENT_EDIT_ENABLED       // Event editing
FeatureFlagKey.IS_CALENDAR_EVENT_DELETE_ENABLED     // Event deletion
FeatureFlagKey.IS_CALENDAR_MEET_INTEGRATION_ENABLED // Google Meet
FeatureFlagKey.IS_CALENDAR_TEAMS_INTEGRATION_ENABLED // MS Teams (future)
FeatureFlagKey.IS_CALENDAR_EMAIL_INVITE_ENABLED     // Meeting in email
FeatureFlagKey.IS_CALENDAR_RSVP_ENABLED             // RSVP responses
```

---

## Security Considerations

1. **OAuth Scopes**: Ensure connected accounts have calendar write permissions
2. **Permission Checks**: Only allow editing/deleting events user created or owns
3. **Rate Limiting**: Implement rate limits on calendar API calls
4. **Input Validation**: Sanitize all user inputs before sending to providers
5. **Attendee Privacy**: Respect visibility settings when displaying attendees
6. **Provider Isolation**: Providers cannot access other providers' credentials

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Event creation success rate | > 99% |
| Average event creation time | < 3 seconds |
| Meet link generation success | > 98% |
| User adoption (events created/week) | Track growth |
| New provider integration time | < 1 day |

---

## Dependencies

- Google Calendar API v3
- Microsoft Graph Calendar API (Phase 4+)
- Existing OAuth infrastructure
- Email composer module (loose coupling)
- Twenty's feature flag system

---

## Open Questions

1. Should we support recurring events in Phase 1 or defer?
2. How should we handle timezone differences between users and attendees?
3. Should the ICS file be stored permanently or generated on-demand?
4. Do we need a calendar "quick view" in the navigation sidebar?
5. Should conference provider preference be stored per-user?

---

## References

- [Google Calendar API - Create Events](https://developers.google.com/workspace/calendar/api/guides/create-events)
- [Google Meet in Calendar API](https://workspace.google.com/blog/product-announcements/hangouts-meet-now-available-in-google)
- [iCalendar Specification (RFC 5545)](https://datatracker.ietf.org/doc/html/rfc5545)
- [Twenty CRM Documentation](https://docs.twenty.com/)
- [Twenty Backend Development Guide](https://docs.twenty.com/developers/contribute/capabilities/backend-development/)
- [Twenty Frontend Development Guide](https://docs.twenty.com/developers/contribute/capabilities/frontend-development/)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Phos Dev Team | Initial draft |
| 1.1 | Jan 2026 | Phos Dev Team | Added comprehensive modularity requirements, provider abstraction patterns, extensibility guide |

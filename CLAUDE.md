# CLAUDE.md

Use the native ways to extend Twenty as far as possible to maintain schema integrity. That would be GraphQL, REST API, and create-twenty-app@latest (https://docs.twenty.com/developers/extend/capabilities/apps). Only when truly custom implementations are required should we implement anything with scripts, etc. ALWAYS PREFER NATIVE DOCUMENTED TWENTY CRM PROCESSES TO ADD OBJECTS, VIEWS, DASHBOARDS, INTEGRATIONS, etc. Start there first.

Review the pages in both of the following routes for MANDATORY design patterns when developing backend and frontend features so they can eventually be released as Twenty CRM feature recommendations.
https://docs.twenty.com/developers/contribute/capabilities/frontend-development/
https://docs.twenty.com/developers/contribute/capabilities/backend-development/

All of our additions need to be modular in design and added with Twenty's Feature Flag conventions so that I can later request that they be features when completed and so that they feel very Twenty-native.

## Feature Flag Checklist (MANDATORY for every new Phos feature)

When adding a new feature flag for Phos:
1. Add the key to the backend enum: `packages/twenty-server/src/engine/core-modules/feature-flag/enums/feature-flag-key.enum.ts`
2. Add it to the phos-seeder `requiredFeatureFlags` array: `packages/twenty-server/src/engine/workspace-manager/phos-seeder/services/phos-seeder.service.ts`
3. Add it to the `PHOS_FEATURE_FLAGS` metadata array in the Admin Panel: `packages/twenty-front/src/modules/settings/admin-panel/components/SettingsAdminWorkspaceContent.tsx` — include a human-readable label and one-line description
4. Add it to the workspace-entity-manager test mock: `packages/twenty-server/src/engine/twenty-orm/entity-manager/workspace-entity-manager.spec.ts`
5. Run `npx nx typecheck twenty-front && npx nx typecheck twenty-server` to verify

Our Workspace will be "Phos Industries" and allowable domains will be "@phos-ind.com" and "@lvnlaser.com" and "@beehivebirth.com" (Multi-tenant)

We are focused on Phos only right now.

WHEN IN A BMAD WORKFLOW, OR SKILL - YOU DO NOT EVER NEED TO ASK FOR PERMISSION EXCEPT FOR EXTERNAL EFFECTS - IE. PUSHING A GIT COMMIT. ALL ACTIONS WILL BE TRACKED BY GIT AND CAN BE REOLLED BACK. DO NOT WASTE OUR TIME BY ASKING PERMISSION FOR EVERYTHING

ALWAYS REVIEW the PRD FIRST AND FOREMOST BEFORE STARTING MAJOR TASKS. PRIORITIZE USER CRITICAL TASKS AND REMEMBER USER CRITICAL DIRECTIVES. Use context7 mcp for doc lookup rather than guessing.

AFTER FIXING A PRD TASK ALWAYS CHANGE IT'S TEXT IN THE PRD with A CONTINUITY/ITERATION REFERENCE and a one-line description of the fix (Concision is King).

YOU MUST MAKE ATOMIC COMMITS TO ALLOW FOR QUICK ROLLBACKS

## Project Overview

Twenty is an open-source CRM built with modern technologies in a monorepo structure. The codebase is organized as an Nx workspace with multiple packages.

## Key Commands

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.


### Development

```bash
# Start development environment (frontend + backend + worker)
yarn start

# Individual package development
npx nx start twenty-front     # Start frontend dev server
npx nx start twenty-server    # Start backend server
npx nx run twenty-server:worker  # Start background worker
```

### Testing

```bash
# Run tests
npx nx test twenty-front      # Frontend unit tests
npx nx test twenty-server     # Backend unit tests
npx nx run twenty-server:test:integration:with-db-reset  # Integration tests with DB reset

# Storybook
npx nx storybook:build twenty-front         # Build Storybook
npx nx storybook:test twenty-front     # Run Storybook tests


When testing the UI end to end, click on "Continue with Email" and use the prefilled credentials.
```

### Code Quality

```bash
# Linting (diff with main - fastest)
npx nx lint:diff-with-main twenty-front           # Lint only files changed vs main
npx nx lint:diff-with-main twenty-server          # Lint only files changed vs main
npx nx lint:diff-with-main twenty-front --configuration=fix  # Auto-fix files changed vs main

# Linting (full project)
npx nx lint twenty-front      # Lint all files in frontend
npx nx lint twenty-server     # Lint all files in backend
npx nx lint twenty-front --fix  # Auto-fix all linting issues

# Type checking
npx nx typecheck twenty-front
npx nx typecheck twenty-server

# Format code
npx nx fmt twenty-front
npx nx fmt twenty-server
```

### Build

```bash
# Build packages
npx nx build twenty-front
npx nx build twenty-server
```

### Database Operations

```bash
# 🚨 CRITICAL: LIVE PRODUCTION DATA - NO RESETS ALLOWED 🚨
# Railway deployment imminent - maintain schema integrity at all costs

# ❌ FORBIDDEN - NEVER USE THESE:
# npx nx database:reset twenty-server         # ❌ DESTROYS LIVE DATA
# npx nx run twenty-server:database:init:prod # ❌ WIPES PRODUCTION

# ✅ SAFE MIGRATION WORKFLOW - ALWAYS USE THIS:

# 1. Generate migration (captures schema changes)
npx nx run twenty-server:typeorm migration:generate src/database/typeorm/core/migrations/common/[name] -d src/database/typeorm/core/core.datasource.ts

# 2. Review generated migration file - verify no data loss
# Check: up() and down() methods are reversible
# Check: No DROP TABLE/COLUMN on existing production data
# Check: Nullable constraints on new columns or provide defaults

# 3. Run migration (applies changes safely)
npx nx run twenty-server:database:migrate:prod # Run migrations

# 4. Sync metadata (updates Twenty's GraphQL schema)
npx nx run twenty-server:command workspace:sync-metadata

# PRODUCTION-SAFE MIGRATION PRINCIPLES:
# - Always additive: ADD columns/tables, never DROP existing ones
# - New columns must be nullable OR have default values
# - Test locally before deploying to Railway
# - Keep migrations atomic and reversible
# - Document breaking changes in migration comments
```

### GraphQL

```bash
# Generate GraphQL types
npx nx run twenty-front:graphql:generate
```

## Architecture Overview

### Tech Stack

- **Frontend**: React 18, TypeScript, Recoil (state management), Emotion (styling), Vite
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, GraphQL (with GraphQL Yoga)
- **Monorepo**: Nx workspace managed with Yarn 4

### Package Structure

```
packages/
├── twenty-front/          # React frontend application
├── twenty-server/         # NestJS backend API
├── twenty-ui/             # Shared UI components library
├── twenty-shared/         # Common types and utilities
├── twenty-emails/         # Email templates with React Email
├── twenty-website/        # Next.js documentation website
├── twenty-zapier/         # Zapier integration
└── twenty-e2e-testing/    # Playwright E2E tests
```

### Key Development Principles

- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party interfaces)
- **String literals over enums** (except for GraphQL enums)
- **No 'any' type allowed**
- **Event handlers preferred over useEffect** for state updates

### State Management

- **Recoil** for global state management
- Component-specific state with React hooks
- GraphQL cache managed by Apollo Client

### Backend Architecture

- **NestJS modules** for feature organization
- **TypeORM** for database ORM with PostgreSQL
- **GraphQL** API with code-first approach
- **Redis** for caching and session management
- **BullMQ** for background job processing

### Database

- **PostgreSQL** as primary database
- **Redis** for caching and sessions
- **TypeORM migrations** for schema management
- **ClickHouse** for analytics (when enabled)

## Development Workflow

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 MCP tools to resolve library IDs and get library docs without waiting for explicit requests.

### Before Making Changes

1. Always run linting and type checking after code changes
2. Test changes with relevant test suites
3. Ensure database migrations are properly structured
4. Check that GraphQL schema changes are backward compatible

### Code Style Notes

- Use **Emotion** for styling with styled-components pattern
- Follow **Nx** workspace conventions for imports
- Use **Lingui** for internationalization
- Components should be in their own directories with tests and stories

### Testing Strategy

- **Unit tests** with Jest for both frontend and backend
- **Integration tests** for critical backend workflows
- **Storybook** for component development and testing
- **E2E tests** with Playwright for critical user flows

## Important Files

- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Development guidelines and best practices

## My specific requirements for this CRM:

- This will be a swiss-army knife for my Phos Industries laser / software technical consulting business (https://phos.solutions)
- I must be able to manage the following core areas of my business
  - Customers
    - Relations
    - Communication
    - Sales
    - Support
    - Cash-flow by customer?
  - Projects
    - Gantt Charting
    - Kanban Boards
  - Expenses / Accounting
    - Receipt uploads
    - Tracking expenses per project
    - Annual expense / tax write-off exports
  - Quoting & Billing
    - Integrate with Stripe (use a placeho)
  - Email
  - Inventory Management (future - not critical yet)

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->

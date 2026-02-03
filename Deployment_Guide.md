# Phos CRM - Railway Deployment Guide (Docker)

> **Target**: Railway Pro plan with Docker builder
> **Architecture**: PostgreSQL 16 + Redis + Twenty Server + Twenty Worker
> **Branch**: `wip` (or `main` once merged)

---

## Prerequisites

1. **Railway CLI** installed and authenticated:
   ```bash
   # Install
   npm install -g @railway/cli
   # or
   brew install railway

   # Login
   railway login
   ```

2. **Local tools** available:
   - `openssl` (for generating secrets)
   - `git` (repo must be pushed to GitHub)

3. **GitHub repo** connected to Railway (Railway pulls source from GitHub)

---

## Step 1: Create the Railway Project

```bash
railway init --name phos-crm
```

If you already have a project, link to it instead:
```bash
railway link --project phos-crm
```

---

## Step 2: Add Database Services

Railway manages PostgreSQL and Redis as plugin services with persistent volumes and automated backups.

```bash
# PostgreSQL 16
railway add --database postgres

# Redis (queue + cache)
railway add --database redis
```

> **Important**: After adding these, note the auto-generated reference variable names. They typically appear as `Postgres` and `Redis` service names in the Railway dashboard. Verify the exact names — you will reference them as `${{Postgres.DATABASE_URL}}` and `${{Redis.REDIS_URL}}` below.

### Redis Configuration

Railway's default Redis uses `allkeys-lru` eviction. Twenty's BullMQ job queue **requires `noeviction`** to prevent job data loss. Set this in the Redis service variables:

```bash
railway variables --set "REDIS_CONFIGURATION=maxmemory-policy noeviction" --service Redis
```

If Railway doesn't expose direct Redis config, you can verify queue reliability by monitoring for eviction warnings in logs after deployment.

---

## Step 3: Create Application Services

Create two services from the same codebase — one for the API server, one for the background worker:

```bash
# API + Frontend server
railway add --service twenty-server

# Background job worker
railway add --service twenty-worker
```

---

## Step 4: Configure the Server Service

### 4a. Set Build Configuration

The server service uses the existing production Dockerfile. Set the Dockerfile path and builder via service variables:

```bash
railway variables --set "RAILWAY_DOCKERFILE_PATH=packages/twenty-docker/twenty/Dockerfile" --service twenty-server
```

Alternatively, create a `railway.toml` at the repo root for config-as-code (see [Appendix A](#appendix-a-railwaytoml-config-as-code)).

### 4b. Set Environment Variables

Generate secrets first:
```bash
APP_SECRET=$(openssl rand -base64 32)
echo "Generated APP_SECRET: $APP_SECRET"
```

Set all server variables (replace placeholder values):
```bash
railway variables --service twenty-server \
  --set "NODE_ENV=production" \
  --set "PG_DATABASE_URL=\${{Postgres.DATABASE_URL}}" \
  --set "REDIS_URL=\${{Redis.REDIS_URL}}" \
  --set "APP_SECRET=$APP_SECRET" \
  --set "SERVER_URL=https://api.phos-ind.com" \
  --set "FRONTEND_URL=https://app.phos-ind.com" \
  --set "STORAGE_TYPE=local" \
  --set "IS_MULTIWORKSPACE_ENABLED=true" \
  --set "AUTH_PASSWORD_ENABLED=true" \
  --set "SIGN_IN_PREFILLED=false"
```

> **Note on reference variables**: The `${{Postgres.DATABASE_URL}}` syntax is Railway's template syntax. It resolves at deploy time to the actual connection string from the Postgres plugin. Escape the `$` when setting via CLI to prevent shell interpolation.

### 4c. Set Build Args

The frontend needs the server URL baked in at build time:
```bash
railway variables --service twenty-server \
  --set "REACT_APP_SERVER_BASE_URL=https://api.phos-ind.com"
```

This is picked up by the Dockerfile's `ARG REACT_APP_SERVER_BASE_URL` directive.

---

## Step 5: Configure the Worker Service

The worker runs from the same Docker image but with a different start command and migrations disabled:

```bash
railway variables --set "RAILWAY_DOCKERFILE_PATH=packages/twenty-docker/twenty/Dockerfile" --service twenty-worker
```

```bash
railway variables --service twenty-worker \
  --set "NODE_ENV=production" \
  --set "PG_DATABASE_URL=\${{Postgres.DATABASE_URL}}" \
  --set "REDIS_URL=\${{Redis.REDIS_URL}}" \
  --set "APP_SECRET=$APP_SECRET" \
  --set "SERVER_URL=https://api.phos-ind.com" \
  --set "STORAGE_TYPE=local" \
  --set "IS_MULTIWORKSPACE_ENABLED=true" \
  --set "DISABLE_DB_MIGRATIONS=true" \
  --set "DISABLE_CRON_JOBS_REGISTRATION=true"
```

> **Why disable migrations on the worker?** The `entrypoint.sh` runs migrations and registers cron jobs on startup. Only the server should do this — the worker just processes BullMQ jobs. Running migrations from both would cause race conditions.

### Worker Start Command

Override the default CMD so the worker runs `yarn worker:prod` instead of `node dist/main`. Set this in the Railway dashboard under **twenty-worker > Settings > Deploy > Start Command**:

```
yarn worker:prod
```

Or via config-as-code in `railway.toml` (see [Appendix A](#appendix-a-railwaytoml-config-as-code)).

---

## Step 6: Add Persistent Volume (Server)

Twenty stores uploaded files (receipts, attachments) in `.local-storage`. Without a volume, redeployments wipe this data:

```bash
railway volume add --service twenty-server
```

When prompted, set the **mount path** to:
```
/app/.local-storage
```

This maps to the path created in the Dockerfile (`mkdir -p /app/.local-storage`).

---

## Step 7: Deploy

### 7a. First Deploy via CLI

Link your local repo and deploy:

```bash
# Link to the server service
railway link --service twenty-server
railway up

# Link to the worker service
railway link --service twenty-worker
railway up
```

Or deploy to a specific service without re-linking:

```bash
railway up --service twenty-server
railway up --service twenty-worker
```

### 7b. Monitor Build Logs

```bash
railway logs --build --service twenty-server
```

The build takes several minutes (multi-stage Docker: deps, server build, front build, runtime assembly).

### 7c. Monitor Deployment Logs

```bash
railway logs --deployment --service twenty-server
```

You should see the entrypoint.sh output:
```
Running database setup and migrations...
Database appears to be empty, running migrations.
Successfully migrated DB!
Registering background sync jobs...
Successfully registered all background sync jobs!
```

---

## Step 8: First-Time Initialization

### 8a. Create Your Admin Account

Navigate to your frontend URL and create the first account with `ben@phos-ind.com`. This creates the workspace.

### 8b. Grant Admin Access

Connect to the Railway Postgres instance and grant full admin:

```bash
# Use railway run to execute with production DB credentials
railway run --service twenty-server -- \
  psql $PG_DATABASE_URL -c "UPDATE core.\"user\" SET \"canAccessFullAdminPanel\" = true WHERE email = 'ben@phos-ind.com';"
```

### 8c. Run the Phos Seeder

The phos-seeder creates all 13 custom objects, 22 relations, 6 feature flags, and standard object extensions:

```bash
# Get your workspace ID from the database
railway run --service twenty-server -- \
  psql $PG_DATABASE_URL -tAc "SELECT id FROM core.workspace LIMIT 1;"
```

```bash
# Run the seeder with the workspace ID
railway run --service twenty-server -- \
  node dist/command/command workspace:seed:phos -- --workspace-id <WORKSPACE_ID>
```

### 8d. Run Upgrade Commands (if on v1.16+)

```bash
railway run --service twenty-server -- node dist/command/command upgrade:1-16:identify-object-metadata
railway run --service twenty-server -- node dist/command/command upgrade:1-16:identify-field-metadata
railway run --service twenty-server -- node dist/command/command upgrade:1-16:identify-view-metadata
railway run --service twenty-server -- node dist/command/command upgrade:1-16:identify-index-metadata
railway run --service twenty-server -- node dist/command/command upgrade:1-16:flush-v2-cache-and-increment-metadata-version
```

---

## Step 9: Custom Domain & SSL

Railway auto-provisions SSL via Let's Encrypt.

```bash
# Generate a Railway subdomain first (for testing)
railway domain --service twenty-server

# Add custom domain
railway domain app.phos-ind.com --service twenty-server --port 3000
```

Then add the CNAME record in your DNS:
- **Host**: `app` (or `api`)
- **Value**: the Railway-provided target (shown after running the command)
- **TTL**: 300

Update environment variables to match:
```bash
railway variables --service twenty-server \
  --set "SERVER_URL=https://app.phos-ind.com" \
  --set "FRONTEND_URL=https://app.phos-ind.com" \
  --set "REACT_APP_SERVER_BASE_URL=https://app.phos-ind.com"
```

> **Note**: Since Twenty serves both API and frontend from the same process (`ServeStaticModule`), `SERVER_URL` and `FRONTEND_URL` can be the same domain. The API lives at `/api` and `/graphql` paths, frontend is the root.

Redeploy after variable changes:
```bash
railway redeploy --service twenty-server --yes
```

---

## Step 10: Verify Deployment

```bash
# Health check
curl https://app.phos-ind.com/healthz

# Check server logs
railway logs --service twenty-server

# Check worker logs
railway logs --service twenty-worker
```

### Verification Checklist

- [ ] `/healthz` returns 200
- [ ] Login with `ben@phos-ind.com` works
- [ ] Admin Panel visible in Settings
- [ ] "Phos Features" section shows 6 feature flag toggles
- [ ] Sidebar shows custom objects: Projects, Expenses, Quotes, Invoices, Payments, Mileage Logs
- [ ] Worker logs show "Listening for jobs..."

---

## Ongoing Operations

### Redeployment (After Code Changes)

If using GitHub integration (recommended for ongoing):
- Push to the connected branch; Railway auto-deploys.

If using CLI deploys:
```bash
railway up --service twenty-server
railway up --service twenty-worker
```

### Database Backups

Railway Postgres provides automated daily backups. For manual backups:

```bash
# Dump from Railway to local file
railway run --service twenty-server -- \
  pg_dump $PG_DATABASE_URL --format=custom --file=/tmp/backup.dump

# Or run pg_dump locally with the Railway connection string
railway run --service twenty-server -- printenv PG_DATABASE_URL
# Then use the URL with local pg_dump
```

### Viewing Variables

```bash
railway variables --service twenty-server --kv
railway variables --service twenty-worker --kv
```

### Running One-Off Commands

```bash
# Sync workspace metadata
railway run --service twenty-server -- \
  node dist/command/command workspace:sync-metadata

# Register cron jobs manually
railway run --service twenty-server -- \
  node dist/command/command cron:register:all
```

### Rollback

Railway keeps deployment history. To rollback:
1. Open the Railway dashboard
2. Navigate to the service
3. Click the deployment to rollback to
4. Select "Rollback"

Database migrations have `down()` methods but **manual rollback is recommended** — review the migration before reverting.

---

## Data Safety Guarantees

| Risk | Protection |
|------|------------|
| Redeploy wipes database | Railway Postgres uses persistent volumes. Service redeployments do NOT affect the database. |
| Migration destroys data | `entrypoint.sh` only runs `setup-db.ts` if the `core` schema doesn't exist. Subsequent deploys run `upgrade` (additive only). |
| Custom objects lost | Phos-seeder is idempotent — skips already-created objects. Objects live in workspace schema, not TypeORM migrations. |
| Feature flags reset | Seeder `requiredFeatureFlags` array re-enables them. Also visible in Admin Panel. |
| File uploads lost | Persistent volume mounted at `/app/.local-storage` survives redeployments. |
| Need full rollback | Atomic git commits + Railway deployment rollback. Database backups available. |
| Worker races migrations | Worker has `DISABLE_DB_MIGRATIONS=true` — only the server runs migrations. |

---

## Appendix A: railway.toml Config-as-Code

Place this at the repo root for declarative service configuration. Note: Railway applies `railway.toml` to the service that the repo is connected to. For multi-service setups, some configuration must still be done via dashboard or CLI.

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "packages/twenty-docker/twenty/Dockerfile"

[deploy]
healthcheckPath = "/healthz"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

For the worker service, use the dashboard to override:
- **Start Command**: `yarn worker:prod`
- **Health check**: disable (worker has no HTTP endpoint)

---

## Appendix B: Environment Variable Reference

### Required (Server)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PG_DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway template ref |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Railway template ref |
| `APP_SECRET` | `openssl rand -base64 32` | Generate once, share with worker |
| `SERVER_URL` | `https://app.phos-ind.com` | Public URL |
| `FRONTEND_URL` | `https://app.phos-ind.com` | Same as SERVER_URL (single process serves both) |
| `REACT_APP_SERVER_BASE_URL` | `https://app.phos-ind.com` | Build-time arg for frontend |
| `STORAGE_TYPE` | `local` | Use `s3` later if needed |
| `IS_MULTIWORKSPACE_ENABLED` | `true` | Multi-tenant for Phos domains |
| `AUTH_PASSWORD_ENABLED` | `true` | Email/password login |
| `SIGN_IN_PREFILLED` | `false` | Disable demo prefill in production |
| `RAILWAY_DOCKERFILE_PATH` | `packages/twenty-docker/twenty/Dockerfile` | Custom Dockerfile location |

### Required (Worker — additional/overrides)

| Variable | Value | Notes |
|----------|-------|-------|
| `DISABLE_DB_MIGRATIONS` | `true` | Server handles migrations |
| `DISABLE_CRON_JOBS_REGISTRATION` | `true` | Server handles cron registration |

### Optional (Add When Ready)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Epic 003 - Stripe integration |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `AUTH_GOOGLE_ENABLED` | Google OAuth login |
| `AUTH_GOOGLE_CLIENT_ID` | Google OAuth |
| `AUTH_GOOGLE_CLIENT_SECRET` | Google OAuth |
| `MESSAGING_PROVIDER_GMAIL_ENABLED` | Gmail integration |
| `CALENDAR_PROVIDER_GOOGLE_ENABLED` | Google Calendar sync |
| `EMAIL_DRIVER` | `smtp` for real email (default: `LOGGER`) |
| `EMAIL_SMTP_HOST` | SMTP server |
| `EMAIL_SMTP_PORT` | SMTP port |
| `EMAIL_SMTP_USER` | SMTP username |
| `EMAIL_SMTP_PASSWORD` | SMTP password |
| `EMAIL_FROM_ADDRESS` | Sender address |
| `SENTRY_DSN` | Error monitoring |
| `PG_SSL_ALLOW_SELF_SIGNED` | `true` if Railway PG uses self-signed certs |

---

## Appendix C: Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │           Railway Project            │
                    │            (phos-crm)                │
                    │                                      │
                    │  ┌──────────┐    ┌──────────┐       │
     HTTPS ────────────▶ twenty-  │    │  twenty-  │       │
     app.phos-ind.com│  │ server   │    │  worker   │       │
                    │  │          │    │           │       │
                    │  │ API +    │    │ BullMQ    │       │
                    │  │ Frontend │    │ Jobs      │       │
                    │  │ Cron     │    │           │       │
                    │  │ Migrate  │    │ No HTTP   │       │
                    │  └────┬─────┘    └─────┬─────┘       │
                    │       │                │             │
                    │       ▼                ▼             │
                    │  ┌──────────┐    ┌──────────┐       │
                    │  │ Postgres │    │  Redis    │       │
                    │  │  (16)    │◀───│           │       │
                    │  │          │    │ noeviction│       │
                    │  │ Daily    │    │           │       │
                    │  │ Backups  │    │           │       │
                    │  └──────────┘    └──────────┘       │
                    │                                      │
                    │  ┌──────────┐                        │
                    │  │ Volume   │                        │
                    │  │ .local-  │                        │
                    │  │ storage  │                        │
                    │  └──────────┘                        │
                    └─────────────────────────────────────┘
```

---

## Appendix D: Quick Command Reference

```bash
# --- Project Setup ---
railway login
railway init --name phos-crm          # or: railway link --project phos-crm
railway add --database postgres
railway add --database redis
railway add --service twenty-server
railway add --service twenty-worker

# --- Deploy ---
railway up --service twenty-server
railway up --service twenty-worker

# --- Logs ---
railway logs --build --service twenty-server
railway logs --deployment --service twenty-server
railway logs --service twenty-worker

# --- Domain ---
railway domain --service twenty-server
railway domain app.phos-ind.com --service twenty-server --port 3000

# --- Variables ---
railway variables --service twenty-server --kv
railway variables --set "KEY=value" --service twenty-server

# --- One-Off Commands ---
railway run --service twenty-server -- node dist/command/command workspace:seed:phos -- --workspace-id <ID>
railway run --service twenty-server -- node dist/command/command workspace:sync-metadata

# --- Maintenance ---
railway redeploy --service twenty-server --yes
railway redeploy --service twenty-worker --yes
```

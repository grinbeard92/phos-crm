# Phos Industries CRM - Domain Configuration Guide
## Making phos-ind.com the Primary/Admin Domain

**Created**: 2026-01-25
**Workspace**: Phos Industries
**Status**: Configuration Guide

---

## Overview

This guide explains how to configure phos-ind.com as the primary domain for the Phos Industries workspace, with lvnlaser.com and beehivebirth.com as additional approved access domains.

---

## Current Architecture

### Domain Concepts in Twenty CRM

Twenty CRM has **NO explicit "admin domain"** concept. Instead, it uses:

1. **Workspace Subdomain**: Unique identifier (e.g., `phos-ind`)
   - Users access via: `phos-ind.localhost:3001` (dev) or `phos-ind.yourdomain.com` (prod)
   - Required, unique per workspace
   - Used for routing and workspace identification

2. **Custom Domain** (Optional): Direct domain routing
   - Example: `phos-ind.com` → routes directly to workspace
   - Requires DNS/SSL configuration
   - Bypasses subdomain requirement

3. **Approved Access Domains**: Email domains for auto-signup
   - Example: `@phos-ind.com`, `@lvnlaser.com`
   - Users with these emails can sign up without invitation
   - Must be validated via email confirmation

---

## Recommended Configuration for Phos Industries

### Strategy: Subdomain + Approved Domains (Simplest)

**Why**: Works immediately without DNS/SSL configuration, supports all domains equally.

**Setup**:
- **Workspace Subdomain**: `phos-ind` (primary identifier)
- **Access URL**: `http://localhost:3001` (dev) or `https://crm.phos-ind.com` (prod)
- **Approved Domains**: `@phos-ind.com`, `@lvnlaser.com`, `@beehivebirth.com`

**User Experience**:
- ✅ All three email domains can auto-signup
- ✅ All users share the same workspace
- ✅ Works in development without extra config
- ❌ Users must access via subdomain URL (not phos-ind.com directly)

---

### Alternative: Custom Domain (Advanced)

**Why**: Professional URL (phos-ind.com instead of phos-ind.crm.com)

**Setup**:
- **Workspace Subdomain**: `phos-ind`
- **Custom Domain**: `phos-ind.com`
- **Approved Domains**: `@phos-ind.com`, `@lvnlaser.com`, `@beehivebirth.com`
- **DNS**: Point phos-ind.com → your server IP
- **SSL**: Configure certificate for phos-ind.com

**User Experience**:
- ✅ Users access via: `https://phos-ind.com` (professional)
- ✅ All three email domains can auto-signup
- ✅ Fallback: `phos-ind.crm.com` also works
- ⚠️ Requires DNS/SSL configuration
- ⚠️ Only works in production (not localhost)

---

## Implementation Steps

### Step 1: Verify Current Workspace Configuration

**Query Current Workspace**:
```graphql
query GetWorkspace {
  workspace {
    id
    subdomain
    customDomain
    isCustomDomainEnabled
    approvedAccessDomains {
      edges {
        node {
          domain
          isValidated
        }
      }
    }
  }
}
```

**Expected Result** (based on your previous setup):
```json
{
  "data": {
    "workspace": {
      "id": "572a2b40-3011-4a15-bff4-376f817b88e7",
      "subdomain": "phos-ind",  // or needs to be set
      "customDomain": null,
      "isCustomDomainEnabled": false,
      "approvedAccessDomains": {
        "edges": [
          {
            "node": {
              "domain": "phos-ind.com",
              "isValidated": true  // or false if not validated
            }
          }
        ]
      }
    }
  }
}
```

---

### Step 2: Update Workspace Subdomain (If Needed)

**If subdomain is not "phos-ind"**, update it:

```graphql
mutation UpdateWorkspace {
  updateWorkspace(
    data: {
      subdomain: "phos-ind"
    }
  ) {
    id
    subdomain
  }
}
```

**Note**: Subdomain must be unique across all workspaces and cannot contain underscores or special characters.

---

### Step 3: Add Approved Access Domains

**Add phos-ind.com** (if not already added):

```graphql
mutation CreateApprovedDomain1 {
  createApprovedAccessDomain(
    input: {
      approvedAccessDomain: {
        domain: "phos-ind.com"
        email: "admin@phos-ind.com"
      }
    }
  ) {
    id
    domain
    isValidated
  }
}
```

**Add lvnlaser.com**:

```graphql
mutation CreateApprovedDomain2 {
  createApprovedAccessDomain(
    input: {
      approvedAccessDomain: {
        domain: "lvnlaser.com"
        email: "admin@lvnlaser.com"
      }
    }
  ) {
    id
    domain
    isValidated
  }
}
```

**Add beehivebirth.com**:

```graphql
mutation CreateApprovedDomain3 {
  createApprovedAccessDomain(
    input: {
      approvedAccessDomain: {
        domain: "beehivebirth.com"
        email: "admin@beehivebirth.com"
      }
    }
  ) {
    id
    domain
    isValidated
  }
}
```

**Important**: Each mutation sends a validation email to the specified admin email address.

---

### Step 4: Validate Domains

**Process**:
1. Check inbox for emails from Twenty CRM
2. Click validation link in each email
3. Domain marked as `isValidated: true`
4. Users with that email domain can now auto-signup

**Check Validation Status**:
```graphql
query CheckDomainValidation {
  approvedAccessDomains {
    edges {
      node {
        id
        domain
        isValidated
      }
    }
  }
}
```

**Expected Result**:
```json
{
  "data": {
    "approvedAccessDomains": {
      "edges": [
        { "node": { "domain": "phos-ind.com", "isValidated": true } },
        { "node": { "domain": "lvnlaser.com", "isValidated": true } },
        { "node": { "domain": "beehivebirth.com", "isValidated": true } }
      ]
    }
  }
}
```

---

### Step 5: Test Auto-Signup

**Create Test Users**:
1. Navigate to signup page: `http://localhost:3001/sign-up`
2. Try signing up with:
   - `test@phos-ind.com` ✅ Should work
   - `test@lvnlaser.com` ✅ Should work
   - `test@beehivebirth.com` ✅ Should work
   - `test@gmail.com` ❌ Should require invitation

**Expected Behavior**:
- Users with approved domains → Account created immediately
- Users with other domains → "You need an invitation to join this workspace"

---

## Optional: Enable Custom Domain (Production Only)

### Step 1: Enable Custom Domain in CRM

```graphql
mutation EnableCustomDomain {
  updateWorkspace(
    data: {
      customDomain: "phos-ind.com"
      isCustomDomainEnabled: true
    }
  ) {
    id
    customDomain
    isCustomDomainEnabled
  }
}
```

---

### Step 2: Configure DNS

**Add DNS Records**:

**For phos-ind.com → Your Server**:
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600
```

**For www.phos-ind.com → phos-ind.com** (optional):
```
Type: CNAME
Name: www
Value: phos-ind.com
TTL: 3600
```

**Wait for DNS Propagation** (up to 48 hours, usually 5-10 minutes):
```bash
# Test DNS resolution
nslookup phos-ind.com
dig phos-ind.com
```

---

### Step 3: Configure SSL Certificate

**Option A: Let's Encrypt (Free, Recommended)**

Using Certbot:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d phos-ind.com -d www.phos-ind.com

# Auto-renewal (already configured by Certbot)
sudo certbot renew --dry-run
```

**Option B: Cloudflare (Free, Easy)**

1. Add domain to Cloudflare
2. Update nameservers at domain registrar
3. Enable "Full (strict)" SSL mode
4. Cloudflare handles certificate automatically

---

### Step 4: Update Environment Variables

**Backend (.env)**:
```bash
# Update frontend URL to custom domain
FRONTEND_URL=https://phos-ind.com
SERVER_URL=https://phos-ind.com

# Keep multi-workspace enabled
IS_MULTIWORKSPACE_ENABLED=true
```

**Restart Server**:
```bash
npx nx start twenty-server
```

---

### Step 5: Test Custom Domain

**Access CRM**:
- Navigate to: `https://phos-ind.com`
- Should show Twenty CRM login/signup
- Subdomain still works: `https://phos-ind.yourbasedomain.com`

---

## Domain Hierarchy & Routing

### How Twenty Routes Requests

```
1. Extract hostname from request
   Example: https://phos-ind.com/login

2. Check if hostname matches workspace.customDomain
   If phos-ind.com == workspace.customDomain → Route to workspace ✅

3. Else, check if hostname contains subdomain
   Example: phos-ind.localhost:3001
   Extract subdomain: "phos-ind"
   Find workspace where subdomain == "phos-ind" → Route to workspace ✅

4. Else, use DEFAULT_SUBDOMAIN
   Example: localhost:3001 (no subdomain)
   Find workspace where subdomain == "app" → Route to default workspace ✅

5. Else, show error: "Workspace not found"
```

---

## Security & Access Control

### Email Domain Validation

**Purpose**: Prevents unauthorized users from joining workspace

**Process**:
1. User signs up with email (e.g., `john@phos-ind.com`)
2. Twenty extracts domain: `phos-ind.com`
3. Checks approved access domains: Is `phos-ind.com` in list? Is it validated?
4. If yes → Allow signup
5. If no → Require invitation

**Code Reference** (`auth.service.ts:797-804`):
```typescript
if (
  workspace?.approvedAccessDomains.some(
    (trustDomain) =>
      trustDomain.isValidated && trustDomain.domain === email.split('@')[1],
  )
) {
  return; // Allow signup
}
```

---

### Managing Access

**Allow New Domain**:
```graphql
mutation AddDomain {
  createApprovedAccessDomain(
    input: {
      approvedAccessDomain: {
        domain: "newdomain.com"
        email: "admin@newdomain.com"
      }
    }
  ) {
    id
    domain
  }
}
```

**Remove Domain**:
```graphql
mutation RemoveDomain {
  deleteApprovedAccessDomain(id: "DOMAIN_ID") {
    id
  }
}
```

**List All Domains**:
```graphql
query ListDomains {
  approvedAccessDomains {
    edges {
      node {
        id
        domain
        isValidated
        createdAt
      }
    }
  }
}
```

---

## UI-Based Configuration (Alternative to GraphQL)

### Via Twenty CRM Settings

**Navigate**: Settings → Workspace → Domains

**Features**:
1. **Workspace Domain Card**:
   - Edit subdomain
   - Enable/disable custom domain
   - Set custom domain URL

2. **Approved Domains Card**:
   - Add new approved domain
   - Send validation email
   - View validation status
   - Remove domains

3. **Emailing Domains Card** (Optional):
   - Configure SMTP domains for sending emails
   - Not required for access control

---

## Troubleshooting

### Problem: Users can't sign up with approved domain

**Checks**:
1. Is domain validated? Check `isValidated: true`
2. Is multi-workspace enabled? Check `IS_MULTIWORKSPACE_ENABLED=true`
3. Is domain exactly matching? (no typos, no @)
4. Check validation email in spam folder

**Solution**:
```bash
# Query domain status
# In GraphQL playground: http://localhost:3000/graphql
query {
  approvedAccessDomains {
    edges {
      node {
        domain
        isValidated
      }
    }
  }
}

# If not validated, resend validation email via UI
# Settings → Workspace → Domains → Resend validation
```

---

### Problem: Custom domain not routing to workspace

**Checks**:
1. Is `isCustomDomainEnabled: true`?
2. Is DNS pointing to server? Test: `nslookup phos-ind.com`
3. Is SSL certificate valid? Test: `curl -v https://phos-ind.com`
4. Is `FRONTEND_URL` updated in `.env`?
5. Did you restart server after `.env` changes?

**Solution**:
```bash
# Test DNS
dig phos-ind.com  # Should return your server IP

# Test SSL
openssl s_client -connect phos-ind.com:443 -servername phos-ind.com

# Check environment
grep FRONTEND_URL packages/twenty-server/.env

# Restart
npx nx start twenty-server
```

---

### Problem: "Workspace not found" error

**Cause**: Subdomain doesn't match any workspace

**Solution**:
```graphql
# Verify workspace exists and subdomain is correct
query {
  workspaces {
    edges {
      node {
        id
        subdomain
        customDomain
      }
    }
  }
}

# Update if needed
mutation {
  updateWorkspace(data: { subdomain: "phos-ind" }) {
    subdomain
  }
}
```

---

## Database Schema Reference

### Workspace Table

```sql
-- Core workspace configuration
CREATE TABLE "metadata"."workspace" (
  "id" uuid PRIMARY KEY,
  "subdomain" varchar UNIQUE,           -- Routing identifier
  "customDomain" varchar UNIQUE,        -- Optional custom domain
  "isCustomDomainEnabled" boolean,      -- Enable custom routing
  "displayName" varchar,                -- Human-readable name
  "createdAt" timestamp,
  "updatedAt" timestamp
);
```

### Approved Access Domain Table

```sql
-- Email domains allowed to auto-signup
CREATE TABLE "metadata"."approvedAccessDomain" (
  "id" uuid PRIMARY KEY,
  "domain" varchar,                     -- Email domain (e.g., "phos-ind.com")
  "isValidated" boolean DEFAULT false,  -- Domain ownership confirmed
  "workspaceId" uuid REFERENCES "metadata"."workspace"(id),
  "createdAt" timestamp,
  "deletedAt" timestamp
);
```

---

## Summary: Recommended Configuration

### For Phos Industries CRM

**Development (Current)**:
```
Workspace Subdomain: phos-ind
Access URL: http://localhost:3001
Approved Domains:
  - phos-ind.com (validated)
  - lvnlaser.com (validated)
  - beehivebirth.com (validated)
Custom Domain: None (not needed in dev)
```

**Production (Future)**:
```
Workspace Subdomain: phos-ind
Custom Domain: phos-ind.com (optional but recommended)
Access URL: https://phos-ind.com
Fallback URL: https://phos-ind.crm.yourdomain.com
Approved Domains:
  - phos-ind.com (validated)
  - lvnlaser.com (validated)
  - beehivebirth.com (validated)
```

---

## Next Steps

1. ✅ Verify current workspace configuration (Step 1)
2. ⏳ Add/validate all three approved domains (Steps 2-4)
3. ⏳ Test auto-signup with each domain (Step 5)
4. ⏳ (Optional) Configure custom domain for production
5. ⏳ Document final configuration in workspace settings

---

**Last Updated**: 2026-01-25
**Version**: 1.0
**Configuration Status**: Pending validation of lvnlaser.com and beehivebirth.com

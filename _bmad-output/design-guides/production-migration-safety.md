# 🚨 Production Database Migration Safety Guide

**Status:** LIVE PRODUCTION DATA ACTIVE
**Deployment Platform:** Railway (imminent)
**Last Updated:** 2026-01-26

---

## Critical Context

We have **LIVE PRODUCTION DATA** in the system. All database changes must preserve existing data and maintain schema integrity for Railway deployment.

## ❌ FORBIDDEN COMMANDS - NEVER USE

```bash
# These commands DESTROY production data:
npx nx database:reset twenty-server
npx nx run twenty-server:database:init:prod
npx nx run twenty-server:test:integration:with-db-reset
```

**If you see these commands in documentation or scripts, DO NOT RUN THEM.**

---

## ✅ Production-Safe Migration Workflow

### Step 1: Generate Migration

```bash
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/AddSalesGuidanceFields \
  -d src/database/typeorm/core/core.datasource.ts
```

**What this does:**
- Compares current TypeORM entities vs. database schema
- Generates SQL statements to sync them
- Creates timestamped migration file

### Step 2: Review Migration File

**Location:** `packages/twenty-server/src/database/typeorm/core/migrations/common/`

**Critical checks before running:**

```typescript
// ✅ SAFE - Adding new column with default or nullable
await queryRunner.query(`
  ALTER TABLE "opportunity"
  ADD COLUMN "salesGuidance" text NULL
`);

// ✅ SAFE - Creating new table
await queryRunner.query(`
  CREATE TABLE "emailTemplate" (...)
`);

// ⚠️ RISKY - Adding non-nullable column without default
await queryRunner.query(`
  ALTER TABLE "opportunity"
  ADD COLUMN "requiredField" text NOT NULL
`);
// Fix: Add DEFAULT value or make nullable

// ❌ DANGEROUS - Dropping existing column
await queryRunner.query(`
  ALTER TABLE "opportunity"
  DROP COLUMN "existingField"
`);
// Fix: Keep column, mark as deprecated, remove in future phase

// ❌ DANGEROUS - Renaming column without data migration
await queryRunner.query(`
  ALTER TABLE "opportunity"
  RENAME COLUMN "oldName" TO "newName"
`);
// Fix: Add new column, migrate data, deprecate old
```

### Step 3: Test Migration Locally

```bash
# Backup local database first (optional but recommended)
pg_dump twenty > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
npx nx run twenty-server:database:migrate:prod

# Verify changes
psql twenty -c "\d opportunity"  # Check table schema
psql twenty -c "SELECT COUNT(*) FROM opportunity"  # Verify data intact

# If something goes wrong, rollback:
# Restore from backup OR run migration down() method
```

### Step 4: Sync Metadata

```bash
# Updates Twenty's GraphQL schema to match database
npx nx run twenty-server:command workspace:sync-metadata
```

### Step 5: Verify in UI

- Open http://localhost:3001/settings/objects
- Check new fields appear correctly
- Test creating/editing records
- Verify existing data still displays

---

## Production Migration Principles

### 1. Always Additive

**DO:**
- ADD new tables
- ADD new columns (nullable or with defaults)
- ADD new indexes
- ADD new constraints that don't conflict with existing data

**DON'T:**
- DROP existing tables
- DROP existing columns
- RENAME columns (without data migration)
- Add NOT NULL constraints without defaults

### 2. Reversible Migrations

Every migration must have a proper `down()` method:

```typescript
export class AddSalesGuidanceFields1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "opportunity"
      ADD COLUMN "salesGuidance" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "opportunity"
      DROP COLUMN "salesGuidance"
    `);
  }
}
```

### 3. Data Migration Strategy

If you need to transform existing data:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // 1. Add new column (nullable)
  await queryRunner.query(`
    ALTER TABLE "opportunity"
    ADD COLUMN "daysInStage" integer NULL
  `);

  // 2. Populate existing records
  await queryRunner.query(`
    UPDATE "opportunity"
    SET "daysInStage" = EXTRACT(DAY FROM NOW() - "createdAt")::integer
    WHERE "daysInStage" IS NULL
  `);

  // 3. Optionally make NOT NULL after population
  await queryRunner.query(`
    ALTER TABLE "opportunity"
    ALTER COLUMN "daysInStage" SET NOT NULL
  `);
}
```

### 4. Multi-Step Breaking Changes

For breaking changes, use multi-phase deployment:

**Phase 1 (Week 1):** Add new field, keep old field
```typescript
ALTER TABLE "opportunity" ADD COLUMN "leadSourceNew" text NULL;
```

**Phase 2 (Week 2):** Migrate data, dual-write to both
```typescript
UPDATE "opportunity" SET "leadSourceNew" = "leadSource";
-- Application code writes to both fields
```

**Phase 3 (Week 3):** Switch reads to new field
```typescript
-- Application code reads from leadSourceNew only
```

**Phase 4 (Week 4):** Drop old field
```typescript
ALTER TABLE "opportunity" DROP COLUMN "leadSource";
```

---

## Railway Deployment Checklist

Before deploying migration to Railway:

- [ ] Migration tested locally with production data copy
- [ ] `up()` and `down()` methods both tested
- [ ] No data loss confirmed
- [ ] No breaking changes to existing records
- [ ] Metadata sync command verified
- [ ] GraphQL API still returns existing records
- [ ] Frontend UI displays existing data correctly
- [ ] New fields render properly in UI
- [ ] Migration file committed to git
- [ ] Migration documented in this guide

---

## Common Twenty CRM Patterns

### Adding Custom Fields to Existing Objects

**Example: Add Sales Guidance to Opportunity**

```typescript
// 1. Update entity file
// packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts

import { FieldMetadataType } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';

@WorkspaceField({
  standardId: OPPORTUNITY_STANDARD_FIELD_IDS.salesGuidance,
  type: FieldMetadataType.TEXT,
  label: 'Sales Guidance',
  description: 'Sales call scripts and objection handling',
  icon: 'IconScript',
})
salesGuidance: string | null;

// 2. Generate migration
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/AddSalesGuidanceToOpportunity \
  -d src/database/typeorm/core/core.datasource.ts

// 3. Review, test, run migration
// 4. Sync metadata
```

### Creating New Custom Objects

Use Twenty's GraphQL API (safer than direct schema manipulation):

```bash
# See: _bmad-output/scripts/create-custom-objects.sh
# This uses the metadata API which handles migrations internally
```

---

## Emergency Rollback Procedure

If a migration breaks production:

### Option 1: Run Down Migration

```bash
# Manually run the down() method
npx nx run twenty-server:typeorm migration:revert
```

### Option 2: Database Restore (Last Resort)

**Railway specific:**
1. Access Railway project dashboard
2. Navigate to PostgreSQL service
3. Restore from automatic backup
4. Redeploy application
5. **Note:** Loses data created after backup timestamp

---

## Migration Naming Conventions

```
YYYYMMDDHHMMSS-DescriptiveActionName.ts

Examples:
20260126120000-AddSalesGuidanceToOpportunity.ts
20260126130000-CreateEmailTemplateObject.ts
20260126140000-AddDaysInStageToOpportunity.ts
20260126150000-AddLeadSourceAttributionFields.ts
```

**Naming pattern:**
- `Add` - Adding new columns/fields
- `Create` - Creating new tables/objects
- `Update` - Modifying existing data
- `Remove` - Removing deprecated features (RARE in production)

---

## Questions Before Running Any Migration

1. **Does this migration modify existing tables?**
   - If yes: Are existing records safe?

2. **Does this add NOT NULL constraints?**
   - If yes: Do existing records have values OR is there a default?

3. **Does this rename or drop columns?**
   - If yes: STOP. Use multi-phase deployment instead.

4. **Can this migration be rolled back?**
   - If no: Don't run it.

5. **Have I tested this locally?**
   - If no: Test first.

6. **Is the down() method implemented?**
   - If no: Implement it.

---

## Contact & Escalation

**If you're unsure about a migration's safety:**
1. Review this guide
2. Test in local development copy
3. Document the risk in migration comments
4. Create a database backup before running
5. Run during low-traffic period

**Remember:** It's better to delay a feature than corrupt production data.

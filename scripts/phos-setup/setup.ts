#!/usr/bin/env npx ts-node
/**
 * Phos CRM Setup CLI
 *
 * Interactive setup tool for configuring Phos Industries CRM extensions.
 * Run with: npx ts-node scripts/phos-setup/setup.ts
 *
 * Features:
 * - Creates custom objects (Project, Expense, Quote, Invoice, Payment, etc.)
 * - Adds custom fields to objects
 * - Establishes relationships between objects
 * - Extends standard objects (Opportunity, Company)
 * - Configures admin access
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Configuration
const GRAPHQL_ENDPOINT = process.env.TWENTY_GRAPHQL_URL || 'http://localhost:3000/graphql';
const SCHEMA_PATH = path.join(__dirname, 'schema.json');

interface FieldOption {
  value: string;
  label: string;
  color: string;
  position: number;
}

interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  description: string;
  options?: FieldOption[];
}

interface RelationshipDefinition {
  name: string;
  type: string;
  targetObject: string;
  description: string;
}

interface ObjectDefinition {
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  description: string;
  icon: string;
  fields: FieldDefinition[];
  relationships?: RelationshipDefinition[];
}

interface Schema {
  objects: ObjectDefinition[];
  opportunityExtensions?: { fields: FieldDefinition[] };
  companyExtensions?: { fields: FieldDefinition[] };
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string): void {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string): void {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string): void {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string): void {
  log(`⚠️  ${message}`, colors.yellow);
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function graphqlRequest(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: unknown; errors?: Array<{ message: string }> }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}

async function createObject(
  apiKey: string,
  obj: ObjectDefinition
): Promise<string | null> {
  const query = `
    mutation CreateObject($input: CreateOneObjectInput!) {
      createOneObject(input: $input) {
        id
        nameSingular
      }
    }
  `;

  const variables = {
    input: {
      object: {
        nameSingular: obj.nameSingular,
        namePlural: obj.namePlural,
        labelSingular: obj.labelSingular,
        labelPlural: obj.labelPlural,
        description: obj.description,
        icon: obj.icon,
      },
    },
  };

  const result = await graphqlRequest(apiKey, query, variables);

  if (result.errors) {
    logError(`Failed to create object ${obj.nameSingular}: ${result.errors[0].message}`);
    return null;
  }

  const data = result.data as { createOneObject: { id: string } };
  return data.createOneObject.id;
}

async function createField(
  apiKey: string,
  objectId: string,
  field: FieldDefinition
): Promise<boolean> {
  const query = `
    mutation CreateField($input: CreateOneFieldMetadataInput!) {
      createOneField(input: $input) {
        id
        name
      }
    }
  `;

  const fieldInput: Record<string, unknown> = {
    objectMetadataId: objectId,
    name: field.name,
    label: field.label,
    type: field.type,
    description: field.description,
  };

  if (field.options) {
    fieldInput.options = field.options;
  }

  const variables = {
    input: {
      field: fieldInput,
    },
  };

  const result = await graphqlRequest(apiKey, query, variables);

  if (result.errors) {
    logError(`Failed to create field ${field.name}: ${result.errors[0].message}`);
    return false;
  }

  return true;
}

async function getObjectIdByName(
  apiKey: string,
  nameSingular: string
): Promise<string | null> {
  const query = `
    query GetObjects {
      objects {
        edges {
          node {
            id
            nameSingular
          }
        }
      }
    }
  `;

  const result = await graphqlRequest(apiKey, query);

  if (result.errors) {
    return null;
  }

  const data = result.data as {
    objects: {
      edges: Array<{ node: { id: string; nameSingular: string } }>;
    };
  };

  const obj = data.objects.edges.find(
    (e) => e.node.nameSingular === nameSingular
  );
  return obj?.node.id || null;
}

async function createRelation(
  apiKey: string,
  sourceObjectId: string,
  targetObjectId: string,
  relationName: string,
  description: string
): Promise<boolean> {
  const query = `
    mutation CreateRelation($input: CreateOneRelationInput!) {
      createOneRelation(input: $input) {
        id
      }
    }
  `;

  const variables = {
    input: {
      relation: {
        fromObjectMetadataId: sourceObjectId,
        toObjectMetadataId: targetObjectId,
        fromName: relationName,
        fromLabel: relationName.charAt(0).toUpperCase() + relationName.slice(1),
        fromDescription: description,
        relationType: 'MANY_TO_ONE',
      },
    },
  };

  const result = await graphqlRequest(apiKey, query, variables);

  if (result.errors) {
    logError(`Failed to create relation ${relationName}: ${result.errors[0].message}`);
    return false;
  }

  return true;
}

async function main(): Promise<void> {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Phos CRM Setup Tool', colors.bright);
  log('='.repeat(60) + '\n', colors.cyan);

  // Load schema
  if (!fs.existsSync(SCHEMA_PATH)) {
    logError(`Schema file not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema: Schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  logSuccess(`Loaded schema with ${schema.objects.length} objects`);

  // Get API key
  logInfo('You need an API key for your Twenty CRM workspace.');
  logInfo('Create one in Settings > Developers > API Keys');
  const apiKey = await prompt('\nEnter your API key: ');

  if (!apiKey) {
    logError('API key is required');
    process.exit(1);
  }

  // Test connection
  log('\nTesting connection...', colors.yellow);
  const testResult = await graphqlRequest(apiKey, '{ __typename }');
  if (testResult.errors) {
    logError(`Connection failed: ${testResult.errors[0].message}`);
    process.exit(1);
  }
  logSuccess('Connected to Twenty CRM');

  // Menu
  log('\nWhat would you like to do?\n');
  log('  1. Full setup (create all objects, fields, relationships)');
  log('  2. Create objects only');
  log('  3. Add fields to existing objects');
  log('  4. Create relationships only');
  log('  5. Extend Opportunity object');
  log('  6. Extend Company object');
  log('  0. Exit\n');

  const choice = await prompt('Enter your choice (0-6): ');

  switch (choice) {
    case '1':
      await fullSetup(apiKey, schema);
      break;
    case '2':
      await createObjects(apiKey, schema);
      break;
    case '3':
      await addFieldsToExistingObjects(apiKey, schema);
      break;
    case '4':
      await createRelationships(apiKey, schema);
      break;
    case '5':
      await extendOpportunity(apiKey, schema);
      break;
    case '6':
      await extendCompany(apiKey, schema);
      break;
    case '0':
      log('\nGoodbye!', colors.cyan);
      process.exit(0);
    default:
      logError('Invalid choice');
      process.exit(1);
  }

  log('\n' + '='.repeat(60), colors.cyan);
  log('  Setup complete!', colors.green);
  log('='.repeat(60) + '\n', colors.cyan);
}

async function fullSetup(apiKey: string, schema: Schema): Promise<void> {
  log('\n--- Full Setup ---\n', colors.bright);

  // Step 1: Create objects
  await createObjects(apiKey, schema);

  // Step 2: Add fields
  await addFieldsToExistingObjects(apiKey, schema);

  // Step 3: Create relationships
  await createRelationships(apiKey, schema);

  // Step 4: Extend standard objects
  if (schema.opportunityExtensions) {
    await extendOpportunity(apiKey, schema);
  }
  if (schema.companyExtensions) {
    await extendCompany(apiKey, schema);
  }
}

async function createObjects(apiKey: string, schema: Schema): Promise<void> {
  log('\n--- Creating Objects ---\n', colors.bright);

  for (const obj of schema.objects) {
    log(`Creating ${obj.labelSingular}...`);
    const objectId = await createObject(apiKey, obj);
    if (objectId) {
      logSuccess(`Created ${obj.labelSingular} (${objectId})`);
    }
  }
}

async function addFieldsToExistingObjects(
  apiKey: string,
  schema: Schema
): Promise<void> {
  log('\n--- Adding Fields ---\n', colors.bright);

  for (const obj of schema.objects) {
    const objectId = await getObjectIdByName(apiKey, obj.nameSingular);
    if (!objectId) {
      logWarning(`Object ${obj.nameSingular} not found, skipping fields`);
      continue;
    }

    log(`Adding fields to ${obj.labelSingular}...`);
    for (const field of obj.fields) {
      const success = await createField(apiKey, objectId, field);
      if (success) {
        logSuccess(`  Added field: ${field.name}`);
      }
    }
  }
}

async function createRelationships(
  apiKey: string,
  schema: Schema
): Promise<void> {
  log('\n--- Creating Relationships ---\n', colors.bright);

  for (const obj of schema.objects) {
    if (!obj.relationships) continue;

    const sourceId = await getObjectIdByName(apiKey, obj.nameSingular);
    if (!sourceId) {
      logWarning(`Source object ${obj.nameSingular} not found`);
      continue;
    }

    for (const rel of obj.relationships) {
      const targetId = await getObjectIdByName(apiKey, rel.targetObject);
      if (!targetId) {
        logWarning(`Target object ${rel.targetObject} not found`);
        continue;
      }

      log(`Creating ${obj.nameSingular} → ${rel.targetObject}...`);
      const success = await createRelation(
        apiKey,
        sourceId,
        targetId,
        rel.name,
        rel.description
      );
      if (success) {
        logSuccess(`  Created relation: ${rel.name}`);
      }
    }
  }
}

async function extendOpportunity(apiKey: string, schema: Schema): Promise<void> {
  if (!schema.opportunityExtensions) {
    logWarning('No opportunity extensions defined');
    return;
  }

  log('\n--- Extending Opportunity Object ---\n', colors.bright);

  const objectId = await getObjectIdByName(apiKey, 'opportunity');
  if (!objectId) {
    logError('Opportunity object not found');
    return;
  }

  for (const field of schema.opportunityExtensions.fields) {
    const success = await createField(apiKey, objectId, field);
    if (success) {
      logSuccess(`Added field: ${field.name}`);
    }
  }
}

async function extendCompany(apiKey: string, schema: Schema): Promise<void> {
  if (!schema.companyExtensions) {
    logWarning('No company extensions defined');
    return;
  }

  log('\n--- Extending Company Object ---\n', colors.bright);

  const objectId = await getObjectIdByName(apiKey, 'company');
  if (!objectId) {
    logError('Company object not found');
    return;
  }

  for (const field of schema.companyExtensions.fields) {
    const success = await createField(apiKey, objectId, field);
    if (success) {
      logSuccess(`Added field: ${field.name}`);
    }
  }
}

// Run the CLI
main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

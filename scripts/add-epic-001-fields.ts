/**
 * Epic 001: Add missing fields to custom objects via Twenty Metadata API
 *
 * This script adds the missing fields required by the PRD to:
 * - Project: priority, actualCost, progressPercentage, projectType
 * - Expense: paymentMethod, billable, status, approvedBy
 * - Quote: subtotal, discountPercentage, discountAmount, taxPercentage, taxAmount
 * - Invoice: subtotal, discountPercentage, discountAmount, taxPercentage, taxAmount, balanceDue, stripe fields
 */

const API_URL = 'http://localhost:3000/metadata';
const API_KEY = process.env.TWENTY_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE';

// Object IDs from metadata
const OBJECT_IDS = {
  project: '908deb12-79d9-4516-bf60-f4f0e2853dc3',
  expense: 'de73f140-b98e-4f50-8de5-b0c494c7dbb4',
  quote: '1e395f61-91dd-4ce3-8872-0b674cec9b41',
  invoice: 'ab4f4492-82f6-4628-87cb-0b07358ea899',
  workspaceMember: '214c05c6-2824-48f9-aa41-56e6b189e0fc',
};

interface FieldInput {
  name: string;
  label: string;
  type: string;
  description?: string;
  icon?: string;
  isNullable?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: string; color: string; position: number }>;
}

async function createField(objectId: string, field: FieldInput): Promise<void> {
  const mutation = `
    mutation CreateOneField($input: CreateOneFieldMetadataInput!) {
      createOneField(input: $input) {
        id
        name
        type
      }
    }
  `;

  const variables = {
    input: {
      field: {
        objectMetadataId: objectId,
        name: field.name,
        label: field.label,
        type: field.type,
        description: field.description || '',
        icon: field.icon || 'IconCircle',
        isNullable: field.isNullable ?? true,
        ...(field.defaultValue !== undefined && { defaultValue: field.defaultValue }),
        ...(field.options && { options: field.options }),
      },
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const result = await response.json() as {
      errors?: Array<{ message: string }>;
      data?: { createOneField: { id: string; name: string; type: string } };
    };

    if (result.errors) {
      // Check if it's a duplicate field error
      const errorMsg = result.errors[0]?.message || '';
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        console.log(`  ⚠️  Field '${field.name}' already exists, skipping`);
        return;
      }
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    console.log(`  ✅ Created field: ${field.name} (${result.data?.createOneField.id})`);
  } catch (error) {
    console.error(`  ❌ Failed to create field '${field.name}':`, error);
    throw error;
  }
}

async function addProjectFields(): Promise<void> {
  console.log('\n📁 Adding Project fields...');

  const fields: FieldInput[] = [
    {
      name: 'priority',
      label: 'Priority',
      type: 'SELECT',
      description: 'Project priority level',
      icon: 'IconFlag',
      options: [
        { label: 'Low', value: 'LOW', color: 'gray', position: 0 },
        { label: 'Medium', value: 'MEDIUM', color: 'blue', position: 1 },
        { label: 'High', value: 'HIGH', color: 'orange', position: 2 },
        { label: 'Critical', value: 'CRITICAL', color: 'red', position: 3 },
      ],
    },
    {
      name: 'actualCost',
      label: 'Actual Cost',
      type: 'CURRENCY',
      description: 'Actual cost spent on project (computed from expenses)',
      icon: 'IconCurrencyDollar',
    },
    {
      name: 'progressPercentage',
      label: 'Progress',
      type: 'NUMBER',
      description: 'Project completion percentage (0-100)',
      icon: 'IconPercentage',
      defaultValue: 0,
    },
    {
      name: 'projectType',
      label: 'Project Type',
      type: 'SELECT',
      description: 'Type of project',
      icon: 'IconCategory',
      options: [
        { label: 'Consulting', value: 'CONSULTING', color: 'blue', position: 0 },
        { label: 'Implementation', value: 'IMPLEMENTATION', color: 'green', position: 1 },
        { label: 'Support', value: 'SUPPORT', color: 'yellow', position: 2 },
        { label: 'Training', value: 'TRAINING', color: 'purple', position: 3 },
        { label: 'Other', value: 'OTHER', color: 'gray', position: 4 },
      ],
    },
  ];

  for (const field of fields) {
    await createField(OBJECT_IDS.project, field);
  }
}

async function addExpenseFields(): Promise<void> {
  console.log('\n💸 Adding Expense fields...');

  const fields: FieldInput[] = [
    {
      name: 'paymentMethod',
      label: 'Payment Method',
      type: 'SELECT',
      description: 'How the expense was paid',
      icon: 'IconCreditCard',
      options: [
        { label: 'Credit Card', value: 'CREDIT_CARD', color: 'blue', position: 0 },
        { label: 'Debit Card', value: 'DEBIT_CARD', color: 'green', position: 1 },
        { label: 'Cash', value: 'CASH', color: 'gray', position: 2 },
        { label: 'Check', value: 'CHECK', color: 'yellow', position: 3 },
        { label: 'Bank Transfer', value: 'BANK_TRANSFER', color: 'purple', position: 4 },
        { label: 'Other', value: 'OTHER', color: 'gray', position: 5 },
      ],
    },
    {
      name: 'billable',
      label: 'Billable',
      type: 'BOOLEAN',
      description: 'Whether this expense can be billed to the client',
      icon: 'IconReceipt',
      defaultValue: false,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'SELECT',
      description: 'Expense approval status',
      icon: 'IconStatusChange',
      options: [
        { label: 'Draft', value: 'DRAFT', color: 'gray', position: 0 },
        { label: 'Submitted', value: 'SUBMITTED', color: 'blue', position: 1 },
        { label: 'Approved', value: 'APPROVED', color: 'green', position: 2 },
        { label: 'Rejected', value: 'REJECTED', color: 'red', position: 3 },
        { label: 'Paid', value: 'PAID', color: 'purple', position: 4 },
      ],
    },
  ];

  for (const field of fields) {
    await createField(OBJECT_IDS.expense, field);
  }

  // Add approvedBy relation separately (requires special handling)
  console.log('  ℹ️  Note: approvedBy relation should be added via UI or separate relation API');
}

async function addQuoteFields(): Promise<void> {
  console.log('\n📝 Adding Quote fields...');

  const fields: FieldInput[] = [
    {
      name: 'subtotal',
      label: 'Subtotal',
      type: 'CURRENCY',
      description: 'Sum of line items before discount and tax',
      icon: 'IconCalculator',
    },
    {
      name: 'discountPercentage',
      label: 'Discount %',
      type: 'NUMBER',
      description: 'Discount percentage (0-100)',
      icon: 'IconDiscount',
      defaultValue: 0,
    },
    {
      name: 'discountAmount',
      label: 'Discount Amount',
      type: 'CURRENCY',
      description: 'Calculated discount amount',
      icon: 'IconDiscount2',
    },
    {
      name: 'taxPercentage',
      label: 'Tax %',
      type: 'NUMBER',
      description: 'Tax percentage',
      icon: 'IconReceipt2',
      defaultValue: 0,
    },
    {
      name: 'taxAmount',
      label: 'Tax Amount',
      type: 'CURRENCY',
      description: 'Calculated tax amount',
      icon: 'IconReceiptTax',
    },
  ];

  for (const field of fields) {
    await createField(OBJECT_IDS.quote, field);
  }
}

async function addInvoiceFields(): Promise<void> {
  console.log('\n🧾 Adding Invoice fields...');

  const fields: FieldInput[] = [
    {
      name: 'subtotal',
      label: 'Subtotal',
      type: 'CURRENCY',
      description: 'Sum of line items before discount and tax',
      icon: 'IconCalculator',
    },
    {
      name: 'discountPercentage',
      label: 'Discount %',
      type: 'NUMBER',
      description: 'Discount percentage (0-100)',
      icon: 'IconDiscount',
      defaultValue: 0,
    },
    {
      name: 'discountAmount',
      label: 'Discount Amount',
      type: 'CURRENCY',
      description: 'Calculated discount amount',
      icon: 'IconDiscount2',
    },
    {
      name: 'taxPercentage',
      label: 'Tax %',
      type: 'NUMBER',
      description: 'Tax percentage',
      icon: 'IconReceipt2',
      defaultValue: 0,
    },
    {
      name: 'taxAmount',
      label: 'Tax Amount',
      type: 'CURRENCY',
      description: 'Calculated tax amount',
      icon: 'IconReceiptTax',
    },
    {
      name: 'balanceDue',
      label: 'Balance Due',
      type: 'CURRENCY',
      description: 'Remaining balance (total - amountPaid)',
      icon: 'IconCash',
    },
    {
      name: 'stripeInvoiceId',
      label: 'Stripe Invoice ID',
      type: 'TEXT',
      description: 'Stripe invoice identifier',
      icon: 'IconBrandStripe',
    },
    {
      name: 'stripePaymentLink',
      label: 'Payment Link',
      type: 'TEXT',
      description: 'Stripe hosted payment link URL',
      icon: 'IconLink',
    },
    {
      name: 'stripePaymentStatus',
      label: 'Stripe Payment Status',
      type: 'TEXT',
      description: 'Payment status from Stripe',
      icon: 'IconStatusChange',
    },
  ];

  for (const field of fields) {
    await createField(OBJECT_IDS.invoice, field);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Epic 001: Adding missing fields to custom objects\n');
  console.log('API URL:', API_URL);
  console.log('Using API Key:', API_KEY.substring(0, 20) + '...');

  try {
    await addProjectFields();
    await addExpenseFields();
    await addQuoteFields();
    await addInvoiceFields();

    console.log('\n✅ All fields added successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npx nx run twenty-server:command workspace:sync-metadata');
    console.log('2. Verify fields appear in UI');
    console.log('3. Test GraphQL queries for new fields');
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main();

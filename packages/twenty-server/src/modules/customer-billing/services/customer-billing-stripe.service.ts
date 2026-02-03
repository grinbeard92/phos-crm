import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import * as fs from 'fs/promises';
import * as path from 'path';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

type StripeSettingsData = {
  sandboxMode: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
};

export type CreateStripeInvoiceInput = {
  customerEmail: string;
  customerName?: string;
  invoiceNumber: string;
  dueDate?: Date;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmountCents: number;
  }>;
  metadata?: Record<string, string>;
};

export type StripeInvoiceResult = {
  stripeInvoiceId: string;
  stripeCustomerId: string;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  paymentIntentStatus: string | null;
};

@Injectable()
export class CustomerBillingStripeService {
  private readonly logger = new Logger(CustomerBillingStripeService.name);
  private stripe: Stripe | null = null;
  private readonly settingsDir = path.join(process.cwd(), '.stripe-settings');
  private workspaceStripeInstances = new Map<string, Stripe>();

  constructor(
    private configService: ConfigService,
    private globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-10-29.clover',
      });
      this.logger.log('Stripe SDK initialized from environment variables');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured. Stripe integration disabled.',
      );
    }
  }

  private async ensureSettingsDir(): Promise<void> {
    try {
      await fs.access(this.settingsDir);
    } catch {
      await fs.mkdir(this.settingsDir, { recursive: true });
    }
  }

  private getSettingsFilePath(workspaceId: string): string {
    return path.join(this.settingsDir, `${workspaceId}.json`);
  }

  async getStripeSettings(
    workspaceId: string,
  ): Promise<StripeSettingsData> {
    try {
      const filePath = this.getSettingsFilePath(workspaceId);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      // Return default settings with environment variable values (masked)
      const envSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      const envWebhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

      return {
        sandboxMode: envSecretKey?.startsWith('sk_test_') ?? true,
        secretKey: envSecretKey ? '***' + envSecretKey.slice(-4) : undefined,
        webhookSecret: envWebhookSecret ? '***' + envWebhookSecret.slice(-4) : undefined,
      };
    }
  }

  async saveStripeSettings(
    workspaceId: string,
    settings: StripeSettingsData,
  ): Promise<void> {
    await this.ensureSettingsDir();
    const filePath = this.getSettingsFilePath(workspaceId);
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');

    // Reinitialize Stripe instance for this workspace if secret key provided
    if (settings.secretKey) {
      const stripeInstance = new Stripe(settings.secretKey, {
        apiVersion: '2025-10-29.clover',
      });
      this.workspaceStripeInstances.set(workspaceId, stripeInstance);
      this.logger.log(`Stripe SDK initialized for workspace ${workspaceId}`);
    }
  }

  async testStripeConnection(workspaceId: string): Promise<{
    success: boolean;
    message: string;
    accountId?: string;
  }> {
    try {
      const settings = await this.getStripeSettings(workspaceId);

      let testStripe: Stripe | null = null;

      // Try workspace-specific instance first
      if (this.workspaceStripeInstances.has(workspaceId)) {
        testStripe = this.workspaceStripeInstances.get(workspaceId)!;
      } else if (settings.secretKey && !settings.secretKey.startsWith('***')) {
        // Use settings secret key if not masked
        testStripe = new Stripe(settings.secretKey, {
          apiVersion: '2025-10-29.clover',
        });
      } else if (this.stripe) {
        // Fall back to environment variable instance
        testStripe = this.stripe;
      }

      if (!testStripe) {
        return {
          success: false,
          message: 'No Stripe API key configured',
        };
      }

      const account = await testStripe.accounts.retrieve();

      return {
        success: true,
        message: `Connected to Stripe account: ${(account as any).display_name || account.id}`,
        accountId: account.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to connect to Stripe',
      };
    }
  }

  isEnabled(): boolean {
    return this.stripe !== null;
  }

  async convertQuoteToInvoice(
    quoteId: string,
    workspaceId: string,
  ): Promise<string> {
    const quoteRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'quote',
    );

    const quote = await quoteRepository.findOne({
      where: { id: quoteId },
      relations: {
        company: true,
        contact: true,
        lineItems: true,
      },
    });

    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    // Create new invoice from quote data
    const invoiceRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'invoice',
    );

    const invoice = await invoiceRepository.save({
      name: quote.name || `Invoice from ${quote.quoteNumber}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'DRAFT',
      subtotal: quote.subtotal,
      discountPercentage: quote.discountPercentage,
      discountAmount: quote.discountAmount,
      taxPercentage: quote.taxPercentage,
      taxAmount: quote.taxAmount,
      total: quote.total,
      paidAmount: { amountMicros: 0, currencyCode: 'USD' },
      balanceDue: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      companyId: quote.companyId,
      contactId: quote.contactId,
      quoteId: quote.id,
      stripePaymentStatus: 'NOT_SYNCED',
    });

    // Copy line items from quote to invoice
    if (quote.lineItems && quote.lineItems.length > 0) {
      const invoiceLineItemRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'invoiceLineItem',
        );

      for (const quoteLineItem of quote.lineItems) {
        await invoiceLineItemRepository.save({
          description: quoteLineItem.description,
          quantity: quoteLineItem.quantity,
          unitPrice: quoteLineItem.unitPrice,
          serviceCategory: quoteLineItem.serviceCategory,
          invoiceId: invoice.id,
        });
      }
    }

    this.logger.log(
      `Converted quote ${quoteId} to invoice ${invoice.id} with ${quote.lineItems?.length || 0} line items`,
    );

    return invoice.id;
  }

  async fetchInvoiceData(
    invoiceId: string,
    workspaceId: string,
  ): Promise<CreateStripeInvoiceInput> {
    const invoiceRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'invoice',
    );

    const invoice = await invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: {
        company: true,
        contact: true,
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Extract customer email from contact or company
    const customerEmail = invoice.contact?.email || invoice.company?.email || '';
    if (!customerEmail) {
      throw new Error(
        `No email found for invoice ${invoiceId}. Invoice must have a contact or company with an email.`,
      );
    }

    // Build customer name
    const customerName =
      invoice.company?.name ||
      (invoice.contact
        ? `${invoice.contact.nameFirstName || ''} ${invoice.contact.nameLastName || ''}`.trim()
        : undefined);

    // Convert line items to Stripe format
    const lineItems = (invoice.lineItems || []).map((item: any) => ({
      description: item.description || 'Service',
      quantity: item.quantity || 1,
      unitAmountCents: Math.round(
        (item.unitPrice?.amountMicros || 0) / 10000,
      ), // Convert micros to cents
    }));

    if (lineItems.length === 0) {
      throw new Error(`Invoice ${invoiceId} has no line items`);
    }

    return {
      customerEmail,
      customerName,
      invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      lineItems,
      metadata: {
        crmInvoiceId: invoice.id,
        crmInvoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8),
        workspaceId,
      },
    };
  }

  async updateCrmAfterInvoiceCreation(
    invoiceId: string,
    workspaceId: string,
    stripeCustomerId: string,
    stripeInvoiceId: string,
    stripePaymentLink: string | null,
  ): Promise<void> {
    const invoiceRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'invoice',
    );

    const invoice = await invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: { company: true },
    });

    if (!invoice) {
      this.logger.error(`Invoice not found: ${invoiceId}`);
      return;
    }

    // Update invoice with Stripe IDs and payment link
    await invoiceRepository.update(invoiceId, {
      stripeInvoiceId,
      stripePaymentLink: stripePaymentLink || undefined,
      stripePaymentStatus: 'PENDING',
    });

    // Update company with stripeCustomerId if not already set
    if (invoice.companyId) {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'company',
        );

      const company = await companyRepository.findOne({
        where: { id: invoice.companyId },
      });

      if (company && !company.stripeCustomerId) {
        await companyRepository.update(invoice.companyId, {
          stripeCustomerId,
        });
        this.logger.log(
          `Updated company ${invoice.companyId} with Stripe customer ID ${stripeCustomerId}`,
        );
      }
    }
  }

  async createInvoice(
    input: CreateStripeInvoiceInput,
  ): Promise<StripeInvoiceResult> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    // Find or create customer
    const customers = await this.stripe.customers.list({
      email: input.customerEmail,
      limit: 1,
    });

    let customer: Stripe.Customer;

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await this.stripe.customers.create({
        email: input.customerEmail,
        name: input.customerName,
      });
    }

    // Create invoice
    const invoice = await this.stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: input.dueDate
        ? Math.ceil(
            (input.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
        : 30,
      metadata: {
        crmInvoiceNumber: input.invoiceNumber,
        ...input.metadata,
      },
    });

    // Add line items
    for (const item of input.lineItems) {
      await this.stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        description: item.description,
        quantity: item.quantity,
        amount: item.unitAmountCents * item.quantity,
      });
    }

    // Finalize the invoice
    const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(
      invoice.id,
    );

    return {
      stripeInvoiceId: finalizedInvoice.id,
      stripeCustomerId: customer.id,
      hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url || null,
      invoicePdfUrl: finalizedInvoice.invoice_pdf || null,
      paymentIntentStatus: null,
    };
  }

  async createPaymentLink(input: {
    stripeInvoiceId: string;
  }): Promise<string | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const invoice = await this.stripe.invoices.retrieve(
      input.stripeInvoiceId,
    );

    return invoice.hosted_invoice_url || null;
  }

  async handleWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    return event;
  }

  async handleInvoicePaid(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    this.logger.log(`Invoice paid: ${invoice.id}`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amountPaid: invoice.amount_paid,
      metadata: invoice.metadata,
    });

    const workspaceId = invoice.metadata?.workspaceId;
    const crmInvoiceId = invoice.metadata?.crmInvoiceId;

    if (!workspaceId || !crmInvoiceId) {
      this.logger.warn(
        'Invoice paid webhook missing workspaceId or crmInvoiceId in metadata',
        { invoiceId: invoice.id, metadata: invoice.metadata },
      );
      return;
    }

    try {
      const invoiceRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'invoice',
        );

      const crmInvoice = await invoiceRepository.findOne({
        where: { id: crmInvoiceId },
      });

      if (!crmInvoice) {
        this.logger.error(
          `CRM invoice not found: ${crmInvoiceId} in workspace ${workspaceId}`,
        );
        return;
      }

      // Update invoice status to PAID and set paid amount
      await invoiceRepository.update(crmInvoiceId, {
        status: 'PAID',
        paidAmount: {
          amountMicros: invoice.amount_paid * 10000, // Convert cents to micros
          currencyCode: (invoice.currency || 'usd').toUpperCase(),
        },
        stripePaymentStatus: 'SUCCEEDED',
      });

      // Create Payment record
      const paymentRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'payment',
        );

      await paymentRepository.save({
        name: `Payment for ${crmInvoice.invoiceNumber || invoice.id.slice(0, 8)}`,
        paymentDate: new Date(),
        amount: {
          amountMicros: invoice.amount_paid * 10000,
          currencyCode: (invoice.currency || 'usd').toUpperCase(),
        },
        paymentMethod: 'STRIPE',
        stripePaymentId:
          typeof (invoice as any).payment_intent === 'string'
            ? (invoice as any).payment_intent
            : (invoice as any).payment_intent?.id || '',
        invoiceId: crmInvoiceId,
        companyId: crmInvoice.companyId,
        notes: `Stripe invoice ${invoice.id} paid`,
      });

      this.logger.log(
        `Updated CRM invoice ${crmInvoiceId} to PAID and created payment record`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update CRM invoice after payment: ${error.message}`,
        { error, invoiceId: invoice.id },
      );
    }
  }

  async handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`, {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });

    const workspaceId = paymentIntent.metadata?.workspaceId;
    const crmInvoiceId = paymentIntent.metadata?.crmInvoiceId;

    if (!workspaceId || !crmInvoiceId) {
      this.logger.warn(
        'Payment intent webhook missing workspaceId or crmInvoiceId in metadata',
        { paymentIntentId: paymentIntent.id },
      );
      return;
    }

    try {
      const invoiceRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'invoice',
        );

      const crmInvoice = await invoiceRepository.findOne({
        where: { id: crmInvoiceId },
      });

      if (!crmInvoice) {
        this.logger.error(`CRM invoice not found: ${crmInvoiceId}`);
        return;
      }

      // Create Payment record
      const paymentRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'payment',
        );

      // Check if payment already exists (idempotency)
      const existingPayment = await paymentRepository.findOne({
        where: { stripePaymentId: paymentIntent.id },
      });

      if (existingPayment) {
        this.logger.log(
          `Payment record already exists for payment intent ${paymentIntent.id}`,
        );
        return;
      }

      await paymentRepository.save({
        name: `Payment for ${crmInvoice.invoiceNumber || crmInvoiceId.slice(0, 8)}`,
        paymentDate: new Date(),
        amount: {
          amountMicros: paymentIntent.amount * 10000,
          currencyCode: (paymentIntent.currency || 'usd').toUpperCase(),
        },
        paymentMethod: 'STRIPE',
        stripePaymentId: paymentIntent.id,
        invoiceId: crmInvoiceId,
        companyId: crmInvoice.companyId,
        notes: `Stripe payment intent ${paymentIntent.id}`,
      });

      this.logger.log(
        `Created payment record for payment intent ${paymentIntent.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create payment record: ${error.message}`,
        { error, paymentIntentId: paymentIntent.id },
      );
    }
  }

  async handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;

    this.logger.log(`Charge refunded: ${charge.id}`, {
      chargeId: charge.id,
      amount: charge.amount_refunded,
      refunded: charge.refunded,
    });

    const workspaceId = charge.metadata?.workspaceId;
    const crmInvoiceId = charge.metadata?.crmInvoiceId;

    if (!workspaceId || !crmInvoiceId) {
      this.logger.warn(
        'Charge refunded webhook missing workspaceId or crmInvoiceId in metadata',
        { chargeId: charge.id },
      );
      return;
    }

    try {
      const invoiceRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'invoice',
        );

      const crmInvoice = await invoiceRepository.findOne({
        where: { id: crmInvoiceId },
      });

      if (!crmInvoice) {
        this.logger.error(`CRM invoice not found: ${crmInvoiceId}`);
        return;
      }

      // Create refund Payment record
      const paymentRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'payment',
        );

      // Check if refund payment already exists (idempotency)
      const existingRefund = await paymentRepository.findOne({
        where: { stripeChargeId: charge.id, notes: `Refund for charge ${charge.id}` },
      });

      if (existingRefund) {
        this.logger.log(
          `Refund payment record already exists for charge ${charge.id}`,
        );
        return;
      }

      await paymentRepository.save({
        name: `Refund for ${crmInvoice.invoiceNumber || crmInvoiceId.slice(0, 8)}`,
        paymentDate: new Date(),
        amount: {
          amountMicros: -charge.amount_refunded * 10000, // Negative for refund
          currencyCode: (charge.currency || 'usd').toUpperCase(),
        },
        paymentMethod: 'STRIPE',
        stripeChargeId: charge.id,
        invoiceId: crmInvoiceId,
        companyId: crmInvoice.companyId,
        notes: `Refund for charge ${charge.id}`,
      });

      // Update invoice status if fully refunded
      if (charge.refunded) {
        await invoiceRepository.update(crmInvoiceId, {
          status: 'REFUNDED',
        });
      }

      this.logger.log(`Created refund payment record for charge ${charge.id}`);
    } catch (error) {
      this.logger.error(`Failed to create refund record: ${error.message}`, {
        error,
        chargeId: charge.id,
      });
    }
  }
}

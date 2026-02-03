import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

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

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-10-29.clover',
      });
      this.logger.log('Stripe SDK initialized');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured. Stripe integration disabled.',
      );
    }
  }

  isEnabled(): boolean {
    return this.stripe !== null;
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

    // TODO: Update CRM invoice record status to PAID
    // This will be implemented when we wire up the GraphQL mutation
  }

  async handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`, {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });

    // TODO: Create payment record in CRM
  }

  async handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;

    this.logger.log(`Charge refunded: ${charge.id}`, {
      chargeId: charge.id,
      amount: charge.amount_refunded,
      refunded: charge.refunded,
    });

    // TODO: Update payment record in CRM
  }
}

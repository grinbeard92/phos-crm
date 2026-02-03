import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { CustomerBillingStripeService } from '../services/customer-billing-stripe.service';

type CreateStripeInvoiceRequest = {
  invoiceId: string;
};

type CreateStripeInvoiceResponse = {
  stripeInvoiceId: string;
  stripeCustomerId: string;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
};

@Controller('api/stripe')
@UseGuards(JwtAuthGuard)
export class CustomerBillingApiController {
  constructor(
    private readonly customerBillingStripeService: CustomerBillingStripeService,
  ) {}

  @Post('create-invoice')
  async createInvoice(
    @Body() request: CreateStripeInvoiceRequest,
  ): Promise<CreateStripeInvoiceResponse> {
    if (!this.customerBillingStripeService.isEnabled()) {
      throw new Error('Stripe integration is not enabled');
    }

    // TODO: Fetch invoice data from CRM using Twenty's GraphQL
    // For now, return mock data structure
    // In production, this would:
    // 1. Fetch invoice from workspace using request.invoiceId
    // 2. Fetch related customer/company data
    // 3. Fetch line items
    // 4. Call customerBillingStripeService.createInvoice()

    const mockInvoiceData = {
      customerEmail: 'customer@example.com',
      customerName: 'Example Customer',
      invoiceNumber: 'INV-001',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          description: 'Service A',
          quantity: 1,
          unitAmountCents: 10000, // $100.00
        },
      ],
      metadata: {
        crmInvoiceId: request.invoiceId,
      },
    };

    const result =
      await this.customerBillingStripeService.createInvoice(mockInvoiceData);

    return {
      stripeInvoiceId: result.stripeInvoiceId,
      stripeCustomerId: result.stripeCustomerId,
      hostedInvoiceUrl: result.hostedInvoiceUrl,
      invoicePdfUrl: result.invoicePdfUrl,
    };
  }
}

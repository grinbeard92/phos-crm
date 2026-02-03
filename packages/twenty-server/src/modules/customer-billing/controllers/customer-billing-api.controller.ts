import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type Request } from 'express';

import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
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

type AuthenticatedRequest = Request & {
  workspaceId: string;
  user: { workspaceId: string };
};

@Controller('api/stripe')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class CustomerBillingApiController {
  constructor(
    private readonly customerBillingStripeService: CustomerBillingStripeService,
  ) {}

  @Post('create-invoice')
  async createInvoice(
    @Body() request: CreateStripeInvoiceRequest,
    @Req() req: AuthenticatedRequest,
  ): Promise<CreateStripeInvoiceResponse> {
    if (!this.customerBillingStripeService.isEnabled()) {
      throw new HttpException(
        'Stripe integration is not enabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const workspaceId = req.user?.workspaceId || req.workspaceId;

    if (!workspaceId) {
      throw new HttpException(
        'Workspace ID not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      // Fetch real invoice data from CRM
      const invoiceData =
        await this.customerBillingStripeService.fetchInvoiceData(
          request.invoiceId,
          workspaceId,
        );

      // Create invoice in Stripe
      const result =
        await this.customerBillingStripeService.createInvoice(invoiceData);

      // Save stripeCustomerId back to CRM Company and stripeInvoiceId to Invoice
      await this.customerBillingStripeService.updateCrmAfterInvoiceCreation(
        request.invoiceId,
        workspaceId,
        result.stripeCustomerId,
        result.stripeInvoiceId,
        result.hostedInvoiceUrl,
      );

      return {
        stripeInvoiceId: result.stripeInvoiceId,
        stripeCustomerId: result.stripeCustomerId,
        hostedInvoiceUrl: result.hostedInvoiceUrl,
        invoicePdfUrl: result.invoicePdfUrl,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create Stripe invoice: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

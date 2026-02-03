import {
  Controller,
  Post,
  Get,
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

type ConvertQuoteToInvoiceRequest = {
  quoteId: string;
  createStripeInvoice?: boolean;
};

type ConvertQuoteToInvoiceResponse = {
  invoiceId: string;
  stripeInvoiceId?: string;
  hostedInvoiceUrl?: string;
};

type StripeSettings = {
  sandboxMode: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
};

type SaveStripeSettingsRequest = StripeSettings;

type TestStripeConnectionResponse = {
  success: boolean;
  message: string;
  accountId?: string;
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

  @Get('settings')
  async getStripeSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<StripeSettings> {
    const workspaceId = req.user?.workspaceId || req.workspaceId;

    if (!workspaceId) {
      throw new HttpException(
        'Workspace ID not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const settings =
        await this.customerBillingStripeService.getStripeSettings(workspaceId);
      return settings;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve Stripe settings: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('settings')
  async saveStripeSettings(
    @Body() settings: SaveStripeSettingsRequest,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const workspaceId = req.user?.workspaceId || req.workspaceId;

    if (!workspaceId) {
      throw new HttpException(
        'Workspace ID not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      await this.customerBillingStripeService.saveStripeSettings(
        workspaceId,
        settings,
      );
      return { success: true };
    } catch (error) {
      throw new HttpException(
        `Failed to save Stripe settings: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('settings/test')
  async testStripeConnection(
    @Req() req: AuthenticatedRequest,
  ): Promise<TestStripeConnectionResponse> {
    const workspaceId = req.user?.workspaceId || req.workspaceId;

    if (!workspaceId) {
      throw new HttpException(
        'Workspace ID not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const result =
        await this.customerBillingStripeService.testStripeConnection(
          workspaceId,
        );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to connect to Stripe',
      };
    }
  }

  @Post('convert-quote-to-invoice')
  async convertQuoteToInvoice(
    @Body() request: ConvertQuoteToInvoiceRequest,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConvertQuoteToInvoiceResponse> {
    const workspaceId = req.user?.workspaceId || req.workspaceId;

    if (!workspaceId) {
      throw new HttpException(
        'Workspace ID not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const invoiceId =
        await this.customerBillingStripeService.convertQuoteToInvoice(
          request.quoteId,
          workspaceId,
        );

      // Optionally create Stripe invoice immediately
      if (request.createStripeInvoice) {
        if (!this.customerBillingStripeService.isEnabled()) {
          throw new HttpException(
            'Stripe integration is not enabled',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        const invoiceData =
          await this.customerBillingStripeService.fetchInvoiceData(
            invoiceId,
            workspaceId,
          );

        const stripeResult =
          await this.customerBillingStripeService.createInvoice(invoiceData);

        await this.customerBillingStripeService.updateCrmAfterInvoiceCreation(
          invoiceId,
          workspaceId,
          stripeResult.stripeCustomerId,
          stripeResult.stripeInvoiceId,
          stripeResult.hostedInvoiceUrl,
        );

        return {
          invoiceId,
          stripeInvoiceId: stripeResult.stripeInvoiceId,
          hostedInvoiceUrl: stripeResult.hostedInvoiceUrl || undefined,
        };
      }

      return { invoiceId };
    } catch (error) {
      throw new HttpException(
        `Failed to convert quote to invoice: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

import { CustomerBillingStripeService } from '../services/customer-billing-stripe.service';

@Controller('webhooks/stripe/customer-billing')
export class CustomerBillingWebhookController {
  private readonly logger = new Logger(CustomerBillingWebhookController.name);

  constructor(
    private readonly customerBillingStripeService: CustomerBillingStripeService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');

      return { error: 'Missing stripe-signature header' };
    }

    try {
      const event =
        await this.customerBillingStripeService.handleWebhookEvent(
          request.rawBody as Buffer,
          signature,
        );

      this.logger.log(`Received Stripe webhook: ${event.type}`, {
        eventId: event.id,
        eventType: event.type,
      });

      // Handle different event types
      switch (event.type) {
        case 'invoice.paid':
          await this.customerBillingStripeService.handleInvoicePaid(event);
          break;

        case 'payment_intent.succeeded':
          await this.customerBillingStripeService.handlePaymentIntentSucceeded(
            event,
          );
          break;

        case 'charge.refunded':
          await this.customerBillingStripeService.handleChargeRefunded(event);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook handling failed', {
        error: error.message,
        stack: error.stack,
      });

      return { error: 'Webhook handling failed' };
    }
  }
}

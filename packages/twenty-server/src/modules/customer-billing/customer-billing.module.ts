import { Module } from '@nestjs/common';

import { CustomerBillingStripeService } from './services/customer-billing-stripe.service';
import { CustomerBillingWebhookController } from './controllers/customer-billing-webhook.controller';

@Module({
  controllers: [CustomerBillingWebhookController],
  providers: [CustomerBillingStripeService],
  exports: [CustomerBillingStripeService],
})
export class CustomerBillingModule {}

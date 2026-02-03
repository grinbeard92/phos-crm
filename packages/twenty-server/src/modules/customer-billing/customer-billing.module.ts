import { Module } from '@nestjs/common';

import { CustomerBillingStripeService } from './services/customer-billing-stripe.service';
import { CustomerBillingWebhookController } from './controllers/customer-billing-webhook.controller';
import { CustomerBillingApiController } from './controllers/customer-billing-api.controller';

@Module({
  controllers: [CustomerBillingWebhookController, CustomerBillingApiController],
  providers: [CustomerBillingStripeService],
  exports: [CustomerBillingStripeService],
})
export class CustomerBillingModule {}

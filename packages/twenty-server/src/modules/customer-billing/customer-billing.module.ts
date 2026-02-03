import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

import { CustomerBillingStripeService } from './services/customer-billing-stripe.service';
import { CustomerBillingWebhookController } from './controllers/customer-billing-webhook.controller';
import { CustomerBillingApiController } from './controllers/customer-billing-api.controller';

@Module({
  imports: [AuthModule, WorkspaceCacheModule],
  controllers: [CustomerBillingWebhookController, CustomerBillingApiController],
  providers: [CustomerBillingStripeService],
  exports: [CustomerBillingStripeService],
})
export class CustomerBillingModule {}

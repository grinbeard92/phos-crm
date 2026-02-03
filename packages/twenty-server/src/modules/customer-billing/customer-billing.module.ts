import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';

import { CustomerBillingStripeService } from './services/customer-billing-stripe.service';
import { CustomerBillingWebhookController } from './controllers/customer-billing-webhook.controller';
import { CustomerBillingApiController } from './controllers/customer-billing-api.controller';

@Module({
  imports: [AuthModule, WorkspaceCacheStorageModule, TwentyORMModule],
  controllers: [CustomerBillingWebhookController, CustomerBillingApiController],
  providers: [CustomerBillingStripeService],
  exports: [CustomerBillingStripeService],
})
export class CustomerBillingModule {}

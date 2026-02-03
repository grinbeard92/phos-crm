import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { PdfGenerationService } from './services/pdf-generation.service';
import { PdfGenerationController } from './controllers/pdf-generation.controller';

@Module({
  imports: [
    AuthModule,
    WorkspaceCacheStorageModule,
    TwentyORMModule,
  ],
  providers: [PdfGenerationService],
  controllers: [PdfGenerationController],
  exports: [PdfGenerationService],
})
export class PdfGenerationModule {}

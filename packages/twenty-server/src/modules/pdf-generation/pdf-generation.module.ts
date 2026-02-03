import { Module } from '@nestjs/common';

import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { PdfGenerationService } from './services/pdf-generation.service';
import { PdfGenerationController } from './controllers/pdf-generation.controller';

@Module({
  imports: [TwentyORMModule],
  providers: [PdfGenerationService],
  controllers: [PdfGenerationController],
  exports: [PdfGenerationService],
})
export class PdfGenerationModule {}

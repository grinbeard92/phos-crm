import { Module } from '@nestjs/common';

import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { DataSourceModule } from 'src/engine/metadata-modules/data-source/data-source.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { PhosSeedCommand } from 'src/engine/workspace-manager/phos-seeder/commands/phos-seed.command';
import { PhosSeederService } from 'src/engine/workspace-manager/phos-seeder/services/phos-seeder.service';

@Module({
  imports: [
    ObjectMetadataModule,
    FieldMetadataModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    DataSourceModule,
    FeatureFlagModule,
  ],
  providers: [PhosSeederService, PhosSeedCommand],
  exports: [PhosSeederService],
})
export class PhosSeederModule {}

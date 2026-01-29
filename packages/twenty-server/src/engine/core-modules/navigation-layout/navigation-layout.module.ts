import { Module } from '@nestjs/common';

import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';

import { NavigationCategoryEntity } from 'src/engine/core-modules/navigation-layout/entities/navigation-category.entity';
import { ObjectLayoutConfigEntity } from 'src/engine/core-modules/navigation-layout/entities/object-layout-config.entity';
import { NavigationLayoutResolver } from 'src/engine/core-modules/navigation-layout/resolvers/navigation-layout.resolver';
import { NavigationLayoutService } from 'src/engine/core-modules/navigation-layout/services/navigation-layout.service';

@Module({
  imports: [
    NestjsQueryTypeOrmModule.forFeature([
      NavigationCategoryEntity,
      ObjectLayoutConfigEntity,
    ]),
  ],
  exports: [NavigationLayoutService],
  providers: [NavigationLayoutService, NavigationLayoutResolver],
})
export class NavigationLayoutModule {}

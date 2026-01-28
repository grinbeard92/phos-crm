import { Injectable, Logger } from '@nestjs/common';

import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { FeatureFlagKey } from 'src/engine/core-modules/feature-flag/enums/feature-flag-key.enum';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { DataSourceService } from 'src/engine/metadata-modules/data-source/data-source.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';
import { EXPENSE_CATEGORY_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/expense-category-custom-object-seed.constant';
import { EXPENSE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/expense-custom-object-seed.constant';
import { INVOICE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/invoice-custom-object-seed.constant';
import { INVOICE_LINE_ITEM_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/invoice-line-item-custom-object-seed.constant';
import { MILESTONE_ASSIGNEE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/milestone-assignee-custom-object-seed.constant';
import { PAYMENT_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/payment-custom-object-seed.constant';
import { PROJECT_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/project-custom-object-seed.constant';
import { PROJECT_DELIVERABLE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/project-deliverable-custom-object-seed.constant';
import { PROJECT_MILESTONE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/project-milestone-custom-object-seed.constant';
import { QUOTE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/quote-custom-object-seed.constant';
import { QUOTE_LINE_ITEM_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/quote-line-item-custom-object-seed.constant';
import { EXPENSE_CATEGORY_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/expense-category-custom-field-seeds.constant';
import { EXPENSE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/expense-custom-field-seeds.constant';
import { INVOICE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/invoice-custom-field-seeds.constant';
import { INVOICE_LINE_ITEM_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/invoice-line-item-custom-field-seeds.constant';
import { PAYMENT_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/payment-custom-field-seeds.constant';
import { PROJECT_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/project-custom-field-seeds.constant';
import { PROJECT_DELIVERABLE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/project-deliverable-custom-field-seeds.constant';
import { PROJECT_MILESTONE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/project-milestone-custom-field-seeds.constant';
import { QUOTE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/quote-custom-field-seeds.constant';
import { QUOTE_LINE_ITEM_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/quote-line-item-custom-field-seeds.constant';
import { MILEAGE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/mileage-custom-object-seed.constant';
import { MILEAGE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/mileage-custom-field-seeds.constant';
import { EMAIL_TEMPLATE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/phos-seeder/custom-objects/email-template-custom-object-seed.constant';
import { EMAIL_TEMPLATE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/email-template-custom-field-seeds.constant';
import { OPPORTUNITY_EXTENSION_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/opportunity-extension-field-seeds.constant';
import { COMPANY_EXTENSION_FIELD_SEEDS } from 'src/engine/workspace-manager/phos-seeder/custom-fields/company-extension-field-seeds.constant';

type RelationConfig = {
  sourceObjectName: string;
  fieldName: string;
  fieldLabel: string;
  fieldIcon: string;
  targetObjectName: string;
  targetFieldLabel: string;
  targetFieldIcon: string;
  relationType: RelationType;
};

type JunctionConfig = {
  objectName: string;
  fieldName: string;
  junctionTargetFieldRef: string;
};

// Helper type for flat entity maps
type FlatMaps = {
  fieldMaps: { byId: Record<string, { name: string; morphId?: string }> };
  objectMaps: { byId: Record<string, { fieldIds: string[] }> };
  objectIdByName: Record<string, string>;
};

@Injectable()
export class PhosSeederService {
  private readonly logger = new Logger(PhosSeederService.name);

  // Ordered list: parent objects first, then children
  private readonly objectsConfig: {
    seed: ObjectMetadataSeed;
    fields?: FieldMetadataSeed[];
  }[] = [
    // Core objects
    { seed: PROJECT_CUSTOM_OBJECT_SEED, fields: PROJECT_CUSTOM_FIELD_SEEDS },
    {
      seed: PROJECT_MILESTONE_CUSTOM_OBJECT_SEED,
      fields: PROJECT_MILESTONE_CUSTOM_FIELD_SEEDS,
    },
    {
      seed: PROJECT_DELIVERABLE_CUSTOM_OBJECT_SEED,
      fields: PROJECT_DELIVERABLE_CUSTOM_FIELD_SEEDS,
    },
    // Junction table for milestone assignees (many-to-many)
    { seed: MILESTONE_ASSIGNEE_CUSTOM_OBJECT_SEED },
    // Expense tracking
    {
      seed: EXPENSE_CATEGORY_CUSTOM_OBJECT_SEED,
      fields: EXPENSE_CATEGORY_CUSTOM_FIELD_SEEDS,
    },
    { seed: EXPENSE_CUSTOM_OBJECT_SEED, fields: EXPENSE_CUSTOM_FIELD_SEEDS },
    // Quoting
    { seed: QUOTE_CUSTOM_OBJECT_SEED, fields: QUOTE_CUSTOM_FIELD_SEEDS },
    {
      seed: QUOTE_LINE_ITEM_CUSTOM_OBJECT_SEED,
      fields: QUOTE_LINE_ITEM_CUSTOM_FIELD_SEEDS,
    },
    // Invoicing
    { seed: INVOICE_CUSTOM_OBJECT_SEED, fields: INVOICE_CUSTOM_FIELD_SEEDS },
    {
      seed: INVOICE_LINE_ITEM_CUSTOM_OBJECT_SEED,
      fields: INVOICE_LINE_ITEM_CUSTOM_FIELD_SEEDS,
    },
    { seed: PAYMENT_CUSTOM_OBJECT_SEED, fields: PAYMENT_CUSTOM_FIELD_SEEDS },
    // Mileage tracking
    { seed: MILEAGE_CUSTOM_OBJECT_SEED, fields: MILEAGE_CUSTOM_FIELD_SEEDS },
    // Email templates
    {
      seed: EMAIL_TEMPLATE_CUSTOM_OBJECT_SEED,
      fields: EMAIL_TEMPLATE_CUSTOM_FIELD_SEEDS,
    },
  ];

  // Standard object extensions - fields to add to existing Twenty objects
  private readonly standardObjectExtensions: {
    objectName: string;
    fields: FieldMetadataSeed[];
  }[] = [
    { objectName: 'opportunity', fields: OPPORTUNITY_EXTENSION_FIELD_SEEDS },
    { objectName: 'company', fields: COMPANY_EXTENSION_FIELD_SEEDS },
  ];

  // Relations to create after all objects exist
  private readonly relationsConfig: RelationConfig[] = [
    // Project -> Company (many-to-one)
    {
      sourceObjectName: 'project',
      fieldName: 'company',
      fieldLabel: 'Company',
      fieldIcon: 'IconBuildingSkyscraper',
      targetObjectName: 'company',
      targetFieldLabel: 'Projects',
      targetFieldIcon: 'IconBriefcase',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Project -> WorkspaceMember (projectManager, many-to-one)
    {
      sourceObjectName: 'project',
      fieldName: 'projectManager',
      fieldLabel: 'Project Manager',
      fieldIcon: 'IconUser',
      targetObjectName: 'workspaceMember',
      targetFieldLabel: 'Managed Projects',
      targetFieldIcon: 'IconBriefcase',
      relationType: RelationType.MANY_TO_ONE,
    },
    // ProjectMilestone -> Project (many-to-one)
    {
      sourceObjectName: 'projectMilestone',
      fieldName: 'project',
      fieldLabel: 'Project',
      fieldIcon: 'IconBriefcase',
      targetObjectName: 'project',
      targetFieldLabel: 'Milestones',
      targetFieldIcon: 'IconFlag',
      relationType: RelationType.MANY_TO_ONE,
    },
    // ProjectDeliverable -> ProjectMilestone (many-to-one)
    {
      sourceObjectName: 'projectDeliverable',
      fieldName: 'milestone',
      fieldLabel: 'Milestone',
      fieldIcon: 'IconFlag',
      targetObjectName: 'projectMilestone',
      targetFieldLabel: 'Deliverables',
      targetFieldIcon: 'IconPackage',
      relationType: RelationType.MANY_TO_ONE,
    },
    // MilestoneAssignee -> ProjectMilestone (many-to-one, junction)
    {
      sourceObjectName: 'milestoneAssignee',
      fieldName: 'milestone',
      fieldLabel: 'Milestone',
      fieldIcon: 'IconFlag',
      targetObjectName: 'projectMilestone',
      targetFieldLabel: 'Assignees',
      targetFieldIcon: 'IconUsers',
      relationType: RelationType.MANY_TO_ONE,
    },
    // MilestoneAssignee -> WorkspaceMember (many-to-one, junction)
    {
      sourceObjectName: 'milestoneAssignee',
      fieldName: 'member',
      fieldLabel: 'Team Member',
      fieldIcon: 'IconUser',
      targetObjectName: 'workspaceMember',
      targetFieldLabel: 'Milestone Assignments',
      targetFieldIcon: 'IconFlag',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Expense -> ExpenseCategory (many-to-one)
    {
      sourceObjectName: 'expense',
      fieldName: 'category',
      fieldLabel: 'Category',
      fieldIcon: 'IconCategory',
      targetObjectName: 'expenseCategory',
      targetFieldLabel: 'Expenses',
      targetFieldIcon: 'IconReceipt',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Expense -> Project (many-to-one)
    {
      sourceObjectName: 'expense',
      fieldName: 'project',
      fieldLabel: 'Project',
      fieldIcon: 'IconBriefcase',
      targetObjectName: 'project',
      targetFieldLabel: 'Expenses',
      targetFieldIcon: 'IconReceipt',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Expense -> WorkspaceMember (submittedBy, many-to-one)
    {
      sourceObjectName: 'expense',
      fieldName: 'submittedBy',
      fieldLabel: 'Submitted By',
      fieldIcon: 'IconUser',
      targetObjectName: 'workspaceMember',
      targetFieldLabel: 'Submitted Expenses',
      targetFieldIcon: 'IconReceipt',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Quote -> Company (many-to-one)
    {
      sourceObjectName: 'quote',
      fieldName: 'company',
      fieldLabel: 'Company',
      fieldIcon: 'IconBuildingSkyscraper',
      targetObjectName: 'company',
      targetFieldLabel: 'Quotes',
      targetFieldIcon: 'IconFileInvoice',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Quote -> Person (contact, many-to-one)
    {
      sourceObjectName: 'quote',
      fieldName: 'contact',
      fieldLabel: 'Contact',
      fieldIcon: 'IconUser',
      targetObjectName: 'person',
      targetFieldLabel: 'Quotes',
      targetFieldIcon: 'IconFileInvoice',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Quote -> Project (many-to-one)
    {
      sourceObjectName: 'quote',
      fieldName: 'project',
      fieldLabel: 'Project',
      fieldIcon: 'IconBriefcase',
      targetObjectName: 'project',
      targetFieldLabel: 'Quotes',
      targetFieldIcon: 'IconFileInvoice',
      relationType: RelationType.MANY_TO_ONE,
    },
    // QuoteLineItem -> Quote (many-to-one)
    {
      sourceObjectName: 'quoteLineItem',
      fieldName: 'quote',
      fieldLabel: 'Quote',
      fieldIcon: 'IconFileInvoice',
      targetObjectName: 'quote',
      targetFieldLabel: 'Line Items',
      targetFieldIcon: 'IconList',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Invoice -> Company (many-to-one)
    {
      sourceObjectName: 'invoice',
      fieldName: 'company',
      fieldLabel: 'Company',
      fieldIcon: 'IconBuildingSkyscraper',
      targetObjectName: 'company',
      targetFieldLabel: 'Invoices',
      targetFieldIcon: 'IconFileInvoice',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Invoice -> Person (contact, many-to-one)
    {
      sourceObjectName: 'invoice',
      fieldName: 'contact',
      fieldLabel: 'Contact',
      fieldIcon: 'IconUser',
      targetObjectName: 'person',
      targetFieldLabel: 'Invoices',
      targetFieldIcon: 'IconFileInvoice',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Invoice -> Project (many-to-one)
    {
      sourceObjectName: 'invoice',
      fieldName: 'project',
      fieldLabel: 'Project',
      fieldIcon: 'IconBriefcase',
      targetObjectName: 'project',
      targetFieldLabel: 'Invoices',
      targetFieldIcon: 'IconFileInvoice',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Invoice -> Quote (many-to-one)
    {
      sourceObjectName: 'invoice',
      fieldName: 'quote',
      fieldLabel: 'Quote',
      fieldIcon: 'IconFileInvoice',
      targetObjectName: 'quote',
      targetFieldLabel: 'Invoices',
      targetFieldIcon: 'IconFileInvoice',
      relationType: RelationType.MANY_TO_ONE,
    },
    // InvoiceLineItem -> Invoice (many-to-one)
    {
      sourceObjectName: 'invoiceLineItem',
      fieldName: 'invoice',
      fieldLabel: 'Invoice',
      fieldIcon: 'IconFileInvoice',
      targetObjectName: 'invoice',
      targetFieldLabel: 'Line Items',
      targetFieldIcon: 'IconList',
      relationType: RelationType.MANY_TO_ONE,
    },
    // Payment -> Invoice (many-to-one)
    {
      sourceObjectName: 'payment',
      fieldName: 'invoice',
      fieldLabel: 'Invoice',
      fieldIcon: 'IconFileInvoice',
      targetObjectName: 'invoice',
      targetFieldLabel: 'Payments',
      targetFieldIcon: 'IconCreditCard',
      relationType: RelationType.MANY_TO_ONE,
    },
    // MileageLog -> Project (many-to-one)
    {
      sourceObjectName: 'mileageLog',
      fieldName: 'project',
      fieldLabel: 'Project',
      fieldIcon: 'IconBriefcase',
      targetObjectName: 'project',
      targetFieldLabel: 'Mileage Logs',
      targetFieldIcon: 'IconCar',
      relationType: RelationType.MANY_TO_ONE,
    },
    // MileageLog -> WorkspaceMember (many-to-one, driver)
    {
      sourceObjectName: 'mileageLog',
      fieldName: 'driver',
      fieldLabel: 'Driver',
      fieldIcon: 'IconUser',
      targetObjectName: 'workspaceMember',
      targetFieldLabel: 'Mileage Logs',
      targetFieldIcon: 'IconCar',
      relationType: RelationType.MANY_TO_ONE,
    },
  ];

  // Feature flags required by Phos custom features
  private readonly requiredFeatureFlags: FeatureFlagKey[] = [
    FeatureFlagKey.IS_CALCULATED_FIELD_ENABLED,
  ];

  // Junction configs for many-to-many via junction table
  private readonly junctionConfigs: JunctionConfig[] = [
    // Milestone assignees junction config
    {
      objectName: 'projectMilestone',
      fieldName: 'assignees',
      junctionTargetFieldRef: 'milestoneAssignee.member',
    },
    {
      objectName: 'workspaceMember',
      fieldName: 'milestoneAssignments',
      junctionTargetFieldRef: 'milestoneAssignee.milestone',
    },
  ];

  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly dataSourceService: DataSourceService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Seeds all Phos Industries custom objects and fields
   */
  async seed(workspaceId: string): Promise<void> {
    this.logger.log(
      `Starting Phos Industries seeder for workspace ${workspaceId}`,
    );

    // Get the workspace's data source
    const dataSource =
      await this.dataSourceService.getLastDataSourceMetadataFromWorkspaceIdOrFail(
        workspaceId,
      );

    // Phase 1: Create all objects and their fields
    for (const objConfig of this.objectsConfig) {
      await this.seedObjectIfNotExists({
        dataSourceId: dataSource.id,
        workspaceId,
        objectMetadataSeed: objConfig.seed,
        fieldMetadataSeeds: objConfig.fields,
      });
    }

    this.logger.log('Phase 1 complete: All objects and fields created');

    // Phase 2: Create relations between objects
    await this.seedRelations(workspaceId);

    this.logger.log('Phase 2 complete: All relations created');

    // Phase 3: Configure junction settings for many-to-many
    await this.configureJunctions(workspaceId);

    this.logger.log('Phase 3 complete: Junction settings configured');

    // Phase 4: Add custom fields to standard Twenty objects
    await this.seedStandardObjectExtensions(workspaceId);

    this.logger.log('Phase 4 complete: Standard object extensions added');

    // Phase 5: Enable required feature flags
    await this.seedFeatureFlags(workspaceId);

    this.logger.log('Phase 5 complete: Feature flags enabled');
    this.logger.log(
      `Phos Industries seeder complete for workspace ${workspaceId}`,
    );
  }

  /**
   * Seeds custom fields on standard Twenty objects (Opportunity, Company, etc.)
   */
  private async seedStandardObjectExtensions(
    workspaceId: string,
  ): Promise<void> {
    const maps = await this.getFreshFlatMaps(workspaceId);

    for (const extension of this.standardObjectExtensions) {
      const objectId = maps.objectIdByName[extension.objectName];

      if (!isDefined(objectId)) {
        this.logger.warn(
          `Standard object ${extension.objectName} not found, skipping extensions`,
        );
        continue;
      }

      // Check which fields already exist
      const objectMetadata = maps.objectMaps.byId[objectId];
      const existingFieldNames = new Set<string>();

      if (objectMetadata?.fieldIds) {
        for (const fieldId of objectMetadata.fieldIds) {
          const field = maps.fieldMaps.byId[fieldId];

          if (field?.name) {
            existingFieldNames.add(field.name);
          }
        }
      }

      // Filter to only new fields
      const newFields = extension.fields.filter(
        (f) => !existingFieldNames.has(f.name),
      );

      if (newFields.length === 0) {
        this.logger.log(
          `All extension fields for ${extension.objectName} already exist, skipping`,
        );
        continue;
      }

      this.logger.log(
        `Adding ${newFields.length} extension fields to ${extension.objectName}`,
      );

      const createFieldInputs = newFields.map((fieldSeed) => ({
        ...fieldSeed,
        objectMetadataId: objectId,
      }));

      await this.fieldMetadataService.createManyFields({
        createFieldInputs,
        workspaceId,
      });
    }
  }

  private async seedFeatureFlags(workspaceId: string): Promise<void> {
    if (this.requiredFeatureFlags.length === 0) {
      return;
    }

    this.logger.log(
      `Enabling ${this.requiredFeatureFlags.length} feature flags`,
    );

    await this.featureFlagService.enableFeatureFlags(
      this.requiredFeatureFlags,
      workspaceId,
    );
  }

  private async seedObjectIfNotExists({
    dataSourceId,
    workspaceId,
    objectMetadataSeed,
    fieldMetadataSeeds,
  }: {
    dataSourceId: string;
    workspaceId: string;
    objectMetadataSeed: ObjectMetadataSeed;
    fieldMetadataSeeds?: FieldMetadataSeed[];
  }): Promise<void> {
    // Check if object already exists
    const existingObject =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: objectMetadataSeed.nameSingular },
      });

    if (existingObject) {
      this.logger.log(
        `Object ${objectMetadataSeed.nameSingular} already exists, skipping`,
      );

      return;
    }

    // Create the object
    this.logger.log(`Creating object: ${objectMetadataSeed.nameSingular}`);
    await this.objectMetadataService.createOneObject({
      createObjectInput: {
        ...objectMetadataSeed,
        dataSourceId,
      },
      workspaceId,
    });

    // Create fields if any
    if (fieldMetadataSeeds && fieldMetadataSeeds.length > 0) {
      await this.seedCustomFields({
        workspaceId,
        objectMetadataNameSingular: objectMetadataSeed.nameSingular,
        fieldMetadataSeeds,
      });
    }
  }

  private async seedCustomFields({
    workspaceId,
    objectMetadataNameSingular,
    fieldMetadataSeeds,
  }: {
    workspaceId: string;
    objectMetadataNameSingular: string;
    fieldMetadataSeeds: FieldMetadataSeed[];
  }): Promise<void> {
    const objectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: objectMetadataNameSingular },
      });

    if (!isDefined(objectMetadata)) {
      throw new Error(
        `Object metadata not found for: ${objectMetadataNameSingular}`,
      );
    }

    this.logger.log(
      `Creating ${fieldMetadataSeeds.length} fields for ${objectMetadataNameSingular}`,
    );

    const createFieldInputs = fieldMetadataSeeds.map((fieldMetadataSeed) => ({
      ...fieldMetadataSeed,
      objectMetadataId: objectMetadata.id,
    }));

    await this.fieldMetadataService.createManyFields({
      createFieldInputs,
      workspaceId,
    });
  }

  private async seedRelations(workspaceId: string): Promise<void> {
    const maps = await this.getFreshFlatMaps(workspaceId);

    for (const relation of this.relationsConfig) {
      await this.seedRelation({
        workspaceId,
        relation,
        flatMaps: maps,
      });
    }
  }

  private async seedRelation({
    workspaceId,
    relation,
    flatMaps,
  }: {
    workspaceId: string;
    relation: RelationConfig;
    flatMaps: FlatMaps;
  }): Promise<void> {
    const sourceObjectId = flatMaps.objectIdByName[relation.sourceObjectName];
    const targetObjectId = flatMaps.objectIdByName[relation.targetObjectName];

    if (!isDefined(sourceObjectId)) {
      this.logger.warn(
        `Source object not found: ${relation.sourceObjectName}, skipping relation`,
      );

      return;
    }

    if (!isDefined(targetObjectId)) {
      this.logger.warn(
        `Target object not found: ${relation.targetObjectName}, skipping relation`,
      );

      return;
    }

    // Check if field already exists
    const existingFieldId = this.findFieldIdSafe(
      relation.sourceObjectName,
      relation.fieldName,
      flatMaps,
    );

    if (existingFieldId) {
      this.logger.log(
        `Relation field ${relation.sourceObjectName}.${relation.fieldName} already exists, skipping`,
      );

      return;
    }

    this.logger.log(
      `Creating relation: ${relation.sourceObjectName}.${relation.fieldName} -> ${relation.targetObjectName}`,
    );

    await this.fieldMetadataService.createManyFields({
      createFieldInputs: [
        {
          type: FieldMetadataType.RELATION,
          name: relation.fieldName,
          label: relation.fieldLabel,
          icon: relation.fieldIcon,
          objectMetadataId: sourceObjectId,
          relationCreationPayload: {
            type: relation.relationType,
            targetFieldLabel: relation.targetFieldLabel,
            targetFieldIcon: relation.targetFieldIcon,
            targetObjectMetadataId: targetObjectId,
          },
        },
      ],
      workspaceId,
    });
  }

  private async configureJunctions(workspaceId: string): Promise<void> {
    if (this.junctionConfigs.length === 0) {
      return;
    }

    const maps = await this.getFreshFlatMaps(workspaceId);

    for (const junctionConfig of this.junctionConfigs) {
      await this.applyJunctionConfig({
        workspaceId,
        junctionConfig,
        flatMaps: maps,
      });
    }
  }

  private async applyJunctionConfig({
    workspaceId,
    junctionConfig,
    flatMaps,
  }: {
    workspaceId: string;
    junctionConfig: JunctionConfig;
    flatMaps: FlatMaps;
  }): Promise<void> {
    const [targetObjectName, targetFieldName] =
      junctionConfig.junctionTargetFieldRef.split('.');

    const junctionTargetFieldId = this.findFieldIdSafe(
      targetObjectName,
      targetFieldName,
      flatMaps,
    );

    if (!junctionTargetFieldId) {
      this.logger.warn(
        `Junction target field not found: ${junctionConfig.junctionTargetFieldRef}, skipping`,
      );

      return;
    }

    const fieldId = this.findFieldIdSafe(
      junctionConfig.objectName,
      junctionConfig.fieldName,
      flatMaps,
    );

    if (!fieldId) {
      this.logger.warn(
        `Junction source field not found: ${junctionConfig.objectName}.${junctionConfig.fieldName}, skipping`,
      );

      return;
    }

    this.logger.log(
      `Configuring junction: ${junctionConfig.objectName}.${junctionConfig.fieldName}`,
    );

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      updateFieldInput: {
        id: fieldId,
        settings: {
          relationType: RelationType.ONE_TO_MANY,
          junctionTargetFieldId,
        },
      },
    });
  }

  private async getFreshFlatMaps(workspaceId: string): Promise<FlatMaps> {
    await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
      workspaceId,
      flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
    });

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const { idByNameSingular } = buildObjectIdByNameMaps(
      flatObjectMetadataMaps,
    );

    return {
      fieldMaps: flatFieldMetadataMaps as FlatMaps['fieldMaps'],
      objectMaps: flatObjectMetadataMaps as FlatMaps['objectMaps'],
      objectIdByName: idByNameSingular,
    };
  }

  private findFieldIdSafe(
    objectName: string,
    fieldName: string,
    flatMaps: FlatMaps,
  ): string | null {
    const objectId = flatMaps.objectIdByName[objectName];

    if (!isDefined(objectId)) {
      return null;
    }

    const objectMetadata = flatMaps.objectMaps.byId[objectId];

    if (!isDefined(objectMetadata)) {
      return null;
    }

    for (const fieldId of objectMetadata.fieldIds) {
      if (flatMaps.fieldMaps.byId[fieldId]?.name === fieldName) {
        return fieldId;
      }
    }

    return null;
  }
}

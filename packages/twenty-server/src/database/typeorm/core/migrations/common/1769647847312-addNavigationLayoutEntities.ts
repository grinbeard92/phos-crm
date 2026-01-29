import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNavigationLayoutEntities1769647847312 implements MigrationInterface {
    name = 'AddNavigationLayoutEntities1769647847312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "core"."navigationCategory" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "icon" character varying, "position" integer NOT NULL DEFAULT '0', "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "IDX_NAVIGATION_CATEGORY_WORKSPACE_ID_NAME_UNIQUE" UNIQUE ("workspaceId", "name"), CONSTRAINT "PK_aa4a7ad4a6c364ccccc2086668f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "core"."objectLayoutConfig" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "objectMetadataId" uuid NOT NULL, "categoryId" uuid, "uiParentObjectMetadataId" uuid, "positionInCategory" integer NOT NULL DEFAULT '0', "positionUnderParent" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "IDX_OBJECT_LAYOUT_CONFIG_WORKSPACE_ID_OBJECT_METADATA_ID_UNIQUE" UNIQUE ("workspaceId", "objectMetadataId"), CONSTRAINT "PK_fd09d6809a5b34aa6e51a160df7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "core"."navigationCategory" ADD CONSTRAINT "FK_a5d534035889c36a4274e94929a" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."objectLayoutConfig" ADD CONSTRAINT "FK_66899f67ba8efa7bdc2f8c6b00f" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."objectLayoutConfig" ADD CONSTRAINT "FK_cda77e3f4c74ed86523d667e963" FOREIGN KEY ("categoryId") REFERENCES "core"."navigationCategory"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."objectLayoutConfig" DROP CONSTRAINT "FK_cda77e3f4c74ed86523d667e963"`);
        await queryRunner.query(`ALTER TABLE "core"."objectLayoutConfig" DROP CONSTRAINT "FK_66899f67ba8efa7bdc2f8c6b00f"`);
        await queryRunner.query(`ALTER TABLE "core"."navigationCategory" DROP CONSTRAINT "FK_a5d534035889c36a4274e94929a"`);
        await queryRunner.query(`DROP TABLE "core"."objectLayoutConfig"`);
        await queryRunner.query(`DROP TABLE "core"."navigationCategory"`);
    }

}

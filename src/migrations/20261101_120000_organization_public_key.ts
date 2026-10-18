import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "public_key" varchar;

    UPDATE "organizations"
      SET "public_key" = substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 8)
      WHERE "public_key" IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "organizations_public_key_idx" ON "organizations" ("public_key");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "organizations_public_key_idx";

    ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "public_key";
  `)
}

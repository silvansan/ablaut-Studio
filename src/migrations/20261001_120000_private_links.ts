import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "private_links_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "public_id" varchar;

    ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "public_id" varchar;

    CREATE UNIQUE INDEX IF NOT EXISTS "events_public_id_idx" ON "events" ("public_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "channels_public_id_idx" ON "channels" ("public_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "events_public_id_idx";
    DROP INDEX IF EXISTS "channels_public_id_idx";

    ALTER TABLE "events"
      DROP COLUMN IF EXISTS "private_links_enabled",
      DROP COLUMN IF EXISTS "public_id";

    ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "public_id";
  `)
}

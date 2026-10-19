import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Channels added after an event's Private links were switched on never got a public id, so
// their links (event id + readable channel slug) returned 404. New rows now get an id in the
// collection hooks; this fills in the existing gaps with the same 12-character alphabet.
// The correlated WHERE makes Postgres draw a fresh id per row instead of reusing one.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "events" SET "public_id" = (
      SELECT string_agg(substr('23456789ABCDEFGHJKMNPQRSTVWXYZ', 1 + floor(random() * 30)::int, 1), '')
      FROM generate_series(1, 12)
      WHERE "events"."id" IS NOT NULL
    )
    WHERE "public_id" IS NULL;

    UPDATE "channels" SET "public_id" = (
      SELECT string_agg(substr('23456789ABCDEFGHJKMNPQRSTVWXYZ', 1 + floor(random() * 30)::int, 1), '')
      FROM generate_series(1, 12)
      WHERE "channels"."id" IS NOT NULL
    )
    WHERE "public_id" IS NULL;
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Ids handed out here may already be printed on QR codes; leave them in place.
}

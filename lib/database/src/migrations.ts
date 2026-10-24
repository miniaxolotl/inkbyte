import type { Knex } from "knex";

export const migrations = [
  {
    name: "20261024_001_initial_schema",
    async up(db: Knex) {
      await db.raw(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TABLE users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          clerk_subject text NOT NULL UNIQUE,
          email text NOT NULL,
          first_name text NOT NULL DEFAULT '',
          last_name text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX users_email_idx ON users (lower(email));

        CREATE TABLE domains (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          slug text NOT NULL UNIQUE,
          is_default boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE links (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          slug text NOT NULL,
          domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          long_url text NOT NULL,
          title text,
          is_tracking boolean NOT NULL DEFAULT true,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          deleted_at timestamptz
        );
        CREATE UNIQUE INDEX links_slug_domain_unique ON links (domain_id, slug);
        CREATE INDEX links_user_idx ON links (user_id);

        CREATE TABLE link_events (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          link_id uuid NOT NULL REFERENCES links(id) ON DELETE CASCADE,
          visitor_id text NOT NULL,
          referrer text,
          user_agent text,
          country text,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX link_events_link_idx ON link_events (link_id, created_at DESC);
        CREATE INDEX link_events_created_idx ON link_events (created_at DESC);
      `);
    },
    async down() {
      throw new Error("Use a forward migration; rolling back would erase data");
    },
  },
  {
    name: "20261024_002_bio_qr_cta_geo",
    async up(db: Knex) {
      await db.raw(`
        ALTER TABLE links
          ADD COLUMN cta_heading text,
          ADD COLUMN cta_body text,
          ADD COLUMN cta_action text;

        ALTER TABLE link_events
          ADD COLUMN city text,
          ADD COLUMN region text,
          ADD COLUMN device text,
          ADD COLUMN event_type text NOT NULL DEFAULT 'view'
            CHECK (event_type IN ('view', 'cta_click'));

        CREATE TABLE bio_pages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          handle text NOT NULL UNIQUE,
          heading text NOT NULL DEFAULT '',
          bio text NOT NULL DEFAULT '',
          is_published boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          deleted_at timestamptz
        );

        CREATE TABLE bio_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          bio_page_id uuid NOT NULL REFERENCES bio_pages(id) ON DELETE CASCADE,
          link_id uuid NOT NULL REFERENCES links(id) ON DELETE CASCADE,
          label text NOT NULL,
          position integer NOT NULL DEFAULT 0,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          deleted_at timestamptz
        );
        CREATE INDEX bio_items_page_idx ON bio_items (bio_page_id, position);
      `);
    },
    async down() {
      throw new Error("Use a forward migration; rolling back would erase data");
    },
  },
];

export const migrationSource: Knex.MigrationSource<
  (typeof migrations)[number]
> = {
  getMigrations: async () => migrations,
  getMigrationName: (migration) => migration.name,
  getMigration: async (migration) => migration,
};

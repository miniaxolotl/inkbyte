import knex from "knex";
import { Model, knexSnakeCaseMappers } from "objection";
import type { Knex } from "knex";
import { migrationSource } from "./migrations.ts";

export { migrationSource };
export type { Knex };
export type { QueryBuilder } from "objection";

export type DatabaseOptions = {
  ssl?: boolean;
  max?: number;
  acquireTimeoutMs?: number;
  statementTimeoutMs?: number;
  applicationName?: string;
};

/** Hosted PostgreSQL connections must authenticate the server certificate. */
export function createDatabase(
  url: string,
  options: DatabaseOptions = {},
): Knex {
  return knex({
    client: "pg",
    connection: {
      connectionString: url,
      ssl: options.ssl ? { rejectUnauthorized: true } : undefined,
      connectionTimeoutMillis: options.acquireTimeoutMs ?? 10000,
      statement_timeout: options.statementTimeoutMs ?? 10000,
      application_name: options.applicationName ?? "inkbyte",
    },
    pool: { min: 0, max: options.max ?? 8 },
    acquireConnectionTimeout: options.acquireTimeoutMs ?? 10000,
    ...knexSnakeCaseMappers(),
    migrations: { migrationSource },
  });
}

export const closeDatabase = (db: Knex) => db.destroy();

/** Knex's postProcessResponse does not map raw pg result rows. */
export function camelRows<T>(result: { rows: Record<string, unknown>[] }): T[] {
  return result.rows.map(
    (row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key.replace(/_([a-z])/g, (_match, letter: string) =>
            letter.toUpperCase(),
          ),
          value,
        ]),
      ) as T,
  );
}

/** Readiness probe: the schema must exist and be reachable. */
export async function probeDatabase(db: Knex) {
  await db.raw("SELECT 1 FROM users LIMIT 1");
  await db.raw("SELECT 1 FROM links LIMIT 1");
  await db.raw("SELECT 1 FROM link_events LIMIT 1");
}

export class UserModel extends Model {
  static tableName = "users";
  id!: string;
  clerkSubject!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static get relationMappings() {
    return {
      links: {
        relation: Model.HasManyRelation,
        modelClass: LinkModel,
        join: { from: "users.id", to: "links.user_id" },
      },
    };
  }
}

export class DomainModel extends Model {
  static tableName = "domains";
  id!: string;
  slug!: string;
  isDefault!: boolean;
  createdAt!: Date;

  static get relationMappings() {
    return {
      links: {
        relation: Model.HasManyRelation,
        modelClass: LinkModel,
        join: { from: "domains.id", to: "links.domain_id" },
      },
    };
  }
}

export class LinkModel extends Model {
  static tableName = "links";
  id!: string;
  slug!: string;
  domainId!: string;
  userId!: string;
  longUrl!: string;
  title!: string | null;
  isTracking!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;

  static get relationMappings() {
    return {
      domain: {
        relation: Model.BelongsToOneRelation,
        modelClass: DomainModel,
        join: { from: "links.domain_id", to: "domains.id" },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserModel,
        join: { from: "links.user_id", to: "users.id" },
      },
      events: {
        relation: Model.HasManyRelation,
        modelClass: LinkEventModel,
        join: { from: "links.id", to: "link_events.link_id" },
      },
    };
  }
}

export class LinkEventModel extends Model {
  static tableName = "link_events";
  id!: string;
  linkId!: string;
  visitorId!: string;
  referrer!: string | null;
  userAgent!: string | null;
  country!: string | null;
  createdAt!: Date;
}

import { closeDatabase, createDatabase } from "@lib/database";

const url =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "MIGRATION_DATABASE_URL or DATABASE_URL is required to run migrations",
  );
}

const db = createDatabase(url, {
  ssl: process.env.DATABASE_SSL === "require",
  applicationName: "inkbyte-migrate",
});
try {
  const [, applied] = await db.migrate.latest();
  console.log(JSON.stringify({ applied }));
} finally {
  await closeDatabase(db);
}

import { closeDatabase, createDatabase } from "@lib/database";

/**
 * Prepares the disposable database used by the integration suite.
 *
 * The target database name must end in `_test`; this guard exists so a
 * retained development or production database can never be truncated by a
 * test run.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error("TEST_DATABASE_URL is required for the test bootstrap");
}

const parsed = new URL(url);
const database = parsed.pathname.replace(/^\//, "");
if (!database.endsWith("_test")) {
  throw new Error(
    `Refusing to prepare "${database}": the test database name must end in _test`,
  );
}

const db = createDatabase(url, {
  ssl: process.env.DATABASE_SSL === "require",
  applicationName: "inkbyte-test-bootstrap",
});
try {
  await db.migrate.latest();
  const domains = (process.env.DEFAULT_DOMAINS ?? "inkbyte.app,inkbyte.co")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  for (const [index, slug] of domains.entries()) {
    await db("domains")
      .insert({ slug, is_default: index === 0 })
      .onConflict("slug")
      .merge({ is_default: index === 0 });
  }
  console.log(JSON.stringify({ status: "test-database-ready", database }));
} finally {
  await closeDatabase(db);
}

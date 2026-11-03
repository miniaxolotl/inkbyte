import { closeDatabase, createDatabase } from "@lib/database";

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "MIGRATION_DATABASE_URL or DATABASE_URL is required to seed domains",
  );
}

const domains = (process.env.DEFAULT_DOMAINS ?? "inkb.ca,inkbyte.ca")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

if (domains.length === 0) {
  throw new Error("DEFAULT_DOMAINS must contain at least one domain");
}

const db = createDatabase(url, {
  ssl: process.env.DATABASE_SSL === "require",
  applicationName: "inkbyte-seed",
});
try {
  for (const [index, slug] of domains.entries()) {
    await db("domains")
      .insert({ slug, is_default: index === 0 })
      .onConflict("slug")
      .merge({
        is_default: index === 0,
      });
  }
  console.log(JSON.stringify({ domains }));
} finally {
  await closeDatabase(db);
}

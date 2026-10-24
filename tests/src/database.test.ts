import assert from "node:assert/strict";
import { test } from "node:test";
import { createDatabase } from "@lib/database";

test("hosted database connections verify TLS certificates", async () => {
  const db = createDatabase(
    "postgresql://example:secret@example.invalid/test",
    { ssl: true },
  );
  assert.equal(db.client.config.connection.ssl.rejectUnauthorized, true);
  await db.destroy();
});

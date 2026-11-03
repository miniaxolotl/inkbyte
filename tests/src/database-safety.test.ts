import assert from "node:assert/strict";
import { test } from "node:test";
import { assertTestDatabase } from "../../scripts/database/src/safety.ts";

test("query strings cannot disguise a retained database as a test database", () => {
  assert.throws(() =>
    assertTestDatabase(
      "postgresql://fixture:fixture@localhost/production?application_name=inkbyte_test",
    ),
  );
  assert.doesNotThrow(() =>
    assertTestDatabase(
      "postgresql://fixture:fixture@localhost/inkbyte_test?sslmode=verify-full",
    ),
  );
});

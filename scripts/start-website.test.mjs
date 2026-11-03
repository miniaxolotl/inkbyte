import assert from "node:assert/strict";
import { test } from "node:test";
import { serverEnvironment } from "./start-website.mjs";

test("the standalone website runner honours explicit port and host", () => {
  const env = serverEnvironment(
    ["--port", "4272", "--hostname", "127.0.0.1"],
    {},
  );
  assert.equal(env.PORT, "4272");
  assert.equal(env.HOSTNAME, "127.0.0.1");
});
test("the standalone runner rejects malformed ports", () => {
  assert.throws(() => serverEnvironment(["--port", "invalid"], {}));
  assert.throws(() => serverEnvironment(["--port", "70000"], {}));
});

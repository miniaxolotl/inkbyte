export function assertTestDatabase(value: string): string {
  const url = new URL(value);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !database.endsWith("_test")
  ) {
    throw new Error(
      "Refusing this test target: the database name must end in _test",
    );
  }
  return database;
}

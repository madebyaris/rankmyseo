import "server-only";

import { createSqliteStore } from "./sqlite-store.js";

export function createStore(databaseUrl: string) {
  if (
    databaseUrl.startsWith("postgres") ||
    databaseUrl.startsWith("mysql")
  ) {
    throw new Error(
      "Postgres and MySQL adapters are not implemented in M0. Use sqlite:// or :memory:",
    );
  }

  const path = databaseUrl.startsWith("sqlite://")
    ? databaseUrl.slice("sqlite://".length)
    : databaseUrl;

  return createSqliteStore(path);
}

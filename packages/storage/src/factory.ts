import type { RankStore } from "@rankmyseo/core";
import { createPostgresStore } from "./postgres-store.js";
import { createSqliteStore } from "./sqlite-store.js";

export function createStore(databaseUrl: string): RankStore {
  if (databaseUrl.startsWith("mysql://") || databaseUrl.startsWith("mysql:")) {
    throw new Error(
      "MySQL is not supported; use sqlite:// or postgres://",
    );
  }

  if (
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
  ) {
    return createPostgresStore(databaseUrl);
  }

  const path = databaseUrl.startsWith("sqlite://")
    ? databaseUrl.slice("sqlite://".length)
    : databaseUrl;

  return createSqliteStore(path);
}

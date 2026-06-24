import { createStore } from "@rankmyseo/storage";

export function migrateDatabase(databaseUrl: string): { ok: true; path: string } {
  const store = createStore(databaseUrl);
  void store;
  const path = databaseUrl.startsWith("sqlite://")
    ? databaseUrl.slice("sqlite://".length)
    : databaseUrl;
  return { ok: true, path };
}

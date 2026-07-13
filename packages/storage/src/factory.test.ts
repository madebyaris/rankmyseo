import { describe, expect, it } from "vitest";
import { createStore } from "./factory.js";

describe("createStore factory", () => {
  it("rejects MySQL with a clear error", () => {
    expect(() => createStore("mysql://user:pass@localhost:3306/db")).toThrow(
      /MySQL is not supported; use sqlite:\/\/ or postgres:\/\//,
    );
  });

  it("routes sqlite:// to SQLite", () => {
    const store = createStore("sqlite://:memory:");
    expect(store.projects).toBeDefined();
    expect(store.keywords).toBeDefined();
  });

  it("routes :memory: to SQLite", () => {
    const store = createStore(":memory:");
    expect(store.projects).toBeDefined();
  });

  it("routes postgres:// to Postgres store", () => {
    const store = createStore("postgres://test:test@localhost:5432/rankmyseo");
    expect(store.projects).toBeDefined();
    expect(store.blog).toBeDefined();
  });

  it("routes postgresql:// to Postgres store", () => {
    const store = createStore(
      "postgresql://test:test@localhost:5432/rankmyseo",
    );
    expect(store.audits).toBeDefined();
  });
});

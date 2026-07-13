import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { runStoreContractTests } from "@rankmyseo/core/testing";
import { createPrismaStore } from "./prisma-store.js";

const postgresUrl =
  process.env.RANKMYSEO_POSTGRES_URL ?? process.env.DATABASE_URL;

describe.skipIf(!postgresUrl)(
  "prisma store contract (requires RANKMYSEO_POSTGRES_URL or DATABASE_URL)",
  () => {
    runStoreContractTests(() => createPrismaStore(postgresUrl!), {
      makeScope: () => ({
        tenantId: randomUUID(),
        projectId: randomUUID(),
      }),
    });
  },
);

describe.skipIf(postgresUrl)("prisma store skipped", () => {
  it("skips when RANKMYSEO_POSTGRES_URL / DATABASE_URL is unset", () => {
    expect(postgresUrl).toBeFalsy();
  });
});

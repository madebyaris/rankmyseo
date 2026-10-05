import { describe, expect, it } from "vitest";
import { defineConfig } from "@rankmyseo/core";
import { ardPublisher, buildArdManifest } from "./discovery.js";

describe("ARD publisher names", () => {
  it("keeps a normal hostname and strips characters the URN pattern rejects", () => {
    expect(ardPublisher("example.com")).toBe("example.com");
    expect(ardPublisher("::1")).toBe("1");
  });

  it("anchors the entry on the request host, not rankmyseo.com", () => {
    const config = defineConfig({
      databaseUrl: "sqlite://:memory:",
      tenantId: "tenant-a",
      projectId: "project-1",
      llmsTxt: { projectName: "Example" },
    });
    const manifest = buildArdManifest("http://localhost/api/rankmyseo", "/api/rankmyseo", config);
    expect(manifest.host.identifier).toBe("http://localhost");
    expect(manifest.host.documentationUrl).toBe("http://localhost/api/rankmyseo/api");
    expect(manifest.entries[0]?.identifier).toBe("urn:air:localhost:rankmyseo:api-rankmyseo");
    expect(manifest.entries[0]?.url).toContain("/.well-known/api-catalog");
    expect(manifest.entries).toHaveLength(1);
  });
});

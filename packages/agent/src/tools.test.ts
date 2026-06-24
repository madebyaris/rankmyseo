import { describe, it, expect, beforeEach } from "vitest";
import { createAgentTools } from "./tools.js";
import { createSqliteStore } from "@rankmyseo/storage";

describe("createAgentTools", () => {
  let store: ReturnType<typeof createSqliteStore>;
  const scope = { tenantId: "tenant-a", projectId: "project-1" };

  beforeEach(async () => {
    store = createSqliteStore(":memory:");
    await store.projects.create({
      id: scope.projectId,
      tenantId: scope.tenantId,
      name: "Test",
      domain: "example.com",
    });
  });

  it("lists keywords via tool execute", async () => {
    await store.keywords.create({
      tenantId: scope.tenantId,
      projectId: scope.projectId,
      text: "seo audit",
      country: "us",
      device: "desktop",
      tags: [],
    });

    const tools = createAgentTools({ store, scope });
    const execute = tools.listKeywords.execute;
    if (!execute) throw new Error("execute missing");
    const result = await execute({}, { toolCallId: "1", messages: [] });

    expect("keywords" in result && result.keywords).toHaveLength(1);
  });

  it("updates dashboard config via tool execute", async () => {
    const tools = createAgentTools({ store, scope });
    const execute = tools.updateDashboardConfig.execute;
    if (!execute) throw new Error("execute missing");
    const result = await execute(
      {
        widgets: [
          {
            id: "w1",
            type: "KeywordTable",
            title: "Keywords",
            query: {},
            options: {},
          },
        ],
      },
      { toolCallId: "2", messages: [] },
    );

    expect("config" in result && result.config.widgets).toHaveLength(1);
  });
});

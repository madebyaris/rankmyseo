import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RankMySeoProvider, createRankMySeoClient } from "@rankmyseo/react";
import { DashboardRenderer } from "./dashboard-renderer.js";

describe("DashboardRenderer", () => {
  it("renders keyword table widget", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const client = createRankMySeoClient({
      baseUrl: "http://localhost",
      tenantId: "t",
      projectId: "p",
      fetchImpl,
    });

    render(
      <RankMySeoProvider value={client}>
        <DashboardRenderer
          widgets={[
            {
              id: "w1",
              type: "KeywordTable",
              title: "Keywords",
              query: {},
              options: {},
            },
          ]}
        />
      </RankMySeoProvider>,
    );

    expect(screen.getByText("Keywords")).toBeTruthy();
  });
});

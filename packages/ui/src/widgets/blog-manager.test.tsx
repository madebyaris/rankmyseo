import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RankMySeoProvider, createRankMySeoClient } from "@rankmyseo/react";
import { BlogManager } from "./blog-manager.js";

describe("BlogManager", () => {
  it("renders create form with default options", async () => {
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
        <BlogManager
          title="Content"
          options={{ labels: { createTitle: "Write a post" } }}
        />
      </RankMySeoProvider>,
    );

    expect(screen.getByText("Write a post")).toBeTruthy();
    expect(screen.getByText("Content (0)")).toBeTruthy();
  });
});

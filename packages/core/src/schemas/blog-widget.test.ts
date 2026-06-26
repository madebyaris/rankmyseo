import { describe, it, expect } from "vitest";
import {
  BLOG_WIDGET_TYPE,
  dashboardHasBlogWidget,
  parseBlogWidgetOptions,
} from "./index.js";

describe("blog widget helpers", () => {
  it("detects BlogManager on dashboard", () => {
    expect(
      dashboardHasBlogWidget([
        {
          id: "w1",
          type: BLOG_WIDGET_TYPE,
          title: "Blog",
          query: {},
          options: {},
        },
      ]),
    ).toBe(true);
    expect(dashboardHasBlogWidget([])).toBe(false);
  });

  it("parses widget options with defaults", () => {
    const opts = parseBlogWidgetOptions({ allowCreate: false });
    expect(opts.allowCreate).toBe(false);
    expect(opts.showRecommendations).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import type { StartPageCollectorOptions } from "@rankmyseo/collector";
import { usePageCollector } from "./collector.js";

const { dispose, startPageCollectorMock } = vi.hoisted(() => {
  const disposeFn = vi.fn();
  const startMock = vi.fn((_options: StartPageCollectorOptions) => disposeFn);
  return { dispose: disposeFn, startPageCollectorMock: startMock };
});

vi.mock("@rankmyseo/collector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rankmyseo/collector")>();
  return {
    ...actual,
    startPageCollector: startPageCollectorMock,
  };
});

describe("usePageCollector", () => {
  beforeEach(() => {
    dispose.mockClear();
    startPageCollectorMock.mockClear();
  });

  it("calls startPageCollector on mount and dispose on unmount", async () => {
    const Child = defineComponent({
      setup() {
        usePageCollector({
          baseUrl: "http://localhost:3456",
          tenantId: "t",
          projectId: "p",
          delayMs: 50,
        });
        return () => h("div");
      },
    });

    const wrapper = mount(Child);
    await nextTick();

    expect(startPageCollectorMock).toHaveBeenCalledOnce();
    expect(startPageCollectorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "http://localhost:3456",
        tenantId: "t",
        projectId: "p",
        delayMs: 50,
      }),
    );

    wrapper.unmount();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("skips start when enabled is false", async () => {
    const Child = defineComponent({
      setup() {
        usePageCollector({
          baseUrl: "http://localhost:3456",
          tenantId: "t",
          projectId: "p",
          enabled: false,
        });
        return () => h("div");
      },
    });

    mount(Child);
    await nextTick();
    expect(startPageCollectorMock).not.toHaveBeenCalled();
  });
});

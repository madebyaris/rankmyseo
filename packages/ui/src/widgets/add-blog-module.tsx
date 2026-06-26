import type { BlogWidgetOptions } from "@rankmyseo/core/schemas";

export interface AddBlogModuleProps {
  onEnable: (options?: Partial<BlogWidgetOptions>) => void | Promise<void>;
  busy?: boolean;
}

/** Prompt shown when the blog module is not on the dashboard yet. */
export function AddBlogModule({ onEnable, busy }: AddBlogModuleProps) {
  return (
    <div className="rms-root rms-card">
      <div className="rms-module-promo">
        <div className="rms-card-head">
          <h3>Blog module</h3>
          <p className="rms-card-desc">
            Optional SEO blog with keyword intent, auto meta generation, and
            recommendations. Add it when you need content — leave it off when
            you do not.
          </p>
        </div>
        <ul className="rms-card-desc" style={{ margin: 0, paddingLeft: "1.1rem" }}>
          <li>Target keyword + search intent per post</li>
          <li>Auto-generated meta title and description</li>
          <li>Intent-based recommendations on each post</li>
        </ul>
        <button
          type="button"
          className="rms-btn rms-btn-primary"
          disabled={busy}
          onClick={() => void onEnable()}
        >
          {busy ? "Adding…" : "Add blog to dashboard"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import type {
  BlogWidgetOptions,
  DashboardWidget,
  KeywordIntent,
  Recommendation,
} from "@rankmyseo/core/schemas";
import { parseBlogWidgetOptions } from "@rankmyseo/core/schemas";
import { useBlog } from "@rankmyseo/react";

const DEFAULT_INTENTS: KeywordIntent[] = [
  "informational",
  "navigational",
  "commercial",
  "transactional",
];

function intentBadgeClass(intent: KeywordIntent): string {
  if (intent === "commercial") return "rms-badge rms-badge-warning";
  if (intent === "transactional") return "rms-badge rms-badge-success";
  return "rms-badge rms-badge-default";
}

function priorityBadgeClass(priority: Recommendation["priority"]): string {
  if (priority === "high") return "rms-badge rms-badge-destructive";
  if (priority === "medium") return "rms-badge rms-badge-warning";
  return "rms-badge rms-badge-outline";
}

export interface BlogManagerProps {
  widget?: DashboardWidget;
  /** Standalone use — merged with widget.options when both provided */
  options?: Partial<BlogWidgetOptions>;
  title?: string;
}

export function BlogManager({ widget, options: optionsOverride, title }: BlogManagerProps) {
  const opts = {
    ...parseBlogWidgetOptions(widget?.options),
    ...optionsOverride,
  };
  const labels = opts.labels ?? {};
  const intents = opts.intents ?? DEFAULT_INTENTS;

  const { posts, loading, createPost, updatePost, deletePost, getPost } = useBlog();
  const [draft, setDraft] = useState({
    title: "",
    targetKeyword: "",
    intent: "informational" as KeywordIntent,
    content: "",
  });
  const [recs, setRecs] = useState<{ id: string; items: Recommendation[] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!draft.title.trim() || !opts.allowCreate) return;
    setBusy(true);
    try {
      await createPost({ ...draft, status: "draft" });
      setDraft({ title: "", targetKeyword: "", intent: "informational", content: "" });
    } finally {
      setBusy(false);
    }
  };

  const toggleRecs = async (id: string) => {
    if (!opts.showRecommendations) return;
    if (recs?.id === id) {
      setRecs(null);
      return;
    }
    const res = await getPost(id);
    setRecs({ id, items: res.recommendations });
  };

  const listTitle = title ?? widget?.title ?? labels.listTitle ?? "Blog";

  return (
    <div className="rms-root rms-stack rms-stack-lg">
      {opts.allowCreate ? (
        <section className="rms-card">
          <div className="rms-card-head">
            <h3>{labels.createTitle ?? "New blog post"}</h3>
            <p className="rms-card-desc">
              {labels.createDescription ??
                "Meta is auto-generated when left blank."}
            </p>
          </div>
          <div className="rms-form-grid">
            <div className="rms-field rms-span-2">
              <label className="rms-label" htmlFor="rms-blog-title">
                Title
              </label>
              <input
                id="rms-blog-title"
                className="rms-input"
                value={draft.title}
                placeholder="e.g. The best rank tracking tools in 2026"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="rms-field">
              <label className="rms-label" htmlFor="rms-blog-kw">
                Target keyword
              </label>
              <input
                id="rms-blog-kw"
                className="rms-input"
                value={draft.targetKeyword}
                placeholder="rank tracking tools"
                onChange={(e) =>
                  setDraft({ ...draft, targetKeyword: e.target.value })
                }
              />
            </div>
            {opts.showIntent ? (
              <div className="rms-field">
                <label className="rms-label" htmlFor="rms-blog-intent">
                  Keyword intent
                </label>
                <select
                  id="rms-blog-intent"
                  className="rms-select"
                  value={draft.intent}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      intent: e.target.value as KeywordIntent,
                    })
                  }
                >
                  {intents.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="rms-field rms-span-2">
              <label className="rms-label" htmlFor="rms-blog-content">
                Content
              </label>
              <textarea
                id="rms-blog-content"
                className="rms-textarea"
                rows={3}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: "0.85rem" }}>
            <button
              type="button"
              className="rms-btn rms-btn-primary"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? "Saving…" : (labels.addButton ?? "Add post")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="rms-card">
        <div className="rms-card-head">
          <h3>
            {listTitle} ({posts.length})
          </h3>
        </div>
        {loading ? (
          <div className="rms-stack">
            <div className="rms-skeleton" />
            <div className="rms-skeleton" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rms-empty">
            {labels.empty ?? "No posts yet. Create your first one above."}
          </div>
        ) : (
          <div className="rms-stack">
            {posts.map((p) => (
              <article key={p.id} className="rms-post">
                <div className="rms-post-title-row">
                  <strong>{p.title}</strong>
                  {opts.showIntent ? (
                    <span className={intentBadgeClass(p.intent)}>{p.intent}</span>
                  ) : null}
                  <span
                    className={
                      p.status === "published"
                        ? "rms-badge rms-badge-success"
                        : "rms-badge rms-badge-outline"
                    }
                  >
                    {p.status}
                  </span>
                </div>
                {opts.showMetaPreview ? (
                  <>
                    <p className="rms-meta-line">{p.metaTitle}</p>
                    <p className="rms-meta-line">{p.metaDescription}</p>
                  </>
                ) : null}
                {p.targetKeyword ? (
                  <span className="rms-kw-chip">🎯 {p.targetKeyword}</span>
                ) : null}

                <div className="rms-actions">
                  {opts.showRecommendations ? (
                    <button
                      type="button"
                      className="rms-btn rms-btn-outline rms-btn-sm"
                      onClick={() => void toggleRecs(p.id)}
                    >
                      {labels.recommendations ?? "Recommendations"}
                    </button>
                  ) : null}
                  {opts.allowPublish ? (
                    <button
                      type="button"
                      className="rms-btn rms-btn-outline rms-btn-sm"
                      onClick={() =>
                        void updatePost(p.id, {
                          status: p.status === "draft" ? "published" : "draft",
                        })
                      }
                    >
                      {p.status === "draft"
                        ? (labels.publish ?? "Publish")
                        : (labels.unpublish ?? "Unpublish")}
                    </button>
                  ) : null}
                  {opts.allowDelete ? (
                    <button
                      type="button"
                      className="rms-btn rms-btn-destructive rms-btn-sm"
                      onClick={() => void deletePost(p.id)}
                    >
                      {labels.delete ?? "Delete"}
                    </button>
                  ) : null}
                </div>

                {recs?.id === p.id ? (
                  <>
                    <hr className="rms-separator" />
                    <div className="rms-stack">
                      {recs.items.map((r) => (
                        <div key={r.id} className="rms-rec">
                          <span className={priorityBadgeClass(r.priority)}>
                            {r.priority}
                          </span>
                          <div>
                            <strong>{r.title}</strong>
                            <p className="rms-rec-detail">{r.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Dashboard widget adapter */
export function BlogManagerWidget({ widget }: { widget: DashboardWidget }) {
  return <BlogManager widget={widget} />;
}

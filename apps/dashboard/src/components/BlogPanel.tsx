import { useState } from "react";
import type { KeywordIntent, Recommendation } from "@rankmyseo/core";
import { useBlog } from "@rankmyseo/react";
import { Badge, Card, EmptyState, priorityTone } from "./ui.js";

const INTENTS: KeywordIntent[] = [
  "informational",
  "navigational",
  "commercial",
  "transactional",
];

const INTENT_TONE: Record<KeywordIntent, "blue" | "green" | "amber" | "neutral"> = {
  informational: "blue",
  navigational: "neutral",
  commercial: "amber",
  transactional: "green",
};

export function BlogPanel() {
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
    if (!draft.title.trim()) return;
    setBusy(true);
    try {
      await createPost({ ...draft, status: "draft" });
      setDraft({ title: "", targetKeyword: "", intent: "informational", content: "" });
    } finally {
      setBusy(false);
    }
  };

  const viewRecs = async (id: string) => {
    const res = await getPost(id);
    setRecs({ id, items: res.recommendations });
  };

  return (
    <div className="panel">
      <Card title="New blog post" subtitle="Meta is auto-generated when left blank.">
        <div className="form-grid">
          <label className="full">
            Title
            <input
              className="input"
              value={draft.title}
              placeholder="e.g. The best rank tracking tools in 2026"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Target keyword
            <input
              className="input"
              value={draft.targetKeyword}
              placeholder="rank tracking tools"
              onChange={(e) => setDraft({ ...draft, targetKeyword: e.target.value })}
            />
          </label>
          <label>
            Keyword intent
            <select
              className="input"
              value={draft.intent}
              onChange={(e) =>
                setDraft({ ...draft, intent: e.target.value as KeywordIntent })
              }
            >
              {INTENTS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Content
            <textarea
              className="input"
              rows={3}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
          </label>
        </div>
        <button className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
          {busy ? "Saving…" : "Add post"}
        </button>
      </Card>

      <Card title={`Posts (${posts.length})`}>
        {loading ? (
          <EmptyState>Loading posts…</EmptyState>
        ) : posts.length === 0 ? (
          <EmptyState>No posts yet. Create your first one above.</EmptyState>
        ) : (
          <ul className="post-list">
            {posts.map((p) => (
              <li key={p.id} className="post-item">
                <div className="post-main">
                  <div className="post-title-row">
                    <strong>{p.title}</strong>
                    <Badge tone={INTENT_TONE[p.intent]}>{p.intent}</Badge>
                    <Badge tone={p.status === "published" ? "green" : "neutral"}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="muted meta-line">{p.metaTitle}</p>
                  <p className="muted meta-line">{p.metaDescription}</p>
                  {p.targetKeyword ? (
                    <span className="kw-chip">🎯 {p.targetKeyword}</span>
                  ) : null}
                </div>
                <div className="post-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => void viewRecs(p.id)}>
                    Recommendations
                  </button>
                  {p.status === "draft" ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => void updatePost(p.id, { status: "published" })}
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => void updatePost(p.id, { status: "draft" })}
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => void deletePost(p.id)}
                  >
                    Delete
                  </button>
                </div>

                {recs?.id === p.id ? (
                  <ul className="rec-list inline-recs">
                    {recs.items.map((r) => (
                      <li key={r.id}>
                        <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
                        <div>
                          <strong>{r.title}</strong>
                          <p className="muted">{r.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

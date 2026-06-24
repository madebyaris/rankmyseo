import { useState } from "react";
import { useMetaGenerator } from "@rankmyseo/react";
import { Badge, Card, EmptyState } from "./ui.js";

export function MetaPanel() {
  const { result, generating, error, generate } = useMetaGenerator();
  const [form, setForm] = useState({
    title: "How to choose the best SEO tools for small teams",
    content:
      "Picking SEO tools is hard when every vendor claims to be the best. This guide compares rank tracking, audits, and reporting so small teams can choose with confidence.",
    targetKeyword: "best seo tools",
    url: "https://example.com/best-seo-tools",
    siteName: "RankMySEO",
  });
  const [copied, setCopied] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="panel">
      <Card
        title="Meta generator"
        subtitle="Generate optimized meta tags from a title + content."
      >
        <div className="form-grid">
          <label>
            Page title
            <input
              className="input"
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
            />
          </label>
          <label>
            Target keyword
            <input
              className="input"
              value={form.targetKeyword}
              onChange={(e) => set("targetKeyword")(e.target.value)}
            />
          </label>
          <label>
            Canonical URL
            <input
              className="input"
              value={form.url}
              onChange={(e) => set("url")(e.target.value)}
            />
          </label>
          <label>
            Site name
            <input
              className="input"
              value={form.siteName}
              onChange={(e) => set("siteName")(e.target.value)}
            />
          </label>
          <label className="full">
            Content
            <textarea
              className="input"
              rows={4}
              value={form.content}
              onChange={(e) => set("content")(e.target.value)}
            />
          </label>
        </div>
        <button
          className="btn btn-primary"
          disabled={generating}
          onClick={() => {
            void generate(form).catch(() => {});
          }}
        >
          {generating ? "Generating…" : "Generate meta"}
        </button>
        {error ? <p className="error">{error.message}</p> : null}
      </Card>

      {result ? (
        <Card
          title="Generated meta"
          actions={
            <Badge tone={result.score >= 90 ? "green" : "amber"}>
              audit score {result.score}
            </Badge>
          }
        >
          <ul className="signal-list">
            <li>
              <span>Meta title ({result.meta.metaTitle.length})</span>
              <code>{result.meta.metaTitle}</code>
            </li>
            <li>
              <span>Description ({result.meta.metaDescription.length})</span>
              <code>{result.meta.metaDescription}</code>
            </li>
            <li>
              <span>Slug</span>
              <code>{result.meta.slug}</code>
            </li>
          </ul>

          <div className="snippet-head">
            <span className="muted">Head snippet</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                void navigator.clipboard?.writeText(result.meta.html);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="code-block">{result.meta.html}</pre>
        </Card>
      ) : (
        <EmptyState>Fill the form and generate meta to preview it here.</EmptyState>
      )}
    </div>
  );
}

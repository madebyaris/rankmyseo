import { useState } from "react";
import { useScan } from "@rankmyseo/react";
import { Badge, Card, EmptyState, ScoreRing, priorityTone } from "./ui.js";

export function ScanPanel() {
  const { result, scanning, error, scan } = useScan();
  const [url, setUrl] = useState("https://vercel.com");

  return (
    <div className="panel">
      <Card
        title="Scan a website"
        subtitle="Fetch a live URL, extract on-page signals, and score it."
      >
        <div className="row">
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <button
            className="btn btn-primary"
            disabled={scanning}
            onClick={() => {
              void scan(url).catch(() => {});
            }}
          >
            {scanning ? "Scanning…" : "Scan"}
          </button>
        </div>
        {error ? <p className="error">{error.message}</p> : null}
      </Card>

      {result ? (
        <div className="scan-results">
          <Card title="Audit score">
            <div className="score-block">
              <ScoreRing score={result.audit.score} label="/ 100" />
              <ul className="signal-list">
                <li>
                  <span>Title</span>
                  <code>{result.signals.title ?? "—"}</code>
                </li>
                <li>
                  <span>Meta description</span>
                  <code>{result.signals.metaDescription ?? "—"}</code>
                </li>
                <li>
                  <span>Canonical</span>
                  <code>{result.signals.canonical ?? "—"}</code>
                </li>
                <li>
                  <span>H1 count</span>
                  <code>{result.signals.h1Count}</code>
                </li>
                <li>
                  <span>Open Graph</span>
                  <code>{result.signals.hasOgTags ? "yes" : "no"}</code>
                </li>
                <li>
                  <span>JSON-LD</span>
                  <code>{result.signals.hasJsonLd ? "yes" : "no"}</code>
                </li>
              </ul>
            </div>
          </Card>

          <Card title="Checks">
            <ul className="check-list">
              {result.audit.checks.map((c) => (
                <li key={c.ruleId}>
                  <Badge tone={c.passed ? "green" : "red"}>
                    {c.passed ? "PASS" : "FAIL"}
                  </Badge>
                  <span>{c.message}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Recommendations">
            {result.recommendations.length === 0 ? (
              <EmptyState>No issues found. This page looks healthy. 🎉</EmptyState>
            ) : (
              <ul className="rec-list">
                {result.recommendations.map((r) => (
                  <li key={r.id}>
                    <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
                    <div>
                      <strong>{r.title}</strong>
                      <p className="muted">{r.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState>
          Enter a URL and hit <strong>Scan</strong> to audit a live page.
        </EmptyState>
      )}
    </div>
  );
}

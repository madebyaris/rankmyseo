import { useState } from "react";
import { useDashboardConfig, useRankMySeoChat } from "@rankmyseo/react";
import { DashboardRenderer } from "@rankmyseo/ui";
import { Card, EmptyState } from "./ui.js";

export function OverviewPanel() {
  const { config, loading } = useDashboardConfig();
  const { sendMessage, streaming } = useRankMySeoChat();
  const [prompt, setPrompt] = useState(
    "Show my keywords and suggest a dashboard layout",
  );
  const [reply, setReply] = useState("");

  return (
    <div className="panel">
      <Card title="Dashboard widgets" subtitle="Rendered from @rankmyseo/ui">
        {loading ? (
          <EmptyState>Loading dashboard…</EmptyState>
        ) : config ? (
          <DashboardRenderer widgets={config.widgets} />
        ) : (
          <EmptyState>No dashboard config yet.</EmptyState>
        )}
      </Card>

      <Card title="Agent" subtitle="Ask the RankMySEO agent (mock model in playground)">
        <textarea
          className="input"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={streaming}
          onClick={() => {
            void sendMessage([{ role: "user", content: prompt }]).then(setReply);
          }}
        >
          {streaming ? "Thinking…" : "Ask agent"}
        </button>
        <pre className="code-block">{reply || "Agent response will appear here."}</pre>
      </Card>
    </div>
  );
}

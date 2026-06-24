import { useState } from "react";
import {
  RankMySeoProvider,
  createRankMySeoClient,
} from "@rankmyseo/react";
import { Landing } from "./components/Landing.js";
import { OverviewPanel } from "./components/OverviewPanel.js";
import { ScanPanel } from "./components/ScanPanel.js";
import { MetaPanel } from "./components/MetaPanel.js";
import { BlogPanel } from "./components/BlogPanel.js";

const client = createRankMySeoClient({
  baseUrl: "",
  tenantId: "tenant-a",
  projectId: "project-1",
});

type Tab = "overview" | "scan" | "meta" | "blog";

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "scan", label: "Scan", icon: "🔍" },
  { id: "meta", label: "Meta generator", icon: "🏷️" },
  { id: "blog", label: "Blog", icon: "✍️" },
];

function Dashboard({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>("scan");

  return (
    <div className="dash">
      <aside className="sidebar">
        <button className="brand brand-btn" onClick={onExit}>
          <span className="brand-mark">◆</span> RankMySEO
        </button>
        <nav className="nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot muted">
          tenant-a · project-1
          <br />
          Apache-2.0
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-head">
          <h2>{TABS.find((t) => t.id === tab)?.label}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onExit}>
            ← Back to site
          </button>
        </header>
        {tab === "overview" ? <OverviewPanel /> : null}
        {tab === "scan" ? <ScanPanel /> : null}
        {tab === "meta" ? <MetaPanel /> : null}
        {tab === "blog" ? <BlogPanel /> : null}
      </main>
    </div>
  );
}

export function App() {
  const [view, setView] = useState<"landing" | "app">("landing");

  return (
    <RankMySeoProvider value={client}>
      {view === "landing" ? (
        <Landing onLaunch={() => setView("app")} />
      ) : (
        <Dashboard onExit={() => setView("landing")} />
      )}
    </RankMySeoProvider>
  );
}

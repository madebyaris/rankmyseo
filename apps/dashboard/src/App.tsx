import { useState } from "react";
import {
  Braces,
  ChevronLeft,
  FileText,
  LayoutGrid,
  Search,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { RankMySeoProvider, createRankMySeoClient, useBlogModule } from "@rankmyseo/react";
import { BlogManager } from "@rankmyseo/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Landing } from "@/components/Landing";
import { OverviewPanel } from "@/components/OverviewPanel";
import { ScanPanel } from "@/components/ScanPanel";
import { MetaPanel } from "@/components/MetaPanel";
import { SchemaPanel } from "@/components/SchemaPanel";

const client = createRankMySeoClient({
  baseUrl: "",
  tenantId: "tenant-a",
  projectId: "project-1",
});

type Tab = "overview" | "scan" | "meta" | "schema" | "blog";

const BASE_TABS: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "scan", label: "Scan", icon: Search },
  { id: "meta", label: "Meta generator", icon: Tags },
  { id: "schema", label: "Schema generator", icon: Braces },
];

const BLOG_TAB = { id: "blog" as const, label: "Blog", icon: FileText };

function Dashboard({ onExit }: { onExit: () => void }) {
  const { enabled, widget, options } = useBlogModule();
  const tabs = enabled ? [...BASE_TABS, BLOG_TAB] : BASE_TABS;
  const [tab, setTab] = useState<Tab>("scan");
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col gap-6 border-r bg-sidebar p-4 md:sticky md:top-0 md:h-screen">
        <button
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          onClick={onExit}
        >
          <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground">
            ◆
          </span>
          RankMySEO
        </button>

        <nav className="flex flex-col gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto text-xs leading-relaxed text-muted-foreground">
          tenant-a · project-1
          <br />
          Apache-2.0
        </div>
      </aside>

      <main className="mx-auto w-full max-w-4xl px-6 py-6">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            {active?.label}
          </h2>
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ChevronLeft data-icon="inline-start" />
            Back to site
          </Button>
        </header>
        {tab === "overview" ? <OverviewPanel /> : null}
        {tab === "scan" ? <ScanPanel /> : null}
        {tab === "meta" ? <MetaPanel /> : null}
        {tab === "schema" ? <SchemaPanel /> : null}
        {tab === "blog" && enabled && widget ? (
          <BlogManager widget={widget} options={options} />
        ) : null}
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

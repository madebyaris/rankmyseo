import { ArrowRight, FileText, Lightbulb, Search, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: Search,
    title: "Website scan",
    body: "Fetch any URL, extract on-page SEO signals, and score it against the audit rule engine in seconds.",
  },
  {
    icon: Tags,
    title: "Meta generator",
    body: "Generate a clean title, meta description, Open Graph tags, and JSON-LD — verified against the same audit rules.",
  },
  {
    icon: FileText,
    title: "Blog system",
    body: "Draft posts with a target keyword and search intent. Meta is auto-generated when you leave it blank.",
  },
  {
    icon: Lightbulb,
    title: "Recommendations",
    body: "Every scan and post returns prioritized, actionable fixes — high, medium, and low priority.",
  },
];

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <nav className="flex items-center justify-between py-5">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground text-xs">
            ◆
          </span>
          RankMySEO
        </span>
        <Button onClick={onLaunch}>Open dashboard</Button>
      </nav>

      <header className="flex flex-col items-center gap-5 py-16 text-center">
        <Badge variant="secondary">Open-source · Apache-2.0</Badge>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          The SEO toolkit you{" "}
          <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
            drop into any app
          </span>
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
          Scan pages, generate meta tags, manage an intent-driven blog, and get
          recommendations — all powered by the framework-agnostic{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
            @rankmyseo/*
          </code>{" "}
          packages, with your data in your database.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={onLaunch}>
            Launch the dashboard
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/madebyaris/rankmyseo"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <span className="mb-1 grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </span>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <footer className="mt-auto py-12 text-center text-sm text-muted-foreground">
        Self-hosted · bring your own database · no paid SERP brokers
      </footer>
    </div>
  );
}

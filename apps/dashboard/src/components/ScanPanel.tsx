import { useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { useScan } from "@rankmyseo/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Empty, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { ScoreRing } from "@/components/score-ring";
import { priorityVariant } from "@/lib/seo";

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <code className="max-w-[60%] truncate text-sm">{value}</code>
    </div>
  );
}

export function ScanPanel() {
  const { result, scanning, error, scan } = useScan();
  const [url, setUrl] = useState("https://vercel.com");

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Scan a website</CardTitle>
          <CardDescription>
            Fetch a live URL, extract on-page signals, and score it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com or https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !scanning) void scan(url).catch(() => {});
              }}
            />
            <Button
              disabled={scanning}
              onClick={() => void scan(url).catch(() => {})}
            >
              {scanning ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Search data-icon="inline-start" />
              )}
              {scanning ? "Scanning…" : "Scan"}
            </Button>
          </div>
          {error ? (
            <Alert variant="destructive">
              <X />
              <AlertTitle>{error.message}</AlertTitle>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Audit score</CardTitle>
              <CardDescription className="truncate">
                {result.audit.url}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-6">
              <ScoreRing score={result.audit.score} />
              <div className="min-w-64 flex-1">
                <Signal label="Title" value={result.signals.title ?? "—"} />
                <Signal
                  label="Meta description"
                  value={result.signals.metaDescription ?? "—"}
                />
                <Signal
                  label="Canonical"
                  value={result.signals.canonical ?? "—"}
                />
                <Signal label="H1 count" value={String(result.signals.h1Count)} />
                <Signal
                  label="Open Graph"
                  value={result.signals.hasOgTags ? "yes" : "no"}
                />
                <Signal
                  label="JSON-LD"
                  value={result.signals.hasJsonLd ? "yes" : "no"}
                />
                <Signal
                  label="Indexable"
                  value={result.signals.robotsNoindex ? "no (noindex)" : "yes"}
                />
                <Signal
                  label="Mobile viewport"
                  value={result.signals.hasViewportMeta ? "yes" : "no"}
                />
                <Signal label="Language" value={result.signals.lang ?? "—"} />
                <Signal
                  label="Image alt coverage"
                  value={
                    result.signals.imageCount
                      ? `${result.signals.imagesWithAlt ?? 0}/${result.signals.imageCount}`
                      : "—"
                  }
                />
                <Signal
                  label="Word count"
                  value={
                    result.signals.wordCount !== undefined
                      ? String(result.signals.wordCount)
                      : "—"
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checks</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {result.audit.checks.map((c) => (
                <div key={c.ruleId} className="flex items-start gap-2 text-sm">
                  {c.passed ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <span>{c.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {result.recommendations.length === 0 ? (
                <Empty>
                  <EmptyMedia variant="icon">
                    <Check />
                  </EmptyMedia>
                  <EmptyDescription>
                    No issues found. This page looks healthy.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="flex flex-col gap-3">
                  {result.recommendations.map((r) => (
                    <div key={r.id} className="flex items-start gap-3">
                      <Badge variant={priorityVariant(r.priority)}>
                        {r.priority}
                      </Badge>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{r.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {r.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyDescription>
            Enter a URL and hit Scan to audit a live page.
          </EmptyDescription>
        </Empty>
      )}
    </div>
  );
}

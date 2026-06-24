import { useState } from "react";
import { Copy, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useMetaGenerator } from "@rankmyseo/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { Alert, AlertTitle } from "@/components/ui/alert";

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

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Meta generator</CardTitle>
          <CardDescription>
            Generate optimized meta tags from a title and content.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-title">Page title</Label>
              <Input
                id="m-title"
                value={form.title}
                onChange={(e) => set("title")(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-kw">Target keyword</Label>
              <Input
                id="m-kw"
                value={form.targetKeyword}
                onChange={(e) => set("targetKeyword")(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-url">Canonical URL</Label>
              <Input
                id="m-url"
                value={form.url}
                onChange={(e) => set("url")(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-site">Site name</Label>
              <Input
                id="m-site"
                value={form.siteName}
                onChange={(e) => set("siteName")(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="m-content">Content</Label>
              <Textarea
                id="m-content"
                rows={4}
                value={form.content}
                onChange={(e) => set("content")(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button
              disabled={generating}
              onClick={() => void generate(form).catch(() => {})}
            >
              {generating ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {generating ? "Generating…" : "Generate meta"}
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
        <Card>
          <CardHeader>
            <CardTitle>Generated meta</CardTitle>
            <CardDescription>
              Verified against the audit rules.
            </CardDescription>
            <CardAction>
              <Badge variant={result.score >= 90 ? "default" : "secondary"}>
                audit score {result.score}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  Meta title ({result.meta.metaTitle.length})
                </span>
                <code className="text-sm">{result.meta.metaTitle}</code>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  Description ({result.meta.metaDescription.length})
                </span>
                <code className="text-sm">{result.meta.metaDescription}</code>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Slug</span>
                <code className="text-sm">{result.meta.slug}</code>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Head snippet</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(result.meta.html);
                    toast.success("Head snippet copied");
                  }}
                >
                  <Copy data-icon="inline-start" />
                  Copy
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs leading-relaxed text-background">
                {result.meta.html}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <Sparkles />
          </EmptyMedia>
          <EmptyDescription>
            Fill the form and generate meta to preview it here.
          </EmptyDescription>
        </Empty>
      )}
    </div>
  );
}

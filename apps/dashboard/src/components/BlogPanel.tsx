import { useState } from "react";
import { Lightbulb, Plus, Target, Trash2 } from "lucide-react";
import type { KeywordIntent, Recommendation } from "@rankmyseo/core";
import { useBlog } from "@rankmyseo/react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { intentVariant, priorityVariant } from "@/lib/seo";

const INTENTS: KeywordIntent[] = [
  "informational",
  "navigational",
  "commercial",
  "transactional",
];

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

  const toggleRecs = async (id: string) => {
    if (recs?.id === id) {
      setRecs(null);
      return;
    }
    const res = await getPost(id);
    setRecs({ id, items: res.recommendations });
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>New blog post</CardTitle>
          <CardDescription>
            Meta is auto-generated when left blank.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="b-title">Title</Label>
              <Input
                id="b-title"
                value={draft.title}
                placeholder="e.g. The best rank tracking tools in 2026"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b-kw">Target keyword</Label>
              <Input
                id="b-kw"
                value={draft.targetKeyword}
                placeholder="rank tracking tools"
                onChange={(e) =>
                  setDraft({ ...draft, targetKeyword: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b-intent">Keyword intent</Label>
              <Select
                value={draft.intent}
                onValueChange={(v) =>
                  setDraft({ ...draft, intent: v as KeywordIntent })
                }
              >
                <SelectTrigger id="b-intent" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {INTENTS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="b-content">Content</Label>
              <Textarea
                id="b-content"
                rows={3}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Button disabled={busy} onClick={() => void submit()}>
              <Plus data-icon="inline-start" />
              {busy ? "Saving…" : "Add post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          ) : posts.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Plus />
              </EmptyMedia>
              <EmptyDescription>
                No posts yet. Create your first one above.
              </EmptyDescription>
            </Empty>
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border p-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.title}</span>
                    <Badge variant={intentVariant(p.intent)}>{p.intent}</Badge>
                    <Badge variant={p.status === "published" ? "default" : "outline"}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.metaTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.metaDescription}
                  </p>
                  {p.targetKeyword ? (
                    <span className="flex w-fit items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      <Target className="size-3" />
                      {p.targetKeyword}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void toggleRecs(p.id)}
                  >
                    <Lightbulb data-icon="inline-start" />
                    Recommendations
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      void updatePost(p.id, {
                        status: p.status === "draft" ? "published" : "draft",
                      })
                    }
                  >
                    {p.status === "draft" ? "Publish" : "Unpublish"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void deletePost(p.id)}
                  >
                    <Trash2 data-icon="inline-start" className="text-destructive" />
                    Delete
                  </Button>
                </div>

                {recs?.id === p.id ? (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-3">
                      {recs.items.map((r) => (
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
                  </>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

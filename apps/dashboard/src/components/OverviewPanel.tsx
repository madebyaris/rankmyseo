import { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useBlogModule, useDashboardConfig, useRankMySeoChat } from "@rankmyseo/react";
import { AddBlogModule, DashboardRenderer } from "@rankmyseo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyMedia } from "@/components/ui/empty";

export function OverviewPanel() {
  const { config, loading } = useDashboardConfig();
  const { enabled, enable, loading: blogLoading } = useBlogModule();
  const { sendMessage, streaming } = useRankMySeoChat();
  const [prompt, setPrompt] = useState(
    "Show my keywords and suggest a dashboard layout",
  );
  const [reply, setReply] = useState("");
  const [enabling, setEnabling] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {!enabled && !blogLoading ? (
        <AddBlogModule
          busy={enabling}
          onEnable={async () => {
            setEnabling(true);
            try {
              await enable();
            } finally {
              setEnabling(false);
            }
          }}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dashboard widgets</CardTitle>
          <CardDescription>Rendered from @rankmyseo/ui</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : config ? (
            <DashboardRenderer widgets={config.widgets} />
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Bot />
              </EmptyMedia>
              <EmptyDescription>No dashboard config yet.</EmptyDescription>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent</CardTitle>
          <CardDescription>
            Ask the RankMySEO agent (mock model in playground)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div>
            <Button
              disabled={streaming}
              onClick={() => {
                void sendMessage([{ role: "user", content: prompt }]).then(
                  setReply,
                );
              }}
            >
              {streaming ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Bot data-icon="inline-start" />
              )}
              {streaming ? "Thinking…" : "Ask agent"}
            </Button>
          </div>
          <pre className="min-h-16 overflow-x-auto rounded-lg bg-foreground p-4 text-sm whitespace-pre-wrap text-background">
            {reply || "Agent response will appear here."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

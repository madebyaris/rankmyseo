import "server-only";

import { streamText, type LanguageModel, type StreamTextResult } from "ai";
import type { RankStore, TenantScope } from "@rankmyseo/core";
import { createAgentTools, type AgentTools } from "./tools.js";

export interface AgentChatOptions {
  store: RankStore;
  scope: TenantScope;
  model: LanguageModel;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export async function streamAgentChat(
  options: AgentChatOptions,
): Promise<StreamTextResult<AgentTools, never>> {
  const tools = createAgentTools({
    store: options.store,
    scope: options.scope,
  });

  return streamText({
    model: options.model,
    system:
      "You are RankMySEO assistant. Help users understand SEO data and customize their dashboard via tools. Never expose secrets.",
    messages: options.messages,
    tools,
  });
}

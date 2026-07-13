import "server-only";

import {
  convertToModelMessages,
  streamText,
  type LanguageModel,
  type StreamTextResult,
  type UIMessage,
} from "ai";
import type { RankStore, TenantScope } from "@rankmyseo/core";
import { createAgentTools, type AgentTools } from "./tools.js";

export interface AgentChatOptions {
  store: RankStore;
  scope: TenantScope;
  model: LanguageModel;
  messages: UIMessage[];
}

export async function streamAgentChat(
  options: AgentChatOptions,
): Promise<StreamTextResult<AgentTools, never>> {
  const tools = createAgentTools({
    store: options.store,
    scope: options.scope,
  });

  const modelMessages = await convertToModelMessages(options.messages, { tools });

  return streamText({
    model: options.model,
    system:
      "You are RankMySEO assistant. Help users understand SEO data and customize their dashboard via tools. Never expose secrets. Mutating tools require user approval before they run.",
    messages: modelMessages,
    tools,
  });
}

export type { AgentTools };

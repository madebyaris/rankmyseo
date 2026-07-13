import { writable, type Writable } from "svelte/store";
import type { RankMySeoClient } from "@rankmyseo/client";
import { getRankMySeoContext } from "../context.js";

export interface ChatStore {
  streaming: Writable<boolean>;
  sendMessage: (
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>,
  ) => Promise<string>;
}

export function createChatStore(client: RankMySeoClient): ChatStore {
  const streaming = writable(false);

  async function sendMessage(
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>,
  ) {
    streaming.set(true);
    try {
      return await client.agent.chat(messages);
    } finally {
      streaming.set(false);
    }
  }

  return { streaming, sendMessage };
}

export function chatStore(): ChatStore {
  return createChatStore(getRankMySeoContext());
}

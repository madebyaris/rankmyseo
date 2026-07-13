import { ref } from "vue";
import { useRankMySeoClient } from "../plugin.js";

export function useRankMySeoChat() {
  const client = useRankMySeoClient();
  const streaming = ref(false);

  async function sendMessage(
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>,
  ) {
    streaming.value = true;
    try {
      return await client.agent.chat(messages);
    } finally {
      streaming.value = false;
    }
  }

  return { sendMessage, streaming };
}

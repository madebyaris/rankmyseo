import { z } from "zod";

export const scanBodySchema = z.object({
  url: z.string().trim().min(1),
});

export const generateMetaBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  targetKeyword: z.string().optional(),
  url: z.string().optional(),
  siteName: z.string().optional(),
});

export const createReportBodySchema = z.object({
  title: z.string().min(1).default("Report"),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const agentChatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().optional(),
        parts: z.array(z.unknown()).optional(),
      }),
    )
    .default([]),
});

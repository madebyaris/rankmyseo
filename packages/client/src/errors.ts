export class RankMySeoApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    options: { code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "RankMySeoApiError";
    this.status = status;
    this.code = options.code;
    this.details = options.details;
  }
}

export function parseApiErrorBody(body: unknown): {
  message: string;
  code?: string;
  details?: unknown;
} {
  if (typeof body === "object" && body !== null && "error" in body) {
    const record = body as {
      error?: unknown;
      code?: unknown;
      details?: unknown;
    };
    return {
      message:
        typeof record.error === "string" ? record.error : "RankMySEO API error",
      code: typeof record.code === "string" ? record.code : undefined,
      details: record.details,
    };
  }
  return { message: "RankMySEO API error" };
}

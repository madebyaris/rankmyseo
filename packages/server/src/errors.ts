export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiSuccessResponse<T> = {
  data: T;
};

export function apiError(
  message: string,
  status: number,
  options: { code?: string; details?: unknown } = {},
): Response {
  const body: ApiErrorResponse = {
    error: message,
    ...(options.code ? { code: options.code } : {}),
    ...(options.details !== undefined ? { details: options.details } : {}),
  };
  return Response.json(body, { status });
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiErrorResponse).error === "string"
  );
}

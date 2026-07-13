export {
  createHandler,
  normalizeBasePath,
  rewriteRequestBasePath,
  stripBasePath,
  readScope,
  type HandlerOptions,
} from "./handler.js";
export type { RequestScope } from "./utils.js";
export type { ApiErrorResponse, ApiSuccessResponse } from "./errors.js";
export { apiError, isApiErrorResponse } from "./errors.js";

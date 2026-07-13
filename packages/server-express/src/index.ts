import { Readable } from "node:stream";
import type { RankStore } from "@rankmyseo/core";
import { createHandler, type HandlerOptions } from "@rankmyseo/server";
import type {
  NextFunction,
  Request as ExpressRequest,
  RequestHandler,
  Response as ExpressResponse,
} from "express";

type WebHandler = (request: Request) => Promise<Response>;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

/** Build an absolute Web `Request` from an Express request. */
export function expressToWebRequest(req: ExpressRequest): Request {
  const protocol =
    typeof req.protocol === "string" && req.protocol.length > 0
      ? req.protocol
      : "http";
  const host = req.get("host") ?? "localhost";
  const pathAndQuery = req.originalUrl || req.url || "/";
  const url = `${protocol}://${host}${pathAndQuery}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else {
      headers.set(key, value);
    }
  }

  const method = (req.method ?? "GET").toUpperCase();
  const init: RequestInit = { method, headers };

  if (method !== "GET" && method !== "HEAD") {
    if (req.readable && !req.readableEnded && !(req as { body?: unknown }).body) {
      init.body = Readable.toWeb(req) as ReadableStream;
      Object.assign(init, { duplex: "half" });
    } else if ((req as { body?: unknown }).body !== undefined) {
      const body = (req as { body: unknown }).body;
      if (typeof body === "string" || body instanceof Uint8Array) {
        init.body = body;
      } else if (Buffer.isBuffer(body)) {
        init.body = new Uint8Array(body);
      } else {
        init.body = JSON.stringify(body);
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
      }
    } else if (req.readable && !req.readableEnded) {
      init.body = Readable.toWeb(req) as ReadableStream;
      Object.assign(init, { duplex: "half" });
    }
  }

  return new Request(url, init);
}

/** Write a Web `Response` onto an Express `res`, streaming the body when present. */
export async function writeWebResponse(
  res: ExpressResponse,
  response: Response,
): Promise<void> {
  res.status(response.status);

  response.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const nodeStream = Readable.fromWeb(
    response.body as import("node:stream/web").ReadableStream,
  );

  await new Promise<void>((resolve, reject) => {
    nodeStream.on("error", reject);
    res.on("error", reject);
    res.on("finish", () => resolve());
    nodeStream.pipe(res);
  });
}

/**
 * Adapt a `(Request) => Promise<Response>` handler to Express middleware.
 * Useful when you already have `createHandler` and want Express mounting.
 */
export function toNodeHandler(webHandler: WebHandler): RequestHandler {
  return (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    void (async () => {
      try {
        const request = expressToWebRequest(req);
        const response = await webHandler(request);
        await writeWebResponse(res, response);
      } catch (error) {
        next(error);
      }
    })();
  };
}

/**
 * Express middleware that mounts the full RankMySEO HTTP API.
 * Pass `basePath` when the public URL is under a subpath (use `req.originalUrl`).
 */
export function createRankMySeoExpress(
  store: RankStore,
  options: HandlerOptions = {},
): RequestHandler {
  return toNodeHandler(createHandler(store, options));
}

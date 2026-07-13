import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  extractPageSignals,
  normalizeHttpUrl,
  runAuditChecks,
  SEO_PAGE_SNAPSHOT_VERSION,
  type SeoPageSnapshot,
} from "@rankmyseo/core";

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  /** When set, only these origins (protocol+host+port) may be fetched. */
  allowedOrigins?: string[];
  userAgent?: string;
  fetchImpl?: typeof fetch;
  /** Skip private-IP blocking (tests only). */
  allowPrivateNetwork?: boolean;
}

export interface SafeFetchResult {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  headers: Headers;
  body: string;
  redirectChain: string[];
  contentType: string | null;
}

export class ScanError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ScanError";
    this.code = code;
  }
}

function originOf(url: URL): string {
  return url.origin;
}

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!v4) return false;
  const a = Number(v4[1]);
  const b = Number(v4[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

async function assertPublicHost(
  url: URL,
  options: SafeFetchOptions,
): Promise<void> {
  if (options.allowPrivateNetwork) return;
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScanError("Only http(s) URLs can be scanned", "INVALID_PROTOCOL");
  }

  const hostname = url.hostname;
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal"
  ) {
    throw new ScanError("Private/local hosts are blocked", "PRIVATE_HOST");
  }

  const addresses: string[] = [];
  if (isIP(hostname)) {
    addresses.push(hostname);
  } else {
    try {
      const records = await lookup(hostname, { all: true, verbatim: true });
      for (const record of records) addresses.push(record.address);
    } catch {
      throw new ScanError(`Could not resolve host ${hostname}`, "DNS_FAILED");
    }
  }

  for (const address of addresses) {
    if (isPrivateIp(address)) {
      throw new ScanError(
        `Host resolves to private address ${address}`,
        "PRIVATE_IP",
      );
    }
  }
}

function assertAllowedOrigin(url: URL, options: SafeFetchOptions): void {
  if (!options.allowedOrigins?.length) return;
  const allowed = new Set(
    options.allowedOrigins.map((o) => originOf(new URL(o))),
  );
  if (!allowed.has(originOf(url))) {
    throw new ScanError(
      `Origin ${url.origin} is not in the allowlist`,
      "ORIGIN_NOT_ALLOWED",
    );
  }
}

async function readBodyLimited(
  response: Response,
  maxBytes: number,
): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new ScanError("Response body exceeds size limit", "BODY_TOO_LARGE");
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        throw new ScanError(
          "Response body exceeds size limit",
          "BODY_TOO_LARGE",
        );
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

/**
 * Fetch a URL with SSRF protections, redirect revalidation, timeout, and body limit.
 * Does not follow redirects automatically — each hop is validated.
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? 1_500_000;
  const maxRedirects = options.maxRedirects ?? 5;
  const fetchImpl = options.fetchImpl ?? fetch;
  const userAgent = options.userAgent ?? "RankMySEO-Scanner/1.0";

  let current = normalizeHttpUrl(rawUrl);
  const redirectChain: string[] = [];
  const deadline = Date.now() + timeoutMs;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    assertAllowedOrigin(current, options);
    await assertPublicHost(current, options);

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new ScanError("Scan timed out", "TIMEOUT");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);

    let response: Response;
    try {
      response = await fetchImpl(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": userAgent,
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new ScanError("Scan timed out", "TIMEOUT");
      }
      throw new ScanError(
        err instanceof Error ? err.message : "Fetch failed",
        "FETCH_FAILED",
      );
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ScanError("Redirect missing Location header", "BAD_REDIRECT");
      }
      if (hop === maxRedirects) {
        throw new ScanError("Too many redirects", "TOO_MANY_REDIRECTS");
      }
      redirectChain.push(current.toString());
      current = new URL(location, current);
      continue;
    }

    const contentType = response.headers.get("content-type");
    if (
      contentType &&
      !/text\/html|application\/xhtml\+xml/i.test(contentType)
    ) {
      throw new ScanError(
        `Unsupported content-type: ${contentType}`,
        "UNSUPPORTED_CONTENT_TYPE",
      );
    }

    const body = await readBodyLimited(response, maxBytes);
    return {
      requestedUrl: normalizeHttpUrl(rawUrl).toString(),
      finalUrl: current.toString(),
      statusCode: response.status,
      headers: response.headers,
      body,
      redirectChain,
      contentType,
    };
  }

  throw new ScanError("Too many redirects", "TOO_MANY_REDIRECTS");
}

export interface ScanPageOptions extends SafeFetchOptions {
  route?: string;
  originLabel?: SeoPageSnapshot["originLabel"];
}

export async function scanPage(
  rawUrl: string,
  options: ScanPageOptions = {},
): Promise<SeoPageSnapshot> {
  const fetched = await safeFetch(rawUrl, options);
  const xRobotsTag = fetched.headers.get("x-robots-tag");
  const signals = extractPageSignals(fetched.body, fetched.finalUrl, {
    xRobotsTag,
  });
  const audit = runAuditChecks(signals);
  const route =
    options.route ??
    (() => {
      try {
        return new URL(fetched.requestedUrl).pathname || "/";
      } catch {
        return "/";
      }
    })();

  return {
    version: SEO_PAGE_SNAPSHOT_VERSION,
    route,
    requestedUrl: fetched.requestedUrl,
    finalUrl: fetched.finalUrl,
    statusCode: fetched.statusCode,
    redirectChain: fetched.redirectChain,
    signals,
    audit: {
      score: audit.score,
      checks: audit.checks,
      engineVersion: audit.engineVersion,
    },
    capturedAt: new Date().toISOString(),
    originLabel: options.originLabel ?? "candidate",
  };
}

export function joinOriginAndRoute(origin: string, route: string): string {
  const base = origin.replace(/\/+$/, "");
  if (!route || route === "/") return `${base}/`;
  return `${base}${route.startsWith("/") ? route : `/${route}`}`;
}

/**
 * Parse a user-entered URL for HTTP fetches. Adds https:// when no scheme is present.
 */
export function normalizeHttpUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new TypeError("URL is required");
  }

  try {
    return new URL(trimmed);
  } catch {
    return new URL(`https://${trimmed.replace(/^\/+/, "")}`);
  }
}

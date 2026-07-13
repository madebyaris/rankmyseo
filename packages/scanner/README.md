# @rankmyseo/scanner

SSRF-safe HTTP page scanner used by RankMySEO `POST /scan` and the SEO regression CLI.

## Install

```bash
npm i @rankmyseo/scanner
```

## Usage

```ts
import { scanPage, safeFetch } from "@rankmyseo/scanner";

const snapshot = await scanPage("https://example.com/", {
  route: "/",
  originLabel: "production",
  allowedOrigins: ["https://example.com"],
  timeoutMs: 10_000,
  maxBytes: 1_500_000,
});
```

By default the scanner blocks private/localhost targets, revalidates redirect hops against an allowlist, and rejects non-HTML / oversized responses. Set `allowPrivateNetwork: true` only in trusted test environments.

## License

Apache-2.0

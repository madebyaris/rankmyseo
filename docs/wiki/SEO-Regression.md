# SEO Regression

Git-aware SEO regression checks compare **production** pages with a pull-request **preview** deployment using explicit file→route mappings.

## Install

```bash
npm i -D @rankmyseo/cli @rankmyseo/scanner
```

`@rankmyseo/scanner` is also used by `POST /scan` for SSRF-safe fetching.

## Configure

In `rankmyseo.config.ts`:

```ts
regression: {
  enabled: true,
  productionUrl: "https://www.example.com",
  alwaysRoutes: ["/"],
  routeMap: [
    { files: ["app/page.tsx", "app/layout.tsx"], routes: ["/"] },
    { files: ["app/about/**"], routes: ["/about"] },
  ],
  failOn: "error", // or "warning"
  timeoutMs: 10_000,
  maxBytes: 1_500_000,
},
```

CI supplies the preview URL. RankMySEO does **not** call Vercel/Netlify APIs.

## CLI

```bash
npx rankmyseo-cli regression check \
  --candidate-url "$PREVIEW_URL" \
  --base-ref "$BASE_SHA" \
  --head-ref "$HEAD_SHA" \
  --json
```

Flags:

| Flag | Meaning |
| --- | --- |
| `--candidate-url` | Preview deployment origin (required) |
| `--base-ref` | Git base (default `origin/main`) |
| `--head-ref` | Git head (default `HEAD`) |
| `--all-routes` | Scan every mapped route, ignore git diff |
| `--config` | Config path |
| `--json` | Machine-readable `SeoRegressionResult` |

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | No gated regressions |
| `1` | Findings at/above `failOn` |
| `2` | Config/network/runtime failure (e.g. preview unavailable) |

## Default gate rules

Only **healthy → unhealthy** transitions fail:

1. Degraded HTTP status
2. Unexpected redirect / final URL mismatch
3. Newly blocked indexability (`noindex`)
4. Canonical removed or changed
5. Title removed
6. JSON-LD invalid or types removed

Improvements and pre-existing failures do **not** fail the gate. Aggregate audit score and Core Web Vitals are not gated.

## GitHub Actions example

```yaml
name: SEO regression
on:
  pull_request:

jobs:
  seo-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm i -D @rankmyseo/cli
      # After your preview deploy step sets PREVIEW_URL:
      - name: SEO regression check
        env:
          PREVIEW_URL: ${{ needs.deploy.outputs.url }}
        run: |
          npx rankmyseo-cli regression check \
            --candidate-url "$PREVIEW_URL" \
            --base-ref "${{ github.event.pull_request.base.sha }}" \
            --head-ref "${{ github.sha }}" \
            --json
```

## Intentional changes

If a PR intentionally removes a title or changes a canonical, either:

1. Update the production deployment first, or
2. Temporarily set `failOn` / remove the route from `routeMap`, or
3. Run report-only (capture JSON without failing CI) until the change is accepted.

## Security

The scanner:

- Blocks private/localhost targets by default
- Revalidates every redirect hop against an origin allowlist
- Enforces timeouts and response size limits
- Accepts HTML content-types only

# API Reference

Base URL depends on your deployment. Demo playground: `http://localhost:3456`.

## Headers

| Header | Required | Description |
| --- | --- | --- |
| `x-tenant-id` | Yes (scoped routes) | Tenant identifier |
| `x-project-id` | Yes (scoped routes) | Project identifier |
| `content-type` | POST/PUT | `application/json` |
| `accept` | Optional | `text/markdown` on `GET /` for markdown negotiation |

## Projects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get project |

## Keywords

| Method | Path | Description |
| --- | --- | --- |
| GET | `/keywords` | List keywords |
| POST | `/keywords` | Create keyword |
| GET | `/keywords/:id` | Get keyword |
| DELETE | `/keywords/:id` | Delete keyword |

**Create body:**

```json
{
  "text": "best seo tools",
  "country": "us",
  "device": "desktop",
  "tags": []
}
```

## Rank snapshots

| Method | Path | Description |
| --- | --- | --- |
| POST | `/snapshots` | Append snapshot (append-only) |
| GET | `/snapshots?keywordId=&from=&to=` | Query by date range |

## Audits

| Method | Path | Description |
| --- | --- | --- |
| POST | `/audits` | Create audit with explicit score/checks |
| GET | `/audits` | List audits |
| GET | `/audits/:id` | Get audit |
| POST | `/collect` | Submit page signals → scored audit (requires `siteFeatures.collector`) |

## Scan & meta

| Method | Path | Description |
| --- | --- | --- |
| POST | `/scan` | Fetch live URL → signals + score + recommendations |
| POST | `/meta/generate` | Generate meta tags from title/content/keyword |

**Scan body:**

```json
{ "url": "https://example.com" }
```

**Meta generate body:**

```json
{
  "title": "How to choose SEO tools",
  "content": "Guide text…",
  "targetKeyword": "seo tools",
  "url": "https://example.com/seo-tools",
  "siteName": "My Site"
}
```

## Blog (requires `siteFeatures.blog: true`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/blog` | List posts |
| POST | `/blog` | Create post (auto meta/slug when omitted) |
| GET | `/blog/:id` | Get post + recommendations |
| PUT | `/blog/:id` | Update post |
| DELETE | `/blog/:id` | Delete post |

Returns **403** when blog is disabled in config.

## Reports

| Method | Path | Description |
| --- | --- | --- |
| POST | `/reports` | Build rollup report |
| GET | `/reports` | List reports |
| GET | `/reports/:id` | Get report |

## Dashboard

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard` | Get widget layout |
| PUT | `/dashboard` | Upsert widget layout |

## Agent

| Method | Path | Description |
| --- | --- | --- |
| POST | `/agent/chat` | Stream agent response (requires `agentModel` in handler) |

## Site features

| Method | Path | Description |
| --- | --- | --- |
| GET | `/sitemap.xml` | Generated sitemap (requires `siteFeatures.sitemap`) |
| GET | `/llms.txt` | Agent-readable site summary |
| GET | `/` | HTML or markdown (Accept negotiation) |

## Audit rules

The audit engine checks:

| Rule ID | Severity | Check |
| --- | --- | --- |
| `title-length` | error | Title 30–60 chars |
| `meta-description` | warning | Description 70–160 chars |
| `canonical` | warning | Canonical URL present |
| `single-h1` | error | Exactly one H1 |
| `og-tags` | info | Open Graph tags |
| `json-ld` | info | JSON-LD schema |
| `cwv-lcp` | warning | LCP ≤ 2.5s |
| `cwv-cls` | warning | CLS ≤ 0.1 |

Score = percentage of passed checks (rounded).

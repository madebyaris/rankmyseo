# API Reference

Base URL depends on your deployment. Demo playground: `http://localhost:3456`.

## Headers

| Header | Required | Description |
| --- | --- | --- |
| `x-tenant-id` | Yes (most routes) | Tenant identifier |
| `x-project-id` | Yes (most routes) | Project identifier |
| `content-type` | POST/PUT | `application/json` |
| `accept` | Optional | `text/markdown` on `GET /` for markdown negotiation |

### Header exemptions

| Route | Scope headers |
| --- | --- |
| `GET /sitemap.xml` | Not required |
| `GET /llms.txt` | Not required |
| `GET /` | Optional (defaults to config tenant/project) |
| All other routes | Required |

Disabled features: collector/blog → **403**; disabled sitemap/llms.txt → **404**.

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
| POST | `/schema/generate` | Generate Schema.org JSON-LD structured data |

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

**Schema generate body** (discriminated on `type`):

```json
{
  "type": "FAQPage",
  "questions": [
    { "question": "What is RankMySEO?", "answer": "An open-source SEO toolkit." }
  ]
}
```

Supported types: `Article`, `Product`, `FAQPage`, `BreadcrumbList`, `Organization`. See [Schema-Generator](./Schema-Generator.md).

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
| GET | `/llms.txt` | Agent-readable site summary (agent-readiness; not an SEO ranking lever) |
| GET | `/` | HTML or markdown (`Accept: text/markdown`) for agent/dev-tool consumption |

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
| `cwv-inp` | warning | INP ≤ 200ms |
| `https` | error | Served over HTTPS |
| `robots-indexable` | error | Not blocked by robots noindex |
| `viewport-meta` | warning | Mobile viewport meta present |
| `lang-attribute` | warning | `<html lang>` declared |
| `heading-structure` | info | At least one H2 |
| `image-alt` | warning | Images have alt text |
| `content-depth` | warning | ≥ 250 words when measured |

Score = percentage of passed checks (rounded). **16 rules** total.

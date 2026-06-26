# Schema Generator

Generate [Schema.org](https://schema.org) JSON-LD for rich search results. RankMySEO ships typed builders for five essential schema types, exposed via the core engine, HTTP API, React hook, dashboard UI, and AI agent.

## Supported types

| Type | Use case |
| --- | --- |
| **Article** | Blog posts, guides, news |
| **Product** | E-commerce product pages |
| **FAQPage** | FAQ sections (FAQ rich results) |
| **BreadcrumbList** | Site navigation breadcrumbs |
| **Organization** | Brand/company entity |

## HTTP API

```http
POST /schema/generate
x-tenant-id: tenant-a
x-project-id: project-1
content-type: application/json
```

**Article example:**

```json
{
  "type": "Article",
  "headline": "How to choose SEO tools",
  "description": "A practical comparison for small teams.",
  "url": "https://example.com/seo-tools",
  "authorName": "Jane Doe",
  "publisherName": "Example Co"
}
```

**FAQPage example:**

```json
{
  "type": "FAQPage",
  "questions": [
    { "question": "What is RankMySEO?", "answer": "An open-source SEO toolkit." }
  ]
}
```

**Response:**

```json
{
  "data": {
    "schema": {
      "type": "FAQPage",
      "jsonLd": { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [] },
      "html": "<script type=\"application/ld+json\">…</script>"
    }
  }
}
```

Invalid input returns **400** with Zod validation details.

## Core API

```ts
import { generateSchema, schemaGeneratorInputSchema } from "@rankmyseo/core";

const schema = generateSchema({
  type: "BreadcrumbList",
  items: [
    { name: "Home", url: "https://example.com" },
    { name: "Blog", url: "https://example.com/blog" },
  ],
});

console.log(schema.html); // paste into <head>
```

## React hook

```tsx
import { useSchemaGenerator } from "@rankmyseo/react";

const { result, generating, generate } = useSchemaGenerator();

await generate({
  type: "Organization",
  name: "RankMySEO",
  url: "https://example.com",
});
```

## Dashboard

Open the reference dashboard (`pnpm dev:dashboard`) → **Schema generator** tab. Pick a type, fill fields, copy JSON-LD or the script tag.

## AI agent

The agent exposes a read-only `generateSchema` tool (and MCP `generate_schema`) using the same Zod input schema.

## Audit integration

Live scans (`POST /scan`) now extract `@type` values from existing JSON-LD blocks into `signals.jsonLdTypes`. The `json-ld` audit check reports detected types (e.g. "JSON-LD present: Article, BreadcrumbList") without changing pass/fail scoring.

## Related

- [API Reference → Schema generate](./API-Reference.md#scan--meta)
- [SEO Playbook](../seo-playbook.md) — structured data parameters

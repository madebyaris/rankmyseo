# Blog Module

The blog module is **opt-in**. Many users won't need content SEO — enable it only when you do.

## Two-step enable

### 1. Turn on the API

```typescript
// rankmyseo.config.ts
siteFeatures: {
  blog: true,
  // …other features
}
```

Without this, all `/blog` routes return **403 Blog module disabled**.

### 2. Add the dashboard widget

```typescript
{
  id: "blog-1",
  type: "BlogManager",
  title: "Blog",
  query: {},
  options: {
    allowCreate: true,
    allowDelete: true,
    allowPublish: true,
    showRecommendations: true,
    showIntent: true,
    showMetaPreview: true,
    labels: {
      addButton: "Add post",
      publish: "Publish",
    },
  },
}
```

Or use the React helper:

```tsx
import { useBlogModule } from "@rankmyseo/react";
import { AddBlogModule } from "@rankmyseo/ui";

function Overview() {
  const { enabled, enable } = useBlogModule();
  if (!enabled) return <AddBlogModule onEnable={() => enable()} />;
  // …
}
```

## Widget options

| Option | Default | Description |
| --- | --- | --- |
| `allowCreate` | `true` | Show new post form |
| `allowDelete` | `true` | Delete button per post |
| `allowPublish` | `true` | Publish/unpublish toggle |
| `showRecommendations` | `true` | Intent + meta recommendations |
| `showIntent` | `true` | Keyword intent selector |
| `showMetaPreview` | `true` | Show generated meta lines |
| `intents` | all four | Limit intent dropdown values |
| `labels` | — | Override UI copy |

Intent values: `informational`, `navigational`, `commercial`, `transactional`.

## Standalone component

Use without the dashboard grid:

```tsx
import "@rankmyseo/ui/styles.css";
import { BlogManager } from "@rankmyseo/ui";

<BlogManager
  title="Content"
  options={{ allowCreate: true, showRecommendations: true }}
/>
```

## Auto meta generation

When creating a post, if `metaTitle` or `metaDescription` are blank, the server generates them via `generateMeta()` from title, content, and target keyword. Slug is derived from title when omitted.

## Recommendations

`GET /blog/:id` returns `{ data: post, recommendations: [...] }`.

Recommendations cover:

- Missing meta title/description
- Target keyword absent from body
- Intent-specific guidance (informational → FAQ schema, transactional → CTA, etc.)

Priorities: `high`, `medium`, `low`.

## Blog post schema

| Field | Description |
| --- | --- |
| `title` | Post title |
| `slug` | URL slug (auto from title) |
| `content` | Body text |
| `targetKeyword` | SEO target phrase |
| `intent` | Search intent enum |
| `metaTitle` / `metaDescription` | Generated or manual |
| `status` | `draft` or `published` |

## Storage

Posts live in `rms_blog_posts` (SQLite). Scoped by `tenantId` + `projectId`.

## Customization without new dependencies

All blog UI uses `@rankmyseo/ui/styles.css` — override `--rms-primary`, `--rms-radius`, etc. on `.rms-root`. No Tailwind or shadcn install required in consumer projects.

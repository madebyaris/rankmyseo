# Dashboard and Widgets

RankMySEO dashboards are **data-driven**: widget layouts are stored in SQLite and fetched via `GET /dashboard`. Render them with `@rankmyseo/ui`.

## Quick setup

```tsx
import "@rankmyseo/ui/styles.css";
import { RankMySeoProvider, createRankMySeoClient } from "@rankmyseo/react";
import { DashboardRenderer } from "@rankmyseo/ui";

const client = createRankMySeoClient({
  baseUrl: "https://api.example.com",
  tenantId: "tenant-a",
  projectId: "project-1",
});

function Dashboard() {
  const { config, loading } = useDashboardConfig();
  if (loading || !config) return null;
  return <DashboardRenderer widgets={config.widgets} />;
}
```

## Built-in widgets

| Type | Component | Data source |
| --- | --- | --- |
| `KeywordTable` | Tracked keywords table | `useKeywords` |
| `RankHistoryChart` | Rank over time (Recharts) | `useRankTracker` |
| `AuditScoreCard` | Latest audit score | `useAudit` |
| `TopMoversList` | Report top movers | `useReport` |
| `CoreWebVitalsGauge` | CWV gauge | widget query |
| `BlogManager` | Optional blog CRUD | `useBlog` |

## Widget schema

```typescript
{
  id: "unique-id",
  type: "KeywordTable",
  title: "Tracked keywords",
  query: {},      // widget-specific filters
  options: {},    // display/behavior overrides
  layout: { x: 0, y: 0, w: 2, h: 1 }  // optional grid hint
}
```

Update via `PUT /dashboard`:

```bash
curl -X PUT http://localhost:3456/dashboard \
  -H "x-tenant-id: tenant-a" \
  -H "x-project-id: project-1" \
  -H "content-type: application/json" \
  -d '{"widgets":[{"id":"w1","type":"KeywordTable","title":"Keywords","query":{},"options":{}}]}'
```

## Styling (no Tailwind/shadcn in your app)

`@rankmyseo/ui` ships **custom CSS** with shadcn-like aesthetics. Import once:

```tsx
import "@rankmyseo/ui/styles.css";
```

Customize via CSS variables on `.rms-root`:

```css
.rms-root {
  --rms-primary: #4f46e5;
  --rms-primary-fg: #ffffff;
  --rms-radius: 10px;
  --rms-border: #e2e8f0;
  --rms-muted-fg: #64748b;
}
```

Available classes: `.rms-card`, `.rms-btn`, `.rms-input`, `.rms-badge`, `.rms-table`, `.rms-empty`, etc.

## React hooks for custom dashboards

If you build your own UI instead of widgets:

| Hook | Purpose |
| --- | --- |
| `useDashboardConfig` | Read/update widget layout |
| `useKeywords` | Keyword CRUD |
| `useRankTracker` | Snapshot history |
| `useAudit` | Audit list/create |
| `useReport` | Report generation |
| `useScan` | Live URL scan |
| `useMetaGenerator` | Meta tag generation |
| `useBlogModule` | Enable/disable blog widget |
| `useRankMySeoChat` | Agent streaming chat |

## Reference dashboard app

`apps/dashboard` is a demo shell (uses shadcn/Tailwind locally for navigation chrome only). Library widgets render via `@rankmyseo/ui` CSS.

Run:

```bash
pnpm dev:playground   # terminal 1
pnpm dev:dashboard    # terminal 2
```

See also: [[Blog-Module]] for the optional blog widget.

---
"@rankmyseo/server": minor
"@rankmyseo/server-hono": minor
"@rankmyseo/storage": minor
"@rankmyseo/scanner": minor
"@rankmyseo/agent": minor
"@rankmyseo/datasource": minor
"@rankmyseo/scheduler": minor
---

Make backend packages portable on generic Node by removing the Next-specific `server-only` runtime guard, add `basePath` mounting for `createHandler`, and lazy-load scanner/agent on demand.

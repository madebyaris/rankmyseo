# Senior practices — quick checklist

Reuse between sessions; copy into notes when tracking a longer guidance arc.

## Intake

- [ ] Record exact framework/runtime/library versions from manifests
- [ ] Name the specific decision (not "make it better")
- [ ] Scan 2–3 existing repo examples of the same problem
- [ ] Check style governance: match vs improve vs follow-up slice

## Source tiers

| Tier | Examples | Trust for |
| --- | --- | --- |
| T1 | Official docs, RFCs, release notes, CVE/advisories | APIs, defaults, deprecations |
| T2 | Maintainer/platform engineering guides (version-matched) | Endorsed patterns |
| T3 | Corroborated senior content aligned with T1/T2 | Tradeoffs, ops wisdom |
| Reject | Random tutorials, unversioned SO answers | — |

## Retrieval passes

| Pass | Intent | Done when |
| --- | --- | --- |
| 1 | T1 anchor per decision | Each point has version-matched official source |
| 2 | Deprecation / security scan | Breaking or unsafe paths flagged |
| 3 | T2/T3 only if T1 silent | One corroborating source max per gap |
| 4 | Reconcile with repo | Apply-now vs follow-up split is explicit |

## Recommendation ledger (minimum)

| Recommendation | Tier | Source inspected | Apply now / follow-up | Verification |
| --- | --- | --- | --- | --- |

## Reconcile checklist

- [ ] Matches file being edited unless improvement is in scope
- [ ] Uses existing project libs/utilities where present
- [ ] No mass refactor of unrelated modules
- [ ] Verification command named for apply-now items

## Stop rule

Stop when T1 answers the decision and repo reconciliation is done. Do not keep searching for confirming blog posts.

## Hand-off capsule (optional)

```
Stack versions:
Sources (T1 first):
Apply now:
Follow-up plan:
Open risks:
```

Strip empty sections instead of filler.

---
name: senior-practices
description: >-
  Version-pinned coding and framework best practices from official docs and
  corroborated senior/maintainer guidance — use for unfamiliar stacks, upgrades,
  migrations, architecture reviews, "best practice" questions, or before
  introducing a new pattern when style governance says improve might be warranted.
---

# Senior practices skill

Companion to `.cursor/rules/composer-senior-practices.mdc`. Load when external, **current** guidance is needed — not when matching an obvious local pattern suffices.

For multi-vendor audits or contradictory literature, pair with [deep-research](../deep-research/SKILL.md). For applying findings without scope creep, follow [composer-coding-excellence](../../rules/composer-coding-excellence.mdc) § Style governance.

See [reference.md](reference.md) for compact repeatable checklists.

## Operating stance

Training data is a hypothesis until anchored to **this repo's versions** and **T1 sources**. Prefer falsification: check deprecations, breaking changes, and "do not use" guidance before recommending a pattern.

Do not imitate private chain-of-thought. Make the work **inspectable**: version inventory, source list, reconciled recommendations, and apply-now vs follow-up split.

## Phase A — Inventory (this repo)

1. Read manifests: `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `Gemfile`, etc.
2. Record **exact** versions of the framework, runtime, and relevant libraries.
3. Note existing project standards: eslint/prettier, ADRs, README, CI config.
4. Scan how similar problems are already solved **in this codebase** (2–3 examples).

If versions cannot be determined, say so and label recommendations **[H]** until anchored.

## Phase B — Anchor (T1 primary)

For each decision point:

1. Open **official docs** keyed to the pinned version (not "latest" unless the repo tracks latest).
2. Read release notes / migration guides for the version span in use.
3. Check security advisories when the change touches auth, crypto, input, or dependencies.

Draft a short coverage note: what T1 says, what is deprecated, what the repo currently does.

## Phase C — Corroborate (T2/T3, sparingly)

Add T2/T3 sources **only when T1 is silent** on the specific decision:

- Platform owner guides (Vercel, Cloudflare, etc.) matched to deployment target.
- Maintainer conference talks or engineering blogs **when** they align with T1 or include reproducible examples.

Log contradictions; do not pick the blog over the official doc without explaining why.

## Phase D — Reconcile (this repo wins constraints)

Map external guidance to local reality:

| Check | Question |
| --- | --- |
| Style governance | Match file style, or is improvement explicitly in scope? |
| Dependencies | Does the repo already have a library for this? |
| Blast radius | Can this be one vertical slice? |
| Tests | What verification exists or is needed? |

Split output:

- **Apply now** — fits current task and minimal diff.
- **Follow-up plan** — style/tech-debt; cite paths; do not implement unprompted.

## Phase E — Deliver

Use this shape (omit empty sections):

```
## Context
- Stack + versions:
- Question:

## Sources inspected
| Tier | Source | What it established |
| --- | --- | --- |

## Recommendations
1. [P/T1] … — apply now | follow-up
2. …

## Reconcile with this repo
- Existing patterns to follow:
- Conflicts with local style (if any):

## Verification
- Command or check | expected result
```

Tag confidence when helpful: **[P]** primary, **[S]** synthesized, **[H]** hypothesis.

## Anti-patterns

- Recommending "latest best practice" without checking pinned versions.
- Citing tutorials that contradict official docs.
- Drive-by refactors across unrelated files.
- Adding dependencies when the repo already has an equivalent.
- Skipping how the codebase already solves the problem.

## When to escalate

- Legal, compliance, or org-specific policy not in public docs — flag **blocked** and name what human input is needed.
- Irreconcilable T1 vs repo constraint — present options with blast radius; do not silently override ADRs or lint rules.

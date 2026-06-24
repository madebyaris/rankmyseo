---
name: deep-research
description: >-
  Iterative multi-source investigation with contradiction logging—use for audits,
  vendor comparisons, security posture reviews, benchmarking methodology,
  literature surveys, ambiguous technical history, regulated domains, unfamiliar
  APIs, architectural landscape scans, falsifiable claims needing citations,
  stakeholder briefings where evidence tiers matter more than narration.
---

# Deep research skill

Companion to `.cursor/rules/composer-deep-research.mdc`; load this when retrieval depth exceeds quick-rule ergonomics (more than a few independent sources, contradictory docs, benchmarking, compliance or security narratives).

For wide **codebase** surveys, pair this skill's claim ledger with the built-in Explore subagent or [composer-orchestration](.cursor/rules/composer-orchestration.mdc) — keep raw search noise out of the parent thread.

See [reference.md](reference.md) for compact repeatable checklists.

## Operating stance

Assume initial answers are hypotheses until corroborated. Prioritise falsification (finding counter-evidence or version skew) ahead of reinforcing comfortable narratives.

Do not imitate private chain-of-thought. Make the research **inspectable** through compact artifacts: a plan, a claim ledger, a contradiction log, and a confidence-bearing conclusion.

## Phase A — Clarify investigative goal

Produce internally (surface only if ambiguity blocks progress):

| Facet | Pin down |
| --- | --- |
| Question type | Comparative, diagnostic, explanatory, procedural, forecasting (each steers retrieval) |
| Decision utility | Actionable takeaway vs exploratory survey |
| Time/version window | Freeze target stack release or cutoff date explicitly |
| Non-goals | Exclusions narrowing scope creep |
| Success signal | Acceptance evidence that would persuade a sceptical reviewer |

Avoid expanding scope preemptively unless the user requests a landscape survey.

When the task is deep or high-stakes, surface a brief research plan before the final synthesis:

```
Research plan:
- Scope:
- Primary anchors:
- Counter-evidence pass:
- Stop condition:
```

## Phase B — Retrieval passes (iterate two to four times typical)

Structure passes deliberately.

### Pass 1 — Primary anchors

- Official docs and readmes keyed to version.
- Specs, RFCs, or issue trackers for definitive semantics.
- Security advisories, changelogs, and CVE metadata feeding risk statements.

Draft a coverage matrix: sub-questions by anchors still missing.

### Pass 2 — Corroboration / tension surfacing

- Independent second primary (vendor-neutral when bias risk is high).
- Measurements reproduced or methodology copied when benchmarking.
- Identify first divergence timelines (when guidance split).
- Search for negative evidence: deprecations, security advisories, failed migrations, benchmark critiques, issue tracker regressions, and “do not use” guidance.

### Pass 3 — Noise reduction

Shrink query terms using discovered identifiers; discard redundant echoes of the same tertiary source.

### Pass 4 — Residual uncertainty audit

Enumerate remaining unknowns and classify each as:

- unblockable empirically (needs lab repro), or
- epistemic fog (forecast or opinion tiers).

Stop further retrieval when marginal novelty drops; summarise instead.

### Contradiction log (mandatory mini-artefact)

Rows: Topic, Claim A with source and timestamp, Claim B, resolution leaning, confidence, verification step.

Surface contradictions in a dedicated subsection in long answers; do not bury them in narrative only.

### Claim ledger (mandatory for recommendations)

Track the claims that drive the conclusion:

| Claim | Evidence tier | Source(s) inspected | Counter-check | Confidence |
| --- | --- | --- | --- | --- |

Every strong recommendation should map to at least one ledger row. If it does not, downgrade it to a hypothesis or remove it.

## Phase C — Synthesis

Mirror the Composer deep-research rule output order plus:

### Confidence tagging

Annotate bullets with:

- **[P]** primary-established
- **[S]** synthesized from coherent moderate sources (two or more)
- **[H]** hypothesis or weakly evidenced
- **[A]** anecdotal corroboration only

### Anti-patterns to avoid

- Authority laundering from blogs citing unspecified officials.
- Version smear collapse mixing incompatible majors without signalling.
- Relying on changelog titles alone for behavioural breaking-change claims.
- Citation padding: adding links that do not directly support the sentence they accompany.
- Benchmark laundering: comparing numbers without hardware, version, dataset, flags, warmup, and variance context.

### Edge classes needing humility

Pricing rumours, unpublished roadmaps, unreleased internals, regulatory extrapolation—use scenario ranges, not asserted certainties unless codified externally.

### Large corpora caveat

Summarise ingestion limits; cite inspected segments only; propose honest sampling expansions.

## Phase D — Verification offer

Deliver repeatable checks:

- Minimal repro commands or scripts.
- API sketches with placeholders for secrets where needed.
- Cross-check metrics semantics.
- Diagnostics that isolate competing hypotheses.

If the environment blocks reproduction, label work `blocked` or downgrade certainty—do not phantom-run invisible checks.

## When to escalate to a human

Legal or policy-privileged judgement, privileged incident facts, biometric or highly sensitive identifiers—defer with intake needs rather than improvising authoritative positions.

## Hand-off capsule (optional closing)

Reuse when helpful:

```
Findings summary: ...
Assumptions: ...
Confidence mix (P/S/H/A): ...
Unresolved conflicts: ...
Next evidence steps: ...
Risks if proceeding blindly: ...
```

Strip empty sections instead of filler.

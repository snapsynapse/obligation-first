---
title: Provenance, extensions, and conformance
status: accepted-direction
decision_date: 2026-08-04
implementation_target: v0.6.0 candidate
current_contract_impact: none
---

# Provenance, extensions, and conformance

## Scope

This record resolves the direction for D12 and D13, plus semantic-review items 3, 24, 26, and 29.

## Decision

1. The shared core carries provenance used by multiple adopters: source citation, source locator, source URL, source version, language, evidence type, verification or retrieval date, and the asserting adopter where applicable.
2. Domain-specific metadata stays in a named extension context. EveryAILaw risk tiers, search terms, editorial tags, and evidence-workflow details do not enter the shared core unless another adopter demonstrates the same semantics.
3. Adopters must map local keys through an explicit second context. Unmapped keys that would expand through the current `@vocab` receive a namespace-hygiene warning. Removing the default vocabulary remains a v2 breaking-change question.
4. Category metadata remains on ObligationCategory. `implemented_by_terms` is not emitted when it merely duplicates `created_by`; an inverse is asserted only when it has an independently defined contract.
5. Conformance includes record shape, graph coherence, naming-profile fidelity, publication-surface parity, and versioned semantics. Per-record JSON Schema success is necessary but insufficient.
6. Graph checks cover `hasTerm` and `parent_instrument`, `creates` and grounding relations, authority relations, category classification, anchors and constraints, amendment and replacement relations, Determination joins, and acyclicity of defeasibility relations.
7. Aggregate, per-record, companion, deprecated, and tombstone surfaces are all in validation scope. Unknown, absent, false, stale, and unresolved values remain distinct in reports.
8. Naming-profile templates are tested against every emitted record type and deprecated path the adopter advertises. Cross-host targets are validated against both the declared pattern and resolvability when the federation suite has the target corpus.
9. Every validation report identifies the exact Obligation-First version and, for unreleased local validation, the source commit and dirty-state flag. A dirty sibling checkout cannot silently redefine conformance.
10. Conformance levels are versioned. A pre-1.0 change that makes a conforming adopter non-conforming requires a minor release, an explicit conformance-break notice, and a migration fixture. The same change is major after v1.0.
11. For non-EU instrument joins, the first real cross-adopter US or Canadian join triggers a bounded citation-normalization trial before adopting a universal identifier requirement.

## Compatibility direction

- v0.5 record validation remains available as a named legacy profile during the v0.6 migration window.
- Additive shared provenance fields do not require current records to invent unavailable values.
- Warnings become errors only in the new versioned profile and only with a published migration.
- Extension data remains portable JSON-LD through its declared context without being misrepresented as Obligation-First vocabulary.

## Acceptance fixtures

- A record passes JSON Schema but fails graph validation when its issuer, category, or inverse edge is false.
- A deprecated record is validated even when omitted from the aggregate collection.
- A local adopter report states `0.6.0-candidate`, source commit, and dirty state.
- EveryAILaw retains risk tier and evidence workflow metadata in its own extension while shared citations remain queryable across all adopters.
- A three-node `defeats` cycle fails even though no pair forms an immediate two-node cycle.

## Adopter impact

- EveryAILaw gains a documented extension boundary and must report exact source, index, evidence, and generated-output coverage.
- PubLedge retains temporal and publication provenance while scheduled checks guard date-driven drift.
- AI Incident Law keeps court and source provenance in its native model while shared proceeding edges receive graph-level checks.

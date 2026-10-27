# Lifecycle relationship checks

Scope: Obligation-First repository tooling for [issue 6](https://github.com/snapsynapse/obligation-first/issues/6), with a bounded production-evidence assessment for [issue 4](https://github.com/snapsynapse/obligation-first/issues/4). Prepared locally on 2026-10-26 against main `755fa601e9a26df5dcc6e75f19337e5e2aa3056c`. This is a candidate tooling policy, not a schema release or source-admission decision.

## Relationship agreement

`scripts/check-entity-agreement.mjs` compares `supersedes`, `wouldSupersede`, `repeals` and Instrument-level `amends` between Instruments joined by explicit `describesSameEntityAs` assertions. Existing scalar comparisons remain unchanged.

Target sets compare by exact IRI or by connected components of declared Instrument correspondence among loaded records. Declaration direction and target order do not affect equality. Correspondence is used only for target comparison. It does not merge record properties, replace identifiers, assert `sameAs`, or infer legal effect. Titles, similar URLs and `sameAs` are not used to discover correspondence.

Both sides must assert nonempty target sets, and every target must resolve to an Instrument. Missing assertions, empty sets and unresolved or wrongly typed targets are reported in each pair's `unknown_relations`, with a reason. They are not equality or an assertion that no relationship exists. Malformed target values fail. Schema and graph validation remain necessary companion checks.

Comparable assertions appear in each pair's `compared_relations`, including original target values and `equal`. Distinct loaded target IRIs without declared correspondence remain different assertions. A failure requires review of the targets and correspondence evidence; it does not prove that the underlying legal entities differ.

Required-pair configuration accepts an optional `relations` array drawn from these four predicates. A pair must require at least one supported scalar field or relation. Existing configurations using `fields` remain valid. Requiring a relation makes missing assertions or unresolved targets fail with `OF-ENTITY-REQUIRED-RELATION`; a differing comparable target set fails independently of whether the relation is required. Scalar `counts` retain their existing meaning; relation coverage is reported separately within each pair.

## Warning and failure policy

| Condition | Diagnostic | Outcome |
|---|---|---|
| Both corresponding Instruments assert a relation, but their resolved target sets differ | `OF-ENTITY-RELATION-CONFLICT` | Fail |
| Corresponding Instruments explicitly assert replacement versus pure repeal of a corresponding target | `OF-ENTITY-RELATION-KIND` | Fail |
| A compared relation contains malformed target values | `OF-ENTITY-RELATION-SHAPE` | Fail |
| A required relation cannot be compared | `OF-ENTITY-REQUIRED-RELATION` | Fail |
| A relation targets its own source IRI | `OF-RELATION-SELF` | Fail |
| A draft or proposed Instrument asserts post-enactment `supersedes` | `OF-RELATION-STAGE` | Fail |
| One Instrument both replaces and purely repeals the same target IRI | `OF-RELATION-KIND-CONFLICT` | Fail |
| A known predecessor lifecycle differs from `superseded` for replacement, or `repealed` for pure repeal | `OF-LIFECYCLE-REVIEW` | Warn; source-owner review required |
| Predecessor lifecycle is absent or explicitly unknown | No inferred disposition | Preserve uncertainty |
| Optional relationship assertion or target resolution is missing | Pair-level unknown reason | Report; require explicitly where coverage is mandatory |

Warnings are returned in the report's `warnings` array and do not change the CLI exit code. Conflicts and missing required coverage use exit 1. These are entity-agreement checks, invoked by federation; this candidate does not add new rules to the shared graph validator.

The predecessor warning implements the existing protocol's recommended lifecycle reconciliation without turning it into an automatic legal conclusion. It cannot choose commencement dates, savings clauses, historical operation, enforcement or child-Term effects. A future-effective successor's enactment does not establish when every predecessor duty ceased. Partial `amends` does not require whole-Instrument retirement.

The current graph validator rejects `wouldSupersede` on an enacted record. The protocol permits retaining the historical assertion for audit. This candidate preserves that existing validator policy: transition fixtures remove `wouldSupersede` from the current record when adding `supersedes`; historical snapshots remain separate. It does not resolve that broader protocol/validator compatibility question.

## Issue 4 production-evidence assessment

The existing [F14 decision](F14-contract-decision-2026-09-05.md) requires a second owner's real record, consumer operation and failing production round trip before a normative qualified-date extension. Synthetic sidecars cannot meet that threshold.

Fetched default branches were inspected read-only on 2026-10-26:

| Owner and revision | Inspected production surface | Bounded finding |
|---|---|---|
| EveryAILaw `0f8c1f776dd464b275cb78ef6a1ebb2f42d96b21` | `data/_schema.md`, parser, OF exporter, build, verification prompt and tracked `data/` | Parser/build support native fallback dates and amendment metadata; OF carries `eal:amendment_status` and scalar dates. Exact-field search found definitions and implementation references, but no active tracked data instance of `amendment_status` or `effective_if_unamended`. Historical adopter evidence remains historical. |
| PubLedge `2475ff6d974d2da6982f194c58e43f8dec90883a` | Tracked `data/` and `scripts/`, OF exporter and temporal-status checks | Existing native `amends` examples and scalar export/status checks exist. Search found no `effective_if_unamended`, `amendment_status` or `wouldAmend` production mapping. |
| AI Incident Law `b1e56d4a87f0a52d36af86c0f73e60136a2fe7ec` | Tracked `data/` and `scripts/` | Search found none of those contingent-amendment fields or relations. No second-owner production round-trip failure was demonstrated. |

Search terms were `effective_if_unamended`, `amendment_status`, `wouldAmend`, `wouldSupersede` and native `amends` declarations. This is a bounded implementation assessment, not proof that no equivalent representation or future use case exists. EveryAILaw's local checkout was four dependency commits behind its fetched main; inspection used the fetched tree. Its projection and the inspected parser/export/build paths had no differences across those four commits. PubLedge's existing unpushed dependency commit was preserved; assessment used its fetched main.

The second-owner threshold remains unmet by this assessment. Keep issue 4 open. Do not introduce `wouldAmend`, qualified production dates or a serializer from synthetic examples. Existing `amends` plus independent lifecycle is structurally valid for proposed and enacted Instrument fixtures; that proves expressibility of stage, not production round-trip sufficiency or commencement semantics.

The next admissible schema proposal must provide a real second-owner record and source evidence, the consumer question that loses a necessary distinction, a failing export/round-trip reproduction, expected/fallback conditions with evidence and as-of, and migration/unknown behavior reviewed with both owners. Source review and any schema/release decision remain separate.

## Verification and remaining issue 6 work

`scripts/test-lifecycle-relations.mjs`, included in the existing hardening gate, exercises target retargeting with identical scalar states, target order, correspondence direction and components, missing/unresolved/malformed targets, required relation coverage, replacement versus pure repeal, proposed-to-enacted transition, reversed direction, inconsistent predecessor labels, partial amendment stages and unchanged unknown operation/enforcement. All facts are synthetic and use `example.com` identifiers.

The full local `npm test` gate passed after the implementation. A separate read-only comparison of 1,088 local adopter projection records found two resolved correspondence pairs, six comparable scalar assertions, one comparable relationship and seven unknown relationship comparisons, with no conflicts. Two Colorado predecessor lifecycle warnings surfaced, one per owner. This is local projection evidence, not a full federation run, hosted-byte verification, legal currentness check or source-history resolution.

Keep issue 6 open for source-owner review and admission of the predecessor disposition and any still-unknown operative/enforcement history. The warning identifies that work without changing source records or human dates. The original Colorado snapshot and evolution companion remain unchanged. Neither issue has been commented on or closed by this local candidate.

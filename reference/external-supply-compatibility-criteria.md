# External-supply compatibility criteria

Status: planning criteria, 2026-10-11. Not a schema, vocabulary, naming-profile or release change. No external source has been selected, examined or approved by this record.

## Purpose and authority

The PAICE Foundation 2026-09-22 Legal Graph decision keeps the graph as core undertaking for its validation value, and states that core status does not justify maintaining scope that others already serve. Foundation compares concrete Legal Graph data and capabilities with legitimate external supply. This record is the Obligation-First input to that comparison: the criteria a proposed external source must meet before it can replace, or be ingested alongside, an adopter's native records without losing the meaning the shared contract preserves.

Authority boundaries:

- Foundation owns the comparison and any portfolio disposition.
- EveryAILaw, AI Incident Law and PubLedge own source admission, legal meaning, currentness and any decision to stop maintaining their own scope.
- Obligation-First owns the shared vocabulary, crosswalks and validation contract. It does not centralize adopter data and does not judge whether a source is legally correct.

The criteria reuse the existing crosswalks ([gist](crosswalks/gist.md), [LegalRuleML](crosswalks/legalruleml.md), [Akoma Ntoso](crosswalks/akomantoso.md), [ELI/ECLI](crosswalks/eli-ecli.md)), the [IRI and crosswalk decision](iri-naming-and-crosswalks.md) and the five [v0.6 decision records](decisions/README.md). A terminology difference between a source and Obligation-First is not by itself a gap or a reason to keep native scope. A gap exists only where the shared contract or an existing crosswalk cannot carry a fact that a named consumer task needs.

## How to apply the criteria

Assess one candidate source against one named consumer task at a time. A source can be adequate for one task (for example, locating the official text of an EU regulation) and inadequate for another (for example, reporting which Obligations a court treated as applicable).

For each pair, record:

1. The consumer task, stated as a finite question, and the record types and relations it traverses.
2. The candidate source, its access method, the evaluated snapshot and the date observed.
3. A result for each criterion below: `meets`, `meets-with-crosswalk`, `partial`, `fails` or `unknown`. `unknown` is a valid result and must not be reported as `meets`.
4. The fields that must remain native to the adopter for this task.
5. The outcome: `replace` (the adopter can stop maintaining the scope for this task), `ingest-as-crosswalk` (the source becomes the identifier or text authority while adopter records persist), `keep-native`, or `unresolved`.

A `replace` outcome requires every criterion to be `meets` or `meets-with-crosswalk` for the task, and a passing bounded fixture (see "Bounded fixture evaluation"). Any `fails` on C2 or C3 blocks `replace` regardless of the other results.

## Criteria

### C1. Identifiers

Requirement: the source provides stable, documented identifiers at the granularity the task needs, and those identifiers can ride as typed crosswalks without becoming the Obligation-First `@id`.

Contract anchors: adopter `@id` values are local, opaque and permanent ([identity and classification](decisions/identity-and-classification.md)). Standard identifiers ride in typed fields: `eli_uri` on Instruments, `ecli_uri` and `neutral_citation` on Proceedings and Determinations, `akn_uri` on Terms, `citation` on Instruments and Proceedings, and `sameAs` for external canonical URLs. `owl:sameAs` is reserved for genuine identity; `describesSameEntityAs` records correspondence between records about the same external entity.

Tests:

- Identifier persistence: the source documents a permanence or retirement policy, or the evaluated snapshot shows stable identifiers across at least two observations.
- Granularity: the identifier reaches the level the task needs (Instrument, provision, decision or matter). An Instrument-level identifier does not meet a provision-level task.
- Level: the identifier names the same kind of thing as the receiving field. A decision identifier is not a matter identifier; a document identifier is not a provision identifier.
- Join safety: two adopters carrying the same source identifier can join through the crosswalk field without asserting `sameAs`. A shared URL never creates identity (ROADMAP OF-1).

### C2. Source, time and authority semantics

Requirement: the source preserves who issued or decided something, what text is authoritative, and when each state held, at least as precisely as the adopter record it would replace.

Contract anchors: [authority, source text, and legal scope](decisions/authority-text-and-scope.md) and [normative force and lifecycle](decisions/normative-force-and-lifecycle.md).

Tests:

- Issuance versus adjudication: the source distinguishes the Authority that issued an Instrument (`issuedBy`) from the forum that heard a Proceeding (`heardBy`), and adjudicative Determinations (AI Incident Law) from administrative issuance Determinations (PubLedge). A source that lists a court as "authority" for the statute it applied, or a regulator as "issuer" of an enforcement matter without separating the deciding act, fails this test for any task that traverses those relations.
- Multiple issuers: joint issuance (for example, Parliament and Council) remains two Authorities, not one composite.
- Exact text versus summary: the source states whether its text is the official text, a consolidated text, an unofficial copy or an editorial summary. Obligation-First `Term.text` accepts only source-faithful text; paraphrase goes to `summary`.
- Separate axes: normative force, lifecycle, operative status and enforcement status remain separate. A single "status: in force" field does not meet a task that needs Term-level operative or enforcement state.
- Point in time: dated facts (enactment, effective, full enforcement, sunset, decision date) are source assertions with their own dates. Computed present-state values carry an explicit as-of date. A source that reports current status without an as-of date can be `partial` at best.
- Relations between versions: `amends`, `supersedes`, `repeals`, `vacates` and `constrains` keep their direction and level. A source that records only "replaced" or "changed" without direction or level fails for tasks that traverse these relations.

### C3. Licensing and reuse terms

Requirement: the adopter can lawfully store, transform and redistribute what the task needs, under terms compatible with the adopter's publication and with Obligation-First's CC BY 4.0 reference material and Apache 2.0 code.

Contract anchors: none in the record schema (see gap G1). [Authority, source text, and legal scope](decisions/authority-text-and-scope.md) already requires an adopter that cannot distribute full text to omit `text` and publish a summary.

Tests:

- The license or reuse terms are identified by a citable document, with the date observed. Absence of a stated license is `unknown`, not permission.
- Redistribution: the terms permit the adopter's actual surfaces (static JSON, per-record pages, MCP or API responses, bulk download).
- Attribution and share-alike: required attribution can be carried on each derived record, and share-alike terms do not conflict with the adopter's existing license.
- Text versus metadata: terms are assessed separately for full text, metadata and identifiers. Many sources license these differently.
- Access constraints: rate limits, authentication, terms of service and paid tiers are recorded. A source usable only under a paid or personal-use license fails for a public adopter task.

Licensing judgment belongs to the adopter and, where needed, counsel. These criteria record the evidence; they do not decide legal permissibility.

### C4. Versioning and change signaling

Requirement: the adopter can tell which version of the source a record reflects and detect when the source changes.

Contract anchors: shared provenance fields `source`, `source_citation`, `source_locator`, `source_version`, `language`, `evidence_type`, `retrieved`, `verified` and `asserted_by_adopter` ([provenance, extensions, and conformance](decisions/provenance-extensions-and-conformance.md)). Validation reports identify the exact Obligation-First version and source commit.

Tests:

- The source exposes a version, consolidation date, expression date or content hash that can populate `source_version` without invention.
- Changes are signaled (change feed, dated release, modified date, or deterministic snapshot) so drift is detectable by an adopter check rather than by rereading everything.
- Retracted, corrected or withdrawn items remain identifiable. Silent deletion fails for tasks that rely on historical state, because Obligation-First retirement uses Tombstones and queryable successors.
- The source's own schema or API versioning is documented, so an adapter can pin it.

### C5. Uncertainty and unknowns

Requirement: the source does not strengthen meaning. Missing, unknown, contested and not-applicable states stay distinguishable from false, absent or routine.

Contract anchors: the `unknown` values on lifecycle, operative, enforcement and normative-force enums; [consumer answer contract](consumer-answer-contract.md) rules against asserted applicability, promoted drafts, widened scope and defaulted deontic class; [term boundary checks](term-boundary-checks.md) date-precision handling; [qualified-time fixture v1](contracts/qualified-time-fixture-v1.md) expected and fallback branches.

Tests:

- Unknown is representable and is not coerced to a default (for example, every duty defaulted to a Requirement, or every proceeding to "decided").
- Date precision is preserved. A year or month is never completed with an invented day.
- Drafts, proposals and pending matters keep that state after ingestion.
- Allegations remain assertions until a Determination decides them. A source that records claims as findings fails for proceeding tasks.
- Disputed or conflicting sources can be reported as conflicted rather than merged.

### C6. Deontic and normative content

Requirement: where the task needs Obligations, not only source documents, the source supplies or supports the extraction of duty, duty holder, beneficiary, deontic class, conditions and grounding without collapsing them.

Contract anchors: [actors and deontic grounding](decisions/actors-and-deontic-grounding.md); LegalRuleML alignment for Requirement, Restriction, Permission and Reparation and for `defeats`, `rebuts` and `undercuts`; gist bindings for the deontic quartet.

Tests:

- Deontic class is grounded in a cited Term or Determination, not inferred from topic.
- Exceptions and conditions are separate records or explicit conditions, not lost in prose.
- Duty holders are typed Parties or role references, distinct from applicability prose.
- Reparations carry their violation and trigger relations.

Most document-level sources (statute text, case law, gazettes) are expected to be `partial` or `fails` here. That result is the finding, not a defect of the source: it locates the residual work that external supply does not replace.

### C7. Adopter-specific fields

Requirement: the comparison names which adopter fields the task needs and whether any external source supplies them.

Contract anchors: domain-specific metadata stays in named adopter extension contexts ([provenance, extensions, and conformance](decisions/provenance-extensions-and-conformance.md)); adopter naming profiles govern each adopter's IRIs.

Fields that the shared contract deliberately leaves native include EveryAILaw risk tiers, search terms, editorial tags and evidence-workflow state; adopter admission status and unresolved source-review questions (read by the consumer answer contract); PubLedge co-signers, regulated parties and negotiated re-allocation; AI Incident Law matter classification and admission criteria; and each adopter's naming profile and Tombstones.

Tests:

- For each native field the task traverses, record whether the source supplies an equivalent, a lossy equivalent or nothing.
- An external source that supplies text and identifiers but none of the native fields a task needs leads to `ingest-as-crosswalk`, not `replace`.
- A native field that no consumer task traverses is evidence for reducing that scope, independent of external supply.

## Concrete interoperability gaps

These are places where the current contract or crosswalks cannot carry, losslessly, a fact that external supply commonly provides or that a substitution would need. Each gap is recorded for the comparison; none is an approved schema change. Any change still follows the governance window in `INTENT.md` and needs a demonstrated second-adopter need.

| # | Gap | Evidence in this repository | Effect on substitution |
|---|---|---|---|
| G1 | No licensing or reuse field in the shared provenance set. | The shared provenance fields listed under C4 contain no license, rights or attribution field; only `PROTOCOL.md` frontmatter carries the specification's own license. | A record ingested from an external source cannot carry its reuse terms or required attribution through the graph. C3 evidence must live in adopter extensions or outside the records. |
| G2 | Work versus expression versus point-in-time version is not distinguished. | `eli_uri` and `akn_uri` are single fields; `source_version` is a free string. ELI and the Akoma Ntoso naming convention (FRBR-derived) both distinguish the abstract work from dated expressions and consolidated versions. The [Akoma Ntoso crosswalk](crosswalks/akomantoso.md) example uses a work-level path. | Two adopters can carry ELI or Akoma Ntoso identifiers for different consolidated versions of one Instrument and the crosswalk cannot say whether they refer to the same version. Point-in-time tasks cannot rely on the identifier alone. |
| G3 | ECLI identifies a decision, not a matter. | `ecli_uri` is accepted on both `of:Proceeding` and `of:Determination`; the [ELI/ECLI crosswalk](crosswalks/eli-ecli.md) maps Proceeding to "the matter to which the ECLI refers". | A Proceeding with several Determinations has no single ECLI. Carrying one decision's ECLI on the Proceeding conflates matter and decision, which weakens the issuance versus adjudication distinction for multi-decision matters. |
| G4 | Record dates require full calendar dates. | Instrument, Term and Obligation date fields use JSON Schema `format: date`. Partial-date handling exists only in offline tooling (term boundary checks and the F14 fixture), not in records. | External sources that give a year or month cannot populate record dates without invention, so C5 forces those facts into notes or adopter extensions. |
| G5 | Source authority class is not explicit. | `evidence_type` is a free string; `source` is a URL. There is no controlled distinction between official publication, official consolidation, unofficial aggregator and editorial summary source. | A consumer cannot tell from shared fields whether a substituted source is authoritative, which is the central question in C2. |
| G6 | No US federal or common-law identifier field. | `PROTOCOL.md` names USLM for US federal statutes and the IRI decision lists USLM and `urn:lex`, but no schema field carries them. Non-EU joins fall back to `citation` or `sameAs`, pending the bounded citation-normalization trial (ROADMAP deferred decision 20). | US sources cannot be joined on a typed identifier. This is the trigger already recorded for decision 20, not a new decision. |
| G7 | LegalRuleML temporal and source metadata is unmapped. | The [LegalRuleML crosswalk](crosswalks/legalruleml.md) maps deontic operators and defeasibility. It does not map LegalRuleML's temporal characteristics, authority or source metadata to Obligation-First's lifecycle, operative and enforcement axes, and the `legalRuleMLEncoding` pointer stays deferred (ROADMAP deferred decision 14). | An external LegalRuleML encoding could be linked, but its temporal and authority claims cannot be compared with adopter records without a reviewed mapping. Confirm the mapping against the OASIS specification before any equivalence claim. |
| G8 | Akoma Ntoso element-level binding is referenced, not formalized. | `INTENT.md` defers element-level binding; ROADMAP keeps it open. | Provision-level substitution from an Akoma Ntoso source needs adopter-side mapping and review for each jurisdiction's naming convention. |

Terminology differences that are not gaps: Obligation-First `Requirement` versus LegalRuleML `Obligation` (documented 1:1 alignment); `of:Term` versus `eli:LegalResourceSubdivision` or Akoma Ntoso `section` or `article` (documented crosswalk); `of:Determination` versus `gist:Determination` (direct binding). None of these alone justifies keeping native scope.

## What remains native regardless of supply

No document-level external source is expected to replace these without new evidence:

- The Obligation layer itself: Terms creating grounded, typed Obligations with duty holders, conditions, defeasibility and Reparation triggers. Akoma Ntoso encodes text; obligations are derived from it by interpretation, which is the gap Obligation-First fills.
- Cross-adopter joins: `anchors`, `constrains`, Category classification through `gist:isCategorizedBy`, and record correspondence. These express PAICE's own graph, not a property of any source.
- Adopter judgments: admission status, unresolved source-review questions, risk tiers and editorial classification.
- Issuance versus adjudication distinctions where sources conflate them.

These are candidates for residual value. Whether each one is worth maintaining is a separate question answered by whether a consumer task traverses it (C7).

## Bounded fixture evaluation

Before any `replace` outcome, build a bounded offline fixture for the specific task:

1. Freeze a small sample of the candidate source and the corresponding adopter records, with source hashes and observation dates.
2. Project the source sample into Obligation-First records through a candidate adapter, carrying identifiers as crosswalks and provenance as observed.
3. Run the existing harness: `npm run validate` and graph checks, the [consumer answer contract](consumer-answer-contract.md) on the task's journey, and [term boundary checks](term-boundary-checks.md) or the [qualified-time fixture](contracts/qualified-time-fixture-v1.md) where dates matter.
4. Compare the reviewed expected answer from adopter records with the answer from the projected source. Any strengthened meaning, lost unknown, lost draft state or changed relation direction is a failure.
5. Include negative controls: a conflated issuer and forum, a work-level identifier on a version-level task, a partial date completed to a day, and a status without an as-of date.

Public fixtures stay synthetic or redistributable. A fixture built from a source whose terms are `unknown` under C3 stays local.

## Owner choices and unknowns

- Foundation chooses which candidate sources and consumer tasks enter the comparison. This record does not select any.
- Adopters decide source admission, legal meaning and currentness, and whether a `replace` outcome is acted on.
- Whether G1, G2, G4 or G5 becomes a shared-contract proposal depends on more than one adopter needing it; that need is not yet demonstrated.
- Licensing evidence for any specific source has not been gathered here. External terms change, so C3 evidence must be dated per comparison.
- Live resolution of `https://w3id.org/of/v1/` remains pending (ROADMAP v1.0 gate) and does not affect these criteria.

## Scorecard template

Copy one block per candidate source and consumer task, then fill each value from the comparison evidence.

Literal
```yaml
consumer_task: ""
traversed_records_and_relations: []
candidate_source:
  name: ""
  access: ""
  snapshot_observed: ""
criteria:
  C1_identifiers: unknown
  C2_source_time_authority: unknown
  C3_licensing: unknown
  C4_versioning: unknown
  C5_uncertainty: unknown
  C6_deontic_content: unknown
  C7_adopter_fields: unknown
gaps_hit: []
must_remain_native: []
fixture: ""
outcome: unresolved
evidence: []
```

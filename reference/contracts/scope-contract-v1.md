# Scope inventory evaluator contract v1

Scope: Obligation-First's shared evaluation contract. Implemented locally on 2026-09-05 for F11 and the non-territorial issuer regression in issue 7. This is an independently versioned companion to the v0.6 record schemas and fingerprint v2. It adds no RDF terms, changes no record identifiers, and is not a new spec release or certification claim.

## Ownership and admission

OF owns this contract, its JSON Schema, diagnostics, and synthetic fixtures. Each adopter owns `tests/fixtures/of-scope-inventory.json` and `tests/fixtures/of-scope-baseline.json`. The inventory owner must exactly match the adopter's naming profile. EveryAILaw's registry defines its recognized service vocabulary; it is not a universal legal-jurisdiction inventory.

An inventory declares `contract_version: 1`, an independent `inventory_version`, an HTTPS owner, source evidence, typed entries, and separate coverage statements. Each entry retains its exact identifier, territorial or institutional kind, source, and explicit extension flag. A territorial parent must itself be recognized and cannot form a cycle. Institutional identities cannot acquire territorial parents.

Adopters admit extensions by reviewing their identity, source, kind and any parent, then declaring them in their own inventory. The extension may come from another adopter without granting that adopter control over local coverage. British Columbia `ca-bc` is recognized by AI Incident Law and adopted explicitly by EveryAILaw; it is never rewritten to `ca`. New identifiers fail membership checks until reviewed. Valid identifiers outside the declared inventory are reported as unknown to that inventory, not invalid geography. There is no case folding, slug repair, fuzzy matching, parent substitution or inferred applicability.

The initial inventories preserve source spellings, including institutional names and existing reserved territorial tokens. They are admission and continuity evidence, not an independent legal audit of every source record. Reviewed changes to inventory semantics require an inventory-version change and an explicit baseline diff. The checker does not download an inventory or contact an external service.

## Recognition and coverage are independent

| Observation | Meaning |
|---|---|
| Recognized, modeled | The owner explicitly declares modeled evidence under this scope; it does not establish any particular duty's applicability |
| Recognized, uncovered | The owner explicitly declares that its evidence/service coverage does not cover this scope |
| Recognized, coverage unknown | No coverage statement exists, or the owner explicitly declares uncertainty |
| Unknown identifier | The requested kind and exact value have no declaration in this inventory |
| Institutional | Organization/legal-competence identity, independent of territorial coverage |
| Missing scope | No scope assertion exists on this record; the checker creates none |

Coverage is owner-specific and source-attributed. An omitted coverage statement yields `unknown`, never zero. EveryAILaw's coverage adapter uses its published modeled-instrument counts: positive means modeled, zero means uncovered, missing/null means unknown. This is dataset evidence, not proof of legal applicability or absence of law. Its explicit `ca-bc` service declaration preserves an unknown instrument count. PubLedge and AI Incident Law make no numeric or coverage assertions merely because their records use a scope.

Cross-adopter comparison rejects conflicting kinds and conflicting known territorial parents for the same exact identifier. Missing parent evidence is not agreement. Different coverage statements and different source citations are permitted. The check does not assert synonymy between differently spelled identifiers.

## Exact continuity and compatibility

The companion baseline retains exact record ID, field path and values for inline jurisdiction scopes, legacy `gist:Jurisdiction.ref`, record-level territorial/institutional scope, local Jurisdiction references, and naming-profile scope. Sets are order-independent and scalar/set presentation remains compatible. Record and field identity are preserved, so changing ISO to OECD or British Columbia to Canada fails even when both values are recognized and the JSON shape is valid.

Local `jurisdiction` IRIs must resolve to `of:Jurisdiction` records. Unresolved external references are explicitly reported and block this evaluator's acceptance; they remain syntactically valid under the released schema. A future external-resolution declaration needs a versioned contract change, not a network call hidden in deterministic validation. Other nested provenance and relationship paths remain outside this tranche.

`check-scope-contract.mjs --write` creates an initial baseline only and refuses to overwrite any existing file. Normal checks never learn expected values from current output. Baselines pin inventory version and content digest. Existing fingerprint v2 files remain byte-identical, and preserve their prior edge/provenance responsibilities. Adopter fingerprint wrappers run the scope checks before permitting even a fingerprint rewrite.

## Evaluation and gates

`npm run test:scope` runs the shared evaluator suite; `npm run test:hardening` includes it with the checked-in synthetic fixtures under `reference/fixtures/scope-contract-v1/`. No restricted adopter records are copied into OF. The fixture's ISO standard and all relations are illustrative, not statements about a real instrument.

- Schema-valid ISO/OECD substitution demonstrates the old fingerprint's blind spot and must fail the new CLI check.
- `ca-bc` flattening, legacy substitution, removed scopes, scope-kind confusion, unknown codes, case/whitespace changes, and unresolved or wrong-type references fail.
- Empty/duplicate scope sets, missing/duplicate record identity, invalid inventory versions, duplicate entries, parent cycles, unrecognized coverage, and missing source declarations fail.
- Missing scope and missing coverage remain distinct from uncovered; null instrument counts remain distinct from zero in the owning EveryAILaw eval.
- Baseline truncation, coverage/inventory drift and writer overwrite attempts fail. Reordered sets/records and legacy scalar forms pass.
- Schema-derived path discovery detects a removed implementation path or a newly introduced scope path that has no evaluator coverage.
- ISO issuance remains independent from administration, regulation and enforcement. Moving the issuer into any of those relations must change the existing semantic fingerprint; the fixture needs neither fictional territory nor unsupported authority basis.
- EveryAILaw's owning source eval rejects registry additions/removals, changed coverage and extension-parent drift. Pro's existing filter evals additionally preserve `ca-bc` and reject ISO/OECD as territorial filters.

Federation requires each inventory and baseline, checks actual adopter projections, compares declarations across owners, and retains isolated rebuilds, JSON-LD round trips, exact edges, provenance continuity and required correspondence checks. Adopter canonical gates also invoke the companion through their existing fingerprint wrapper.

Stable diagnostics are `OF-SCOPE-CONTRACT`, `OF-SCOPE-OWNER`, `OF-SCOPE-RECORDS`, `OF-SCOPE-SHAPE`, `OF-SCOPE-KIND`, `OF-SCOPE-UNKNOWN`, `OF-SCOPE-UNRESOLVED`, `OF-SCOPE-BASELINE`, `OF-SCOPE-DRIFT`, `OF-SCOPE-CONFLICT`, and EveryAILaw's `OF-SCOPE-SOURCE`. CLI input/IO failures report `OF-SCOPE-INPUT` with exit 2; semantic failures use exit 1.

## Delivery dependency and remaining work

Local test outcomes and candidate source digests are recorded in [scope eval acceptance](../scope-eval-acceptance-2026-09-05.json).

This evaluator is packaged with OF v0.6.4. Packaging alone is not hosted acceptance. Delivery must first make the new OF checker available and then update adopter CI pins to its exact accepted revision before enforcing the new wrappers remotely. Old OF checkouts lack the companion and fail closed. Record the resulting compatible revision set after actual delivery; test snapshots are not delivery revisions. The current `check:of-fingerprint` skip policy when no OF checkout exists remains unchanged; canonical CI must continue setting `CHECK_OF_REQUIRED=1`.

F14 qualified time, F15 consumer journeys, general nested provenance, namespace publication, and external certification remain separate work. Issue 7's source correction is not repeated: the real EveryAILaw ISO authority already names the International Organization for Standardization. This tranche supplies the previously missing shared semantic regression.

---
title: Identity and classification
status: accepted-direction
decision_date: 2026-08-04
implementation_target: v0.6.0 candidate
current_contract_impact: none
---

# Identity and classification

## Scope

This record resolves the direction for D8 and D10 from the EveryAILaw alignment review and item 1 from the semantic review. It also narrows deferred identity-fidelity and non-EU join-key work.

## Decision

1. An Obligation-First `@id` denotes the entity asserted by an adopter, not a particular JSON file or HTML representation. The IRI remains adopter-local, opaque, permanent, and governed by the adopter naming profile.
2. Representation URLs, redirects, tombstones, and deprecation metadata must not change the asserted legal or deontic identity. A compatibility record may not invent `created_by`, `issuedBy`, or any other fact merely to satisfy a schema.
3. `owl:sameAs` is reserved for genuine identity where property merging is intended. It must not join two adopter records merely because they describe the same external entity.
4. Record-to-record mappings that describe the same external entity need a weaker, explicit relation. The v0.6 design must choose between a dedicated Obligation-First predicate such as `describesSameEntityAs` and a documented SKOS mapping whose domain is conceptually valid. `skos:exactMatch` remains appropriate only for true concept-to-concept equivalence across schemes.
5. `of:ObligationCategory` binds to `gist:Category`. An Obligation is classified by a Category through `gist:isCategorizedBy`, not `skos:exactMatch`.
6. Category hierarchy uses existing gist or SKOS hierarchy relations according to declared scheme semantics. `skos:exactMatch` remains the cross-scheme equivalence relation for Categories. An Obligation may carry multiple categories; any primary-category rule belongs in an adopter extension unless more than one adopter needs it.
7. Canonical-successor and deprecation metadata must be queryable on aggregate, per-record, companion, and deprecated surfaces. Redirect behavior alone is not enough for offline consumers.

## Compatibility direction

- v0.5 `exactMatch` edges from Obligation to ObligationCategory remain readable during a documented deprecation window.
- The migration transform replaces those classification edges with `gist:isCategorizedBy` and retains `exactMatch` only between Categories.
- Existing `sameAs` values require review by assertion, not a global textual replacement.
- Deprecated records that contain false provenance must become redirects or tombstones rather than remain schema-valid duties.

## Acceptance fixtures

- Two adopter records about the same authority do not merge under OWL semantics unless genuine identity is explicitly asserted.
- EU Parliament and Council remain two Authorities and can jointly issue one Instrument.
- One statutory Obligation can be categorized as both transparency and record-keeping without claiming identity with either Category.
- A deprecated category-shaped Obligation resolves to its Category successor without a fabricated creating Term.
- A naming-profile check validates every canonical and deprecated IRI it advertises.

## Adopter impact

- EveryAILaw replaces concrete-Obligation `exactMatch` classification and removes false compatibility duties.
- PubLedge and AI Incident Law keep Category anchors for concept-level statements; those anchors are not classification edges.
- All adopters audit current `sameAs` assertions and distinguish entity identity, record correspondence, and concept equivalence.

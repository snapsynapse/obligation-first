---
title: "Obligation-First INTENT"
# of-version: intent-frontmatter
version: "0.6.5"
last_updated: 2026-09-05
status: working-hypothesis
description: "Standards-level strategy for the Obligation-First upper schema. Defines scope, design constraints, adoption order, and governance posture."
tags: [intent, strategy, obligation-first, ontology, gist, standards]
---

# Obligation-First INTENT

Strategy for the Obligation-First upper schema and the obligationfirst.org canonical home. Subscribes to portfolio-level working hypotheses maintained by PAICE Foundation (see [paice.foundation](https://paice.foundation/) for the public-facing portfolio; full portfolio INTENT is held privately by the Foundation and is not publicly hosted at this stage).

## Purpose

Obligation-First is the shared upper schema for normative content across the PAICE Regulation vector. It binds three domains — statutes (EveryAILaw), proceedings (AI Incident Law), and joint interpretations (PubLedge) — onto a single small ontology so they interoperate without forcing each project to flatten its native structure.

The methodology behind the schema: normative content is modeled by what it requires, not what it says. The Obligation is the unit of comparison across jurisdictions, instruments, and time.

Obligation-First is therefore the integration layer for PAICE legal projects, not another end-user corpus. EveryAILaw publishes statutory Obligations, AI Incident Law publishes Proceedings and adjudicative Determinations that anchor to those Obligations, and PubLedge publishes joint interpretations that re-allocate or clarify them plus administrative issuance Determinations for its Instruments. This repo owns the common vocabulary, validation contract, and identifier conventions that let those projects behave as one graph while remaining separately scoped products.

## Design constraints

1. **Bind, don't reinvent.** Where standards exist (Semantic Arts gist, LegalRuleML deontic operators, Akoma Ntoso source-text IRIs, ELI, ECLI), Obligation-First references them. It does not duplicate them.
2. **Small core, explicit extension points.** The shared core admits semantics used by more than one adopter. Domain-specific risk tiers, search metadata, editorial tags, and workflow details remain in named adopter contexts.
3. **Three real adopters before v1.0.** EveryAILaw, PubLedge, and AI Incident Law are all live adopters. Their shared graph and migration fixtures now gate v1.0.
4. **Permanent IRIs.** Preserve the existing w3id.org vocabulary identifiers. Their redirect is planned, not yet filed; obligationfirst.org hosts the context and is the intended resolution target. Dereferenceability is a separate readiness gate.
5. **Drafting in public.** Every revision is a commit. Material changes are documented in CHANGELOG.md.

## Scope

In scope:

- Authority / Instrument / Term / Obligation (the four-role spine)
- Proceeding / Allegation / Determination (the proceeding strand)
- ObligationCategory (the category layer): jurisdiction-neutral `gist:Category` concepts. Obligations join through `gist:isCategorizedBy`; `skos:exactMatch` remains concept-to-concept only.
- Party, Jurisdiction, and Tombstone support for typed actors, legal competence, and queryable identifier retirement.
- Deontic quartet: Requirement / Restriction / Permission / Reparation (subclasses of Obligation, aligned with LegalRuleML 1.0). v0.2 refines the gist binding for Reparation to a layered `gist:Requirement` + `gist:Intention` (+ `gist:Event`) pattern without changing the of: class — see [reference/crosswalks/gist.md](reference/crosswalks/gist.md).
- Defeasibility relation (`of:defeats`) per Lawsky / LegalRuleML §7.4
- Polymorphic executable-encoding reference (Catala, Blawx, OpenFisca, others)
- Multi-valued authority-basis vocabulary and distinct issuance, administration, regulation, enforcement, and hearing relations
- IRI compatibility with ELI, ECLI, Akoma Ntoso element IRIs, USLM

Deferred or extension-scoped work:

- Akoma Ntoso element-level binding (referenced, not formalized)
- A future temporal rules engine beyond the v0.6 lifecycle, operative-effect, and enforcement fields
- Cross-jurisdictional equivalence relation (`of:correspondsTo`) (still deferred post-v0.3; the v0.3 crosswalk matrix carries cross-adopter joins for now)
- Multi-language source text handling
- A formal SHACL validator (deferred to v1.0)
- External conformance certification (deferred to v1.0); JSON Schema, graph, JSON-LD and semantic mutation checks are implemented

## Integration role

The project has two operating modes:

1. **Specification mode.** Define the smallest stable schema that can carry statutes, proceedings, and joint interpretations without forcing one domain's record shape onto the others.
2. **Interstitial mode.** Provide the cross-project contract that lets PAICE legal products join through stable `@id` values, `anchors`, shared schemas, and common validation.

All three adopters publish v0.6 projections from their native sources. The shared schema, deterministic migration fixture, graph checks, and naming-profile ranges are released and validated as one federated contract.

The [scope inventory evaluator contract v1](reference/contracts/scope-contract-v1.md) adds independently versioned, adopter-owned recognition and coverage declarations with exact scope continuity. This evaluator extension preserves the released schema and each adopter's vocabulary ownership; its implementation and delivery status are recorded in that contract.

The [implementation status](reference/implementation-status.json) distinguishes released tooling from the unreleased [F14 offline fixture](reference/contracts/qualified-time-fixture-v1.md). F14 exercises qualified date comparisons; it does not expand the record schema, implement production serialization, or resolve predecessor operative history. The existing second-adopter requirement still governs a future schema proposal.

## Implemented semantic direction

Five implemented decision records govern v0.6:

- [Identity and classification](reference/decisions/identity-and-classification.md)
- [Authority, source text, and legal scope](reference/decisions/authority-text-and-scope.md)
- [Normative force and lifecycle](reference/decisions/normative-force-and-lifecycle.md)
- [Actors and deontic grounding](reference/decisions/actors-and-deontic-grounding.md)
- [Provenance, extensions, and conformance](reference/decisions/provenance-extensions-and-conformance.md)

The v0.6 implementation preserves v0.5 schema validity while requiring migrated projections to state new semantics explicitly. Immutable v0.5 release packages remain unchanged.

## Adoption state

1. **EveryAILaw is live** as the statutory source of truth and category publisher.
2. **PubLedge is live** on the spine and owns administrative issuance for its Instruments.
3. **AI Incident Law is live** on the proceeding strand and owns adjudicative Determinations for public matters.
4. EveryAILaw, PubLedge, and AI Incident Law each exercise a different portion of the v0.6 contract, and cross-repository validation checks the combined graph.

## Relationship to other components

- **Knowledge-as-Code** (https://knowledge-as-code.com/): the methodology family. Obligation-First is one specific KaC schema for normative content. Other KaC schemas may emerge for other domains.
- **PubLedge** (https://publedge.org/): protocol that adopts Obligation-First. The four-role spine originated in PubLedge; Obligation-First lifts and generalizes it. PubLedge records administrative issuance Determinations for its Instruments while `issuedBy` identifies the Authority that acted.
- **EveryAILaw** (https://everyailaw.com/): adopter; provides the statute-and-obligation reference dataset.
- **AI Incident Law** (https://aiincidentlaw.org/): adopter; provides the proceeding-and-adjudicative-determination reference dataset.
- **AI Posture** (https://aiposture.org/): downstream consumer. Posture assertions reference Obligations via Obligation-First IRIs.
- **Semantic Arts gist**: the upper ontology Obligation-First binds to. We do not fork gist; we vendor a snapshot under `vendor/gist/` and reference it.

## Governance

Stewarded by PAICE.work PBC. Spec and reference material under CC BY 4.0; code under Apache 2.0. Contributions welcome via PR.

Transition to an independent steward (PAICE Foundation) is anticipated. Until then, material changes (anything affecting the spine, the proceeding strand, or the deontic quartet) require explicit changelog entries and a 14-day comment window if any external adopter has bound to the schema.

## Status

Subscribes to: Measurement Authority, Calibration Compounding (both from the portfolio INTENT).

Current tier: working hypothesis.

Last review: 2026-08-04.

Next scheduled review: on external adopter feedback or before the v1.0 freeze, whichever comes first.

## Changelog

- 0.6.1 (2026-08-04): Reconciles released-state claims, promotes the five implemented decisions, and adds a deterministic release-state gate.
- 0.6.0 (2026-08-04): Implements the accepted semantic decisions and releases all three adopter projections against the shared contract.
- 0.5.1-candidate (2026-08-04): Reconciles the current three-adopter state, records the accepted v0.6 semantic direction, and keeps the patch candidate separate from ontology expansion.
- 0.5.0 (2026-07-25): Adds the ObligationCategory commensurability layer and version-range naming profiles.
- 0.4.0 (2026-06-03): Makes adopter naming profiles machine-validatable.
- 0.3.1 (2026-06-02): Adopts record-local permanent IRIs and standard identifier crosswalks for federation.
- 0.2.0 (2026-05-26): Incorporates Semantic Arts binding feedback for the deontic and allegation layers.
- 0.1.0-draft+integration (2026-05-13): Clarifies that Obligation-First is the interstitial integration layer for PAICE legal projects after the local v0.1 spec work is complete.
- 0.1.0-draft (2026-05-04): Initial INTENT. Codifies four-role spine + proceeding strand, gist binding, LegalRuleML alignment, three-adopter v1.0 gate, EveryAILaw-first adoption order.

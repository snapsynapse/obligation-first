---
title: "Obligation-First INTENT"
version: "0.1.0-draft"
last_updated: 2026-05-04
status: working-hypothesis
description: "Standards-level strategy for the Obligation-First upper schema. Defines scope, design constraints, adoption order, and governance posture."
tags: [intent, strategy, obligation-first, ontology, gist, standards]
---

# Obligation-First INTENT

Strategy for the Obligation-First upper schema and the obligationfirst.org canonical home. Subscribes to portfolio-level working hypotheses (see https://github.com/snapsynapse/paice-foundation/blob/main/INTENT.md).

## Purpose

Obligation-First is the shared upper schema for normative content across the PAICE Regulation vector. It binds three domains — statutes (EveryAILaw), proceedings (AI Incident Law), and joint interpretations (PubLedge) — onto a single small ontology so they interoperate without forcing each project to flatten its native structure.

The methodology behind the schema: normative content is modeled by what it requires, not what it says. The Obligation is the unit of comparison across jurisdictions, instruments, and time.

## Design constraints

1. **Bind, don't reinvent.** Where standards exist (Semantic Arts gist, LegalRuleML deontic operators, Akoma Ntoso source-text IRIs, ELI, ECLI), Obligation-First references them. It does not duplicate them.
2. **Small core, explicit extension points.** v0.1 covers the spine, the proceeding strand, the deontic quartet, defeasibility, and a polymorphic executable-encoding reference. Everything else is a downstream extension.
3. **Three real adopters before v1.0.** EveryAILaw, PubLedge, and AI Incident Law must each bind to v0.1 in production before the schema is promoted to v1.0.
4. **Permanent IRIs.** Stable references via w3id.org redirect; obligationfirst.org is the resolution target, not the canonical IRI.
5. **Drafting in public.** Every revision is a commit. Material changes are documented in CHANGELOG.md.

## Scope

In scope:

- Authority / Instrument / Term / Obligation (the four-role spine)
- Proceeding / Allegation / Determination (the proceeding strand)
- Deontic quartet: Requirement / Restriction / Permission / Reparation (subclasses of Obligation, aligned with LegalRuleML 1.0)
- Defeasibility relation (`of:defeats`) per Lawsky / LegalRuleML §7.4
- Polymorphic executable-encoding reference (Catala, Blawx, OpenFisca, others)
- Authority-basis vocabulary (statutory / regulatory / contractual / corporate / judicial)
- IRI compatibility with ELI, ECLI, Akoma Ntoso element IRIs, USLM

Out of scope for v0.1:

- Akoma Ntoso element-level binding (referenced, not formalized)
- Provision lifecycle state machine (deferred to v0.2; drives the visualization layer)
- Cross-jurisdictional equivalence relation (`of:correspondsTo`) (deferred to v0.2)
- Multi-language source text handling
- A formal SHACL validator (deferred to v1.0)
- Conformance test suite (deferred to v1.0)

## Adoption order

1. **EveryAILaw first.** Its `instruments/`, `provisions/`, `obligations/`, `authorities/` already mostly fit. Smallest binding effort. Validates the schema against living legal data.
2. **PubLedge second.** Already on the spine; adopting v0.1 means swapping its repo-local context for the shared context.
3. **AI Incident Law third.** Largest restructure (flat records → Proceeding/Allegation/Determination). By the time it adopts, the schema has been stress-tested against EveryAILaw and PubLedge.

## Relationship to other components

- **Knowledge-as-Code** (https://knowledge-as-code.com/): the methodology family. Obligation-First is one specific KaC schema for normative content. Other KaC schemas may emerge for other domains.
- **PubLedge** (https://publedge.org/): protocol that adopts Obligation-First. The four-role spine originated in PubLedge; Obligation-First lifts and generalizes it.
- **EveryAILaw** (https://everyailaw.com/): adopter; provides the statute-and-obligation reference dataset.
- **AI Incident Law** (https://aiincidentlaw.org/): adopter; provides the proceeding-and-determination reference dataset.
- **AI Posture** (https://aiposture.org/): downstream consumer. Posture assertions reference Obligations via Obligation-First IRIs.
- **Semantic Arts gist**: the upper ontology Obligation-First binds to. We do not fork gist; we vendor a snapshot under `vendor/gist/` and reference it.

## Governance

Stewarded by PAICE.work PBC. Spec and reference material under CC BY 4.0; code under Apache 2.0. Contributions welcome via PR.

Transition to an independent steward (PAICE Foundation) is anticipated. Until then, material changes (anything affecting the spine, the proceeding strand, or the deontic quartet) require explicit changelog entries and a 14-day comment window if any external adopter has bound to the schema.

## Status

Subscribes to: Measurement Authority, Calibration Compounding (both from the portfolio INTENT).

Current tier: working hypothesis.

Last review: 2026-05-04.

Next scheduled review: when v0.1 freezes (expected within 90 days), or after first external adopter feedback, whichever comes first.

## Changelog

- 0.1.0-draft (2026-05-04): Initial INTENT. Codifies four-role spine + proceeding strand, gist binding, LegalRuleML alignment, three-adopter v1.0 gate, EveryAILaw-first adoption order.

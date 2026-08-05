---
title: Actors and deontic grounding
status: implemented
decision_date: 2026-08-04
implementation_target: v0.6.0
current_contract_impact: implemented in v0.6.0
---

# Actors and deontic grounding

## Scope

This record resolves the direction for D6 and D7, plus semantic-review items 12 through 17.

## Decision

1. Concrete people and organizations are typed parties. Obligation-First introduces a Party shape over `gist:Person` and `gist:Organization` without requiring an `authority_basis`.
2. Obligations may identify multiple duty holders and beneficiaries through typed references. Allegations may identify multiple asserting parties. Controlled actor-role references are separate from concrete party identity.
3. Applicability prose, thresholds, exemptions, triggers, geographic scope, and institutional scope remain separate from actor identity and role. A scalar scope paragraph is not a duty-holder type.
4. The existing open strings remain a compatibility fallback for one minor-version window. Typed references are required for a v0.6 high-conformance profile whenever the party or canonical role is known.
5. Deontic class is asserted independently of topic category. Requirement, Restriction, Permission, and Reparation classification must cite the source Term or Determination that grounds it.
6. Prohibitions with exceptions and permissions with conditions may require more than one Obligation. Adapters must not classify by subject group or default every record to Requirement.
7. Reparations require explicit violation and trigger relations. `triggers_on_violation_of`, `created_by`, and their inverse relations become array-capable with consistency checks.
8. An Allegation may reference the Obligations allegedly violated before a Determination exists.
9. An Obligation may be grounded in one or more Terms, recognized by a Determination, or imposed by a Determination. The v0.6 schema must distinguish recognition of an existing common-law duty from creation of a new remedial duty.
10. A structured Remedy, if introduced, points to the resulting Obligation rather than duplicating it in an unstructured parallel object.

## Compatibility direction

- Existing scalar `created_by` and trigger fields remain valid when widened to arrays.
- Existing string duty-holder fields remain accepted with warnings during migration.
- Existing Requirements remain valid only if the adapter can point to source evidence. Unknown deontic classification must not silently default to Requirement under the v0.6 profile.

## Acceptance fixtures

- A JIA preserves both signatories and identifies which Party owes each re-allocated duty.
- An EU AI Act provision uses canonical provider and deployer role IRIs while retaining its full applicability conditions separately.
- A prohibition with a statutory exception yields grounded Restriction and Permission records where appropriate.
- The Air Canada graph represents the recognized common-law duty and the award obligation without a fictional statutory Term.
- A pre-decision AI Incident Law Allegation links to the allegedly violated Obligation.

## Adopter impact

- EveryAILaw maps its 13 canonical roles to typed role references and reviews deontic type from source text.
- PubLedge represents co-signers, regulated parties, and beneficiaries rather than losing them in prose.
- AI Incident Law represents claimants, respondents, forums, and common-law or remedial grounds without forcing every duty through an Instrument clause.

---
title: Normative force and lifecycle
status: accepted-direction
decision_date: 2026-08-04
implementation_target: v0.6.0 candidate
current_contract_impact: none
---

# Normative force and lifecycle

## Scope

This record resolves the direction for D1, D2, and D11, plus semantic-review items 9, 11, 16, 20, 21, and 22.

## Decision

1. Normative force, legal lifecycle, operative effect, and enforcement posture are separate axes.
2. `normative_force` expresses whether content is binding, voluntary, nonbinding, or contractual. Interpretive, guidance, standard, judgment, and agreement are Instrument functions or kinds, not force values. Incorporation by reference or adoption supplies a scoped basis that can make otherwise voluntary content binding.
3. Instrument `status` describes the artifact's legal or publication lifecycle. It does not by itself assert that every Term is operative or routinely enforced.
4. Term and Obligation records gain optional lifecycle and effective-date facts. Instrument-level values are summaries. Computed present-state values must be labeled as computed with an as-of date; factual dates remain source assertions.
5. Unknown, absent, not applicable, future, inactive, stayed, and repealed are distinct. Validators must not coerce any of them to false or routine.
6. `enforcement_status` may be asserted on an Obligation. Instrument-level enforcement remains a summary. Coherence rules warn or fail for proposed plus routine, voluntary plus routine without a binding basis, repealed or superseded plus routine without residual authority, and future-effective content reported as presently operative.
7. `anchors` remains interpretive. `constrains` is the dedicated causal relation for a Determination or posture that limits present enforceability.
8. `vacates` relates one Determination to another. A vacated state should have a corresponding incoming relation when the target is available.
9. `supersedes` means replacement by a successor; `repeals` means termination without a replacement; `amends` means partial modification. Relations declare direction and applicable level. Whole-instrument replacement, partial Term amendment, and Obligation defeasibility are not interchangeable.
10. The act of deciding is always a Determination. An additional Instrument is minted only when the resulting artifact itself contains forward-looking Terms that create or recognize Obligations. When both exist, they join explicitly and must agree on issuer and date.

## Compatibility direction

- Existing `status` and `enforcement_status` remain readable but receive coherence warnings under the v0.6 profile.
- New force and lifecycle fields are additive; adapters must stop fabricating binding or routine values before claiming v0.6 conformance.
- Existing `supersedes` assertions are reviewed for direction and replacement semantics. No global rewrite to `repeals` is permitted.

## Acceptance fixtures

- A voluntary ISO standard is not routinely enforceable until a contract or law adopts it within a stated scope.
- An enacted Instrument contains a future-effective Term without making that Term operative today.
- A stay constrains one Reparation without marking an entire statute constrained.
- Repeal-and-reenactment uses `supersedes`; repeal without replacement uses `repeals`.
- A damages judgment is a Determination only; a consent decree with forward-looking duties is both a Determination and an Instrument joined by the required relation.

## Adopter impact

- EveryAILaw must preserve native voluntary, future, phased, repealed, and amendment facts in its adapter.
- PubLedge must distinguish proposed, issued, effective, expired, and amended interpretation artifacts.
- AI Incident Law must preserve pending, decided, stayed, vacated, and residual-effect states without flattening them into one disposition enum.

# F14 contract decision

Scope: Obligation-First's shared qualified-time tooling. Decision date: 2026-09-05 America/Denver. This records the bounded fixture decision requested by the P2 review; it does not close the remaining source-history or production-adoption work.

## Decision

Keep the v1 qualified-time fixture contract as unreleased offline tooling. Do not add normative fields, `wouldAmend` semantics, or a production serializer in this tranche. The implemented fixture satisfies the requested expected/fallback branches, condition, evidence, explicit as-of, uncertainty and deterministic-transition acceptance scope.

The reviewed implementation was committed locally as OF `032df19`, EveryAILaw `12418d7270`, and PubLedge `ff0570a`. These are source commits, not hosted delivery evidence. The dated initial acceptance and documentation-audit records preserve their pre-commit snapshots.

## Production evidence

| Owner | Inspected implementation | Finding |
|---|---|---|
| EveryAILaw | `scripts/lib/parser.js`, `scripts/lib/obligation-first.js`, `scripts/build.js` | Native provision fallback dates and instrument amendment metadata exist. OF emits scalar dates and an adopter-qualified amendment metadata field; the fixture is not a production round trip of both branches. |
| PubLedge | `scripts/lib/obligation-first.js`, `scripts/lib/temporal-status.js`, `tests/fixtures/of-qualified-time.json` | Export and status checks use scalar dates. The Colorado sidecar demonstrates date-scope distinctions, but does not establish a production consumer requiring expected/fallback amendment branches. |

Search scope: both owners' exporter implementations and the PubLedge `data/` and `scripts/` trees for `effective_if_unamended` and `amendment_status`. No PubLedge matches were found in those trees during this review. This is a bounded implementation finding, not a claim that no future adopter need exists.

The second-adopter production threshold is therefore not demonstrated by the reviewed evidence. Two test sidecars cannot count as two production adopters.

## Reopening gate

Before proposing a schema extension, supply a second owner's real record and consumer operation that loses a necessary distinction, source-backed branch semantics, and a failing production projection/round-trip example. Review migration and missing-evidence behavior with both owners. Preserve partial precision, original identifiers and separate commencement, duty scope and enforcement evidence. A release/version decision follows that review.

## Source-history follow-up

The owning research record is EveryAILaw `design/F14-COLORADO-SOURCE-REVIEW-2026-09-05.md`. The review distinguishes the amendment's commencement from its amended duty dates and records a judicial-order retrieval gap. The predecessor acceptance result remains `unknown`; no conclusion that duties did or did not operate follows from this tooling decision. HB26-1263 harmonization remains separate.

## Validation

The committed candidate passed `npm test`, including 60 qualified-time checks and 15 implementation-status drift mutations. Post-commit `npm run verify:federation` passed for owner projection and acceptance verification. Contract, manifest-hash and whitespace checks also passed after this documentation follow-up. This decision adds no code behavior or release-pinned artifact.

# Semantic decision index

These tracked records move handoff-only decisions into the durable source for the shared Obligation-First contract. Their direction is implemented in the local v0.6.0 candidate, but their status remains `accepted-direction` until review closes and a release is separately authorized.

Status meanings:

- `accepted-direction`: the semantic direction is approved; exact schema, context, migration fixtures, and validator changes still require implementation and review.
- `implemented`: the decision is reflected in a released contract and its conformance suite. Local candidate work alone does not qualify.
- `superseded`: a later tracked record replaces the direction.

The five accepted-direction records dated 2026-08-04 are:

1. [Identity and classification](identity-and-classification.md)
2. [Authority, source text, and legal scope](authority-text-and-scope.md)
3. [Normative force and lifecycle](normative-force-and-lifecycle.md)
4. [Actors and deontic grounding](actors-and-deontic-grounding.md)
5. [Provenance, extensions, and conformance](provenance-extensions-and-conformance.md)

Together they reconcile D1 through D13 from `handoffs/2026-08-04-everyailaw-alignment-remediation.md` with the still-open portions of `handoffs/2026-06-09-semantic-review.md`.

The earlier [IRI naming and crosswalk decision](../iri-naming-and-crosswalks.md) remains authoritative where these records do not refine it.

## Release boundary

- The v0.5.1 correction candidate was never published and is superseded by v0.6.0.
- The shared vocabulary, migration fixture, and three adopter projections are implemented in v0.6.0.
- Existing v0.5 shapes remain schema-valid during the documented migration window.
- Material schema implementation must observe the governance review window in `INTENT.md`.

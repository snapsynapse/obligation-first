# Obligation-First v0.6.0 Release Notes

Release date: 2026-08-04

## Summary

Implements the v0.6 semantic contract across the shared schema and local projections for EveryAILaw, PubLedge, and AI Incident Law. The release adds explicit identity, classification, authority, source-text, legal-scope, actor, lifecycle, force, provenance, and graph semantics while preserving the v1 IRI major and a bounded compatibility window for legacy records.

## Shared schema

- Adds `of:Party`, `of:Jurisdiction`, and `of:Tombstone`, plus the shared `common.schema.json` definitions used across record schemas.
- Makes Authority bases optional and evidence-bearing, separates issuance, administration, regulation, enforcement, and hearing roles, and supports multiple supported bases.
- Separates exact Term `text` from editorial `summary`; contractual Terms may carry both `of:Term` and `gist:ContractTerm`.
- Adds base `of:Obligation` for explicitly unclassified duties, controlled actor-role fields, `binding_basis`, and category membership through `isCategorizedBy`.
- Adds lifecycle, operative effect, enforcement state, replacement, provenance, Party participation, and Determination-result relations.
- Extends graph validation across domains, inverses, categories, identity retirement, lifecycle coherence, Determination joins, replacements, and defeasibility cycles.

## Migration

- Adds a deterministic v0.5 to v0.6 migration command and a five-record input/output fixture.
- Automates only unambiguous shape changes, including legacy jurisdiction and proceeding relations, explicit editorial Term summaries, category membership, and marked compatibility-record retirement.
- Leaves evidence-sensitive decisions for adopter review, including actor identity, legal force, authority basis, exact source text, binding basis, and inferred deontic class.

## Adopter projections

- EveryAILaw projects separate issuing Authorities, explicit role and applicability semantics, evidence-backed provenance, jurisdiction and category records, and Tombstones for retired compatibility identities.
- PubLedge projects contractual multi-type Terms, typed Parties and actor roles, source-grounded Authorities, administrative issuance Determinations, and explicit lifecycle state.
- AI Incident Law projects Proceedings, Parties, Allegations, and adjudicative Determinations without fabricating courts, dates, asserting parties, or jurisdiction.
- The shared validator reports the Obligation-First version, source commit, and dirty state for inspectable local evidence.

## Compatibility

The IRI major remains `v1`. Legacy v0.5 records remain schema-valid during one minor-version migration window. That compatibility does not itself constitute v0.6 conformance: a v0.6 projection must apply the new semantic distinctions, declare `obligation-first >=0.6.0 <0.7.0`, and pass the current schema-and-graph gates. The unpublished v0.5.1 correction candidate was folded into this release and is not a public compatibility target. Immutable prior release packages are unchanged.

## Verification

Literal
```bash
npm test
```

The release package includes `manifest.json` and `sha256.txt` checksums for all pinned public artifacts, including every schema added in v0.6.

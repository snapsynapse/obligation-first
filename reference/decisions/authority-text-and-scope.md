---
title: Authority, source text, and legal scope
status: implemented
decision_date: 2026-08-04
implementation_target: v0.6.0
current_contract_impact: implemented in v0.6.0
---

# Authority, source text, and legal scope

## Scope

This record resolves the direction for D3, D4, D5, and D9, plus semantic-review items 4, 6, 7, 8, and 10.

## Decision

1. `issuedBy` identifies the Authority or Authorities that promulgated or issued an Instrument or Determination. It becomes array-capable, with order carrying no meaning.
2. A Proceeding uses `heardBy` for its forum. Administration, regulation, and enforcement are distinct relations and may be added to the shared core only with explicit domain, range, direction, and multi-adopter fixtures.
3. `authority_basis` describes the source of legal competence, not the first Instrument an Authority happens to manage. It becomes multi-valued and supports statutory, regulatory, constitutional, treaty, charter, contractual, judicial, common-law, and standards-body bases without forcing every organization into a government shape.
4. `of:Term` binds to `gist:Specification`. A Term in a negotiated or contractual Instrument may additionally be typed `gist:ContractTerm`.
5. `Term.text` remains source-faithful legal or normative text. Editorial paraphrase belongs in an explicit summary field. Citation, locator, source URL, language, and source version remain separately queryable. When full text cannot be distributed, an adopter must omit `text` and publish a summary rather than label paraphrase as canonical text.
6. `of:Determination` is a legal-domain composite: the deciding act maps to `gist:Determination`, and the ruling content maps to `gist:Content`. `of:LegalProceeding` will be declared as the legal-domain event class rather than referring to an undefined subtype.
7. `of:Jurisdiction` becomes an Obligation-First legal-competence class. It is not an alias for a geographic region. Territorial scope points to a gist geographic region; institutional or treaty scope points to the relevant organization or legal order through separate relations.
8. Identifier grammar is scheme-aware. ISO 3166 identifiers are used for territorial geography, including documented reserved codes such as `eu`; organizations such as OECD, G7, Council of Europe, and ISO are not made geographic jurisdictions to satisfy a regex.

## Compatibility direction

- Schemas accept legacy `gist:Jurisdiction` during one minor-version deprecation window and emit a warning with a deterministic migration.
- Proceeding `issuedBy` remains accepted during the same window but migrates to `heardBy`.
- Existing scalar `issuedBy` remains valid when array support is added.
- Existing `Term.text` values are not presumed canonical. Adapters must classify them as exact text or summary before migration.

## Acceptance fixtures

- The EU AI Act has Parliament and Council as separate joint issuers while the Commission remains queryable as an administrator or enforcer where supported.
- A court hears a Proceeding and issues a Determination without becoming issuer of the underlying statute.
- An ISO standard has institutional scope without a fictional geographic jurisdiction or government authority basis.
- A statutory Term carries exact clause text and a separate editorial requirements summary.
- A PubLedge negotiated Term may carry both `of:Term` and `gist:ContractTerm`; an EveryAILaw statutory Term does not.

## Adopter impact

- EveryAILaw must curate issuer, administrator, and enforcer data rather than reinterpret its current `authority` field.
- PubLedge gains joint issuance without composite identities.
- AI Incident Law migrates forums to `heardBy` and keeps issued rulings distinct from heard proceedings.

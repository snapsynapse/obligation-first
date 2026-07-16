# Project context — obligation-first

## What this project is

Obligation-First is an open upper schema (methodology + JSON-LD `@context`)
for modeling normative content — laws, cases, and agreements — by what it
*requires* rather than what it *says*. It defines a small, opinionated
four-role spine (Authority, Instrument, Term, Obligation) plus a proceeding
strand (Proceeding, Allegation, Determination), bound to the Semantic Arts
gist upper ontology. It is a spec + JSON Schemas + worked examples, not an
application.

It is the shared interstitial layer for the PAICE legal-graph portfolio:
EveryAILaw, AI Incident Law, and PubLedge each publish Obligation-First
records that join through a shared `@context`, schema validation, stable
`@id`s, and cross-project `anchors`.

## Audience

- Legal-graph builders, compliance-tool developers, and ontologists who need
  normative content to be queryable consistently across sources.
- Rules-as-code implementers (Catala, Blawx, OpenFisca and similar) who want
  a schema-level anchor for executable encodings of legal obligations.
- Adopter projects binding their own data to the Obligation-First context
  (currently EveryAILaw, PubLedge, AI Incident Law).

## Style / tone

Precise, technical, standards-body register — closer to a W3C/IETF spec
than marketing copy. README and PROTOCOL.md favor short declarative
sentences, explicit versioning language ("v0.4.3, subject to revision until
spec freeze"), and named provenance for decisions (e.g. "Semantic Arts
review, Dave McComb, 2026-05-26"). Claims about status are qualified and
dated rather than aspirational. Diagrams/badges used sparingly at the top of
README for spec version and licenses.

## Key URLs

- Canonical site: https://obligationfirst.org/
- Repo: https://github.com/snapsynapse/obligation-first
- Canonical context: https://obligationfirst.org/v1/context.jsonld
- Canonical schemas: https://obligationfirst.org/v1/schema/
- Adopters: https://everyailaw.com/, https://publedge.org/, https://aiincidentlaw.org/
- Upstream ontology: https://semanticarts.com/gist/
- Portfolio canon: https://paice.foundation/ (see sibling repo `paice-foundation/INTENT.md`)

## Current status

- Spec version v0.4.3, pre-freeze ("drafting in public"); `main` clean and
  up to date with origin as of 2026-07-04.
- Three adopters live and bound (EveryAILaw, PubLedge, AI Incident Law).
- Remaining v0.1-freeze gates: LegalRuleML community feedback on deontic
  alignment; w3id.org PR for the permanent `https://w3id.org/of/v1/` IRI.
- CI covers full validation suite, GitHub Pages deploy, and a monthly a11y
  audit; all green on `main`.

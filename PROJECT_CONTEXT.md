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
sentences, explicit versioning language ("current pre-v1.0 release, subject
to revision until spec freeze"), and named provenance for decisions (e.g. "Semantic Arts
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

- <!-- of-version: project-context-current -->
  Spec version v0.6.4, pre-v1.0.
- Three adopters live and bound (EveryAILaw, PubLedge, AI Incident Law).
- Remaining v1.0 gates are tracked in ROADMAP.md; the w3id.org redirect for
  `https://w3id.org/of/v1/` remains planned rather than live.
- CI covers full validation suite, GitHub Pages deploy, and a monthly a11y
  audit; all green on `main`.

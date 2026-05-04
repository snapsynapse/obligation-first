# Obligation-First

[![Spec](https://img.shields.io/badge/spec-v0.1.0--draft-orange)](PROTOCOL.md)
[![Content license: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-lightgrey)](LICENSE-CC-BY-4.0)
[![Code license: Apache 2.0](https://img.shields.io/badge/code-Apache%202.0-lightgrey)](LICENSE-APACHE)
[![Bound to gist](https://img.shields.io/badge/ontology-gist-green)](https://www.semanticarts.com/gist/)

A shared upper schema for normative content — laws, cases, and agreements — bound to the [Semantic Arts gist](https://www.semanticarts.com/gist/) upper ontology.

Obligation-First is a methodology and a JSON-LD context. The methodology says that normative content is best modeled by what it requires, not what it says. The schema gives that methodology a machine-readable shape.

**Drafting in public. v0.1.0-draft. Subject to revision before the v0.1 freeze.**

## What this is

A small, opinionated upper schema with two parts:

1. **The four-role spine** — Authority, Instrument, Term, Obligation. Inherited from the Knowledge-as-Code pattern that PubLedge introduced. Bound to gist classes.
2. **The proceeding strand** — Proceeding, Allegation, Determination. New in Obligation-First. Models cases, enforcement actions, and rulings without forcing premature factual classification.

Together they cover three domains in one schema:

- **Statutes and regulations** — laws and the obligations they create (used by EveryAILaw)
- **Proceedings and enforcement** — cases, allegations, rulings (used by AI Incident Law)
- **Joint interpretations** — agreements between authorities and regulated parties (used by PubLedge)

## Why obligation-first

Most legal data models center on the document. Obligation-First centers on what the document *makes you do*. The advantages compound:

- **Cross-jurisdictional comparison becomes natural.** Two laws with the same Obligation are commensurable even when their texts differ.
- **Proceedings link cleanly to statutes.** A Determination anchors to the Obligation it interprets, not the textual provision.
- **Joint interpretations re-allocate Obligations between parties** — exactly what JIAs and RMAs do.
- **Rules-as-code engines plug in below the schema.** A Provision can carry an `executableEncoding` reference to a Catala scope, a Blawx ruleset, or an OpenFisca formula without changing the schema.

## Adopters

- [PubLedge](https://publedge.org/) — open recordkeeping protocol for joint interpretations
- [EveryAILaw](https://everyailaw.com/) — AI law and obligation tracker (binding planned)
- [AI Incident Law](https://aiincidentlaw.org/) — public-record corpus of AI-related cases (binding planned)

If you'd like to bind your project to v0.1, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository layout

| Path | Purpose |
|---|---|
| [PROTOCOL.md](PROTOCOL.md) | The Obligation-First specification |
| [PRIOR-ART.md](PRIOR-ART.md) | Survey of legal ontologies, deontic logic foundations, and rules-as-code projects |
| [ROADMAP.md](ROADMAP.md) | Versioning plan and deferred decisions |
| [CHANGELOG.md](CHANGELOG.md) | Material changes per version |
| `schema/context.jsonld` | The JSON-LD `@context` for v1 |
| `schema/*.schema.json` | JSON Schemas for each entity |
| `vendor/gist/` | Pinned snapshot of Semantic Arts gist |
| `reference/vocabulary/` | Human-readable docs for each term |
| `reference/crosswalks/` | Mappings to LegalRuleML, Akoma Ntoso, ELI, ECLI, gist |
| `examples/` | Worked examples — round-trip three real records through v0.1 |
| `_workshop/` | Design conversation archives |

## What this is not

- Not a replacement for Akoma Ntoso, LegalRuleML, or ELI. Obligation-First references those standards; it does not duplicate them.
- Not a rules engine. The schema points at executable encodings (Catala, Blawx, OpenFisca) but does not implement them.
- Not legal advice. The schema is descriptive, not prescriptive.
- Not an attempt to model all of law. Scoped to the three domains above.

## Status

v0.1.0-draft. The spec is being written. The IRI prefix is `https://obligationfirst.org/v1/` (resolution target) with `https://w3id.org/of/v1/` planned as the permanent IRI once v0.1 freezes.

## License

Spec text and reference material under [CC BY 4.0](LICENSE-CC-BY-4.0). Code (schemas, scripts, examples) under [Apache 2.0](LICENSE-APACHE).

Stewarded by PAICE.work PBC. Transition to an independent steward (PAICE Foundation) is anticipated.

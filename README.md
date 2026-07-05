# Obligation-First

![Obligation-First — an open upper schema for normative content. Bound to gist. Aligned with LegalRuleML.](imgs/og.png)

[![Spec](https://img.shields.io/badge/spec-v0.4.3-orange)](PROTOCOL.md)
[![Content license: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-lightgrey)](LICENSE-CC-BY-4.0)
[![Code license: Apache 2.0](https://img.shields.io/badge/code-Apache%202.0-lightgrey)](LICENSE-APACHE)
[![Bound to gist](https://img.shields.io/badge/ontology-gist-green)](https://semanticarts.com/gist/)

A shared upper schema for normative content — laws, cases, and agreements — bound to the [Semantic Arts gist](https://semanticarts.com/gist/) upper ontology.

Obligation-First is a methodology and a JSON-LD context. The methodology says that normative content is best modeled by what it requires, not what it says. The schema gives that methodology a machine-readable shape.

**Live at [obligationfirst.org](https://obligationfirst.org/). Drafting in public. v0.4.3. Subject to revision until the spec freeze (remaining gates tracked in [ROADMAP.md](ROADMAP.md)).**

## Who this is for

Anyone modeling laws, cases, or agreements for machines — legal-graph builders, compliance-tool developers, and ontologists who need normative content to be queryable across sources.

## What problem it solves

Normative content is usually modeled by what it says, not what it requires, so obligations can't be queried consistently across laws, cases, and agreements. Obligation-First is a shared upper schema and JSON-LD context that models normative content by what it requires.

## Canonical URL

https://obligationfirst.org/

## What this is

A small, opinionated upper schema with two parts:

1. **The four-role spine** — Authority, Instrument, Term, Obligation. Inherited from the Knowledge-as-Code pattern that PubLedge introduced. Bound to gist classes.
2. **The proceeding strand** — Proceeding, Allegation, Determination. New in Obligation-First. Models cases, enforcement actions, and rulings without forcing premature factual classification.

Together they cover three domains in one schema:

- **Statutes and regulations** — laws and the obligations they create (used by EveryAILaw)
- **Proceedings and enforcement** — cases, allegations, rulings (used by AI Incident Law)
- **Joint interpretations** — agreements between authorities and regulated parties (used by PubLedge)

## Role in the PAICE legal graph

Obligation-First is the interstitial layer between the PAICE legal projects. It does not replace EveryAILaw, AI Incident Law, or PubLedge. It gives them a shared contract:

- EveryAILaw contributes statutory and regulatory `Obligation` records.
- AI Incident Law contributes `Proceeding`, `Allegation`, and `Determination` records that anchor back to those Obligations.
- PubLedge contributes joint-interpretation `Instrument`, `Term`, and `Obligation` records that clarify or re-allocate the same underlying Obligations.

The join surface is deliberately small: stable `@id` values, a shared `@context`, schema validation, and `anchors` for cross-project references.

## Why obligation-first

Most legal data models center on the document. Obligation-First centers on what the document *makes you do*. The advantages compound:

- **Cross-jurisdictional comparison becomes natural.** Two laws with the same Obligation are commensurable even when their texts differ.
- **Proceedings link cleanly to statutes.** A Determination anchors to the Obligation it interprets, not the textual provision.
- **Joint interpretations re-allocate Obligations between parties** — exactly what JIAs and RMAs do.
- **Rules-as-code engines plug in below the schema.** A Provision can carry an `executableEncoding` reference to a Catala scope, a Blawx ruleset, or an OpenFisca formula without changing the schema.

## Adopters

- [EveryAILaw](https://everyailaw.com/) — AI law and obligation tracker, now publishing an Obligation-First binding for statutory and regulatory obligations.
- [PubLedge](https://publedge.org/) — open recordkeeping protocol for joint interpretations, now publishing Obligation-First records for authorities, instruments, terms, obligations, and determinations.
- [AI Incident Law](https://aiincidentlaw.org/) — public-record corpus of AI-related cases, now publishing Obligation-First proceedings, allegations, determinations, and authorities.

If you'd like to bind your project to the current draft, see [Quick start](#quick-start-bind-a-dataset-in-three-steps) below or [CONTRIBUTING.md](CONTRIBUTING.md). v0.1 bindings remain record-valid through v0.4 — no migration required (Level 2 conformance has tightened since v0.3; see PROTOCOL.md "Conformance levels").

## Quick start — bind a dataset in three steps

1. **Reference the canonical `@context`** — set `@context: "https://obligationfirst.org/v1/context.jsonld"` on every record. Repo-local extensions go in a second context object.
2. **Validate against the JSON Schemas** — run every record through the schema for its `@type` (seven per-entity schemas at `https://obligationfirst.org/v1/schema/`, plus the executable-encoding and naming-profile schemas). Schema-conformant adopters (Level 2) pass validation for every published record.
3. **Cite [obligationfirst.org](https://obligationfirst.org/) as the canonical reference** — adopter sites and documentation should link back. The IRI prefix is permanent.

To validate your own records locally:
```bash
git clone https://github.com/snapsynapse/obligation-first.git
cd obligation-first
npm install
npm run validate    # runs scripts/validate-examples.mjs
```
The validator walks `examples/*/records/` and checks every JSON record against the appropriate schema. Adopters can drop their own records into a directory of the same shape and reuse the script.

For a complete local check before opening a PR or publishing docs:
```bash
npm test
```
The full suite validates worked examples, graph constraints, adopter-kit helpers, published artifacts, URL conventions, endpoint inventories, and GuideCheck assistant-guide provenance.

## Assistant-assisted setup

If you use a coding assistant to install, validate, or modify this repo, start from the GuideCheck guide:
```bash
curl https://obligationfirst.org/.well-known/assistant-guide.txt
```
Verify it with https://guidecheck.org/verify or another conformant verifier before asking the assistant to act. The guide is published with a Level 4 sidecar manifest at `https://obligationfirst.org/.well-known/assistant-guide-manifest.txt`; the same guide bytes are also present at repository root as `assistant-guide.txt`.

Conformance is not safety. Read the guide, confirm the reported hash, and keep normal sandboxing, least privilege, and human approval in place.

## Machine-readable endpoints

Every artifact an adopter or agent needs is dereferenceable at a stable URL:

| Endpoint | Purpose |
|---|---|
| [`/v1/context.jsonld`](https://obligationfirst.org/v1/context.jsonld) | The JSON-LD `@context` for v1 |
| [`/v1/schema/*.schema.json`](https://obligationfirst.org/v1/schema/) | JSON Schemas — seven per-entity plus executable-encoding and naming-profile (nine total) |
| [`/v1/schema/authority.schema.json`](https://obligationfirst.org/v1/schema/authority.schema.json) | Authority schema |
| [`/v1/schema/instrument.schema.json`](https://obligationfirst.org/v1/schema/instrument.schema.json) | Instrument schema |
| [`/v1/schema/term.schema.json`](https://obligationfirst.org/v1/schema/term.schema.json) | Term schema |
| [`/v1/schema/obligation.schema.json`](https://obligationfirst.org/v1/schema/obligation.schema.json) | Obligation schema |
| [`/v1/schema/proceeding.schema.json`](https://obligationfirst.org/v1/schema/proceeding.schema.json) | Proceeding schema |
| [`/v1/schema/allegation.schema.json`](https://obligationfirst.org/v1/schema/allegation.schema.json) | Allegation schema |
| [`/v1/schema/determination.schema.json`](https://obligationfirst.org/v1/schema/determination.schema.json) | Determination schema |
| [`/v1/schema/executable-encoding.schema.json`](https://obligationfirst.org/v1/schema/executable-encoding.schema.json) | Executable encoding schema |
| [`/v1/schema/naming-profile.schema.json`](https://obligationfirst.org/v1/schema/naming-profile.schema.json) | Naming profile schema (adopter `.well-known` profiles) |
| [`/llms.txt`](https://obligationfirst.org/llms.txt), [`/llms-full.txt`](https://obligationfirst.org/llms-full.txt) | LLM-readable summary + full context |
| [`/agents.json`](https://obligationfirst.org/agents.json) | Agent capabilities and endpoint inventory |
| [`/releases/v0.4.3/`](https://obligationfirst.org/releases/v0.4.3/) | Current release package manifest and checksums |
| [`/.well-known/assistant-guide.txt`](https://obligationfirst.org/.well-known/assistant-guide.txt) | GuideCheck Human-Verifiable Assistant Guide for assistant-assisted repo work |
| [`/.well-known/assistant-guide-manifest.txt`](https://obligationfirst.org/.well-known/assistant-guide-manifest.txt) | GuideCheck Level 4 sidecar manifest for the assistant guide |
| [`/feed.xml`](https://obligationfirst.org/feed.xml) | Atom feed of releases |
| [`/sitemap.xml`](https://obligationfirst.org/sitemap.xml), [`/robots.txt`](https://obligationfirst.org/robots.txt) | SEO + AI-crawler allow-list |
| [`/.well-known/security.txt`](https://obligationfirst.org/.well-known/security.txt) | Security disclosure (RFC 9116) |
| [`/changelog.html`](https://obligationfirst.org/changelog.html) | Changelog (redirects to GitHub `CHANGELOG.md`) |

The IRI prefix `https://obligationfirst.org/v1/` is the live resolution target. `https://w3id.org/of/v1/` is the planned permanent vocabulary prefix and will resolve to `https://obligationfirst.org/v1/` once the w3id.org redirect is filed before v1.0 freeze.

## Repository layout

| Path | Purpose |
|---|---|
| [PROTOCOL.md](PROTOCOL.md) | The Obligation-First specification |
| [PRIOR-ART.md](PRIOR-ART.md) | Survey of legal ontologies, deontic logic foundations, and rules-as-code projects |
| [ROADMAP.md](ROADMAP.md) | Versioning plan, resolved-in-v0.1 and resolved-in-v0.2 tables, deferred decisions |
| [CHANGELOG.md](CHANGELOG.md) | Material changes per version |
| `schema/context.jsonld` | The JSON-LD `@context` for v1 (canonical source — copied to `docs/v1/` by CI) |
| `schema/*.schema.json` | JSON Schemas for each entity |
| `scripts/validate-examples.mjs` | Validation harness: every JSON record under `examples/*/records/` is checked against the appropriate schema |
| `scripts/lib/adopter-kit.mjs` | Reusable adopter helper for schema validation, graph validation, and aggregate record bundles |
| `scripts/validate-adopter-records.mjs` | CLI validator for adopter record directories |
| `scripts/report-anchor-graph.mjs` | Cross-project `anchors` report for adopter exports and worked examples |
| `vendor/gist/` | Pinned snapshot of Semantic Arts gist (14.1.0) |
| `reference/crosswalks/` | Mappings to LegalRuleML, Akoma Ntoso, ELI/ECLI, gist |
| `reference/adopter-kit.md` | How adopters reuse the binding helper introduced after EveryAILaw |
| `reference/review/` | Public external review questions — including v0.2 resolutions from Semantic Arts |
| `reference/w3id-pr.md` | Prepared w3id.org permanent identifier PR notes |
| `reference/og-image-prompt.md` | Structured prompt for generating the OG social-card image |
| `examples/{air-canada,colorado-sb24-205,publedge-jia-utah-72,eu-ai-act-article-50}/` | Worked examples — four real record sets round-tripped through the current draft, with 49 canonical JSON record files under the `records/` subdirectories. All v0.1 records remain valid through v0.4 unchanged. |
| `docs/` | Published website served by GitHub Pages from `main /docs` (canonical at obligationfirst.org) |
| `.github/workflows/` | CI: validation on every push (`test.yml`), Pages deploy (`pages.yml`), monthly a11y audit (`a11y.yml`) |
| `_workshop/` | Design conversation archives |

## What this is not

- Not a replacement for Akoma Ntoso, LegalRuleML, or ELI. Obligation-First references those standards; it does not duplicate them.
- Not a rules engine. The schema points at executable encodings (Catala, Blawx, OpenFisca) but does not implement them.
- Not legal advice. The schema is descriptive, not prescriptive.
- Not an attempt to model all of law. Scoped to the three domains above.

## Status

v0.4.3. v0.1 spec, schemas, worked examples, adopter kit, and the first three PAICE legal bindings are complete and live. v0.2 absorbed Semantic Arts feedback (Dave McComb, 2026-05-26) as binding-only updates. v0.3 federates record identity: `@id` values are adopter-local and permanent, cross-adopter interoperability rides on standard identifier crosswalks declared in per-adopter `.well-known` naming profiles, and jurisdiction is a typed ISO 3166 field. The of: vocabulary is unchanged from v0.1; adopter records require no migration. See [CHANGELOG](CHANGELOG.md) and the decision record at [reference/iri-naming-and-crosswalks.md](reference/iri-naming-and-crosswalks.md). Open items on the current 0.4.x line ahead of the v1.0 freeze:

- LegalRuleML community feedback on deontic alignment
- File w3id.org PR for the permanent IRI

Current local stage: Obligation-First is operating as the validation and identifier contract between EveryAILaw, PubLedge, and AI Incident Law. The next useful work is external review, permanent IRI filing, and cross-project anchor enrichment.

For anchor enrichment, run `npm run report:anchors` against the worked examples or `node scripts/report-anchor-graph.mjs <adopter-export> [...]` against sibling adopter exports.

The IRI prefix `https://obligationfirst.org/v1/` is the live resolution target. `https://w3id.org/of/v1/` is the planned permanent vocabulary prefix; the w3id PR is targeted for filing before v1.0 freeze.

## License

Spec text and reference material under [CC BY 4.0](LICENSE-CC-BY-4.0). Code (schemas, scripts, examples) under [Apache 2.0](LICENSE-APACHE).

Note on adopter references: as of v0.3.1, example records under `examples/` carry neutral `https://obligationfirst.org/` identifiers and reproduce no EveryAILaw corpus content. Where an example corresponds to a real adopter entity, it references the adopter's published IRI only as a crosswalk (`sameAs` / `anchors`). Those references are citations, not reproductions, and grant no rights in the EveryAILaw corpus, which is licensed separately and restrictively. See [NOTICE](NOTICE) and https://everyailaw.com/.

Stewarded by PAICE.work PBC. Transition to an independent steward (PAICE Foundation) is anticipated.

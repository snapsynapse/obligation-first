---
"@type": "https://w3id.org/semanticarts/ns/ontology/gist/Specification"
title: "Obligation-First Protocol"
version: "0.1.0-draft"
license: "CC-BY-4.0"
created: 2026-05-04
modified: 2026-05-04
---

# Obligation-First Protocol

> **Status: drafting.** This document is the placeholder for the v0.1 specification. The design has been settled in [_workshop/2026-05-04-design-conversation.md](_workshop/2026-05-04-design-conversation.md). The spec text below is an outline; sections marked `TODO` will be expanded before v0.1 freeze.

## What this protocol specifies

A shared upper schema for normative content, expressed as a JSON-LD `@context` and a small set of JSON Schemas. The schema binds to the [Semantic Arts gist](https://www.semanticarts.com/gist/) upper ontology and references the [LegalRuleML 1.0](https://docs.oasis-open.org/legalruleml/legalruleml-core/v1.0/legalruleml-core-v1.0.html) deontic operators for compatibility.

## Core principles

1. **Obligation-first modeling** — normative content is mapped through the Obligations it creates, interprets, or allocates, not through the text of the source document.
2. **Bind to existing standards** — gist for upper ontology, LegalRuleML for deontic operators, Akoma Ntoso / ELI / ECLI / USLM for source-text IRIs. Reference, do not duplicate.
3. **Permanent IRIs** — `https://w3id.org/of/v1/` resolves to `https://obligationfirst.org/v1/`. The w3id IRI is canonical.
4. **Small core, explicit extensions** — the spine, the proceeding strand, the deontic quartet. Everything else is a downstream extension.

## Entity model

### The four-role spine

| Role | of: term | gist class | What it is |
|---|---|---|---|
| Authority | `of:Authority` | wraps `gist:Organization` (subtype as needed) | The party with interpretive or regulatory power |
| Container | `of:Instrument` | `gist:Agreement` / `gist:Specification` (subtype by kind) | The artifact with binding force — a law, an agreement, a ruling |
| Secondary | `of:Term` | `gist:ContractTerm` | A clause within an Instrument |
| Primary | `of:Obligation` | `gist:Requirement` / `gist:Restriction` / `gist:Permission` / `of:Reparation` | The behavior the Term creates, prohibits, permits, or repairs |

### The proceeding strand

| Role | of: term | gist class | What it is |
|---|---|---|---|
| Proceeding | `of:Proceeding` | `gist:Event` (subtype `LegalProceeding`) | The legal matter — docket, case, action |
| Allegation | `of:Allegation` | `gist:Statement` (asserted, unverified) | Asserted facts about what happened |
| Determination | `of:Determination` | `gist:Determination` | An Authority's ruling about Allegations and Obligations |

### The deontic quartet

`of:Obligation` has four subclasses, aligned with LegalRuleML 1.0 §5.3 deontic operators:

| of: term | LegalRuleML | gist | Meaning |
|---|---|---|---|
| `of:Requirement` | `lrml:Obligation` | `gist:Requirement` | A primary duty to act |
| `of:Restriction` | `lrml:Prohibition` | `gist:Restriction` | A primary duty to refrain |
| `of:Permission` | `lrml:Permission` | `gist:Permission` | An authorized capacity to act |
| `of:Reparation` | `lrml:Reparation` | (TODO: gist binding TBC) | A secondary duty triggered by violation of a primary obligation |

## Core relations

| of: term | Domain | Range | Meaning |
|---|---|---|---|
| `of:issuedBy` | Instrument | Authority | Who promulgated the Instrument |
| `of:hasTerm` | Instrument | Term | Composition |
| `of:creates` | Term | Obligation | The deontic content of a Term |
| `of:hasAllegation` | Proceeding | Allegation | Asserted facts in a matter |
| `of:hasDetermination` | Proceeding | Determination | Rulings issued in a matter |
| `of:decides` | Determination | Allegation | What the ruling resolved |
| `of:disposition` | Determination | (closed vocab) | confirmed / rejected / partial / dismissed / settled / vacated |
| `of:anchors` | Determination | Obligation | The Obligation the ruling interprets |
| `of:defeats` | Term | Term | Statutory exception relation (Lawsky default logic) |
| `of:executableEncoding` | Term \| Obligation | (typed reference) | Pointer to a Catala / Blawx / OpenFisca / other executable encoding |

## Authority interface

Every `of:Authority` requires:

```yaml
authority:
  "@type": "of:Authority"
  organization:
    "@type": "gist:Organization"   # or subtype
    name: "..."
  authority_basis:
    kind: "statutory" | "regulatory" | "contractual" | "corporate" | "judicial"
    instrument_ref: "..."          # IRI of the Instrument that grants authority
  jurisdiction:
    "@type": "gist:Jurisdiction"
    ref: "..."                     # ISO / ELI / etc.
```

The `authority_basis` is recursive: the HOA's authority traces to its bylaws, which are themselves an Instrument with provisions. Every Authority's right to act is grounded in an Instrument on the spine.

## Source-text compatibility

Obligation-First does not specify a source-text format. It references existing standards:

- **Akoma Ntoso** (OASIS LegalDocML, namespace `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`) for parliamentary and judicial documents
- **ELI** (European Legislation Identifier) for EU and member-state law IRIs
- **ECLI** (European Case Law Identifier) for case IRIs
- **USLM** (United States Legislative Markup) for US federal statutes

When a Term has a canonical source-text representation in any of these, its `@id` should be the standard's IRI.

## Sections to complete before v0.1 freeze

Status as of 2026-05-04:

- [x] JSON-LD `@context` v1 starter — published at [`schema/context.jsonld`](schema/context.jsonld)
- [x] Three worked examples — [Air Canada](examples/air-canada/), [Colorado SB 24-205](examples/colorado-sb24-205/), [Utah JIA](examples/publedge-jia-utah-72/)
- [x] Crosswalk tables — [gist](reference/crosswalks/gist.md), [LegalRuleML](reference/crosswalks/legalruleml.md), [Akoma Ntoso](reference/crosswalks/akomantoso.md), [ELI/ECLI](reference/crosswalks/eli-ecli.md)
- [ ] TODO: Per-entity JSON Schemas with required fields (`schema/*.schema.json`)
- [ ] TODO: Defeasibility semantics — precedence rules, transitive closure formalized
- [ ] TODO: `executableEncoding` reference shape — formalize the typed reference structure
- [ ] TODO: Conformance levels — minimum bind vs full bind
- [ ] TODO: Versioning policy — semver, breaking-change rules

## Findings from worked examples

Round-tripping the three examples surfaced these findings:

**Confirmed working:**
- Two Authorities attached to one Instrument (Colorado General Assembly + AG)
- One Term creating both a Requirement and a Reparation (the case Reparation was added for)
- Multi-valued `decides` on a Determination (Air Canada had two Allegations resolved by one ruling)
- The recursive Authority basis (BCCRT's authority traced to BC Civil Resolution Tribunal Act)
- Cross-portfolio `anchors` from a PubLedge JIA Obligation to an EveryAILaw Term — the bridge works as designed
- PubLedge adoption is purely additive: existing records bind via `@context` swap with no semantic loss

**Deferred to v0.2:**
- Typed `of:Remedy` entity for monetary awards and other consequences
- Closed party-role vocabulary for `Allegation.asserted_by`
- Symmetric `of:violationOf` relation (parallel to `of:creates`) for Reparations
- Closed vocabularies for `duty_holder_type`, `trigger` (kept repo-local in v0.1)
- LegalRuleML encoding pointer (`of:legalRuleMLEncoding` parallel to `of:executableEncoding`)
- Defeasibility sub-types (rebut vs undercut, priority hierarchies per LegalRuleML §7.4)

**Open for external review (see [outreach](reference/outreach/mccomb-one-pager.md)):**
- gist binding for Reparation — current placeholder is TBC; depends on Semantic Arts feedback
- Whether `gist:Statement` is the right binding for Allegation

## Changelog

- 0.1.0-draft (2026-05-04): Initial draft. Outline only. Spec text to be expanded before freeze.

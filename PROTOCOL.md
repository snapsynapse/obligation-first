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
| `of:disposition` | Determination | (closed vocab) | confirmed / rejected / partial / dismissed / settled / vacated / issued. Adjudicative dispositions (everything except `issued`) require `decides` to be non-empty; `issued` is the administrative form (promulgating an Instrument or recording posture) and may leave `decides` empty. |
| `of:anchors` | Determination \| Term \| Obligation | Obligation \| Term | Interpretive reference. (1) Determination → Obligation: the ruling interprets the obligation. (2) Term → Term: a JIA term interprets a statutory term. (3) Obligation → Obligation: a re-allocated obligation references its statutory ground. Always asserted, never inferred. |
| `of:defeats` | Term | Term | Term-level override (Lawsky default logic, LegalRuleML §7.4). Distinct from `anchors`: defeats is override; anchors is interpretation without override. |
| `of:supersedes` | Instrument | Instrument | Whole-Instrument replacement (post-enactment) |
| `of:wouldSupersede` | Instrument | Instrument | Whole-Instrument replacement (pre-enactment, subjunctive) |
| `of:executableEncoding` | Term \| Obligation | (typed reference) | Pointer to a Catala / Blawx / OpenFisca / other executable encoding |

## Instrument lifecycle and enforcement posture

Two fields together describe an Instrument's operating state:

- `of:status` — the legislative state. Closed enum: `proposed | enacted | in-force | amended | sunset | repealed | superseded | withdrawn`.
- `of:enforcement_status` — whether the Instrument's primary obligations can presently be enforced. Closed enum: `routine | constrained | unsignaled`. Default: `routine` when omitted.

The two are independent. An Instrument may be `enacted` and `routine` (operating normally), `enacted` and `constrained` (a court order, agency posture, or pending rulemaking has paused enforcement), or `proposed` and `unsignaled` (no enforcement question yet applies). Any combination is valid.

### Why enforcement cause lives in the proceeding strand, not in the status enum

`enforcement_status` is deliberately a small flat enum. It does **not** include cause-baked values like `stayed-by-court`, `pending-rulemaking`, `enjoined`, `agency-paused`, etc. The cause of a non-routine enforcement state is expressed via the proceeding strand: a `Determination` (court order, agency statement, executive action) that `anchors` to the affected Obligation.

This separation is deliberate, and the rationale is worth recording because it will be contested:

1. **The spine should describe state. The strand should describe causality.** The spine answers "what is this Instrument's current operating state?" The strand answers "what events affect or interpret it?" Mixing the cause of a state into the state field collapses these layers and makes them harder to query independently.

2. **Cause-baked enums are hostile to enum stability.** Every new cause requires a spec amendment, an enum extension, and an adopter migration. A flat status enum lets the schema stay stable while the proceeding strand absorbs new kinds of constraints — court orders, agency posture statements, legislative pauses, executive action, treaty obligations, emergency declarations — without changing the spine. The set of things that can constrain enforcement is open-ended; the spine should not pretend otherwise.

3. **Multiple causes can constrain at once.** A single Instrument can be enforcement-constrained by both a court order *and* an agency posture statement *and* a legislative review pause, all simultaneously. A scalar status field can carry only one value. The strand can carry many Determinations against the same Obligation, each with its own date, issuer, and source.

4. **Cause provenance lives where causality lives.** A `Determination` already carries `issued_date`, `issuedBy`, `source`, `decides`, and `anchors`. All the metadata needed to evaluate the cause's authority and recency is built in. Inventing parallel cause-substructure on the spine would duplicate the strand.

5. **Decoupling supports cross-jurisdictional comparability.** Two Instruments in different jurisdictions might both be `constrained` for entirely different reasons — one by a federal court order, another by an agency moratorium, a third by a pending statutory amendment. Comparing their enforcement statuses is meaningful precisely because the causes are factored out. Recombining cause and state into one enum forecloses that comparison.

The cost of this separation is one extra hop for adopters who want to display "stayed pending rulemaking" as a single phrase. The benefit is a stable spine and a strand that grows with the world.

## Supersession vs defeasibility

`of:defeats` and `of:supersedes` are different tools for different scopes.

| Predicate | Domain | Range | Scope | When |
|---|---|---|---|---|
| `of:defeats` | Term | Term | Cross-Term override within an Obligation graph | Always, when a specific exception applies |
| `of:supersedes` | Instrument | Instrument | Whole-Instrument replacement | Post-enactment of the superseding Instrument |
| `of:wouldSupersede` | Instrument | Instrument | Whole-Instrument replacement, subjunctive | Pre-enactment of the prospectively-superseding Instrument |

`of:supersedes` does **not** automatically imply `of:defeats` for child Terms. Adopters MUST assert Term-level defeats explicitly where they matter. This is a deliberate choice: most real supersessions carry savings clauses, transitional provisions, or partially exempted sections, and inferring blanket Term-level defeats from an Instrument-level supersession would steamroll those nuances. Validators MAY warn when a `superseded` Instrument has Terms with no incoming `defeats` from the superseding Instrument's Terms, but MUST NOT infer them.

`of:wouldSupersede` is used by `proposed` (or `amended`-in-flux) Instruments that do not yet have legal force. Once such an Instrument enacts, adopters SHOULD migrate the relation to `of:supersedes` and update the predecessor Instrument's `status` to `superseded`. The historical `wouldSupersede` assertion MAY be retained for audit, but `of:supersedes` is what makes the replacement authoritative.

Both `of:supersedes` and `of:wouldSupersede` are array-valued: a consolidating Instrument can replace several earlier ones.

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

## IRI resolution conventions

Adopters and reviewers should know what to expect when they dereference the various IRIs in an Obligation-First record. Three classes:

### MUST resolve

These URIs MUST return HTTP 200 with the appropriate content type. They are part of the spec's contract.

- `https://obligationfirst.org/v1/context.jsonld` — the JSON-LD context (`application/ld+json`)
- `https://obligationfirst.org/v1/schema/` — index of every published JSON Schema, with eight per-entity schemas at `authority`, `instrument`, `term`, `obligation`, `proceeding`, `allegation`, `determination`, `executable-encoding` (each `.schema.json`, served as `application/schema+json` or `application/json`)
- `https://obligationfirst.org/v1/` — namespace landing page (`text/html`)

If any of these 404, the spec is broken. They're CI-verified on every push (see `.github/workflows/test.yml`).

### SHOULD resolve

Adopter-published record `@id` values SHOULD return HTTP 200. This is Linked Data convention: a reader following `@id` should be able to fetch the record and learn something. Best practice is for the `@id` to be the URL where the JSON is served, with HTML representation available via content negotiation.

When an adopter binds to v0.1, they SHOULD ensure every record they publish (Authorities, Instruments, Terms, Obligations, Proceedings, Allegations, Determinations) resolves at its `@id`. The handoff documents under `reference/handoffs/` describe what this looks like for each current adopter.

### MAY resolve

Upstream-standard class IRIs (gist, LegalRuleML, Akoma Ntoso, ELI, ECLI) MAY or MAY NOT resolve depending on each publisher's policy. Notably:

- **gist namespace** (`https://w3id.org/semanticarts/ns/ontology/gist/`) resolves to a namespace overview page (200).
- **gist per-class IRIs** (e.g., `https://w3id.org/semanticarts/ns/ontology/gist/GovernmentOrganization`) currently return 404 — Semantic Arts publishes the namespace but not per-class HTML. The vendored Turtle file at `vendor/gist/gistCore.ttl` is the authoritative local reference.
- **LegalRuleML** publishes per-term IRIs that resolve to the OASIS standard documents.
- **ELI / ECLI** resolution depends on the member state's implementation.

These are URIs in the technical RDF/JSON-LD sense — globally unique identifiers that don't strictly require HTTP resolution for parsing or validation. Conformance Level 1 adopters are not required to host content at upstream URIs.

### Worked-example records

The records under `examples/*/records/*.json` use `@id` values that point at adopter-domain URLs (everyailaw.com, aiincidentlaw.org, publedge.org). Those URLs are aspirational — they illustrate what each adopter will mint when it binds. Until that binding is live, the JSON bytes for these example records are served from `https://obligationfirst.org/v1/examples/<slug>/records/<file>.json` so reviewers can fetch and validate against the published schemas immediately.

When each adopter completes its binding (see handoff documents), the adopter-domain URLs become the canonical homes; the obligationfirst.org mirror remains for spec-illustration purposes.

## Source-text compatibility

Obligation-First does not specify a source-text format. It references existing standards:

- **Akoma Ntoso** (OASIS LegalDocML, namespace `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`) for parliamentary and judicial documents
- **ELI** (European Legislation Identifier) for EU and member-state law IRIs
- **ECLI** (European Case Law Identifier) for case IRIs
- **USLM** (United States Legislative Markup) for US federal statutes

When a Term has a canonical source-text representation in any of these, its `@id` should be the standard's IRI.

## Defeasibility semantics

The `of:defeats` predicate expresses a cross-Term override relation: if Term A `defeats` Term B, then where both Terms apply to the same fact pattern, Term A's Obligations take precedence and Term B's Obligations are overridden.

### Precedence rules

1. **Direct defeat:** if `A defeats B`, A overrides B in any conflict.
2. **Transitive closure:** `defeats` is transitive. If `A defeats B` and `B defeats C`, then `A defeats C`. Adopters MAY compute the transitive closure for query optimization but MUST treat the explicit relation as authoritative.
3. **No mutual defeat:** `A defeats B` and `B defeats A` is invalid. Validators SHOULD reject mutual defeat at ingest time.
4. **Cross-Instrument defeat is allowed:** Term A in Instrument X may defeat Term B in Instrument Y. This expresses statutory supersession, regulatory preemption, and treaty-over-statute relations.
5. **Inferred conflict is out of scope.** `of:defeats` is asserted, not inferred. Adopters that wish to infer defeat from textual or logical analysis MUST emit explicit `of:defeats` relations as the inferred output; the predicate itself does not carry inference semantics.

### Sub-types

LegalRuleML §7.4 distinguishes *rebuttal* (the defeating rule provides an opposite conclusion) from *undercut* (the defeating rule attacks an inferential link). v0.1 does not formalize this distinction — `of:defeats` is binary in v0.1. v0.2 may introduce `of:rebuts` and `of:undercuts` as subproperties of `of:defeats`.

## ExecutableEncoding shape

`of:executableEncoding` is a polymorphic typed reference. Schema at [`schema/executable-encoding.schema.json`](schema/executable-encoding.schema.json). Required fields:

- `kind` — the execution engine (closed vocab: `catala`, `blawx`, `openfisca`, `logical-english`, `l4`, `lkif`, `lrml`, `other`)
- `uri` — IRI of the encoding artifact

Optional: `version`, `engine_version`, `notes`.

A Term or Obligation MAY have multiple `executableEncoding` references — one per engine. The schema does not constrain which engine adopters use; v0.x can expand the `kind` enum without breaking changes.

## Conformance levels

An adopter binds to Obligation-First v0.1 at one of three levels:

### Level 1 — IRI-only

The adopter publishes records using `of:` IRIs as `@id` and `@type` values, but does not validate against the JSON Schemas. Records are discoverable by any consumer that resolves IRIs.

Required: `@id` and `@type` use canonical `of:` IRIs. JSON-LD `@context` references `https://obligationfirst.org/v1/`.

### Level 2 — Schema-conformant (recommended)

The adopter passes JSON Schema validation for every published record. This is the recommended default.

Required: all of Level 1, plus every record validates against the appropriate `schema/*.schema.json`.

### Level 3 — Crosswalk-conformant

The adopter additionally publishes an `akn_uri` or `eli_uri` for every Instrument that has an authoritative external identifier, and binds Obligations to LegalRuleML deontic operators where applicable.

Required: all of Level 2, plus identifier round-trip with at least one of Akoma Ntoso, ELI, or ECLI where the source jurisdiction publishes one.

The three current adopters (PubLedge, EveryAILaw, AI Incident Law) target Level 2 for v0.1. Level 3 is aspirational; PubLedge will reach it first via existing Akoma Ntoso integrations.

## Versioning policy

Obligation-First follows [Semantic Versioning 2.0.0](https://semver.org/) with the following clarifications:

- **MAJOR** version increments break adopters: any change that would cause a Level 2 adopter's records to fail validation against the new schema, or any IRI relocation that breaks resolution.
- **MINOR** version increments are additive: new optional fields, new vocabulary entries (e.g., a new `disposition` enum value), new entities, new crosswalks.
- **PATCH** version increments are textual or clarifying only — no schema or vocabulary changes.

### IRI scheme

The IRI prefix is versioned by major:

- v1.x → `https://w3id.org/of/v1/` (resolves to `https://obligationfirst.org/v1/`)
- v2.x → `https://w3id.org/of/v2/`

Adopters bind to the major-version IRI, not to a specific minor/patch. A v1.5 record uses `@context: https://w3id.org/of/v1/`, not `https://w3id.org/of/v1.5/`.

### Pre-v0.1 (current)

Drafting in public. Breaking changes allowed. All changes recorded in [CHANGELOG.md](CHANGELOG.md).

### v0.1 freeze

Once v0.1 freezes:

- Breaking changes require a 14-day comment window if any external adopter has bound to the schema
- The CHANGELOG must call out every breaking change explicitly
- Each breaking change requires a migration note for adopters

### v1.0 commitment

Once v1.0 ships:

- No breaking changes within v1.x. Period.
- v2.0 is the only path for breaking changes thereafter.
- Both v1.x and v2.x will be maintained for at least 12 months after v2.0 ships, to give adopters a transition window.

### Deprecation

A field, vocabulary entry, or relation deprecated in v1.x is removed only in v2.0. Deprecation is announced in the CHANGELOG, in the relevant JSON Schema's `description`, and in `reference/deprecations.md` (created when first needed).

## Sections complete

Status as of 2026-05-04:

- [x] JSON-LD `@context` v1 — [`schema/context.jsonld`](schema/context.jsonld)
- [x] Per-entity JSON Schemas — [`schema/authority`](schema/authority.schema.json), [`instrument`](schema/instrument.schema.json), [`term`](schema/term.schema.json), [`obligation`](schema/obligation.schema.json), [`proceeding`](schema/proceeding.schema.json), [`allegation`](schema/allegation.schema.json), [`determination`](schema/determination.schema.json), [`executable-encoding`](schema/executable-encoding.schema.json)
- [x] Three worked examples — [Air Canada](examples/air-canada/), [Colorado SB 24-205](examples/colorado-sb24-205/), [Utah JIA](examples/publedge-jia-utah-72/)
- [x] Crosswalk tables — [gist](reference/crosswalks/gist.md), [LegalRuleML](reference/crosswalks/legalruleml.md), [Akoma Ntoso](reference/crosswalks/akomantoso.md), [ELI/ECLI](reference/crosswalks/eli-ecli.md)
- [x] Defeasibility semantics
- [x] `executableEncoding` reference shape
- [x] Conformance levels
- [x] Versioning policy

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

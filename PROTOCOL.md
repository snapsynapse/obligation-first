---
"@type": "https://w3id.org/semanticarts/ns/ontology/gist/Specification"
title: "Obligation-First Protocol"
version: "0.3.0-draft"
license: "CC-BY-4.0"
created: 2026-05-04
modified: 2026-05-26
---

# Obligation-First Protocol

> **Status: v0.3.0-draft.** v0.3 federates record identity: every `@id` is adopter-local, opaque, and permanent (renames preserved via HTTP 301), and cross-adopter interoperability is carried by standard identifier crosswalks (ELI, ECLI, Akoma Ntoso, Wikidata) declared in a per-adopter `.well-known` naming profile, not by shared slugs. Jurisdiction is a typed ISO 3166 field. This reverses the earlier guidance that a Term's `@id` should be the standard source-text IRI. Additive and non-breaking to v0.1 / v0.2 records. The prior v0.2.x line absorbed Semantic Arts feedback (Dave McComb, 2026-05-26) as binding-only updates. See [CHANGELOG.md](CHANGELOG.md) and the decision record at [reference/iri-naming-and-crosswalks.md](reference/iri-naming-and-crosswalks.md). Remaining v0.3 freeze gates are LegalRuleML community feedback, permanent w3id.org redirect filing, and the naming-profile format plus crosswalk schema additions.

## What this protocol specifies

A shared upper schema for normative content, expressed as a JSON-LD `@context` and a small set of JSON Schemas. The schema binds to the [Semantic Arts gist](https://semanticarts.com/gist/) upper ontology and references the [LegalRuleML 1.0](https://docs.oasis-open.org/legalruleml/legalruleml-core/v1.0/legalruleml-core-v1.0.html) deontic operators for compatibility.

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
| Primary | `of:Obligation` | `gist:Requirement` / `gist:Restriction` / `gist:Permission` / (Reparation: see deontic-quartet section below) | The behavior the Term creates, prohibits, permits, or repairs |

### The proceeding strand

| Role | of: term | gist class | What it is |
|---|---|---|---|
| Proceeding | `of:Proceeding` | `gist:Event` (subtype `LegalProceeding`) | The legal matter — docket, case, action |
| Allegation | `of:Allegation` | `gist:Content` (assertion text) + `gist:Intention` (speech-act intent, when intent-bearing) | Asserted facts about what happened |
| Determination | `of:Determination` | `gist:Determination` | An Authority's ruling about Allegations and Obligations |

### The deontic quartet

`of:Obligation` has four subclasses, aligned with LegalRuleML 1.0 §5.3 deontic operators:

| of: term | LegalRuleML | gist | Meaning |
|---|---|---|---|
| `of:Requirement` | `lrml:Obligation` | `gist:Requirement` | A primary duty to act |
| `of:Restriction` | `lrml:Prohibition` | `gist:Restriction` | A primary duty to refrain |
| `of:Permission` | `lrml:Permission` | `gist:Permission` | An authorized capacity to act |
| `of:Reparation` | `lrml:Reparation` | `gist:Requirement` + `gist:Intention` (+ `gist:Event` when actuated) — see Reparation gist-binding note below | A secondary duty triggered by violation of a primary obligation |

**Reparation gist binding (v0.2).** `of:Reparation` is kept as a distinct deontic subclass — LegalRuleML 1:1 alignment, SPARQL queryability (`?r a of:Reparation`), and type-keyed validators all depend on it. What v0.2 changed is the *gist* binding for that class, per Semantic Arts feedback (Dave McComb, 2026-05-26). gist does not need a fourth deontic class; instead it expresses reparation as a layered pattern: the secondary duty is a `gist:Requirement`; the declared legislative intent to repair (compensation, restitution, deterrence) attaches as `gist:Intention` to the creating Term; the actuated reparation, when it occurs, is recorded via the proceeding strand and conceptually maps to `gist:Event`. v0.1 left this binding open; v0.2 closes it. See [reference/crosswalks/gist.md](reference/crosswalks/gist.md) for the full rationale.

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
| `of:defeats` | Term | Term | Term-level override (Lawsky default logic, LegalRuleML §7.4). General/fallback defeasibility predicate. Distinct from `anchors`: defeats is override; anchors is interpretation without override. |
| `of:rebuts` | Term | Term | Subproperty of `of:defeats`. Defeating Term denies the *conclusion* of the defeated Term (a counter-rule that asserts the opposite outcome). Per LegalRuleML §7.4 rebut/undercut distinction. Any `of:rebuts` assertion also entails `of:defeats`. |
| `of:undercuts` | Term | Term | Subproperty of `of:defeats`. Defeating Term denies the *applicability* of the defeated Term in this context (an exception that says the rule doesn't fire here, without contradicting it elsewhere). Per LegalRuleML §7.4. Any `of:undercuts` assertion also entails `of:defeats`. |
| `of:violationOf` | Reparation | Obligation | Symmetric/inverse predicate of `triggers_on_violation_of`. Adopters MAY assert it from either side; if both directions are present, they must be consistent. Added in v0.2 so SPARQL queries can traverse the violation relation from the primary-Obligation side without walking the trigger field. |
| `of:supersedes` | Instrument | Instrument | Whole-Instrument replacement (post-enactment) |
| `of:wouldSupersede` | Instrument | Instrument | Whole-Instrument replacement (pre-enactment, subjunctive) |
| `of:executableEncoding` | Term \| Obligation | (typed reference) | Pointer to a Catala / Blawx / OpenFisca / other executable encoding. Both Term and Obligation accept the field; schemas (`schema/term.schema.json`, `schema/obligation.schema.json`) reflect this. |

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

### `@id` federation and crosswalks

Record `@id` values are adopter-local, opaque, and permanent. An `@id` identifies the adopter's record about a legal entity, not the entity's canonical external identifier. Obligation-First does not prescribe slug grammar; each adopter declares its own naming scheme (see "Naming profiles and identifier crosswalks" below).

External standard identifiers (ELI, ECLI, Akoma Ntoso, urn:lex, Wikidata, and the rest) are carried as typed crosswalk properties on the record, never as the `@id`. Cross-adopter joins key on these crosswalks, not on slugs: two adopters referencing the same statute agree on its `eli_uri`, not on whether one wrote `colorado-sb24-205` and the other `us-co-legislature-statute-2024-sb24-205`.

Permanence: once published, an `@id` does not change. If an adopter reorganizes its namespace, the old `@id` MUST continue to resolve via an HTTP 301 redirect (W3C "Cool URIs Don't Change"). A rename is therefore never a breaking change as long as the redirect persists. This is what lets canonical identity and "do not restructure anyone's files" coexist. See `reference/iri-naming-and-crosswalks.md` for the full decision record.

### Worked-example records

The records under `examples/*/records/*.json` use `@id` values under adopter-domain hosts (everyailaw.com, aiincidentlaw.org, publedge.org). Per "`@id` federation and crosswalks" above, an example `@id` is not a prediction of what an adopter will mint. Where the referenced entity already exists in an adopter's published export, the example MUST use that adopter's actual IRI rather than invent a plausible one. The policy for entities an adopter has not yet minted (a neutral obligationfirst.org example namespace versus a proposed-extension marker) is being finalized; see `reference/iri-naming-and-crosswalks.md`. The current example records predate this rule and are being realigned to it.

Until realignment is complete, the JSON bytes for these example records are served from `https://obligationfirst.org/v1/examples/<slug>/records/<file>.json` so reviewers can fetch and validate against the published schemas immediately.

For enrichment work, `scripts/report-anchor-graph.mjs` reports `anchors` edges across one or more worked-example or adopter exports. It distinguishes base Obligation-First export coverage from populated anchor edges, validates target type when the target record is present, and lists unresolved external targets so adopter repos can add or mirror the missing record-side binding deliberately.

## Source-text compatibility

Obligation-First does not specify a source-text format. It references existing standards:

- **Akoma Ntoso** (OASIS LegalDocML, namespace `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`) for parliamentary and judicial documents
- **ELI** (European Legislation Identifier) for EU and member-state law IRIs
- **ECLI** (European Case Law Identifier) for case IRIs
- **USLM** (United States Legislative Markup) for US federal statutes

When a Term has a canonical source-text representation in any of these, it SHOULD carry the standard's IRI as a typed crosswalk property (`akn_uri`, `eli_uri`, `ecli`), not as its `@id`. Record `@id` values are always adopter-local and permanent; see "`@id` federation and crosswalks" above. (This reverses earlier guidance that a Term's `@id` should be the standard IRI. No live adopter ever did this; the spec is corrected to match practice and to keep all `@id` values federated.)

## Naming profiles and identifier crosswalks

Obligation-First does not standardize adopter slug grammar. Instead, each adopter declares its own scheme and binds interoperability to standard identifiers carried as crosswalks. Full decision record: `reference/iri-naming-and-crosswalks.md`.

### Naming profile

A bound adopter (Level 2 and above) publishes a naming profile at a `.well-known` location, describing the IRI scheme for each entity type using existing vocabulary:

- VoID `void:uriSpace` and `void:uriRegexPattern` for the namespace and pattern its `@id` values follow.
- An RFC 6570 URI Template for the generative form (e.g. `https://example.org/{type}/{slug}`).
- A declared list of which crosswalks the adopter supplies per entity type.

The profile is adopter-owned and adopter-published. Obligation-First consumes and validates against it; it does not prescribe the slug grammar. This is by design: a spec-held prescription of adopter naming is exactly what drifted from reality in the binding handoffs. ELI is the precedent — each EU member state publishes its own ELI URI template and a registry collects them.

### Jurisdiction

Every entity with a jurisdiction carries it as a typed `jurisdiction` field using ISO 3166-2 (or ISO 3166-1 for national and supranational bodies). Jurisdiction is never a slug component. MUST at Level 2.

### Identifier crosswalk matrix

Requirements are RFC 2119 and conditional on coverage; an adopter is never failed for an identifier its jurisdiction does not issue. This is the recommended baseline. An adopter's actual obligations are whatever its naming profile declares.

| Entity | Crosswalk | Req | Condition |
|---|---|---|---|
| Authority | Wikidata QID (`sameAs`) | SHOULD | body has an entry |
| Authority | LCNAF, ISNI, EU Named Authority List | MAY | supplements or substitutes |
| Instrument | ELI (`eli_uri`) | MUST | jurisdiction issues ELIs |
| Instrument | `citation` | SHOULD | always |
| Instrument | urn:lex | MAY | fallback where no ELI |
| Instrument | Akoma Ntoso (`akn_uri`) | MAY | AKN encoding exists |
| Term | Akoma Ntoso element IRI (`akn_uri`) | SHOULD | provision has an AKN representation |
| Term | `section` | MUST | always |
| Term | executable encoding | MAY | executable logic exists |
| Obligation | LegalRuleML deontic alignment | SHOULD | the `of:` deontic class already maps |
| Obligation | EuroVoc concept (`sameAs`) | SHOULD | subject has a EuroVoc concept |
| Proceeding | ECLI | MUST | ECLI jurisdiction |
| Proceeding | neutral citation | MUST | common-law neutral-citation jurisdiction, no ECLI |
| Proceeding | docket / CourtListener id | SHOULD | US and other docket systems |
| Allegation | doctrine / legal-concept ref | MAY | claim maps to a named doctrine |
| Determination | ECLI / neutral citation | MUST | citable court decision |
| Determination | urn:lex / source-document id | SHOULD | administrative determination |

The crosswalk fields above are optional at the JSON-Schema layer (`additionalProperties` already admits them); the matrix governs Level 3 conformance, not schema validity. Formal schema and `context.jsonld` additions for the new crosswalk properties are tracked as follow-on work in `reference/iri-naming-and-crosswalks.md`.

## Defeasibility semantics

The `of:defeats` predicate expresses a cross-Term override relation: if Term A `defeats` Term B, then where both Terms apply to the same fact pattern, Term A's Obligations take precedence and Term B's Obligations are overridden.

### Precedence rules

1. **Direct defeat:** if `A defeats B`, A overrides B in any conflict.
2. **Transitive closure:** `defeats` is transitive. If `A defeats B` and `B defeats C`, then `A defeats C`. Adopters MAY compute the transitive closure for query optimization but MUST treat the explicit relation as authoritative.
3. **No mutual defeat:** `A defeats B` and `B defeats A` is invalid. Validators SHOULD reject mutual defeat at ingest time.
4. **Cross-Instrument defeat is allowed:** Term A in Instrument X may defeat Term B in Instrument Y. This expresses statutory supersession, regulatory preemption, and treaty-over-statute relations.
5. **Inferred conflict is out of scope.** `of:defeats` is asserted, not inferred. Adopters that wish to infer defeat from textual or logical analysis MUST emit explicit `of:defeats` relations as the inferred output; the predicate itself does not carry inference semantics.

### Sub-types

LegalRuleML §7.4 distinguishes *rebuttal* (the defeating rule provides an opposite conclusion) from *undercut* (the defeating rule attacks the applicability of the defeated rule in this context). v0.1 used a single binary `of:defeats` for both cases. v0.2 introduces `of:rebuts` and `of:undercuts` as subproperties of `of:defeats`:

- **`of:rebuts`** — the defeating Term asserts an *opposite outcome*. Example: a later statute that reverses the legal conclusion of an earlier rule on the same facts.
- **`of:undercuts`** — the defeating Term denies that the defeated Term *applies* in this context. Example: an exception clause that carves a fact pattern out of an otherwise-applicable rule without contradicting the rule elsewhere.
- **`of:defeats`** — kept as the general/fallback predicate. Use it when the distinction is unknown, irrelevant to the consumer, or when both forms apply.

The subproperty relation means any assertion of `of:rebuts(A, B)` or `of:undercuts(A, B)` also entails `of:defeats(A, B)`. Adopters MAY use the general predicate alone (v0.1-compatible) or upgrade specific edges to the more precise predicate. The precedence rules above apply uniformly to all three predicates.

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

Required: all of Level 1, plus every record validates against the appropriate `schema/*.schema.json`; plus a published `.well-known` naming profile (see "Naming profiles and identifier crosswalks"); plus `jurisdiction` carried as an ISO 3166 code on every entity that has one. The naming-profile and jurisdiction requirements were added with the `@id`-federation decision (2026-06-02); they tighten Level 2 going forward but are not a record-validation break, since `additionalProperties` already admits the fields.

### Level 3 — Crosswalk-conformant

The adopter additionally carries, on every applicable record, each identifier crosswalk its naming profile declares — with the matrix in "Naming profiles and identifier crosswalks" as the recommended baseline. In practice this means ELI or Akoma Ntoso for instruments where the jurisdiction issues them, ECLI or neutral citation for proceedings and determinations, and the deontic and subject alignments for obligations.

Required: all of Level 2, plus every crosswalk declared in the adopter's profile is present where applicable, and at least one standard legal-source or case identifier round-trips where the source jurisdiction publishes one.

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
- Priority hierarchies per LegalRuleML §7.4 (rebut/undercut sub-types landed in v0.2 as `of:rebuts` / `of:undercuts`; explicit priority chains remain deferred)

**Resolved in v0.2 by external review (see [external review questions](reference/review/external-review-questions.md)):**
- gist binding for `of:Reparation`: layered pattern `gist:Requirement` + `gist:Intention` (declared intent on the creating Term) + `gist:Event` (actuated reparation, recorded via the proceeding strand). The `of:Reparation` class itself is preserved — LegalRuleML 1:1 alignment and SPARQL queryability depend on it. Per Dave McComb / Semantic Arts, 2026-05-26.
- Allegation gist binding: `gist:Statement` does not exist in gist; bind assertion text to `gist:Content` and reach for `gist:Intention` only when the claim is intent-bearing.

## Changelog

- 0.1.0-draft (2026-05-04): Initial draft. Outline only. Spec text to be expanded before freeze.
- 0.2.0-draft (2026-05-26): Semantic Arts feedback absorbed as binding-only updates. `of:Reparation` retained as a distinct deontic subclass; its gist binding closed to the layered pattern `gist:Requirement` + `gist:Intention` + (when actuated) `gist:Event`. Allegation gist binding switched from non-existent `gist:Statement` to `gist:Content` (+ `gist:Intention` when intent-bearing). No of:-vocabulary or adopter-record changes. See [CHANGELOG.md](CHANGELOG.md).
- 0.2.1-draft (2026-05-26): Patch draft release package added under `docs/releases/v0.2.1-draft/` with machine-readable manifest and SHA-256 checksum index for public artifacts.
- 0.2.2-draft (2026-05-30): Security hardening draft. The adopter graph validator now rejects administrative Determinations with `disposition: issued` unless they cite a `target_instrument` or anchor; example and adopter graph validation share one implementation; CI runs the full contract suite; release hashes, GuideCheck guide metadata, and content provenance checks are enforced locally.
- 0.3.0-draft (2026-06-02): `@id` federation and identifier crosswalks. Record `@id` values are adopter-local and permanent; external standard identifiers ride as typed crosswalks; each adopter publishes a `.well-known` naming profile; jurisdiction is a typed ISO 3166 field; Level 2 and Level 3 conformance redefined accordingly. Reverses the Term-`@id`-is-standard-IRI guidance. Additive and non-breaking. Decision record: `reference/iri-naming-and-crosswalks.md`.

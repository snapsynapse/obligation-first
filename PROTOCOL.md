---
"@type": "https://w3id.org/semanticarts/ns/ontology/gist/Specification"
title: "Obligation-First Protocol"
version: "0.6.1"
license: "CC-BY-4.0"
created: 2026-05-04
modified: 2026-08-04
---

# Obligation-First Protocol

> **Status: v0.6.1.** This release implements the shared semantic contract exercised by EveryAILaw, PubLedge, and AI Incident Law. It separates issuance from administration, enforcement, and adjudication; separates normative force from lifecycle, operative effect, and enforcement; adds Party, Jurisdiction, and Tombstone records; reserves `text` for exact source text; adds shared provenance; and replaces concept membership through `exactMatch` with `gist:isCategorizedBy`. Existing v0.5 records remain schema-valid. Adopters using the v0.6 vocabulary declare `obligation-first >=0.6.0 <0.7.0` and migrate their projections with the supplied fixture and validator.

## What this protocol specifies

A shared upper schema for normative content, expressed as a JSON-LD `@context` and a small set of JSON Schemas. The schema binds to the [Semantic Arts gist](https://semanticarts.com/gist/) upper ontology and references the [LegalRuleML 1.0](https://docs.oasis-open.org/legalruleml/legalruleml-core/v1.0/legalruleml-core-v1.0.html) deontic operators for compatibility.

## Core principles

1. **Obligation-first modeling** — normative content is mapped through the Obligations it creates, interprets, or allocates, not through the text of the source document.
2. **Bind to existing standards** — gist for upper ontology, LegalRuleML for deontic operators, Akoma Ntoso / ELI / ECLI / USLM for source-text IRIs. Reference, do not duplicate.
3. **Permanent IRIs** — `https://w3id.org/of/v1/` is the planned permanent vocabulary prefix and will resolve to `https://obligationfirst.org/v1/` once the w3id.org redirect is filed (planned before v1.0 freeze; see ROADMAP). Until then, `https://obligationfirst.org/v1/` is the live resolution target and the only prefix whose resolution is CI-verified.
4. **Small core, explicit extensions** — the spine, the proceeding strand, the deontic quartet, the category layer. Everything else is a downstream extension.

## Entity model

### The four-role spine

| Role | of: term | gist class | What it is |
|---|---|---|---|
| Authority | `of:Authority` | wraps `gist:Organization` (subtype as needed) | An organization with an evidenced legal, administrative, adjudicative, enforcement, or standards role |
| Container | `of:Instrument` | `gist:Agreement` / `gist:Specification` (subtype by kind) | A normative artifact, whether binding, contractual, voluntary, or nonbinding |
| Secondary | `of:Term` | `gist:Specification`; contractual terms may also bind to `gist:ContractTerm` | A clause or provision within an Instrument |
| Primary | `of:Obligation` | `gist:Requirement` / `gist:Restriction` / `gist:Permission` / (Reparation: see deontic-quartet section below) | The behavior the Term creates, prohibits, permits, or repairs |

### The proceeding strand

| Role | of: term | gist class | What it is |
|---|---|---|---|
| Proceeding | `of:Proceeding` | `of:LegalProceeding` over `gist:Event` | The legal matter — docket, case, action |
| Allegation | `of:Allegation` | `gist:Content` (assertion text) + `gist:Intention` (speech-act intent, when intent-bearing) | Asserted facts about what happened |
| Determination | `of:Determination` | `gist:Determination` | An authoritative act that establishes a legal outcome: adjudicative when it resolves Allegations, administrative when it promulgates an Instrument or records posture |

### Supporting record types

| of: term | Binding | Purpose |
|---|---|---|
| `of:Party` | role-bearing record over `gist:Person` or `gist:Organization` | Identifies participants, duty holders, beneficiaries, and asserting parties without reducing them to strings |
| `of:Jurisdiction` | legal competence | Keeps territorial coverage and institutional competence separate |
| `of:Tombstone` | compatibility record | Keeps a retired IRI queryable without pretending the former representation is still a live entity |

### The deontic quartet

`of:Obligation` has four subclasses, aligned with LegalRuleML 1.0 §5.3 deontic operators:

| of: term | LegalRuleML | gist | Meaning |
|---|---|---|---|
| `of:Requirement` | `lrml:Obligation` | `gist:Requirement` | A primary duty to act |
| `of:Restriction` | `lrml:Prohibition` | `gist:Restriction` | A primary duty to refrain |
| `of:Permission` | `lrml:Permission` | `gist:Permission` | An authorized capacity to act |
| `of:Reparation` | `lrml:Reparation` | `gist:Requirement` + `gist:Intention` (+ `gist:Event` when actuated) — see Reparation gist-binding note below | A secondary duty triggered by violation of a primary obligation |

`of:Obligation` itself is also valid for a concrete, source-grounded normative position whose deontic operator has not yet been verified. This is an explicit evidence state. A v0.6 adopter MUST NOT silently convert an unknown operator into `of:Requirement`.

**Reparation gist binding (v0.2).** `of:Reparation` is kept as a distinct deontic subclass — LegalRuleML 1:1 alignment, SPARQL queryability (`?r a of:Reparation`), and type-keyed validators all depend on it. What v0.2 changed is the *gist* binding for that class, per Semantic Arts feedback (Dave McComb, 2026-05-26). gist does not need a fourth deontic class; instead it expresses reparation as a layered pattern: the secondary duty is a `gist:Requirement`; the declared legislative intent to repair (compensation, restitution, deterrence) attaches as `gist:Intention` to the creating Term; the actuated reparation, when it occurs, is recorded via the proceeding strand and conceptually maps to `gist:Event`. v0.1 left this binding open; v0.2 closes it. See [reference/crosswalks/gist.md](reference/crosswalks/gist.md) for the full rationale.

### The category layer

`of:ObligationCategory` is a jurisdiction-neutral duty concept — "human oversight", "incident reporting", "bias prevention". It is the commensurability layer: two Obligations in different jurisdictions are comparable because they carry the same category, not because their texts resemble each other.

A Category is deliberately **not** a duty. It is created by no Term, binds no duty holder, carries no jurisdiction, and nobody can comply with one. Anything actually owed by someone under some Instrument is an Obligation. The test is simple: if you can ask "who owes this, and under which Instrument?" and get an answer, it is an Obligation.

Two predicates connect the layers, and they mean different things:

| From | Predicate | To | Reading |
|---|---|---|---|
| Obligation | `isCategorizedBy` | ObligationCategory | This concrete duty is classified under this gist:Category |
| Determination, Obligation | `anchors` | ObligationCategory | This record concerns the concept generally, not any one statutory duty |

The second row is why Categories are anchorable rather than merely a classification vocabulary. A court sanctioning a lawyer for unreviewed AI output is about human oversight as a concept; there is often no single statutory Obligation it interprets. Forcing that edge onto an arbitrary statutory Obligation would assert something false. Anchoring the Category asserts what is actually true.

The failure mode this guards against is the inverse: an adopter publishing Categories *as* its Obligations, so that the graph's most-referenced nodes are concepts and the statutory duties have no records at all. A Category with a `created_by` is a modelling error.

Categories are adopter-published, like every other record. The spec defines the type and the two predicates; it does not define a canonical taxonomy or arbitrate whose is correct. Use `scheme` to say which vocabulary a Category belongs to, `isCategorizedBy` for membership, and `exactMatch` only to align concepts across vocabularies.

## Core relations

| of: term | Domain | Range | Meaning |
|---|---|---|---|
| `of:issuedBy` | Instrument or Determination | Authority | The evidenced issuer or promulgator. Array-capable for joint issuance |
| `of:administeredBy` | Instrument | Authority | The body administering the Instrument |
| `of:regulatedBy` | Instrument | Authority | The body exercising a regulatory role over the Instrument |
| `of:enforcedBy` | Instrument | Authority | The body with an evidenced enforcement role |
| `of:heardBy` | Proceeding | Authority | The body hearing the matter. Do not use `issuedBy` for this relation |
| `of:hasTerm` | Instrument | Term | Composition |
| `of:creates` | Term | Obligation | The deontic content of a Term |
| `of:recognizedBy` | Obligation | Determination | A pre-existing duty recognized by a Determination, including common-law duties |
| `of:imposedBy` | Obligation | Determination | A duty imposed directly by a Determination |
| `gist:isCategorizedBy` | Obligation | ObligationCategory | Category membership. `exactMatch` is not a classification predicate |
| `of:hasAllegation` | Proceeding | Allegation | Asserted facts in a matter |
| `of:hasDetermination` | Proceeding | Determination | Rulings issued in a matter |
| `of:decides` | Determination | Allegation | What the ruling resolved |
| `of:disposition` | Determination | (closed vocab) | confirmed / rejected / partial / dismissed / settled / vacated / issued. Adjudicative dispositions require non-empty `decides`. Administrative issuance uses empty `decides` and identifies `resulting_instrument`, legacy `target_instrument`, or `anchors` |
| `of:resultingInstrument` | Determination | Instrument | Explicit join from an issuance Determination to forward-looking normative text represented as an Instrument |
| `of:constrains` | Determination | Instrument / Term / Obligation / Determination | Limits operative or enforcement effect without collapsing the cause into a status value |
| `of:vacates` | Determination | Determination | Nullifies a prior Determination |
| `of:anchors` | Determination \| Term \| Obligation | Obligation \| Term \| ObligationCategory | Interpretive reference. (1) Determination → Obligation: the ruling interprets the obligation. (2) Term → Term: a JIA term interprets a statutory term. (3) Obligation → Obligation: a re-allocated obligation references its statutory ground. (4) Determination → ObligationCategory: the ruling concerns the duty concept generally rather than any one statutory obligation. Always asserted, never inferred. |
| `of:scheme` | ObligationCategory | (IRI) | The concept scheme this Category belongs to (skos:inScheme). Lets an adopter publish more than one taxonomy and lets a consumer tell whose taxonomy a Category came from. |
| `of:defeats` | Term | Term | Term-level override (Lawsky default logic, LegalRuleML §7.4). General/fallback defeasibility predicate. Distinct from `anchors`: defeats is override; anchors is interpretation without override. |
| `of:rebuts` | Term | Term | Subproperty of `of:defeats`. Defeating Term denies the *conclusion* of the defeated Term (a counter-rule that asserts the opposite outcome). Per LegalRuleML §7.4 rebut/undercut distinction. Any `of:rebuts` assertion also entails `of:defeats`. |
| `of:undercuts` | Term | Term | Subproperty of `of:defeats`. Defeating Term denies the *applicability* of the defeated Term in this context (an exception that says the rule doesn't fire here, without contradicting it elsewhere). Per LegalRuleML §7.4. Any `of:undercuts` assertion also entails `of:defeats`. |
| `of:violationOf` | Reparation | Obligation | Symmetric/inverse predicate of `triggers_on_violation_of`. Adopters MAY assert it from either side; if both directions are present, they must be consistent. Added in v0.2 so SPARQL queries can traverse the violation relation from the primary-Obligation side without walking the trigger field. |
| `of:supersedes` | Instrument | Instrument | Whole-Instrument replacement (post-enactment) |
| `of:wouldSupersede` | Instrument | Instrument | Whole-Instrument replacement (pre-enactment, subjunctive) |
| `of:repeals` | Instrument | Instrument | Ends a prior Instrument without asserting a replacement |
| `of:amends` | Instrument or Term | same source level | Partially changes a prior Instrument or Term. Cross-level amendment is invalid |
| `of:executableEncoding` | Term \| Obligation | (typed reference) | Pointer to a Catala / Blawx / OpenFisca / other executable encoding. Both Term and Obligation accept the field; schemas (`schema/term.schema.json`, `schema/obligation.schema.json`) reflect this. |

## Normative force, lifecycle, operative effect, and enforcement

v0.6 keeps four questions independent:

| Dimension | Field | Values |
|---|---|---|
| What kind of normative claim is this? | `normative_force` | `binding`, `voluntary`, `nonbinding`, `contractual`, `unknown` |
| Where is it in its legal lifecycle? | `lifecycle_status` | `draft`, `proposed`, `adopted`, `enacted`, `in-force`, `future`, `inactive`, `stayed`, `amended`, `sunset`, `repealed`, `superseded`, `withdrawn`, `unknown` |
| Does it presently operate for this record? | `operative_status` | `operative`, `future`, `inactive`, `stayed`, `repealed`, `not-applicable`, `unknown` |
| What is known about enforceability? | `enforcement_status` | `routine`, `constrained`, `unsignaled`, `enforceable`, `stayed`, `not-enforceable`, `unknown` |

Dates such as `effective`, `full_enforcement`, and `sunset` are facts, not substitutes for those dimensions. A derived status should carry `computed_as_of`. Missing evidence, an unknown value, a future date, inactivity, a stay, repeal, and non-applicability are distinct states.

The v0.5 `status` field and its values remain accepted for migration compatibility. New v0.6 projections should publish `lifecycle_status` and should not infer `routine` or `enforceable` from mere enactment.

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

## Authority and source interface

Every `of:Authority` requires an identified organization. `authority_basis` and `jurisdiction` are optional because an adopter MUST omit them when its evidence does not support them:

```yaml
authority:
  "@type": "of:Authority"
  organization:
    "@type": "gist:Organization"   # or subtype
    name: "..."
  authority_basis:
    - kind: "statutory"            # or regulatory, constitutional, treaty,
      instrument_ref: "..."        # charter, contractual, judicial,
                                    # common-law, or standards-body
  jurisdiction:
    "@type": "of:Jurisdiction"
    territorial_scope: ["us-ut"]
    institutional_scope: ["Utah Office of Artificial Intelligence Policy"]
```

`authority_basis` is array-capable and must cite an Instrument, source URL, or source citation. A validator rejects fabricated self-fragments as evidence. `issuedBy` means issuer or promulgator only. Administration, regulation, enforcement, and hearing use their dedicated predicates.

`Term.text` is exact source text. Editorial paraphrase belongs in `summary`. Shared provenance fields are `source`, `source_citation`, `source_locator`, `source_version`, `language`, `evidence_type`, `verified`, `retrieved`, and `asserted_by_adopter`. Adopter-specific metadata belongs in a named extension context rather than the shared `of:` vocabulary.

## IRI resolution conventions

Adopters and reviewers should know what to expect when they dereference the various IRIs in an Obligation-First record. Three classes:

### MUST resolve

These URIs MUST return HTTP 200 with the appropriate content type. They are part of the spec's contract.

- `https://obligationfirst.org/v1/context.jsonld` — the JSON-LD context (`application/ld+json`)
- `https://obligationfirst.org/v1/schema/` lists fourteen schemas: eleven record schemas (`authority`, `jurisdiction`, `party`, `instrument`, `term`, `obligation`, `obligation-category`, `proceeding`, `allegation`, `determination`, `tombstone`) plus `common`, `executable-encoding`, and `naming-profile`.
- `https://obligationfirst.org/v1/` — namespace landing page (`text/html`)

If any of these 404, the spec is broken. They're CI-verified on every push (see `.github/workflows/test.yml`).

### SHOULD resolve

Adopter-published record `@id` values SHOULD return HTTP 200. This is Linked Data convention: a reader following `@id` should be able to fetch the record and learn something. Best practice is for the `@id` to be the URL where the JSON is served, with HTML representation available via content negotiation.

An adopter SHOULD ensure every record it publishes resolves at its `@id`, including compatibility Tombstones. The handoff documents describe what this looks like for each current adopter.

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

The records under `examples/*/records/*.json` use neutral, suffixless `obligationfirst.org` example IRIs. Real-world identity rides in `sameAs`, standard legal-identifier crosswalks, and explicit `anchors` to actual adopter records. An example never predicts an adopter slug or uses a teaching identifier as the canonical identifier of an external entity.

Until realignment is complete, the JSON bytes for these example records are served from `https://obligationfirst.org/v1/examples/<slug>/records/<file>.json` so reviewers can fetch and validate against the published schemas immediately.

For enrichment work, `scripts/report-anchor-graph.mjs` reports `anchors` edges across one or more worked-example or adopter exports. It distinguishes base Obligation-First export coverage from populated anchor edges, validates target type when the target record is present, and lists unresolved external targets so adopter repos can add or mirror the missing record-side binding deliberately.

## Source-text compatibility

Obligation-First does not specify a source-text format. It references existing standards:

- **Akoma Ntoso** (OASIS LegalDocML, namespace `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`) for parliamentary and judicial documents
- **ELI** (European Legislation Identifier) for EU and member-state law IRIs
- **ECLI** (European Case Law Identifier) for case IRIs
- **USLM** (United States Legislative Markup) for US federal statutes

When a Term has a canonical source-text representation in any of these, it SHOULD carry the standard's IRI as a typed crosswalk property (`akn_uri`, `eli_uri`, `ecli_uri`), not as its `@id`. Record `@id` values are always adopter-local and permanent; see "`@id` federation and crosswalks" above. (This reverses earlier guidance that a Term's `@id` should be the standard IRI. No live adopter ever did this; the spec is corrected to match practice and to keep all `@id` values federated.)

## Naming profiles and identifier crosswalks

Obligation-First does not standardize adopter slug grammar. Instead, each adopter declares its own scheme and binds interoperability to standard identifiers carried as crosswalks. Full decision record: `reference/iri-naming-and-crosswalks.md`.

### Naming profile

A bound adopter (Level 2 and above) MUST publish a naming profile describing the IRI scheme it follows for each entity type, using existing vocabulary:

- VoID `void:uriSpace` and `void:uriRegexPattern` for the namespace and pattern its `@id` values follow.
- An RFC 6570 URI Template (`uriTemplate`) for the generative form (e.g. `https://example.org/instruments/{slug}`).
- A declared list (`crosswalks`) of which crosswalks the adopter supplies per entity type.

The profile is adopter-owned and adopter-published. Obligation-First consumes and validates against it; it does not prescribe the slug grammar. This is by design: a spec-held prescription of adopter naming is exactly what drifted from reality in the binding handoffs. ELI is the precedent — each EU member state publishes its own ELI URI template and a registry collects them.

#### Canonical location and media type

The profile MUST be served at the well-known path

```text
/.well-known/obligation-first-naming-profile.jsonld
```

with `Content-Type: application/ld+json` over HTTPS. The profile is a JSON-LD document of `@type` `of:NamingProfile`, referencing `@context: https://obligationfirst.org/v1/context.jsonld`, and MUST validate against [`schema/naming-profile.schema.json`](schema/naming-profile.schema.json) (published at `https://obligationfirst.org/v1/schema/naming-profile.schema.json`).

The profile is descriptive, not aspirational: `void:uriRegexPattern` MUST match the `@id` values the adopter actually mints today, including any served-file suffix (e.g. `.json`) the adopter currently uses. Where the adopter's scheme diverges from the spec's suffixless-canonical recommendation (see decision #19), the profile records reality; the recommendation is a target, not a gate.

A worked profile and its sidecar are in [`examples/naming-profiles/`](examples/naming-profiles/).

#### Profile shape

```json
{
  "@context": "https://obligationfirst.org/v1/context.jsonld",
  "@type": "of:NamingProfile",
  "profileVersion": "1.0.0",
  "appliesTo": "obligation-first >=0.6.0 <0.7.0",
  "adopter": "https://example.org/",
  "entities": {
    "Instrument": {
      "void:uriSpace": "https://example.org/instruments/",
      "void:uriRegexPattern": "^https://example\\.org/instruments/[a-z0-9-]+$",
      "uriTemplate": "https://example.org/instruments/{slug}",
      "crosswalks": ["eli_uri", "citation"]
    }
  }
}
```

`entities` carries one entry per Obligation-First entity type the adopter mints (`Authority`, `Jurisdiction`, `Party`, `Instrument`, `Term`, `Obligation`, `ObligationCategory`, `Proceeding`, `Allegation`, `Determination`, `Tombstone`); an adopter declares only the types it publishes. An optional profile-level `jurisdiction` sets a legal-competence default; per-record jurisdiction always wins.

#### Declaring a spec version range

`appliesTo` states which Obligation-First versions the profile is written against. Two forms are accepted:

| Form | Example | Means |
|---|---|---|
| Range (preferred) | `obligation-first >=0.6.0 <0.7.0` | Comparators, all of which must hold |
| Pinned minor | `obligation-first 0.4.x` | `>=0.4.0 <0.5.0` |

Declare a floor at the first version whose vocabulary the projection uses. A v0.5 projection may retain its legacy range while it migrates. A projection using Party, Tombstone, `isCategorizedBy`, `heardBy`, separated lifecycle fields, or the v0.6 provenance contract must floor at 0.6.0.

The pinned form was the only form through v0.4 and made every additive release a flag day: each adopter had to move its profile in lockstep with the spec or fail, whether or not the release affected it. The range form removes the coupling without weakening the check — a floor declared because the profile genuinely needs a new type still fails loudly against an older checkout, and that failure is the useful one.

Adopters verify with `scripts/check-adopter-of-version.mjs` (wired as `check:of` in EveryAILaw, PubLedge, and AI Incident Law). The schema deliberately enforces no `pattern` on `appliesTo`; the grammar lives in the checker, where a mistake is a clear error message rather than a schema rejection of an already-published profile.

#### Provenance sidecar

Alongside the profile, an adopter SHOULD publish a flat `key: value` manifest at

```text
/.well-known/obligation-first-naming-profile-manifest.txt
```

served as `text/plain`, making the profile tamper-evident. This mirrors the GuideCheck assistant-guide manifest pattern: the body is structured data, the sidecar is human-reviewable provenance. Required fields:

```text
profile-path: /.well-known/obligation-first-naming-profile.jsonld
profile-version: 2.0.0
profile-sha256: <64-hex SHA-256 of the profile bytes>
profile-bytes: <byte length of the profile>
adopter: https://example.org/
spec: obligation-first
spec-version-range: >=0.6.0, <0.7.0
canonical-url: https://example.org/.well-known/obligation-first-naming-profile.jsonld
```

`repository-url` and `released-at` are RECOMMENDED. `profile-sha256` and `profile-bytes` MUST match the served profile.

#### Discovery

A consumer resolving cross-adopter links SHOULD locate an adopter's profile via the well-known path above. Adopters SHOULD also reference it from their `agents.json` (a `naming_profile` endpoint) and `llms.txt`. Discovery MUST NOT require script execution.

### Jurisdiction

`of:Jurisdiction` represents legal competence, not geography. A jurisdiction may have either or both of:

- `territorial_scope`: geographic coverage identifiers. ISO 3166-1 and ISO 3166-2 are preferred where they describe the territory, including a documented reserved code such as `eu`.
- `institutional_scope`: organizations, treaties, standards bodies, or legal orders whose competence is not reducible to a territory.

Organizations such as OECD, G7, Council of Europe, and ISO belong in institutional scope, not in an invented geographic code. The legacy embedded `gist:Jurisdiction` plus `ref` shape remains accepted for the v0.5 migration window. New v0.6 records use `of:Jurisdiction`, either as a separately identified record or as an embedded legal-competence object. Jurisdiction is never a slug component and MUST be omitted when the source does not support it.

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

The crosswalk fields above are optional at the JSON-Schema layer; the matrix governs Level 3 conformance, not schema validity. The crosswalk properties (`sameAs`, `exactMatch`, `neutral_citation`, `urn_lex`, `jurisdiction`, and the `*_uri` identifiers) are declared in `context.jsonld` and in the per-entity schemas, and entity records remain open (`additionalProperties: true`) for crosswalks not yet declared.

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

A Term or Obligation MAY have multiple `executableEncoding` references — one per engine. The entity schemas accept either a single encoding object or a non-empty array of them. The schema does not constrain which engine adopters use; v0.x can expand the `kind` enum without breaking changes.

## Conformance levels

An adopter binds to Obligation-First at one of three levels. Legacy v0.5 shapes remain accepted during the v0.6 migration window, but an adopter claims v0.6 only after applying the v0.6 semantic distinctions and passing the current schema-and-graph gates:

### Level 1 — IRI-only

The adopter publishes records using `of:` IRIs as `@id` and `@type` values, but does not validate against the JSON Schemas. Records are discoverable by any consumer that resolves IRIs.

Required: `@id` and `@type` use canonical `of:` IRIs. JSON-LD `@context` references `https://obligationfirst.org/v1/context.jsonld` — the context document itself, which serves `application/ld+json` and is processable by any JSON-LD processor. (The bare namespace URL `https://obligationfirst.org/v1/` serves the HTML landing page and is not a valid context reference.) Records published prior to v0.4.x used the bare namespace form as their `@context`; consumers MAY accept it for those legacy records, but new records MUST reference the context document.

### Level 2 — Schema-and-graph-conformant (recommended)

The adopter passes JSON Schema validation for every published record and graph validation over every emitted surface. This is the recommended default.

Required: all of Level 1; every record validates against the appropriate `schema/*.schema.json`; inverse, domain, range, category, identity-retirement, lifecycle-coherence, Determination-join, replacement, and defeasibility-cycle checks pass; aggregate, per-record, companion, deprecated, and Tombstone surfaces agree; and the adopter publishes a `.well-known` naming profile. Jurisdiction is carried as typed legal competence when the source supports one and is omitted when it does not. Validation reports identify the Obligation-First version, source commit, and dirty state.

### Level 3 — Crosswalk-conformant

The adopter additionally carries, on every applicable record, each identifier crosswalk its naming profile declares — with the matrix in "Naming profiles and identifier crosswalks" as the recommended baseline. In practice this means ELI or Akoma Ntoso for instruments where the jurisdiction issues them, ECLI or neutral citation for proceedings and determinations, and the deontic and subject alignments for obligations.

Required: all of Level 2, plus every crosswalk declared in the adopter's profile is present where applicable, and at least one standard legal-source or case identifier round-trips where the source jurisdiction publishes one.

The released v0.6 projections for PubLedge, EveryAILaw, and AI Incident Law pass Level 2 federation validation. Within the federated graph, AI Incident Law is authoritative for adjudicative Determinations arising from its public matters. PubLedge is authoritative for administrative issuance Determinations attached to its Instruments. `issuedBy` always identifies the Authority that acted; it never implies that PubLedge itself issued a ruling. Level 3 remains aspirational.

## Versioning policy

Obligation-First follows [Semantic Versioning 2.0.0](https://semver.org/) with the following clarifications:

- **MAJOR** version increments break adopters: any change that would cause a Level 2 adopter's records to fail validation against the new schema, or any IRI relocation that breaks resolution.
- **MINOR** version increments are additive: new optional fields, new vocabulary entries (e.g., a new `disposition` enum value), new entities, new crosswalks.
- **PATCH** version increments are textual or clarifying only — no schema or vocabulary changes.

### IRI scheme

The planned permanent vocabulary prefix is versioned by major:

- v1.x → `https://w3id.org/of/v1/` (will resolve to `https://obligationfirst.org/v1/` once the w3id.org redirect is filed)
- v2.x → `https://w3id.org/of/v2/`

Adopters bind through the major-version context URL, not to a specific minor/patch. A v1.5 record uses `@context: https://obligationfirst.org/v1/context.jsonld`, not `https://obligationfirst.org/v1.5/context.jsonld`.

### Pre-v1.0 (current)

Drafting in public. Before v1.0, a conformance-breaking change requires a minor version, an explicit notice, and a deterministic migration fixture. All changes are recorded in [CHANGELOG.md](CHANGELOG.md).

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

Status as of 2026-08-04:

- [x] JSON-LD `@context` v1 — [`schema/context.jsonld`](schema/context.jsonld)
- [x] Fourteen JSON Schema documents: eleven entity schemas plus [`common`](schema/common.schema.json), [`executable-encoding`](schema/executable-encoding.schema.json), and [`naming-profile`](schema/naming-profile.schema.json)
- [x] Four worked examples — [Air Canada](examples/air-canada/), [Colorado SB 24-205](examples/colorado-sb24-205/), [Utah JIA](examples/publedge-jia-utah-72/), and [EU AI Act Article 50](examples/eu-ai-act-article-50/)
- [x] Crosswalk tables — [gist](reference/crosswalks/gist.md), [LegalRuleML](reference/crosswalks/legalruleml.md), [Akoma Ntoso](reference/crosswalks/akomantoso.md), [ELI/ECLI](reference/crosswalks/eli-ecli.md)
- [x] Defeasibility semantics
- [x] `executableEncoding` reference shape
- [x] Conformance levels
- [x] Versioning policy

## Findings from worked examples

Round-tripping the four examples and three adopter projections surfaced these findings:

**Confirmed working:**
- Two Authorities attached to one Instrument (Colorado General Assembly + AG)
- One Term creating both a Requirement and a Reparation (the case Reparation was added for)
- Multi-valued `decides` on a Determination (Air Canada had two Allegations resolved by one ruling)
- Evidence-bearing Authority bases that may be omitted when a source does not establish the basis
- Party records, typed proceeding roles, and a common-law Obligation recognized by the Air Canada Determination
- Cross-portfolio `anchors` from a PubLedge JIA Term to an EveryAILaw Term and from its Obligation to an EveryAILaw ObligationCategory — the bridge works at both specificity levels
- PubLedge contractual Terms can assert both `of:Term` and `gist:ContractTerm`, while administrative issuance remains a separate Determination joined to its Instrument

**Still deferred:**
- Typed `of:Remedy` entity for monetary awards and other consequences
- Closed party-role vocabulary for `Allegation.asserted_by`
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
- 0.3.1 (2026-06-02): All user-, agent-, and documentation-facing surfaces realigned to the v0.3 federation model; the four worked examples moved to a neutral example namespace with crosswalks; the `-draft` suffix dropped from this release forward. Additive and non-breaking.
- 0.4.1 (2026-06-09): Documentation-consistency patch from external semantic review: README/NOTICE license-note reconciliation, phantom `gist:Court` removed from annotations, schema count corrected (nine published schemas), w3id resolution claim corrected to future tense, version-narrative drift fixed, Colorado example SB26-189 issuer corrected to the General Assembly. No vocabulary or validation-relevant schema change. See [CHANGELOG.md](CHANGELOG.md); the review's substantive findings are tracked in an internal handoff and will land as decision records.
- 0.4.0 (2026-06-03): Naming-profile format defined. The `.well-known` naming profile is now a concrete, validatable standard: a JSON-LD document of `@type` `of:NamingProfile` served at `/.well-known/obligation-first-naming-profile.jsonld` (`application/ld+json`), with a flat `text/plain` provenance sidecar at `/.well-known/obligation-first-naming-profile-manifest.txt`. Adds `schema/naming-profile.schema.json`, the `void` prefix and profile terms to `context.jsonld`, a worked profile under `examples/naming-profiles/`, and the `validate:naming-profile` CI gate. Closes a v0.3 freeze gate. Additive and non-breaking to adopter records.

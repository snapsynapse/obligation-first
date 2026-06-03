# Handoff: bind EveryAILaw to Obligation-First v0.1

> Reconciled to live adopter data and the v0.3 federation model on 2026-06-02; earlier prescriptive slug schemes are withdrawn. Under v0.3 the record `@id` is adopter-local, opaque, and permanent; the adopter declares its own slug grammar in a `.well-known` naming profile and Obligation-First does not prescribe it; jurisdiction is a typed ISO 3166 field, never a slug component; and standard identifiers (ELI, ECLI, Akoma Ntoso, urn:lex, Wikidata) ride as typed crosswalk properties, not as the `@id`. The "mint these slugs" guidance below is replaced accordingly. See `reference/iri-naming-and-crosswalks.md` for the controlling decision.

This document describes the work to make EveryAILaw a Level-2-conformant Obligation-First adopter. Goal: every record EveryAILaw publishes — laws, provisions, obligations, authorities — round-trips through the v0.1 schemas, dereferences at canonical EveryAILaw URLs, and contributes to the cross-portfolio link graph that makes the spec valuable.

This is not a name-only adoption. Real binding produces:

- Machine-readable records every Obligation-First-aware tool can consume without scraping
- Cross-jurisdictional comparability (two laws with the same Obligation become commensurable)
- A clean join target for AI Incident Law Determinations and PubLedge JIAs
- A foundation for the visualization layer (lifecycle state machine, cross-jurisdictional diff) targeted in v0.2

Smallest binding effort of the three current adopters. Recommended first.

## What the adopter ships

Three deliverables:

1. **Every published record carries `@context` and `@type`** keyed to `of:` IRIs.
2. **Every record dereferences at a stable `@id` URL** under `everyailaw.com`.
3. **Schema validation runs in CI** so a record that drifts from the v0.1 schemas blocks merge.

## Current EveryAILaw shape

EveryAILaw already has the right four directories:

```
data/
  authorities/      → maps to of:Authority
  instruments/      → maps to of:Instrument
  provisions/       → maps to of:Term
  obligations/      → maps to of:Obligation (one of the deontic-quartet subclasses)
```

This means EveryAILaw is the **smallest lift** of the three current adopters — the conceptual model already matches the spine. The work is mostly mechanical: add JSON-LD framing, ensure URL resolution, wire validation.

## Step-by-step binding

### 1. Add JSON-LD framing to every record

Each record under `data/{instruments,provisions,authorities,obligations}/` gets two new top-level fields:

```yaml
"@context": "https://obligationfirst.org/v1/"
"@type": "of:Instrument"   # or of:Term, of:Authority, of:Requirement, etc.
```

For `data/obligations/`, pick the right deontic subclass per record: `of:Requirement`, `of:Restriction`, `of:Permission`, or `of:Reparation`. The vast majority of existing AI-law obligations are Requirements; impact-assessment-on-violation-style consequences are Reparations.

### 2. Mint canonical `@id` values

Every record's `@id` is the URL where the record is served. Under the v0.3 federation model the `@id` is adopter-local, opaque, and permanent: it identifies EveryAILaw's record about a legal entity, not the entity's canonical external identifier. Obligation-First does not prescribe the slug grammar — EveryAILaw declares its own in a `.well-known` naming profile that the spec consumes and validates against. Jurisdiction is carried in a typed ISO 3166 field, never jammed into the slug, and standard identifiers (ELI, ECLI, Akoma Ntoso) ride as typed crosswalks, never as the `@id`.

What EveryAILaw actually publishes today (the live grammar to follow, not invent against):

```
https://everyailaw.com/authority/<slug>.json     (e.g., colorado-ag, european-commission)
https://everyailaw.com/instrument/<slug>.json     (e.g., colorado-sb24-205, eu-ai-act)
https://everyailaw.com/term/<slug>.json           (e.g., colorado-sb24-205-transparency)
https://everyailaw.com/obligation/<slug>.json     (e.g., transparency, bias-prevention)
```

Note the live shape against the withdrawn prescription: full state names (`colorado-`, not `us-co-`) with jurisdiction also carried separately as a typed `us-co` field; full authority names (`colorado-ag`, `european-commission`, not `us-co-general-assembly` or `eu-commission`); a `.json` served suffix declared in EveryAILaw's own profile; terms named by topic (`-transparency`) rather than by section number; and obligations as abstract concepts shared across many laws (`transparency`, `bias-prevention`) rather than one obligation per provision. These are legitimate adopter editorial choices, not drift. Treat the live export under `docs/api/v1/of/` as authoritative for the grammar.

### 3. Translate existing fields to v0.1 relations

| Existing EveryAILaw field | v0.1 relation |
|---|---|
| Provision's parent law (implicit, by directory) | `parent_instrument` (of:Term → of:Instrument) |
| Provision creates an obligation (often free-text "creates") | `creates` (of:Term → of:Obligation, array) |
| Instrument's `enforced_by` | new `of:Authority` record + `issuedBy` on the Instrument; Reparations get `enforcement_authority` |
| Instrument's lifecycle phase | `status` (closed enum) and `enforcement_status` (closed enum) |
| Cross-references between provisions | `defeats` where the relationship is exception/override |
| Replacement of an older law | `supersedes` post-enactment, `wouldSupersede` pre-enactment |

The Colorado SB 24-205 example in [obligation-first/examples/colorado-sb24-205/](https://github.com/snapsynapse/obligation-first/blob/main/examples/colorado-sb24-205/README.md) demonstrates the full mapping for one law. Use it as the pattern.

### 4. Serve records at canonical URLs

Each record needs to dereference. Two ways depending on EveryAILaw's existing pipeline:

**Option A (recommended): JSON alongside HTML.** EveryAILaw already publishes HTML pages per regulation. Serve the JSON record at the same URL with content negotiation, OR at a `.json` companion URL:

```
https://everyailaw.com/instrument/co-sb24-205            (HTML, current)
https://everyailaw.com/instrument/co-sb24-205.json       (JSON-LD, new)
```

**Option B (simpler): JSON only, with HTML rendering generated from it.** The JSON becomes the source of truth; HTML is built from the JSON at deploy time.

Either works. Option A is faster to ship; B is more elegant long-term.

### 5. Validate against the v0.1 schemas in CI

Add to EveryAILaw's CI:

```yaml
- name: Validate against Obligation-First v0.1 schemas
  run: |
    npm install ajv ajv-formats js-yaml
    node scripts/validate-against-of-v1.mjs
```

The script (modeled on [obligation-first/scripts/validate-examples.mjs](https://github.com/snapsynapse/obligation-first/blob/main/scripts/validate-examples.mjs)) walks every record, fetches the matching schema from `https://obligationfirst.org/v1/schema/<entity>.schema.json` (or vendors a copy locally for offline runs), and validates. Failure blocks merge.

### 6. Cross-link to AI Incident Law and PubLedge

Once AI Incident Law has bound, its `Determination.anchors` will reference EveryAILaw's real published `@id` values for the Obligations the ruling interprets. EveryAILaw's records don't need outbound references to make this work — the join is asserted from the AI-Incident-Law side. Cross-adopter links target EveryAILaw's actual published IRIs (resolved from the live export or EveryAILaw's `.well-known` profile), not slugs guessed from a naming convention.

Same for PubLedge: a JIA's Obligations carry `anchors` pointing at EveryAILaw's real Term/Obligation IRIs.

EveryAILaw's responsibility is to keep `@id` values stable so the inbound links don't break. Treat `@id` as a permanent identifier — never change a slug after publication. If a namespace reorganization is unavoidable, the old `@id` MUST keep resolving via HTTP 301.

## Verification checklist

A bind is complete when all of these pass:

- [ ] Every record under `data/` carries `@context: "https://obligationfirst.org/v1/"`
- [ ] Every record carries `@type` matching one of the eight v0.1 entity types
- [ ] Every record's `@id` resolves to a 200 response on `everyailaw.com`
- [ ] CI runs schema validation against `https://obligationfirst.org/v1/schema/*.schema.json`
- [ ] At least one Instrument has `status` + `enforcement_status` set explicitly (Colorado SB 24-205 is the canonical demo case)
- [ ] At least one Instrument-pair has either `supersedes` or `wouldSupersede` set, where the legislative landscape supports it
- [ ] One Term has `defeats` set, where a real exception applies (Colorado §6-1-1707 rebuttable-presumption defeats §6-1-1703 duty is the worked example)
- [ ] At least one Obligation has `executableEncoding` set (forward-looking — fine to be null until a Catala or Blawx encoding lands)
- [ ] Round-trip test: a third party (PubLedge JIA author, AI Incident Law researcher) can fetch any EveryAILaw record and use it without further documentation

## Real value this binding produces

- **Compliance teams** can query "show me every Requirement applicable to high-risk AI developers across all enacted state-level US laws" without scraping HTML
- **Researchers** can compare definitions across jurisdictions ("how do Colorado, NYC LL144, and EU AI Act define 'high-risk AI system'?") via the schema, not the prose
- **AI Incident Law cases** anchor cleanly to specific EveryAILaw Obligations, making case-to-statute joins automatic
- **PubLedge JIAs** can declare which EveryAILaw Term they interpret, creating a public interpretation index
- **The visualization layer** targeted in Obligation-First v0.2 (lifecycle state machine, cross-jurisdictional diff) consumes these records directly — EveryAILaw becomes the data source for those visualizations

## Out of scope for the binding

- Akoma Ntoso element-level encoding (formal binding deferred to v0.2)
- Multi-language source text (deferred to v0.2)
- Catala or Blawx executable encodings of any provision (forward-looking; the field exists but null is fine)

## Estimated effort

- Mechanical translation of existing records: 1-2 days for someone familiar with EveryAILaw's structure
- URL serving (Option A or B): 0.5-1 day depending on existing pipeline
- CI integration: 2-3 hours
- Verification + first round-trip with AI Incident Law: 2-3 hours

Total: ~3-4 working days for a first cut. Less if the existing data already has clean slugs and the build pipeline is JSON-aware.

## After binding

When this is done, EveryAILaw becomes the reference adopter — the case study Obligation-First points at when explaining what a real binding looks like. Update the README of obligation-first to mark EveryAILaw as ✓ live (rather than "binding planned"), and the v0.1 freeze gate's "first adopter binding" item closes.

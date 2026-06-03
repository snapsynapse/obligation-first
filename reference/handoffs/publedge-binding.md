# Handoff: bind PubLedge to Obligation-First v0.1

> Reconciled to live adopter data and the v0.3 federation model on 2026-06-02; earlier prescriptive slug schemes are withdrawn. Under v0.3 the record `@id` is adopter-local, opaque, and permanent; PubLedge declares its own slug grammar in a `.well-known` naming profile and Obligation-First does not prescribe it; jurisdiction is a typed ISO 3166 field, never a slug component; and standard identifiers (ELI, ECLI, Akoma Ntoso, urn:lex, Wikidata) ride as typed crosswalk properties, not as the `@id`. Cross-adopter `anchors` target the other adopter's real published IRI, not a guessed slug. See `reference/iri-naming-and-crosswalks.md` for the controlling decision.

This document describes the work to bind PubLedge's joint-interpretation corpus (JIAs, RMAs, no-action letters, advisory opinions, private letter rulings) to Obligation-First v0.1. PubLedge is unique among the three current adopters: the four-role spine originated in PubLedge and was lifted to Obligation-First. So this binding is largely a swap, not a restructure.

The Utah JIA worked example in [obligation-first/examples/publedge-jia-utah-72/](https://github.com/snapsynapse/obligation-first/blob/main/examples/publedge-jia-utah-72/README.md) confirmed the binding is **purely additive** — every existing PubLedge record can carry the new `@context` reference without losing or changing any data.

## What changes

Two material changes, plus a third optional improvement that v0.1's new fields enable:

1. **`@context` swap.** PubLedge currently uses repo-local context references. Records gain (or replace with) `@context: "https://obligationfirst.org/v1/"` to bind to the canonical Obligation-First context.
2. **Issuance-as-Determination.** PubLedge currently records issuance via a frontmatter string `issuance_event: gist:Determination`. Under v0.1, the act of issuing a JIA is itself a `of:Determination` record (with `disposition: issued` and `target_instrument` pointing at the JIA). This makes the issuance linkable from anywhere — e.g., a future case that cites the JIA can reference the Determination directly.
3. **Obligation-as-typed-record (optional).** PubLedge currently stores `obligation_kind: [requirement, permission]` as a frontmatter list, with the actual obligations expressed in prose. Under v0.1, each obligation becomes its own typed record (`of:Requirement`, `of:Permission`, etc.) under `data/obligations/`. Optional because the prose form remains valid for documentation, but the record form is what the cross-portfolio link graph consumes.

## Step-by-step binding

### 1. Update PubLedge's published `@context`

Every record under `data/examples/instruments/`, `data/examples/authorities/`, and `data/examples/obligations/` adds a JSON-LD context reference. Two patterns work:

**A. Replace with the canonical context:**
```yaml
"@context": "https://obligationfirst.org/v1/"
```

**B. Compose: canonical + repo-local extension:**
```yaml
"@context":
  - "https://obligationfirst.org/v1/"
  - "https://publedge.org/schema/v1/"
```

Pattern B is recommended because PubLedge has its own vocabulary additions (instrument-kind taxonomies for JIA/RMA/no-action-letter, party-role enumerations) that aren't in v0.1's core. Both contexts compose cleanly.

### 2. Add `@type` aligned with v0.1

The mapping is direct:

| PubLedge record kind | v0.1 `@type` |
|---|---|
| Instrument (JIA, RMA, no-action letter, advisory opinion, PLR, statute) | `of:Instrument` |
| Authority (Utah OAIP, SEC, CFPB, IRS, CFTC, Utah Legislature, etc.) | `of:Authority` |
| Obligation (requirement, restriction, permission) | one of `of:Requirement`, `of:Restriction`, `of:Permission` |
| Term within an Instrument | `of:Term` |

What PubLedge actually publishes today: instruments keyed by full issuance ID (e.g. `utah-oaip.json` as the authority, `us-ut-oaip-jia-2026-001.json` / `us-ut-oaip-rma-2025-001.json` as instruments), `.json`-served, with jurisdiction carried as a typed `us-ut` field rather than in the slug. These are PubLedge's declared grammar; the spec consumes the profile and does not prescribe it.

Existing PubLedge records already use `"@type": "https://w3id.org/semanticarts/ns/ontology/gist/Agreement"` — this is gist's Agreement class. Under v0.1, the type becomes `of:Instrument` (which itself binds to `gist:Agreement` for Agreements and `gist:Specification` for Specifications). The shift is from declaring the gist class directly to declaring the Obligation-First class that wraps it. Gives adopter tools a single dispatch handle.

### 3. Replace `issuance_event: string` with a Determination record

For each existing instrument, create a corresponding Determination record under `data/examples/determinations/`:

```yaml
"@context": "https://obligationfirst.org/v1/"
"@type": "of:Determination"
"@id": "https://publedge.org/determination/<instrument-slug>-issuance"
issued_date: <enacted date from the instrument>
issuedBy: <Authority @id from the instrument's issued_by>
disposition: "issued"
target_instrument: <Instrument @id>
notes: "Issuance of the <instrument-title>."
```

The instrument record drops `issuance_event` and gains a back-reference (or leaves the link implicit via `target_instrument` from the Determination side).

This is what the Utah JIA worked example in obligation-first calls out as the first additive change.

### 4. Lift inline obligations to typed records (optional, recommended)

Currently, a PubLedge JIA's prose body contains the obligations the parties have agreed to. Under v0.1, those become first-class `of:Requirement` / `of:Restriction` / `of:Permission` records, with the Term that creates each.

For example, the Utah Mental Health Chatbot Disclosure JIA (`us-ut-oaip-jia-2026-001`) has a prose section "Display disclosure" with sub-requirements. Under v0.1:

The `@id` values below follow PubLedge's own live grammar (full issuance IDs, `.json`-served), not a spec-prescribed scheme:

```yaml
"@type": "of:Term"
"@id": "https://publedge.org/term/us-ut-oaip-jia-2026-001-1.json"
text: "Provider must display the standardized GenAI disclosure on first session..."
parent_instrument: "https://publedge.org/instrument/us-ut-oaip-jia-2026-001.json"
creates:
  - "https://publedge.org/obligation/us-ut-oaip-jia-2026-001-display-disclosure.json"
```

```yaml
"@type": "of:Requirement"
"@id": "https://publedge.org/obligation/us-ut-oaip-jia-2026-001-display-disclosure.json"
title: "Display disclosure on first session"
duty_holder_type: "provider"
content: "Plainly identify the service as an AI chatbot on first session."
created_by: "https://publedge.org/term/us-ut-oaip-jia-2026-001-1.json"
anchors:
  - "<EveryAILaw's real published Term/Obligation @id for the Utah disclosure provision, resolved from EveryAILaw's live export>"
```

The `anchors` field is the cross-portfolio join that makes PubLedge JIAs queryable from EveryAILaw's side: someone reading the EveryAILaw page for the Utah disclosure provision can pivot to "every JIA that interprets this." Critically, the anchor target must be EveryAILaw's actual published IRI (resolved from its live export under `docs/api/v1/of/` or its `.well-known` naming profile), not a slug guessed from a convention. Cross-adopter joins key on the real IRI and on shared standard identifiers (crosswalks), never on a predicted slug.

### 5. Adopt v0.1's lifecycle and supersession fields where applicable

PubLedge JIAs and RMAs evolve over time. No-action letters in particular tend to chain — a 2024 letter may be superseded by a 2026 letter on the same question. v0.1 has the predicates for this:

- `status`: track whether each instrument is `proposed`, `enacted` (issued), `superseded`, `withdrawn`, etc.
- `enforcement_status`: typically `routine` for an issued JIA where parties are following it; `unsignaled` while proposed.
- `supersedes` / `wouldSupersede`: when a later instrument replaces an earlier one in the same chain.

The Utah JIA example in obligation-first surfaces this as applicability — current JIA doesn't exercise it, but PubLedge's no-action-letter chains are the natural use case.

### 6. Wire validation in PubLedge's CI

PubLedge already has CI. Add a step that validates every published record against the Obligation-First v0.1 schemas:

```yaml
- name: Validate against Obligation-First v0.1 schemas
  run: node scripts/validate-against-of-v1.mjs
```

The script (modeled on [obligation-first/scripts/validate-examples.mjs](https://github.com/snapsynapse/obligation-first/blob/main/scripts/validate-examples.mjs)) walks `data/examples/` and validates each record against its `@type`'s schema.

### 7. Update PubLedge's PROTOCOL and PRIOR-ART to reference Obligation-First

PubLedge's PROTOCOL.md should add a section noting that PubLedge is a Level-2 Obligation-First adopter, with the binding documented at `https://obligationfirst.org/`. PRIOR-ART.md and DEFINITIONS.md may benefit from cross-references where shared vocabulary appears.

## Verification checklist

- [ ] Every record under `data/examples/{instruments,authorities,obligations,determinations}/` carries `@context` referencing `https://obligationfirst.org/v1/`
- [ ] Every record carries `@type` matching one of the eight v0.1 entity types
- [ ] Every existing instrument has a corresponding Determination record (the issuance event)
- [ ] Inline obligations have been (or are being) lifted to typed records under `data/examples/obligations/` (optional but recommended)
- [ ] At least one Term has `anchors` pointing at a real EveryAILaw `@id` (cross-portfolio join demonstrated)
- [ ] CI runs schema validation against `https://obligationfirst.org/v1/schema/*.schema.json`
- [ ] PubLedge's existing test suite continues to pass after the binding
- [ ] The MANIFEST.yaml hash chain remains intact (additive changes; existing files re-hashed only if their content changed)

## Real value this binding produces

- **Compliance teams** searching for "every JIA that interprets §X" hit a structured query, not a fuzzy search
- **Researchers** can compare interpretive patterns across regulators ("how do Utah OAIP, SEC, and CFPB approach AI-system disclosure?") via the schema rather than reading prose side-by-side
- **No-action-letter chains** become traversable: `supersedes` makes the chain queryable in either direction
- **AI Incident Law cases** that turn on a JIA's interpretation can `anchor` directly to the JIA's Obligations
- **The "drafting in public" posture** PubLedge maintains becomes more defensible: every published record is machine-validated, making silent drift detectable

## Out of scope for the binding

- Migration of MANIFEST.yaml hash chain semantics (PubLedge's integrity model stays as-is — the v0.1 binding doesn't change file hashes)
- Direct binding of PubLedge's current pa11y-ci a11y testing into Obligation-First's monthly a11y workflow (separate concern)
- Reissuance of existing instruments at obligation-first.org URLs (PubLedge canonical URLs stay at publedge.org; the v0.1 mirror is for spec-illustration only)

## Estimated effort

- `@context` and `@type` additions across all records: 1-2 days for the current 14-instrument corpus
- Determination records for issuance events: 1 day
- Optional obligation-as-typed-record lift: 2-3 days (and worth doing — the cross-portfolio anchor value is in the typed records)
- CI integration: 2-3 hours
- Cross-link verification with EveryAILaw: depends on EveryAILaw binding completion; 0.5 day after

Total: ~3-4 working days for the additive binding (steps 1-3 + CI). +2-3 days if the optional lift in step 4 is done in the same pass.

## After binding

PubLedge becomes the joint-interpretation reference adopter — demonstrating that the four-role spine handles negotiated artifacts (JIAs, RMAs) just as cleanly as promulgated ones (statutes, rulings). Mark as ✓ live in the obligation-first README. The cross-portfolio link graph reaches steady state: EveryAILaw publishes Obligations, PubLedge publishes interpretations of those Obligations, AI Incident Law publishes Determinations against those Obligations.

That graph is what the v0.1 freeze gate calls "ecosystem operational." Three live adopters, mutually linked, each adding evidence the others reference.

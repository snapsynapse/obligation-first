# Handoff: bind AI Incident Law to Obligation-First v0.1

Status: first binding shipped in `snapsynapse/ai-incident-law` commit `6594ed7`.

Current export:

- 16 `of:Authority` records
- 18 `of:Proceeding` records
- 18 `of:Allegation` records
- 15 `of:Determination` records
- 67 total records under `https://aiincidentlaw.org/api/v1/of/records/`

The first implementation uses the split-on-deploy pattern: `data/data.json` remains the editorial source of truth, and `scripts/build-obligation-first.mjs` emits the typed Obligation-First records. Pending included matters emit Proceedings and Allegations but no Determinations until the matter has a resolving posture.

Anchor mechanism: `obligation_first_anchors` now passes curated source-data IRIs through to `Determination.anchors`. The first seeded anchors point high-confidence discrimination/enforcement determinations to EveryAILaw's `bias-prevention` obligation. Remaining work is broader enrichment, not base binding.

This document describes the work to bind AI Incident Law's case corpus to Obligation-First v0.1. The binding is the largest of the three current adopters because it requires restructuring AI Incident Law's flat record shape into the proceeding strand (Proceeding / Allegation / Determination) plus their related Authorities.

The payoff is proportional. AI Incident Law becomes the case-and-enforcement evidence layer that makes EveryAILaw's obligations concrete and PubLedge's joint interpretations grounded in real precedent. A litigator searching for "every case where chatbot misrepresentation triggered negligent-misrepresentation liability" gets a structured, cross-portfolio-linked answer instead of a keyword search.

## What changes

The current AI Incident Law data model is one flat record per matter, with ~25 fields covering everything from `error_id` to `last_verified_date`. The v0.1 binding splits each flat record into multiple typed records:

| Current flat field | New typed entity |
|---|---|
| `jurisdiction` | new `of:Authority` record (court, tribunal, regulator) |
| `public_matter_name`, `public_matter_type`, `filing_date`, `public_record_link` | new `of:Proceeding` record |
| `error_description`, `canonical_source_conflicted`, `mitigation_gap`, `reliance_or_harm` | one or more `of:Allegation` records |
| `filing_status`, `notes_on_resolution` | one or more `of:Determination` records (with `disposition` from the closed vocab) |
| `error_type`, `domain`, `tags` | repo-local extension fields, kept on the appropriate typed record |
| `last_verified_date`, `needs_review`, `confidence_score` | repo-local maintenance fields, kept on the Proceeding |

The split mirrors what the law actually contains: a matter has parties, allegations, and rulings — not a single flat description.

## Step-by-step binding

### 1. Decide on the source-of-truth shape

Two reasonable approaches:

**Option A (recommended): keep the single source file, generate split records at build time.** `data/data.json` stays as the editorial canonical. A build script reads it and emits typed records under `data/v1/{authorities,proceedings,allegations,determinations}/<slug>.json`. The split records are deployed; the source stays editor-friendly.

**Option B: migrate the source file to typed records directly.** More disruptive, more elegant long-term.

Option A keeps editorial workflow unchanged while exposing the v0.1 surface. Recommend A for v0.1, with B as a v0.2 consideration once binding patterns are settled.

### 2. Extract Authorities as separate records

Authorities are typically reused across multiple matters (the BCCRT hears many cases; the SDNY hears many cases). Create one `of:Authority` record per unique court, tribunal, or regulator referenced across the corpus.

Per the worked example in [obligation-first/examples/air-canada/records/authority-bccrt.json](https://github.com/snapsynapse/obligation-first/blob/main/examples/air-canada/records/authority-bccrt.json):

```yaml
"@context": "https://obligationfirst.org/v1/"
"@type": "of:Authority"
"@id": "https://aiincidentlaw.org/authority/ca-bc-bccrt"
organization:
  "@type": "gist:Court"
  name: "British Columbia Civil Resolution Tribunal"
authority_basis:
  kind: "judicial"
  instrument_ref: "https://aiincidentlaw.org/instrument/bc-civil-resolution-tribunal-act"
jurisdiction:
  "@type": "gist:Jurisdiction"
  ref: "ca-bc"
```

Slug scheme: `<country>-<subdivision>-<authority-shorthand>` (e.g., `us-ny-sdny`, `ca-bc-bccrt`, `eu-ec-cnect`).

### 3. Convert each flat record to a Proceeding + Allegations + Determinations

The Air Canada worked example is the canonical pattern. AIEL-2024-001 from `data/data.json` produces:

- 1 `of:Proceeding` (Moffatt v. Air Canada) — citation, filed_date, issuedBy, source URL
- 2 `of:Allegation` records — the misrepresentation claim and the reliance claim (split because they're distinct factual assertions)
- 1 `of:Determination` — the BCCRT's ruling, with disposition `confirmed`, monetary remedy, and `anchors` to the relevant doctrine

For more complex matters (Mata v. Avianca has both an underlying suit and a sanctions order), expect 1-2 Proceedings, 2-4 Allegations, 1-3 Determinations.

### 4. Mint canonical URLs

```
https://aiincidentlaw.org/authority/<slug>           (e.g., ca-bc-bccrt)
https://aiincidentlaw.org/proceeding/<slug>          (e.g., moffatt-v-air-canada-2024-bccrt-149)
https://aiincidentlaw.org/allegation/<slug>          (e.g., moffatt-2024-misrep)
https://aiincidentlaw.org/determination/<slug>       (e.g., moffatt-2024-bccrt-149)
```

Each URL must serve the JSON-LD record (Option A: alongside HTML; Option B: JSON-only with HTML rendered from it).

### 5. Wire `anchors` to EveryAILaw

Determinations interpret Obligations. When AI Incident Law has a Determination that turns on a specific statutory provision (Colorado §6-1-1703 in a future case, EU AI Act Article 5 in another), the Determination's `anchors` field carries the EveryAILaw `@id`:

```yaml
"@type": "of:Determination"
"@id": "https://aiincidentlaw.org/determination/..."
anchors:
  - "https://everyailaw.com/obligation/co-sb24-205-reasonable-care"
```

This is the cross-portfolio join. It makes the EveryAILaw → AI Incident Law graph traversable in either direction (a researcher reading EveryAILaw's Obligation can pivot to "every Determination that has interpreted this," and vice versa).

For matters that turn on common-law doctrines rather than statute (Air Canada → negligent misrepresentation), `anchors` references the doctrine as an Instrument:

```yaml
anchors:
  - "https://aiincidentlaw.org/doctrine/negligent-misrepresentation"
```

### 6. Validate against the v0.1 schemas in CI

Same pattern as the EveryAILaw binding. Add a CI step that fetches the schemas from `https://obligationfirst.org/v1/schema/*.schema.json` and validates every published record. Failure blocks merge.

### 7. Implement the alleged-vs-determined discipline

This is the conceptual heart of the binding, and the most likely place for editorial drift over time. Maintainers must understand:

- An `of:Allegation` is what was asserted by a party. Its `text` reflects the claim, not the truth.
- An `of:Determination` is what an Authority decided. Its `disposition` (confirmed / rejected / partial / dismissed / settled / vacated / issued) records the outcome.
- The Determination's `decides` field points at which Allegations it resolved.
- Pre-ruling, a matter has Allegations but no Determinations (or only procedural Determinations).
- Post-ruling, the Determinations accumulate over time (trial → appeal → reversal). The Proceeding's `hasDetermination` is array-valued.

Editors must avoid the common mistake of writing `of:Allegation.text` as if it's settled fact. The text should be the asserted version of events, attributable to a party. Settled fact is what the Determination establishes.

This discipline is what makes the corpus useful as evidence rather than as opinion.

## Verification checklist

- [ ] Every flat record in `data/data.json` has been split into the appropriate typed records
- [ ] Every typed record carries `@context` and `@type`
- [ ] Every record's `@id` resolves to a 200 response on `aiincidentlaw.org`
- [ ] Authorities are deduplicated across the corpus (one record per court/tribunal/agency)
- [ ] Allegations are written in asserted-by-party voice, not settled-fact voice
- [ ] Determinations cite the Authority that issued them and the Allegations they decide
- [x] At least one Determination's `anchors` field points at a real EveryAILaw Obligation IRI
- [ ] At least one matter with multiple Determinations (e.g., trial + appeal) demonstrates the strand's lifetime accumulation
- [ ] Schema validation runs in CI and blocks merge on drift
- [ ] The weekly cascade verification system that AI Incident Law inherits from ai-tool-watch / every-ai-law continues to run, now layered on top of the typed structure

## Real value this binding produces

- **Litigators** can search by Obligation rather than keyword — "every case under §6-1-1703" pivots from EveryAILaw to AI Incident Law instantly
- **Regulators and journalists** can track enforcement patterns: which Allegations get confirmed, which get dismissed, by jurisdiction over time
- **AI safety researchers** get a structured corpus where each record has clear epistemic status (alleged vs determined)
- **Compliance teams** can use confirmed Determinations as concrete examples when explaining obligations to internal stakeholders
- **The case-as-evidence frame** is exactly what makes AI Incident Law's INTENT.md "show me what has actually happened" promise operational

## Out of scope for the binding

- Subtyping Proceeding by jurisdiction-specific kind (US civil action, EU regulatory enforcement, UK tribunal) — deferred decision in Obligation-First ROADMAP
- Typed `of:Remedy` entity for monetary awards — currently unstructured object on Determination, formalized in v0.2
- Closed party-role vocabulary for `Allegation.asserted_by` — currently free-form, formalized in v0.2

These limitations are recorded in the v0.1 ROADMAP and don't block the binding.

## Estimated effort

- Build script for split-on-deploy (Option A): 2-3 days
- Authority deduplication pass: 1 day (~10-20 unique Authorities for the current corpus size)
- Allegation-vs-Determination editorial review: 2-3 days for the existing records
- URL serving + CI integration: 1-2 days
- Cross-link verification with EveryAILaw: depends on EveryAILaw binding completion; 1 day after

Total: ~7-9 working days for a first cut, assuming EveryAILaw is bound first so the cross-links can be verified.

## After binding

AI Incident Law becomes the proceeding-strand reference adopter — the canonical demonstration of the alleged-vs-determined discipline, the cross-portfolio anchor pattern, and the multi-Determination lifetime model. Mark as ✓ live in the obligation-first README, close the relevant v0.1 freeze-gate item.

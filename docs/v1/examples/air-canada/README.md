# Worked example: Moffatt v. Air Canada (BCCRT 149)

Round-trips the AI Incident Law record AIEL-2024-001 through the Obligation-First proceeding strand. The canonical record is maintained by the [AI Incident Law](https://aiincidentlaw.org/) adopter; this example mirrors the matter onto neutral Obligation-First example IRIs and crosswalks each entity back to the live adopter record with `sameAs`.

## Why this example

Tests the proceeding strand against a real, resolved AI-incident matter. The case has all the moving parts:

- A non-government Authority (a tribunal, not a legislature)
- An AI system whose output conflicted with a canonical policy
- A clear Allegation (chatbot misrepresented bereavement-fare policy) and a clear Determination (tribunal awarded damages)
- A live adopter (AI Incident Law) that publishes the same matter, so the crosswalk is exercised end to end

If this round-trips cleanly, the proceeding strand handles common-law tort cases, not just statutory enforcement.

## Record convention

Every record in this example follows the worked-example convention in [reference/iri-naming-and-crosswalks.md](../../reference/iri-naming-and-crosswalks.md):

- `@context` is the string `https://obligationfirst.org/v1/context.jsonld`. (`https://w3id.org/of/v1/` is the vocabulary namespace prefix `of:` resolves to — it is never used as the context document.)
- `@id` is `https://obligationfirst.org/v1/examples/air-canada/<entity-type>/<local-id>`, suffixless. The `<local-id>` is an opaque, adopter-local descriptor — not a human-readable citation. Jurisdiction is never encoded in the slug; it rides as a typed `jurisdiction` field. The neutral citation rides as a crosswalk (`neutral_citation`, plus `citation` on the Proceeding).
- Internal cross-references (`issuedBy`, `decides`, `hasAllegation`, `hasDetermination`, `related_to`, `authority_basis.instrument_ref`) point at the neutral example `@id`s, so the graph is internally consistent.
- Where an entity corresponds to a live adopter record, `sameAs` carries the adopter's served `.json` IRI.

## Mapping summary

| AI Incident Law field | Obligation-First entity / property |
|---|---|
| `AIEL-2024-001` (record id) | `sameAs` crosswalk from each example record to the live adopter `.json` |
| `public_matter_name` | `title` on Proceeding |
| `British Columbia Civil Resolution Tribunal` | `of:Authority` (separate record), crosswalked to the live BCCRT authority |
| `error_description` + `canonical_source_conflicted` | `of:Allegation` records |
| `notes_on_resolution: Tribunal awarded C$650.88…` | `of:Determination` with `disposition: confirmed` |
| `public_record_link` | `source` on Proceeding and Determination |
| `filing_date` | `filed_date` on Proceeding |
| `2024 BCCRT 149` | `citation` / `neutral_citation` crosswalk fields |

## The records

### 1. Authority — British Columbia Civil Resolution Tribunal

```yaml
"@context": https://obligationfirst.org/v1/context.jsonld
"@type": of:Authority
"@id": https://obligationfirst.org/v1/examples/air-canada/authority/bccrt
organization:
  "@type": gist:GovernmentOrganization
  name: British Columbia Civil Resolution Tribunal
authority_basis:
  kind: judicial
  instrument_ref: https://obligationfirst.org/v1/examples/air-canada/instrument/bccrt-act
jurisdiction:
  "@type": gist:Jurisdiction
  ref: ca-bc
sameAs:
  - https://aiincidentlaw.org/authority/british-columbia-civil-resolution-tribunal.json
```

The BCCRT is not a government department but a quasi-judicial tribunal. gist 14.1.0 defines no Court class, so it binds to `gist:GovernmentOrganization` with `authority_basis.kind = judicial` carrying the quasi-judicial nature. The recursive Authority basis works. The `instrument_ref` points at a neutral example IRI for the BC Civil Resolution Tribunal Act — an illustrative basis with no record of its own (the live adopter does not publish that statute as a separate entity, so there is nothing to crosswalk to). The `sameAs` carries the live BCCRT authority the adopter actually serves.

### 2. Proceeding

```yaml
"@context": https://obligationfirst.org/v1/context.jsonld
"@type": of:Proceeding
"@id": https://obligationfirst.org/v1/examples/air-canada/proceeding/moffatt
title: Moffatt v. Air Canada
citation: 2024 BCCRT 149
neutral_citation: 2024 BCCRT 149
filed_date: 2024-02-14
issuedBy: https://obligationfirst.org/v1/examples/air-canada/authority/bccrt
hasAllegation:
  - https://obligationfirst.org/v1/examples/air-canada/allegation/moffatt-misrep
  - https://obligationfirst.org/v1/examples/air-canada/allegation/moffatt-reliance
hasDetermination:
  - https://obligationfirst.org/v1/examples/air-canada/determination/moffatt-bccrt-149
source: https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html
sameAs:
  - https://aiincidentlaw.org/proceeding/aiel-2024-001-proceeding.json
```

The `@id` is an opaque adopter-local handle (`moffatt`), not a citation. The reader-facing citation rides on `citation` / `neutral_citation`, and the live adopter record rides on `sameAs`.

### 3. Allegations (two)

This example keeps a teaching two-allegation split (misrepresentation; reliance). The live adopter merges both into a single allegation record, so the `sameAs` crosswalk to that merged record sits on the misrepresentation allegation only; the reliance allegation has no live counterpart and carries no `sameAs`.

```yaml
"@context": https://obligationfirst.org/v1/context.jsonld
"@type": of:Allegation
"@id": https://obligationfirst.org/v1/examples/air-canada/allegation/moffatt-misrep
asserted_by: claimant
text: >
  Air Canada's chatbot told the claimant he could request a bereavement
  discount retroactively within 90 days after travel. The answer conflicted
  with Air Canada's published bereavement-fare terms, which required
  approval before travel.
related_to: https://obligationfirst.org/v1/examples/air-canada/system/air-canada-virtual-assistant
sameAs:
  - https://aiincidentlaw.org/allegation/aiel-2024-001-allegation.json
```

```yaml
"@context": https://obligationfirst.org/v1/context.jsonld
"@type": of:Allegation
"@id": https://obligationfirst.org/v1/examples/air-canada/allegation/moffatt-reliance
asserted_by: claimant
text: >
  Claimant relied on the chatbot's answer, purchased tickets, and was denied
  the bereavement discount when he subsequently requested it.
```

The `related_to` points at a neutral example IRI for the AI system; it is illustrative (no separate record).

### 4. Determination

```yaml
"@context": https://obligationfirst.org/v1/context.jsonld
"@type": of:Determination
"@id": https://obligationfirst.org/v1/examples/air-canada/determination/moffatt-bccrt-149
neutral_citation: 2024 BCCRT 149
issued_date: 2024-02-14
issuedBy: https://obligationfirst.org/v1/examples/air-canada/authority/bccrt
decides:
  - https://obligationfirst.org/v1/examples/air-canada/allegation/moffatt-misrep
  - https://obligationfirst.org/v1/examples/air-canada/allegation/moffatt-reliance
disposition: confirmed
remedy:
  monetary_award: 650.88
  currency: CAD
  notes: Plus interest and fees.
notes: >
  Tribunal treated the chatbot answer as part of Air Canada's customer-facing
  service rather than a separate legal actor. Air Canada was held liable for
  negligent misrepresentation.
source: https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html
sameAs:
  - https://aiincidentlaw.org/determination/aiel-2024-001-determination.json
```

The Determination carries no `anchors`. An earlier draft anchored it to a `/doctrine/negligent-misrepresentation` IRI, but no adopter publishes that entity and the live Moffatt determination has no anchors — so anchoring to a common-law doctrine is a not-yet-modeled future pattern, not a working cross-repo join. The narrative that the tribunal applied negligent misrepresentation stays in `notes`; it is not asserted as a resolvable anchor target.

## Round-trip findings

- ✅ Two Allegations, one Determination, multi-valued `decides` works as designed
- ✅ `disposition: confirmed` captures the tribunal's ruling without forcing a narrower vocabulary
- ✅ `sameAs` to the live AI Incident Law export demonstrates the adopter crosswalk end to end, including the teaching-split-to-merged-record case (two example Allegations, one live Allegation)
- ✅ Neutral, opaque `@id`s with jurisdiction as a typed field and citation as a crosswalk keep the example portable and adopter-agnostic
- ⚠ Open: common-law doctrine anchoring (`anchors` to a doctrine like negligent misrepresentation) is not yet modeled — no adopter publishes doctrine entities, so the determination references the doctrine only in prose
- ⚠ Open: `remedy` is an unstructured object; a future typed `of:Remedy` entity may be warranted
- ⚠ Open: `Allegation.asserted_by` is freeform here ("claimant"); a closed party-role vocabulary may be warranted

## Reference

Canonical record: AIEL-2024-001 in the [AI Incident Law](https://aiincidentlaw.org/) export. Source decision: [Moffatt v. Air Canada, 2024 BCCRT 149](https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html). This worked example mirrors that matter onto neutral Obligation-First IRIs and crosswalks back with `sameAs`.

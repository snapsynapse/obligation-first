# Worked example: Moffatt v. Air Canada (BCCRT 149)

Round-trips the AI Incident Law record AIEL-2024-001 through the Obligation-First proceeding strand.

## Why this example

Tests the proceeding strand against a real, resolved AI-incident matter. The case has all the moving parts:

- A non-government Authority (a tribunal, not a legislature)
- An AI system whose output conflicted with a canonical policy
- A clear Allegation (chatbot misrepresented bereavement-fare policy) and a clear Determination (tribunal awarded damages)
- Anchoring to a specific legal doctrine (negligent misrepresentation) without that doctrine being statute

If this round-trips cleanly, the proceeding strand handles common-law tort cases, not just statutory enforcement.

## Mapping summary

| AI Incident Law field | Obligation-First entity / property |
|---|---|
| `error_id: AIEL-2024-001` | `@id` on the `of:Proceeding` record |
| `public_matter_name` | `dct:title` on Proceeding |
| `jurisdiction: British Columbia Civil Resolution Tribunal` | `of:Authority` (separate record) |
| `error_description` + `canonical_source_conflicted` | `of:Allegation` records |
| `notes_on_resolution: Tribunal awarded C$650.88…` | `of:Determination` with `disposition: confirmed` |
| `public_record_link` | `dct:source` on Determination |
| `filing_date` | `prov:startedAtTime` on Proceeding |
| `tags`, `error_type`, `domain` | repo-local AI Incident Law extension fields (not in v1 spine) |

## The records

### 1. Authority — British Columbia Civil Resolution Tribunal

```yaml
"@context": https://w3id.org/of/v1/
"@type": of:Authority
"@id": https://aiincidentlaw.org/authority/ca-bc-bccrt
organization:
  "@type": gist:Court
  name: British Columbia Civil Resolution Tribunal
authority_basis:
  kind: judicial
  instrument_ref: https://aiincidentlaw.org/instrument/bc-civil-resolution-tribunal-act
jurisdiction:
  "@type": gist:Jurisdiction
  ref: ca-bc
```

The BCCRT is not a government department but a quasi-judicial tribunal. It binds cleanly to `gist:Court`, with `authority_basis.kind = judicial` and `instrument_ref` pointing at the BC Civil Resolution Tribunal Act — the statute that grants it authority. The recursive Authority basis works.

### 2. Proceeding

```yaml
"@context": https://w3id.org/of/v1/
"@type": of:Proceeding
"@id": https://aiincidentlaw.org/proceeding/moffatt-v-air-canada-2024-bccrt-149
title: Moffatt v. Air Canada
citation: 2024 BCCRT 149
filed_date: 2024-02-14
issuedBy: https://aiincidentlaw.org/authority/ca-bc-bccrt
hasAllegation:
  - https://aiincidentlaw.org/allegation/moffatt-2024-misrep
  - https://aiincidentlaw.org/allegation/moffatt-2024-reliance
hasDetermination:
  - https://aiincidentlaw.org/determination/moffatt-2024-bccrt-149
source: https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html
```

### 3. Allegations (two)

```yaml
"@context": https://w3id.org/of/v1/
"@type": of:Allegation
"@id": https://aiincidentlaw.org/allegation/moffatt-2024-misrep
asserted_by: claimant
text: >
  Air Canada's chatbot told the claimant he could request a bereavement
  discount retroactively within 90 days after travel. The answer conflicted
  with Air Canada's published bereavement-fare terms, which required
  approval before travel.
related_to: https://aiincidentlaw.org/system/air-canada-virtual-assistant
```

```yaml
"@context": https://w3id.org/of/v1/
"@type": of:Allegation
"@id": https://aiincidentlaw.org/allegation/moffatt-2024-reliance
asserted_by: claimant
text: >
  Claimant relied on the chatbot's answer, purchased tickets, and was denied
  the bereavement discount when he subsequently requested it.
```

### 4. Determination

```yaml
"@context": https://w3id.org/of/v1/
"@type": of:Determination
"@id": https://aiincidentlaw.org/determination/moffatt-2024-bccrt-149
issued_date: 2024-02-14
issuedBy: https://aiincidentlaw.org/authority/ca-bc-bccrt
decides:
  - https://aiincidentlaw.org/allegation/moffatt-2024-misrep
  - https://aiincidentlaw.org/allegation/moffatt-2024-reliance
disposition: confirmed
remedy:
  monetary_award: 650.88
  currency: CAD
  notes: Plus interest and fees.
anchors:
  - https://aiincidentlaw.org/doctrine/negligent-misrepresentation
notes: >
  Tribunal treated the chatbot answer as part of Air Canada's customer-facing
  service rather than a separate legal actor. Air Canada was held liable for
  negligent misrepresentation.
source: https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html
```

## Round-trip findings

- ✅ Two Allegations, one Determination, multi-valued `decides` works as designed
- ✅ `disposition: confirmed` captures the tribunal's ruling without forcing a narrower vocabulary
- ✅ `anchors` to a common-law doctrine (not a statutory provision) works — the doctrine is itself an Instrument with implicit Terms; we don't have to encode the full common-law tree to reference it
- ⚠ Open question: where does monetary award structure (`remedy`) live? Currently in v0.1 it's an unstructured object. v0.2 may want a typed `of:Remedy` entity.
- ⚠ Open question: `Allegation.asserted_by` is freeform here ("claimant"). v0.2 may want a closed party-role vocabulary.

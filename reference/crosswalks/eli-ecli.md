# Crosswalk: Obligation-First ↔ ELI / ECLI

Mapping Obligation-First entity identifiers to European Legislation Identifier (ELI) and European Case Law Identifier (ECLI) URIs.

## ELI — European Legislation Identifier

ELI is an EU Council recommendation (2012, expanded 2017) defining a stable URI scheme for legislation across EU member states. Each member state implements its own URI pattern conforming to the recommendation. The ELI ontology defines properties like `eli:Legislation`, `eli:LegalResource`, `eli:title`, `eli:date_publication`, `eli:type_document`.

### Mapping

| Obligation-First | ELI |
|---|---|
| `of:Instrument` | `eli:LegalResource` (typically subtype `eli:Legislation`) |
| Instrument metadata fields (title, citation, dates) | `eli:title`, `eli:id_local`, `eli:date_document`, `eli:date_publication`, `eli:in_force` |
| `of:Term` | `eli:LegalResourceSubdivision` (where ELI implementations support it) |
| `of:Authority` (legislature) | `eli:passed_by` |

### Identifier compatibility

The ELI URI is never the Instrument's `@id`. Under the v0.3 federation model the `@id` is an adopter-local, opaque, permanent IRI that identifies the adopter's record about the legislation; the ELI URI rides as a typed `eli_uri` crosswalk field. This is what lets two adopters that mint different local IRIs for the same law still join on a shared ELI:

```yaml
"@type": of:Instrument
"@id": https://everyailaw.com/instrument/eu-ai-act.json
title: "EU Artificial Intelligence Act"
jurisdiction:
  "@type": gist:Jurisdiction
  ref: eu
eli_uri: http://data.europa.eu/eli/reg/2024/1689/oj
issuedBy: https://everyailaw.com/authority/european-commission.json
```

The `@id` is whatever the adopter's `.well-known` naming profile declares; Obligation-First does not prescribe its grammar. For EU instruments the ELI URI is carried in `eli_uri` (MUST where the jurisdiction issues ELIs). For non-EU instruments without ELI URIs, the field is simply absent and the join falls back to `citation` or another declared crosswalk.

## ECLI — European Case Law Identifier

ECLI is the analogous standard for case law. Format: `ECLI:{country}:{court}:{year}:{number}`.

### Mapping

| Obligation-First | ECLI |
|---|---|
| `of:Proceeding` | The matter to which the ECLI refers |
| `of:Determination` | The judgment / order identified by the ECLI |

### Identifier compatibility

As with ELI, the ECLI is never the `@id`. The Determination's `@id` is an adopter-local IRI; the ECLI rides as a typed `ecli_uri` crosswalk field:

```yaml
"@type": of:Determination
"@id": https://aiincidentlaw.org/determination/aiel-2024-042-determination.json
issued_date: 2024-09-12
jurisdiction:
  "@type": gist:Jurisdiction
  ref: eu
ecli_uri: ECLI:EU:C:2024:567
issuedBy: https://aiincidentlaw.org/authority/court-of-justice-of-the-european-union.json
```

## Non-EU adoption signal

ELI and ECLI are formally EU instruments, but the crosswalk pattern is portable. Where a US, UK, or other jurisdiction publishes case-law identifiers (e.g., CanLII for Canadian case law, BAILII for UK, or a neutral citation), Obligation-First treats those the same way: they ride as typed crosswalk fields, never as the `@id`. Common-law neutral citations use `neutral_citation`; a CanLII or BAILII canonical URL can be carried in `sameAs`.

The Air Canada example keeps an adopter-local `@id` and carries the CanLII URL and neutral citation as crosswalks:

```yaml
"@type": of:Determination
"@id": https://aiincidentlaw.org/determination/aiel-2024-001-determination.json
neutral_citation: "2024 BCCRT 149"
sameAs:
  - https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html
```

## What we deliberately don't do

- We don't require ELI/ECLI conformance. Adopters that have authoritative ELI/ECLI identifiers carry them in `eli_uri` / `ecli_uri`; others omit the field.
- We don't make the standard identifier the `@id`. The `@id` is adopter-local and opaque; ELI/ECLI ride as crosswalks, and cross-adopter joins key on those crosswalks rather than on slugs.
- We don't import ELI's full vocabulary. The crosswalk is at the identifier level, not the property level. Obligation-First's properties remain canonical for cross-instrument relationships; ELI's properties remain canonical for legislation-document metadata.

## Reference

- ELI: [Operations.eli](https://eur-lex.europa.eu/eli-register/about.html)
- ECLI: [European e-Justice Portal](https://e-justice.europa.eu/content_european_case_law_identifier_ecli-175-en.do)

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

For EU instruments with authoritative ELI URIs, the ELI URI should be the Instrument's `@id`:

```yaml
"@type": of:Instrument
"@id": http://data.europa.eu/eli/reg/2024/1689/oj
title: "EU Artificial Intelligence Act"
issuedBy: http://data.europa.eu/eli/eu/european-parliament
```

For non-EU instruments without ELI URIs, projects mint their own IRIs.

## ECLI — European Case Law Identifier

ECLI is the analogous standard for case law. Format: `ECLI:{country}:{court}:{year}:{number}`.

### Mapping

| Obligation-First | ECLI |
|---|---|
| `of:Proceeding` | The matter to which the ECLI refers |
| `of:Determination` | The judgment / order identified by the ECLI |

### Identifier compatibility

```yaml
"@type": of:Determination
"@id": https://e-justice.europa.eu/ecli/ECLI:EU:C:2024:567
issued_date: 2024-09-12
issuedBy: https://e-justice.europa.eu/court/cjeu
```

## Non-EU adoption signal

ELI and ECLI are formally EU instruments, but the pattern is portable. Where a US, UK, or other jurisdiction publishes case-law identifiers (e.g., CanLII for Canadian case law, BAILII for UK), Obligation-First treats those identifiers the same way: use the canonical IRI as `@id`.

The Air Canada example uses CanLII:

```yaml
"@type": of:Determination
"@id": https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html
```

## What we deliberately don't do

- We don't require ELI/ECLI conformance. Adopters that have authoritative IRIs use them; others mint their own.
- We don't import ELI's full vocabulary. The mapping is at the IRI level, not the property level. Obligation-First's properties remain canonical for cross-instrument relationships; ELI's properties remain canonical for legislation-document metadata.

## Reference

- ELI: [Operations.eli](https://eur-lex.europa.eu/eli-register/about.html)
- ECLI: [European e-Justice Portal](https://e-justice.europa.eu/content_european_case_law_identifier_ecli-175-en.do)

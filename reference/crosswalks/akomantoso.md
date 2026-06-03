# Crosswalk: Obligation-First ↔ Akoma Ntoso

Mapping Obligation-First entities to Akoma Ntoso source-text elements. Source: [OASIS LegalDocML Akoma Ntoso 1.0 vocabulary](https://docs.oasis-open.org/legaldocml/akn-core/v1.0/akn-core-v1.0-part1-vocabulary.html) (OASIS Standard, 2018).

> **Note on the namespace URI.** The Akoma Ntoso XML namespace `http://docs.oasis-open.org/legaldocml/ns/akn/3.0` is an **identifier**, not a URL — the standard does not publish content at that location, and HTTP fetches return 404. This is the conventional W3C/XML namespace pattern. Tools that need the schema content fetch from the OASIS Standard distribution above; tools that only need to recognize Akoma Ntoso documents match the namespace string.

## Why this crosswalk matters

Akoma Ntoso is the de facto XML standard for parliamentary, legislative, and judicial documents. It's used in production by the Italian Senate, Brazilian Congress, Kenya parliament, and a growing list of legislatures. Where an authoritative Akoma Ntoso encoding exists for an Instrument, Obligation-First references it rather than duplicating the source text.

## Conceptual mapping

Akoma Ntoso models *documents* (the textual artifact). Obligation-First models *normative content* (what the document creates). They sit at different layers and compose.

| Obligation-First | Akoma Ntoso | Relationship |
|---|---|---|
| `of:Instrument` | `<akn:act>`, `<akn:bill>`, `<akn:statute>`, `<akn:judgment>` | An Instrument has-a source-text representation that may be an Akoma Ntoso document. |
| `of:Term` | `<akn:section>`, `<akn:article>`, `<akn:paragraph>`, `<akn:clause>` | A Term corresponds to a textual element. The Term's `@id` is adopter-local and opaque; the Akoma Ntoso element IRI rides as the typed `akn_uri` crosswalk, never as the `@id`. |
| `of:Authority` | `<akn:TLCOrganization>`, `<akn:TLCPerson>` | Akoma Ntoso's "top-level concept" references for organizations and persons. |
| `of:Proceeding` | `<akn:judgment>` (for the resulting opinion) | Proceedings produce judgments; the judgment's text is Akoma Ntoso. |
| `of:Obligation` | (no direct equivalent) | Akoma Ntoso encodes text; obligations are derived from text by interpretation. This is precisely the gap Obligation-First fills. |

## IRI compatibility

Akoma Ntoso uses the FRBR-derived `cl:` (CLI) URI scheme for documents:

```
/akn/{country}/{type}/{date}/{number}/!main
```

For example: `/akn/us/act/2024/co-sb-205/!main`

Obligation-First treats the Akoma Ntoso element IRI as a typed `akn_uri` crosswalk on the `Instrument` or `Term` record, never as the `@id`. The `@id` stays adopter-local, opaque, and permanent (and whatever the adopter's `.well-known` naming profile declares); `akn_uri` is the companion field that lets adopters round-trip to the canonical encoding where one exists. Where no authoritative encoding exists, the field is simply absent.

## Worked example

Colorado SB 24-205 §6-1-1703 in both layers:

```yaml
"@type": of:Term
"@id": https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
parent_instrument: https://everyailaw.com/instrument/co-sb24-205
akn_uri: https://akn.everyailaw.com/us/co/act/2024/sb-205/main/section_1703
text: "A developer of a high-risk artificial intelligence system shall use reasonable care..."
creates:
  - https://everyailaw.com/obligation/co-sb24-205-reasonable-care
```

The Term has an Obligation-First `@id` (stable across the lifetime of EveryAILaw) and an Akoma Ntoso `akn_uri` (resolves to the canonical XML if/when published). Both refer to the same Term; neither owns it exclusively.

## What we deliberately don't do

- We don't require adopters to publish Akoma Ntoso. Most US adopters won't have authoritative Akoma Ntoso encodings.
- We don't formalize the `akn_uri` field as required in v0.1. Reference, not requirement.
- We don't import Akoma Ntoso's vocabulary into our own. Akoma Ntoso models documents; Obligation-First models obligations. The layers compose; they don't merge.

## Adoption signal

When an EU member state or other jurisdiction publishes an authoritative Akoma Ntoso encoding for a law that EveryAILaw also tracks, the EveryAILaw record gets an `akn_uri` field pointing at it. Adopters can cross-walk between the two without losing fidelity.

# Worked example: EU AI Act Article 50 - the source-hierarchy collapse

This example models the European Union's Article 50 transparency obligations. It is included because Article 50 is a clean demonstration of the thing Obligation-First exists to do: collapse a multi-layer legal source hierarchy - regulation, recital, guideline, code of practice - into one uniform shape, Terms and the Obligations they create or interpret.

It doubles as an orientation to EU normative structure for readers who know common-law statutes but not the EU instrument stack. The Colorado example shows the spine, the proceeding strand, and a replacement bill. This example shows something Colorado does not: an interpretive Instrument (non-binding Commission guidance) anchored to the binding statute it interprets, and the article-versus-recital distinction that newcomers stumble on.

## The EU source hierarchy, briefly

A reader coming from US law meets several citation formats in the Article 50 materials - "Article 50(2)", "Recital 133", "paragraph (69) of the Guidelines" - and reasonably asks which is the law, which is binding, and how they relate. The layers:

| EU layer | Binding force | US analogue | Obligation-First role |
|---|---|---|---|
| Regulation (Reg (EU) 2024/1689, the AI Act) | Binding, directly applicable in every member state | A self-executing federal statute | Instrument (kind: regulation) |
| Article (e.g. Article 50) | The operative, binding provision | Statutory section | Term that creates one or more Obligations |
| Recital (e.g. Recital 133) | Not independently binding; read to interpret the articles | Legislative findings / preamble / purpose clause | Term that creates no Obligation, anchored to for interpretation |
| Commission Guidelines (under Art 96(1)(d)) | Non-binding interpretation of how to comply | Sub-regulatory agency guidance | A separate Instrument whose Terms anchor to the statutory Terms |
| Code of Practice (forthcoming, for 50(2) and 50(4)) | Co-regulatory; adherence assessed as adequate yields a presumption of compliance | Safe-harbor / recognized compliance standard | A future Instrument; adherence via anchors plus enforcement posture |
| Harmonised standards (CEN-CENELEC JTC 21) | Once cited in the OJ, confer presumption of conformity | Incorporated-by-reference technical standards | Referenced via executableEncoding or as cited Instruments |
| Court of Justice of the EU | The only authoritative interpreter of the Act (draft Guidelines para 5) | Supreme Court as final interpreter | Authority whose Determinations anchor to Obligations |

## The distinction that trips newcomers

Article 50(2), Recital 133, and paragraph 69 of the Guidelines look like three different kinds of thing. In Obligation-First they are all Terms. What differs is exactly two properties: which Instrument the Term belongs to, and whether it creates an Obligation.

- Article 50(2) is a Term of the Regulation that creates an Obligation (mark synthetic content and make it detectable).
- Recital 133 is a Term of the same Regulation that creates no Obligation. It exists to be anchored to for interpretation.
- Paragraph 69 of the Guidelines is a Term of a different, non-binding Instrument that anchors to the Article Term (and, in a fuller model, to the Recital Term).

That collapse is the point. Once modeled this way, "what does Article 50(2) require, and how is that requirement interpreted across the recital and the guidance?" is one graph traversal, not a reading exercise across three documents in three citation styles.

## Interpretation is not override

The Guidelines anchor to the Act. They do not defeat or supersede it. Obligation-First keeps these strictly separate: `anchors` is interpretive reference, `defeats` / `supersedes` is override. A non-binding guideline can never carry `defeats` against the binding regulation it interprets - and modeling the relationship as `anchors` encodes exactly that legal reality. Guidance interprets; it cannot rewrite the statute. Only the CJEU could issue a Determination that authoritatively binds the interpretation.

Note one consequence of the schema: interpretation lives at the Term level, not the Instrument level. There is no instrument-to-instrument "interprets" relation. The Guidelines Instrument simply holds Terms; each interpretive Term anchors to the statutory Term it explains. This keeps the join surface small and precise - paragraph 69 interprets Article 50(2), not "the Guidelines interpret the Act" in some unspecified bulk.

## Identifiers, jurisdiction, and crosswalks

Every record in this example uses a neutral `obligationfirst.org` `@id` of the form `https://obligationfirst.org/v1/examples/eu-ai-act-article-50/<entity-type>/<local-id>`. The `@id` is the example's own identifier for its record about a legal entity, not a claim on any adopter's namespace and not the entity's canonical external identifier. Real-world identity rides in crosswalks, not in the slug.

Two consequences worth making explicit:

- Jurisdiction is typed legal competence, never part of the slug. Each jurisdictional record carries `"jurisdiction": { "@type": "of:Jurisdiction", "territorial_scope": ["eu"] }`. The local-id drops any jurisdiction code (the AI Act instrument is `instrument/ai-act`, not `instrument/eu-ai-act`); structural references that happen to look like codes but are not (`art-50-2`, `recital-133`) are kept because they identify a provision, not a jurisdiction.
- Standard identifiers ride as typed crosswalks. The Regulation carries `eli_uri` (the European Legislation Identifier, `https://data.europa.eu/eli/reg/2024/1689/oj`): the `@id` is this example's own identifier for its record, and `eli_uri` is the crosswalk to the canonical EU identifier for the same law. Where the entity also corresponds to a real adopter record, `sameAs` points at that adopter's served form.

Only two records in this example correspond to entities a real adopter has actually minted, verified against the live EveryAILaw export:

- `authority-eu-commission.json` -> `sameAs` `https://everyailaw.com/authority/european-commission.json`
- `instrument-eu-ai-act.json` -> `sameAs` `https://everyailaw.com/instrument/eu-ai-act.json`, plus its `eli_uri`

The other 24 records are teaching constructs. The two-authority model (Parliament and Council enact the Regulation; the Commission issues the Guidelines under Art 96(1)(d)) is a deliberate pedagogical improvement over EveryAILaw's single-authority shape; the draft Guidelines, the forthcoming Code of Practice, the per-paragraph Obligations, and the individual Article and Recital Terms are likewise constructs EveryAILaw has not minted. They carry neutral `@id` values and `jurisdiction` but no `sameAs`, because there is no real-world record to point at.

## The four-role mapping for this example

| Role | Record | Maps to |
|---|---|---|
| Authority | `authority-eu-parliament-council.json` | European Parliament and Council, co-legislators that enacted the Regulation |
| Authority | `authority-eu-commission.json` | European Commission (AI Office), issuer of the Guidelines under Art 96(1)(d) |
| Instrument | `instrument-eu-ai-act.json` | Regulation (EU) 2024/1689, the binding law |
| Instrument | `instrument-eu-art50-guidelines.json` | The draft Guidelines, non-binding and interpretive |
| Term | `term-art-50-2.json` | Article 50(2), operative; creates the Obligation |
| Term | `term-guidelines-4-2-1-para69.json` | Guidelines paragraph (69); interprets, anchors to the Article |
| Obligation | `obligation-mark-synthetic-content.json` | The marking and detection duty on providers |

## Modeling a recital

A recital is where the article-versus-recital question resolves, and the recitals that ground each Article 50 paragraph are modeled as their own records (`term-recital-132.json` through `term-recital-136.json`). A recital is a Term of the Regulation that creates nothing:

```yaml
"@context": https://obligationfirst.org/v1/context.jsonld
"@type": of:Term
"@id": https://obligationfirst.org/v1/examples/eu-ai-act-article-50/term/recital-133
text: >
  Techniques and methods to mark AI-generated content - watermarks,
  metadata identifications, cryptographic methods for proving provenance
  and authenticity, logging methods, or fingerprints - should be
  sufficiently reliable, interoperable, effective and robust as far as
  technically feasible, taking into account available techniques and the
  generally acknowledged state of the art.
section: "Recital (133)"
parent_instrument: https://obligationfirst.org/v1/examples/eu-ai-act-article-50/instrument/ai-act
creates: []
```

It has no `creates`. Its weight is that the operative Article 50(2) Term, and the Guidelines paragraph 69 Term, both lean on it. The recital is interpreted, never interpreting - so it is anchored to, it does not anchor.

## Records walk-through

- `authority-eu-parliament-council.json` - the co-legislators that enacted the Regulation. Their evidence-bearing `authority_basis` traces to the Treaty (TFEU Art 114), one rung higher than a national constitution. A teaching construct: no `sameAs`.
- `authority-eu-commission.json` - the Commission as issuing Authority for the Guidelines. Its evidence-bearing `authority_basis` traces to Article 96 of the Act itself: the power to issue these Guidelines is granted by the Instrument they interpret. `sameAs` the EveryAILaw `european-commission` authority.
- `instrument-eu-ai-act.json` - the Regulation. Carries `eli_uri` (the canonical EU identifier as a crosswalk) and `sameAs` the EveryAILaw `eu-ai-act` instrument.
- `instrument-eu-art50-guidelines.json` - the draft Guidelines. `status: proposed` (under consultation), `enforcement_status: unsignaled` (non-binding; it carries no enforceable primary Obligations of its own). A teaching construct: no `sameAs`.
- `term-art-50-2.json` - Article 50(2) verbatim; `creates` the marking Obligation.
- `obligation-mark-synthetic-content.json` - an `of:Requirement` stating what providers must do, abstracted from the section text.
- `term-guidelines-4-2-1-para69.json` - Guidelines paragraph 69; `creates: []`, `anchors` to the Article 50(2) Term. The interpretive edge.

## What this sample covers and what it leaves to expand

Covers: all five Article 50 paragraphs as Terms and the Obligations they create (50(1) interaction disclosure split into a provider design duty and a deployer disclosure duty, 50(2) marking and detection, 50(3) emotion recognition and biometric categorisation, 50(4) deep fakes, 50(5) AI-generated text), the five grounding Recitals (132 through 136), the draft Guidelines as a second interpretive Instrument with Terms anchored to the Article and Recital Terms, the forthcoming Code of Practice as a third Instrument stub, and the two-authority co-legislator-plus-Commission model.

Leaves to expand:
- The Code of Practice's Terms, once published, anchored to Articles 50(2) and 50(4) via the same `anchors` pattern the Guidelines use.
- Harmonised standards (CEN-CENELEC JTC 21) referenced via `executableEncoding`.
- The proceeding strand: any future enforcement action would be a Determination anchoring to an Article 50 Obligation, exactly as the Colorado example does for a court stay order.

Conformance: records are schema-conformant and carry `of:Jurisdiction` legal competence. Reaching Level 2 additionally requires graph validation and a published `.well-known` naming profile for the host that serves these `@id` values. Level 3 additionally requires every crosswalk the profile declares to be present on every applicable record. The Regulation already carries its `eli_uri` crosswalk; the Commission authority and the Regulation carry `sameAs` to their EveryAILaw counterparts.

## Provenance

Built 2026-06-02 from the draft Guidelines published for stakeholder consultation (consultation closing 2026-06-03). The draft Guidelines are a moving target. On adoption, the Guidelines Instrument's `status` moves from `proposed` to `in-force`, and its `source` should point to the adopted text rather than the consultation draft. Paragraph and section numbers cited here are those of the consultation draft and may shift in the final text.

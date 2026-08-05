# Worked example: Utah Mental Health Chatbot Disclosure JIA

Round-trips PubLedge instrument `us-ut-oaip-jia-2026-001` through the Obligation-First v0.6 spine. The four-record fixture tests a proposed Instrument, its issuing Authority, a contractual Term with multiple JSON-LD types, and the Requirement that Term creates. The canonical record is maintained in the [PubLedge protocol repo](https://publedge.org/); a mirrored record set is served from [obligationfirst.org/v1/examples/publedge-jia-utah-72/records/](https://obligationfirst.org/v1/examples/publedge-jia-utah-72/records/) so reviewers can fetch and validate the JSON without repo access.

## Why this example

PubLedge already runs the four-role spine. The v0.6 question is whether its native agreement and issuance model can preserve that meaning while adopting the shared entity, actor, lifecycle, provenance, and graph contracts.

The result is an adapter, not a context-only rename. PubLedge keeps authority over its source model and projects evidence-backed shared records into Obligation-First.

## Mapping summary

| PubLedge field | Obligation-First binding |
|---|---|
| agreement-shaped source record | projects to `of:Instrument`; the source kind remains `jia` |
| `id`, `slug`, `title` | project into adopter-local `@id` and shared title fields |
| `jurisdiction` | projects to `of:Jurisdiction` legal competence with `territorial_scope` |
| `issued_by` | projects to `issuedBy`; issuance and administration remain distinct roles |
| administrative issuance event | absent while the instrument remains proposed; once evidenced, the act becomes a separate `of:Determination` record |
| `obligation_kind` | becomes the deontic `@type` on each created Obligation; an explicitly unknown kind remains base `of:Obligation` |
| `parties` | project to `of:Party` records and typed Instrument roles when the curated source supplies them |
| `statute_anchors` | becomes `of:anchors` relations on the created Obligations |
| contractual terms | carry both `of:Term` and `gist:ContractTerm`; `of:Term` remains the schema-dispatch type |
| `status: proposed` | remains proposed and pairs with `enforcement_status: unsignaled` |

## Migration notes for PubLedge

The PubLedge to Obligation-First binding is mostly additive, with three explicit distinctions:

### 1. Issuance becomes a record only after it occurs

The current JIA is an illustrative proposed draft, so this example publishes no issuance Determination. After formal issuance, the authoritative act becomes a separate `of:Determination` rather than a status-like string:

```yaml
"@type": of:Determination
"@id": https://publedge.org/determination/us-ut-oaip-jia-2026-001-issuance
issued_date: 2026-04-15
issuedBy: https://publedge.org/authority/us-ut-oaip
decides: []
disposition: issued
target_instrument: https://publedge.org/instrument/us-ut-oaip-jia-2026-001
```

This makes the issuance linkable without claiming that a draft was promulgated. The current example intentionally omits this hypothetical record.

### 2. `obligation_kind` becomes typed records, not a list

PubLedge stores `obligation_kind` in its source model, with the actual obligations expressed in prose. Under v0.6, each obligation becomes its own typed record:

```yaml
"@type": of:Requirement
"@id": https://publedge.org/obligation/us-ut-oaip-jia-2026-001-display-disclosure
title: Display disclosure on first session
duty_holder: provider
content: "Plainly identify the service as an AI chatbot on first session."
created_by: https://publedge.org/term/us-ut-oaip-jia-2026-001-1
anchors:
  - https://everyailaw.com/obligation-category/transparency.json
```

The `anchors` field is the cross-portfolio join. This illustrative duty is supported only at the transparency-concept level, so it points to the EveryAILaw ObligationCategory. A concrete Obligation anchor would require evidence tying the JIA to the specific Term that creates that duty.

### 3. Contractual meaning is an additional type

The JIA clause is both an Obligation-First Term and a gist contractual term:

```yaml
"@type":
  - of:Term
  - gist:ContractTerm
```

This preserves contract semantics without removing the shared `of:Term` type that selects the schema and joins the Term to its parent Instrument and created Obligation.

## Round-trip findings

- PubLedge's source structure is expressible in v0.6 without making the shared schema authoritative over PubLedge's editorial model.
- Typed Obligation records are additive, while the absent issuance Determination preserves the upstream draft posture.
- Multi-type contractual Terms validate and retain the shared Term graph edges.
- `anchors` demonstrates two cross-portfolio joins: the provision-specific EveryAILaw Term and the broader transparency ObligationCategory.

## Applicability of the Instrument lifecycle fields

JIAs are Instruments, so the shared Instrument lifecycle fields apply here even though this fixture models a single proposed JIA in isolation:

- **`status`** — this JIA is `proposed` (per upstream PubLedge). Could move through `enacted` once formally issued, or `superseded` if a later JIA replaces it.
- **`enforcement_status`** — typically `routine` for a JIA once issued (the parties have agreed to follow it). May be `unsignaled` while the JIA is still proposed. `constrained` is unusual but possible if a later authority disputes the JIA's effect.
- **`supersedes` / `wouldSupersede`** — directly applicable when a JIA replaces an earlier interpretation. PubLedge's no-action letter pattern in particular tends to chain over time; `supersedes` is the right predicate for that chain once each successor is enacted, with `wouldSupersede` available pre-enactment.

PubLedge adopters that need to model JIA lineage or enforcement nuance can do so on the same spine without extending the schema.

## Reference

Canonical PubLedge instrument: identifier `us-ut-oaip-jia-2026-001` in the PubLedge repo at `data/examples/instruments/us-ut-oaip-jia-2026-001.md`, published at [its live record URL](https://publedge.org/us/utah/oaip/jia/2026-001/).

This worked example demonstrates the binding; the canonical record stays in the PubLedge repo.

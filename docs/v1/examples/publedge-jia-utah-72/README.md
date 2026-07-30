# Worked example: Utah Mental Health Chatbot Disclosure JIA

Round-trips PubLedge instrument `us-ut-oaip-jia-2026-001` through the Obligation-First spine. Tests that an existing PubLedge JIA binds cleanly to v0.1 with a `@context` swap and minimal field changes. The canonical record is maintained in the [PubLedge protocol repo](https://publedge.org/); a mirrored record set is served from [obligationfirst.org/v1/examples/publedge-jia-utah-72/records/](https://obligationfirst.org/v1/examples/publedge-jia-utah-72/records/) so reviewers can fetch and validate the JSON without repo access.

## Why this example

PubLedge already runs the four-role spine. The question is whether binding its records through `https://obligationfirst.org/v1/context.jsonld` produces equivalent semantics — i.e., whether v0.1 is genuinely the lift-and-shift of PubLedge's existing model rather than a new modeling pattern.

If this round-trips cleanly, PubLedge's adoption path to v0.1 is purely additive: add the new `@context`, keep all existing records.

## Mapping summary

| PubLedge field | Obligation-First binding |
|---|---|
| `"@type": gist:Agreement` | unchanged — `of:Instrument` is bound to `gist:Agreement` |
| `id`, `slug`, `title`, `type`, `jurisdiction` | unchanged |
| `issued_by` | unchanged — wraps `gist:Organization` subtype the same way |
| administrative issuance event | absent while the instrument remains proposed; once evidenced, the act becomes a separate `of:Determination` record |
| `obligation_kind: [requirement, permission]` | becomes the `@type` on each created `of:Obligation` (split into multiple typed records, not a list of strings) |
| `parties` | unchanged for now; v0.2 may bind to a typed Party vocabulary |
| `statute_anchors` | becomes `of:anchors` relations on the created Obligations |
| `terms` | unchanged — `gist:ContractTerm` already bound |
| `status: proposed` | unchanged — vocabulary stays repo-local in v0.1 |

## Migration notes for PubLedge

The PubLedge → Obligation-First binding is mostly *additive*. Two distinctions are worth noting:

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

Currently PubLedge stores `obligation_kind: [requirement, permission]` as a frontmatter list, with the actual obligations expressed in prose. Under v0.1, each obligation becomes its own typed record:

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

## Round-trip findings

- ✅ PubLedge's existing structure is fully expressible in v0.1 with no information loss
- ✅ Typed obligation records are additive, while the absent issuance record preserves the upstream draft posture
- ✅ The `anchors` field demonstrates cross-portfolio join: PubLedge → EveryAILaw works
- ✅ Confirms v0.1 adoption path for PubLedge is purely additive

## Applicability of the Instrument lifecycle fields

JIAs are Instruments, so the three Instrument-level fields landed in v0.1 from the Colorado example apply here too — they're just not exercised by this particular example, which models a single proposed JIA in isolation:

- **`status`** — this JIA is `proposed` (per upstream PubLedge). Could move through `enacted` once formally issued, or `superseded` if a later JIA replaces it.
- **`enforcement_status`** — typically `routine` for a JIA once issued (the parties have agreed to follow it). May be `unsignaled` while the JIA is still proposed. `constrained` is unusual but possible if a later authority disputes the JIA's effect.
- **`supersedes` / `wouldSupersede`** — directly applicable when a JIA replaces an earlier interpretation. PubLedge's no-action letter pattern in particular tends to chain over time; `supersedes` is the right predicate for that chain once each successor is enacted, with `wouldSupersede` available pre-enactment.

PubLedge adopters that need to model JIA lineage or enforcement nuance can do so on the same spine without extending the schema.

## Reference

Canonical PubLedge instrument: identifier `us-ut-oaip-jia-2026-001` in the PubLedge repo at `data/examples/instruments/us-ut-oaip-jia-2026-001.md`, published at [its live record URL](https://publedge.org/us/utah/oaip/jia/2026-001/).

This worked example demonstrates the binding; the canonical record stays in the PubLedge repo.

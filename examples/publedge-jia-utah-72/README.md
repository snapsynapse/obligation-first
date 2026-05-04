# Worked example: Utah Mental Health Chatbot Disclosure JIA

Round-trips PubLedge instrument [`us-ut-oaip-jia-2026-001`](https://github.com/snapsynapse/publedge/blob/main/data/examples/instruments/us-ut-oaip-jia-2026-001.md) through the Obligation-First spine. Tests that an existing PubLedge JIA binds cleanly to v0.1 with a `@context` swap and minimal field changes.

## Why this example

PubLedge already runs the four-role spine. The question is whether swapping its repo-local context for `https://w3id.org/of/v1/` produces equivalent semantics — i.e., whether v0.1 is genuinely the lift-and-shift of PubLedge's existing model rather than a new modeling pattern.

If this round-trips cleanly, PubLedge's adoption path to v0.1 is purely additive: add the new `@context`, keep all existing records.

## Mapping summary

| PubLedge field | Obligation-First binding |
|---|---|
| `"@type": gist:Agreement` | unchanged — `of:Instrument` is bound to `gist:Agreement` |
| `id`, `slug`, `title`, `type`, `jurisdiction` | unchanged |
| `issued_by` | unchanged — wraps `gist:Organization` subtype the same way |
| `issuance_event: gist:Determination` | this is the act of issuing the JIA itself; in v0.1 this becomes a separate `of:Determination` record (not a string field) — see note below |
| `obligation_kind: [requirement, permission]` | becomes the `@type` on each created `of:Obligation` (split into multiple typed records, not a list of strings) |
| `parties` | unchanged for now; v0.2 may bind to a typed Party vocabulary |
| `statute_anchors` | becomes `of:anchors` relations on the created Obligations |
| `terms` | unchanged — `gist:ContractTerm` already bound |
| `status: proposed` | unchanged — vocabulary stays repo-local in v0.1 |

## Migration notes for PubLedge

The PubLedge → Obligation-First binding is mostly *additive*. Two changes worth noting:

### 1. `issuance_event` becomes a record, not a string

PubLedge currently stores `issuance_event: gist:Determination` as a frontmatter string. Under v0.1, the act of issuing the JIA is itself a Determination (a `gist:Determination`) and gets its own record:

```yaml
"@type": of:Determination
"@id": https://publedge.org/determination/us-ut-oaip-jia-2026-001-issuance
issued_date: 2026-04-15
issuedBy: https://publedge.org/authority/us-ut-oaip
disposition: issued
target_instrument: https://publedge.org/instrument/us-ut-oaip-jia-2026-001
```

This makes the Determination linkable from anywhere (e.g., a future case that cites this JIA) without re-creating it.

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
  - https://everyailaw.com/instrument/utah-sb149/term/utah-code-13-72a-203
```

The `anchors` field is the cross-portfolio join: a PubLedge JIA's obligations link directly to the EveryAILaw provisions they interpret. This is exactly the bridge the schema was designed to enable.

## Round-trip findings

- ✅ PubLedge's existing structure is fully expressible in v0.1 with no information loss
- ✅ Two changes (issuance as Determination record, obligations as typed records) are additive — old prose representation can stay as documentation; the record form is the canonical reference
- ✅ The `anchors` field demonstrates cross-portfolio join: PubLedge → EveryAILaw works
- ✅ Confirms v0.1 adoption path for PubLedge is purely additive

## Reference

Canonical PubLedge instrument lives upstream at:
[github.com/snapsynapse/publedge/blob/main/data/examples/instruments/us-ut-oaip-jia-2026-001.md](https://github.com/snapsynapse/publedge/blob/main/data/examples/instruments/us-ut-oaip-jia-2026-001.md)

This worked example demonstrates the binding; the canonical record stays in the PubLedge repo.

# Adopter binding handoffs

Three handoff documents, one per current adopter, describing what real binding to Obligation-First v0.1 entails. Each is self-contained: someone arriving cold can read it and execute the binding without further context.

| Adopter | Effort | Order |
|---|---|---|
| [EveryAILaw](everyailaw-binding.md) | ~3-4 days | First — smallest lift, validates the schema against living legal data |
| [PubLedge](publedge-binding.md) | ~3-4 days additive (~6 with optional obligation lift) | Second — purely additive; spine originated in PubLedge |
| [AI Incident Law](aiincidentlaw-binding.md) | ~7-9 days | Third — largest restructure (flat → typed); benefits from prior stress-testing |

## What each handoff specifies

- The conceptual change (what the existing record shape becomes under v0.1)
- The mechanical steps (file changes, URL minting, CI wiring)
- A verification checklist (concrete done criteria)
- Real value the binding produces (not theoretical)
- What's deliberately out of scope
- An effort estimate

## Common pattern across all three

Every adopter binding produces three things:

1. Records that carry `@context: "https://obligationfirst.org/v1/"` and a typed `@type`
2. Records that dereference at stable adopter-domain URLs
3. CI that validates every published record against the v0.1 JSON Schemas

The differences are in the conceptual mapping — what existing fields become which v0.1 entity — and in how much restructuring is needed.

## Cross-portfolio link graph

The end state these handoffs produce:

```
                                ┌─ EveryAILaw ─────────────────────────────┐
                                │  Authorities · Instruments · Terms ·     │
                                │  Obligations (statutes + obligations)    │
                                └──────────┬───────────────────────────────┘
                                           │ anchors                anchors
                                           │ (FROM aiincidentlaw)   (FROM publedge)
                                           ▼                        ▼
                ┌─ AI Incident Law ──────────────────┐   ┌─ PubLedge ────────────────────┐
                │  Authorities · Proceedings ·       │   │  Authorities · Instruments ·  │
                │  Allegations · Determinations      │   │  Terms · Obligations          │
                │  (cases + enforcement)             │   │  (joint interpretations)      │
                └────────────────────────────────────┘   └───────────────────────────────┘
```

Each adopter's records carry `@id` values at their canonical domain. Cross-portfolio joins use `anchors` (from a Determination or an Obligation back to a referenced Obligation). The graph is bidirectional via inbound resolution.

## Where to start

If you're the steward of one of these projects, start with the handoff for your repo. Read the verification checklist first — it's the spec for "done." The step-by-step is the recommended path; deviate where it makes sense for your existing build pipeline.

If you're considering binding a new project (a fourth adopter), each of these is also a worked template. The conceptual mapping section in the handoff closest to your project's shape will be the most useful starting point.

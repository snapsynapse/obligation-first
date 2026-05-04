# Design Conversation — 2026-05-04

Archive of the workshop conversation that produced the v0.1.0-draft design. Captured here so the design history travels with the repo.

## Origin

Started as a question about adding a weekly model cascade to ai-incident-law (matching ai-tool-watch and every-ai-law). Quickly broadened: should ai-incident-law stand alone, fold into every-ai-law, or hybrid? Decision: stand alone, with cross-portfolio shared schema as the integration mechanism rather than co-location.

## Schema design — what got resolved

### Four-role spine, lifted from PubLedge

| Role | of: term | gist class |
|---|---|---|
| Authority | `of:Authority` | wraps `gist:Organization` |
| Container | `of:Instrument` | `gist:Agreement` / `gist:Specification` |
| Secondary | `of:Term` | `gist:ContractTerm` |
| Primary | `of:Obligation` | `gist:Requirement` / `gist:Restriction` / `gist:Permission` / `of:Reparation` |

### Proceeding strand — the new contribution

User raised the critical constraint: an "event" in a legal matter is *alleged* until determined, and post-determination the disposition could go either way. Modeling that as a status flag forces premature factual classification.

Resolved as three distinct entities:

- `of:Proceeding` — the legal matter, exists once filed
- `of:Allegation` — asserted facts (gist:Statement: asserted, unverified)
- `of:Determination` — Authority's ruling (gist:Determination)

Relations: `Proceeding hasAllegation Allegation`, `Proceeding hasDetermination Determination`, `Determination decides Allegation` with disposition vocabulary (confirmed / rejected / partial / dismissed / settled / vacated).

### Deontic quartet

After LegalRuleML 1.0 §5.3 review, added Reparation as fourth operator. Reparation is the secondary obligation that fires when a primary is breached — the natural bridge from Provision → Determination → consequent obligation.

### Defeasibility

Added `of:defeats` predicate per Lawsky default logic / LegalRuleML §7.4. Without it, can't model statutory exceptions (most of how law works).

### Executable-rules layer

Added `of:executableEncoding` as polymorphic typed reference (kind: catala / blawx / openfisca / other; uri; version). Doesn't privilege any one rules-as-code engine. Forward-looking — most Provisions won't have encodings yet.

### Authority interface

Recursive: every Authority's right to act is grounded in an Instrument on the spine. Closed vocabulary for `authority_basis.kind`: statutory / regulatory / contractual / corporate / judicial. Handles non-government authorities (HOAs, co-ops, tribunals) without special-casing.

## Prior-art summary

Three Perplexity research passes covered:

1. AI law / incident / agreement schemas — confirmed gap, no existing bridge
2. Visual mapping tools — strong tools per-dimension, no integration; obligation networks, sunset state machines, branching court flows are confirmed gaps
3. Catala — complementary lower layer, not competitive
4. Deontic logic foundations (Lawsky, LegalRuleML, gist) — alignment table built
5. Rules-as-code landscape (Blawx, OpenFisca, Hammurabi, Catala) — multi-engine support added to schema
6. Government machine-readable law (Akoma Ntoso, ELI, ECLI, USLM) — referenced as source-text identifiers, not duplicated

Full survey in PRIOR-ART.md.

## Domain decision

Considered: knowledge-as-code.com, publedge.org, w3id.org, others.

Resolved: **obligationfirst.org** (registered 2026-05-04). Reasoning:

- Schema is literally obligation-first (the Primary role IS Obligation)
- "Obligation-driven compliance" is a known phrase in GRC; name has external resonance
- Gives PAICE a methodology name parallel to knowledge-as-code (the methodology family)
- Pairs with existing obligationfirst.com (philosophy / human content)
- IRI prefix: `https://w3id.org/of/v1/` resolving to `https://obligationfirst.org/v1/`

## Adoption order

1. EveryAILaw first — already mostly aligned, smallest binding effort
2. PubLedge second — already on the spine, swaps repo-local context for shared
3. AI Incident Law third — largest restructure, benefits from prior stress-testing

Three live adopters is the gate to v1.0.

## Outstanding

- Dave McComb / Semantic Arts outreach — one-pager extraction from PROTOCOL.md when v0.1 is closer to complete
- GitHub org structure for PAICE portfolio — captured to Open Brain, deferred
- v0.1 PROTOCOL.md sections still to write (TODO list in PROTOCOL.md)
- Three worked examples: Air Canada, Colorado SB 24-205, Utah JIA-72
- vendor/gist/ snapshot
- Crosswalk tables

## Key external acknowledgments

- Dave McComb (Semantic Arts / gist) — uncontacted; targeted outreach planned
- Jason Morris (Blawx / Lexpedite) — uncontacted; potential collaborator on executableEncoding spec
- Sarah Lawsky — uncontacted; her default-logic foundations are credited in PRIOR-ART
- Denis Merigoux (Catala) — uncontacted; potential collaborator on Catala binding

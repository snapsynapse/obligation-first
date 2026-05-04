# Roadmap

## v0.1.0-draft (current)

**Goal:** lock the design on paper. Ship a coherent spec, three worked examples, and a JSON-LD context. Get external feedback (Semantic Arts, Blawx) before freezing.

In progress:

- [x] INTENT, README, PRIOR-ART, ROADMAP scaffolding
- [x] PROTOCOL.md outline with TODO sections
- [ ] schema/context.jsonld — full v1 context
- [ ] schema/*.schema.json — JSON Schemas for each entity
- [ ] vendor/gist/ — pinned snapshot
- [ ] reference/crosswalks/ — gist, LegalRuleML, Akoma Ntoso, ELI, ECLI
- [ ] examples/air-canada/ — proceeding strand worked example
- [ ] examples/colorado-sb24-205/ — spine worked example
- [ ] examples/publedge-jia-utah-72/ — joint interpretation worked example
- [ ] McComb / Semantic Arts one-pager extraction

## v0.1 freeze (target: within 90 days)

**Gate:** all PROTOCOL.md TODOs resolved, all three worked examples round-trip, external review feedback incorporated or explicitly deferred.

- [ ] PROTOCOL.md complete
- [ ] context.jsonld validated against the three worked examples
- [ ] At least one external reviewer has read and commented (target: Dave McComb / Semantic Arts, Jason Morris / Blawx)
- [ ] First adopter (EveryAILaw) has bound to v0.1 in production
- [ ] CHANGELOG.md captures all changes from -draft to freeze

## v0.2 (target: 6 months after v0.1 freeze)

Adds what we deferred from v0.1.

- [ ] Provision lifecycle state machine (effective / amended / sunset / repealed) — drives the visualization layer
- [ ] Cross-jurisdictional equivalence relation (`of:correspondsTo`) — drives the cross-jurisdictional diff visualization
- [ ] Akoma Ntoso element-level binding (formalized, not just IRI compatibility)
- [ ] Multi-language source text handling
- [ ] Second adopter (PubLedge) has bound

## v1.0 (target: 12 months after v0.1 freeze)

**Gate:** three live adopters, conformance suite, w3id permanent IRI.

- [ ] EveryAILaw, PubLedge, AI Incident Law all bound to v1.0
- [ ] w3id.org/of/v1/ permanent redirect filed and live
- [ ] SHACL validator
- [ ] Conformance test suite
- [ ] At least one external (non-PAICE) adopter

## Deferred decisions

| # | Question | Re-open trigger |
|---|---|---|
| 1 | Is gist's `Requirement`/`Restriction`/`Permission` enough, or does Reparation need its own gist binding? | Semantic Arts feedback or first attempt to validate against gist |
| 2 | Should `of:Proceeding` be subtyped by jurisdiction-specific kinds (US civil action, EU regulatory enforcement, UK tribunal)? | When third proceeding example doesn't fit the generic shape |
| 3 | Should `of:correspondsTo` carry confidence/scope metadata, or be binary? | First cross-jurisdictional comparison use case |
| 4 | Does multi-language source text need its own predicate or piggyback on existing dc:language? | First non-English Instrument bound |
| 5 | Should we mint our own namespace at w3id.org or stay on obligationfirst.org alone? | When external adopters request a permanent IRI |
| 6 | Should `of:executableEncoding` be on Term, Obligation, or both? | When first Catala/Blawx encoding lands |
| 7 | Org structure for the repo (snapsynapse vs new GitHub org) | When first external contributor joins, or Foundation transition |

## Strategic directions

These are not v0.1 deliverables but shape the architecture from the beginning so we don't have to retrofit later.

### EU AI Act as collaboration vector

The EU AI Act is the most-cited AI law globally and the natural shared reference point for outreach to rules-as-code project leaders.

**Plan:**

1. Parse the EU AI Act into Obligation-First's Term + Obligation structure (a substantial but bounded engineering task — ~150 articles, structured deontic content).
2. Use that structured representation to understand how the same content would encode in Catala (executable scope semantics), Blawx (s(CASP) goal-directed), and adjacent frameworks (OpenFisca, Logical English, L4).
3. Reach out to each project's leadership with the parsed corpus + an invitation to participate — Denis Merigoux (Catala/INRIA), Jason Morris (Blawx/Lexpedite), the OpenFisca community, others.

The invitation is not "use our schema." It's: "here's the EU AI Act in a portable shape; we're encoding it in your framework as a worked example; want to collaborate on the cross-framework binding?" The artifact gives them something concrete to evaluate; the question is unambiguous.

### Locally-hosted translation as a build step

Public-good standards should be machine-translatable without paying API tolls. Architecture target:

- A locally-hosted translation model (Gemma family, likely Gemma 4 or its successor) runs as part of the build pipeline
- Every canonical English document (PROTOCOL.md, crosswalks, examples) gets rendered into target languages at build time
- Translations are committed alongside source; CI verifies they regenerate deterministically
- No runtime translation calls; no external dependencies for adopters

This means EveryAILaw, AI Incident Law, PubLedge, and any other Obligation-First adopter can publish multilingual sites by default, with the translation cost amortized to build time and the model artifact pinned for reproducibility.

### Multilingual, a11y-audited, agent-friendly from the beginning

All Obligation-First-adopting offerings ship with three properties baseline, not retrofitted:

1. **Multilingual** — at minimum the EU official languages plus ES (US), ZH (CN/TW), JA. Build-time translation per the previous direction.
2. **A11y-audited** — WCAG 2.1 AA via pa11y-ci or equivalent in CI. Failing builds block merge.
3. **Agent-friendly** — `llms.txt`, `agents.json`, JSON-LD, structured RSS/Atom, MCP server, and explicit AI-crawler `robots.txt` allow-lists from day one. Aligned with [Siteline](https://siteline.to/) audits.

The cost of adding these later is high; the cost of designing for them at v0.1 is low. The ROADMAP commits to this as a non-negotiable design constraint.

## Versioning policy

- **Pre-v0.1:** drafting in public. Breaking changes allowed. Recorded in CHANGELOG.md.
- **v0.1 → v0.x:** additive changes preferred. Breaking changes require a 14-day comment window if any external adopter has bound.
- **v0.x → v1.0:** no breaking changes after the v1.0 freeze. v2.0 path required for breaking changes thereafter.
- IRI scheme: `https://w3id.org/of/v1/` for v1.x; `https://w3id.org/of/v2/` for v2.x.

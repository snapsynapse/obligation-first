# Roadmap

<!-- of-version: roadmap-current -->
## v0.6.4 (current)

Current evaluator work: [scope inventory contract v1](reference/contracts/scope-contract-v1.md) implements F11 and the issue 7 non-territorial issuer regression in the v0.6.4 reference package. Adopter inventories and exact scope baselines preserve recognition independently from coverage. Coordinated delivery and exact CI pins are verified in the [v0.6.4 delivery record](reference/release-delivery-v0.6.4.json).

The v0.6 semantic contract is released through five implemented decision records:

1. [Identity and classification](reference/decisions/identity-and-classification.md)
2. [Authority, source text, and legal scope](reference/decisions/authority-text-and-scope.md)
3. [Normative force and lifecycle](reference/decisions/normative-force-and-lifecycle.md)
4. [Actors and deontic grounding](reference/decisions/actors-and-deontic-grounding.md)
5. [Provenance, extensions, and conformance](reference/decisions/provenance-extensions-and-conformance.md)

The released implementation reconciles the 2026-06-09 semantic review with adopter-scale evidence from EveryAILaw, PubLedge, and AI Incident Law.

v0.6 exit gates:

- [x] Exact vocabulary and compatibility window implemented from the accepted directions
- [x] Legacy v0.5 fixtures and deterministic migrations pass
- [x] EveryAILaw adapter preserves legal force, lifecycle, roles, text provenance, and classification semantics
- [x] PubLedge administrative issuance, Party, source-text, and temporal-state fixtures pass
- [x] AI Incident Law proceeding, Party, jurisdiction, and adjudicative fixtures pass
- [x] Air Canada common-law obligation and remedy fixture passes
- [x] Aggregate, companion, deprecated, naming-profile, and graph checks pass locally
- [x] Conformance and migration notes are implemented
- [x] Material-change review and steward release authorization completed
- [x] Publication, tag, release, and deployment verified
- [x] v0.6.1 release-state patch prevents packaged candidate/released copy drift

## v0.1.0-draft

**Goal:** lock the design on paper. Ship a coherent spec, three worked examples, a JSON-LD context, and a live canonical site. Get external feedback (Semantic Arts, Blawx) before freezing.

Done:

- [x] INTENT, README, PRIOR-ART, ROADMAP, CHANGELOG, ATTRIBUTION, CONTRIBUTING, SECURITY scaffolding
- [x] PROTOCOL.md complete — all internal drafting placeholders closed (defeasibility semantics, executableEncoding shape, conformance levels, versioning policy, supersession vs defeasibility, enforcement-cause rationale)
- [x] schema/context.jsonld — full v1 context published
- [x] schema/*.schema.json — eight JSON Schemas (Authority, Instrument, Term, Obligation, Proceeding, Allegation, Determination, ExecutableEncoding)
- [x] vendor/gist/ — pinned snapshot (gist 14.1.0)
- [x] reference/crosswalks/ — gist, LegalRuleML, Akoma Ntoso, ELI/ECLI
- [x] examples/air-canada/ — proceeding strand worked example
- [x] examples/colorado-sb24-205/ — three-layer reality worked example
- [x] examples/publedge-jia-utah-72/ — joint interpretation worked example
- [x] examples/*/records/ — 23 canonical JSON record files; 23/23 pass schema validation
- [x] scripts/validate-examples.mjs + npm run validate
- [x] Public external review questions drafted at reference/review/external-review-questions.md
- [x] w3id.org PR prep drafted at reference/w3id-pr.md
- [x] Canonical landing site published at https://obligationfirst.org/ — agent-discovery files (llms.txt, llms-full.txt, agents.json, feed.xml, sitemap.xml, robots.txt, security.txt, changelog.html) all dereferencing
- [x] CI: validation on every push (test.yml), Pages deploy (pages.yml), monthly a11y audit (a11y.yml)
- [x] Schema additions surfaced by the Colorado example landed in v0.1 — see "Resolved in v0.1" below

## v0.1 freeze (target: within 90 days)

**Gate:** external review feedback incorporated or explicitly deferred; first adopter binding live; w3id PR filed.

Current assessment as of 2026-05-26: local repo deliverables for v0.1 are complete and tests are green. EveryAILaw, PubLedge, and AI Incident Law publish Obligation-First bindings. Semantic Arts review has come back and is absorbed into v0.2. Remaining v0.1-freeze gates are LegalRuleML community feedback, permanent IRI filing, and cross-project anchor enrichment.

- [x] PROTOCOL.md complete
- [x] context.jsonld validated against the three worked examples (npm run validate green)
- [x] External reviewer feedback (Semantic Arts: Dave McComb response 2026-05-26 — incorporated into v0.2; see [CHANGELOG.md](CHANGELOG.md))
- [ ] LegalRuleML community feedback on deontic alignment
- [x] External review questions sent (Semantic Arts: 2026-05-19)
- [x] First adopter (EveryAILaw) has bound to v0.1 in production
- [x] Cross-project anchor report added so enrichment can be measured across adopter exports
- [x] Initial cross-project anchor enrichment seeded: PubLedge and AI Incident Law both resolve anchors into EveryAILaw in local implementation checks
- [ ] Broader anchor enrichment pass across AI Incident Law and PubLedge
- [ ] w3id.org PR filed for permanent `https://w3id.org/of/v1/` IRI
- [x] CHANGELOG.md captures all changes from -draft to current state

## v0.2 (target: 6 months after v0.1 freeze)

Adds what we deferred from v0.1, plus binding-only refinements landed mid-cycle.

Landed in v0.2.2-draft (2026-05-30):

- [x] Security hardening release contracts: CI now runs the full local contract suite, release package hashes are enforced, GuideCheck assistant-guide byte identity is checked, and `MANIFEST.yaml` hashes the documented canonical content set.
- [x] Shared graph validation hardened: administrative Determinations with `disposition: issued` must cite a `target_instrument` or at least one `anchors` target; worked examples and adopter validation now use the same graph validator.
- [x] Focused hardening regressions added for the confirmed administrative Determination bypass, false-positive controls, stale release hashes, assistant-guide byte drift, and stale content hashes.

Landed in v0.2.1-draft (2026-05-26):

- [x] `of:Reparation` gist binding closed to the layered pattern `gist:Requirement` + `gist:Intention` (+ `gist:Event`) per Semantic Arts feedback; class itself preserved.
- [x] `of:Allegation` rebound from non-existent `gist:Statement` to `gist:Content` (+ `gist:Intention` when intent-bearing).
- [x] Defeasibility sub-types added: `of:rebuts` and `of:undercuts` as subproperties of `of:defeats` per LegalRuleML §7.4.
- [x] `of:violationOf` symmetric/inverse predicate of `triggers_on_violation_of` added so the violation relation can be queried from either side.
- [x] Confirmed `of:executableEncoding` accepts both Term and Obligation as domain (already true in v0.1 schemas; documented).

Remaining directions from the historical v0.2 plan:

- [x] Lifecycle and operative-state fields implemented in v0.6; qualified date branches remain the separate issue 4 fixture work
- [ ] Cross-jurisdictional equivalence relation (`of:correspondsTo`) — drives the cross-jurisdictional diff visualization
- [ ] Akoma Ntoso element-level binding (formalized, not just IRI compatibility)
- [ ] Multi-language source text handling
- [x] Second adopter (PubLedge) has bound

## v1.0 (target: 12 months after v0.1 freeze)

**Gate:** three live adopters, conformance suite, w3id permanent IRI.

- [x] EveryAILaw, PubLedge, AI Incident Law all bound to v0.1
- [ ] w3id.org/of/v1/ permanent redirect filed and live
- [ ] SHACL validator
- [x] JSON Schema, local graph, JSON-LD and deterministic semantic regression suites
- [ ] External conformance certification
- [ ] At least one external (non-PAICE) adopter

## Deferred decisions

| # | Question | Re-open trigger |
|---|---|---|
| 1 | ~~Is gist's `Requirement`/`Restriction`/`Permission` enough, or does Reparation need its own gist binding?~~ **Resolved v0.2 (2026-05-26):** gist binding for `of:Reparation` closed to the layered pattern `gist:Requirement` (the duty) + `gist:Intention` (declared legislative intent on the creating Term) + `gist:Event` (the actuated reparation, recorded via the proceeding strand). `of:Reparation` retained as a distinct deontic subclass for LegalRuleML 1:1 alignment and SPARQL queryability. Per Dave McComb / Semantic Arts. | — |
| 2 | Should `of:Proceeding` be subtyped by jurisdiction-specific kinds (US civil action, EU regulatory enforcement, UK tribunal)? | When third proceeding example doesn't fit the generic shape |
| 3 | Should `of:correspondsTo` carry confidence/scope metadata, or be binary? | First cross-jurisdictional comparison use case |
| 4 | Does multi-language source text need its own predicate or piggyback on existing dc:language? | First non-English Instrument bound |
| 5 | Should we mint our own namespace at w3id.org or stay on obligationfirst.org alone? | When external adopters request a permanent IRI |
| 6 | ~~Should `of:executableEncoding` be on Term, Obligation, or both?~~ **Resolved v0.2 (2026-05-26):** both. v0.1 schemas already accept the field on Term and Obligation; PROTOCOL.md core-relations table updated to make this explicit. | — |
| 7 | Org structure for the repo (snapsynapse vs new GitHub org) | When first external contributor joins, or Foundation transition |
| 11 | A standalone typed `of:Remedy` entity remains deferred. v0.6 requires an embedded remedy to reference its grounded Obligation when that link is known. | A remedy needs identity or lifecycle independent of its Determination |
| 12 | A universal closed party-role vocabulary remains deferred. v0.6 adds typed Party records and role strings or IRIs without pretending every jurisdiction uses one role taxonomy. | Two adopters need the same controlled role identifier |
| 13 | ~~Symmetric `of:violationOf` relation parallel to `of:creates` for Reparations~~ **Resolved v0.2 (2026-05-26):** `of:violationOf` added as the symmetric/inverse predicate of `triggers_on_violation_of`. Adopters MAY assert it from either side; if both directions are present they must be consistent. | — |
| 14 | LegalRuleML encoding pointer (`of:legalRuleMLEncoding`) parallel to `of:executableEncoding` | First Term that has authoritative LegalRuleML encoding |
| 15 | ~~Defeasibility sub-types — `of:rebuts` and `of:undercuts` as subproperties of `of:defeats`~~ **Resolved v0.2 (2026-05-26):** added per LegalRuleML §7.4. `of:defeats` retained as general/fallback predicate; `of:rebuts` denies the conclusion; `of:undercuts` denies applicability. Subproperty entailment: rebut/undercut implies defeats. | — |
| 16 | OSCAL (NIST Assessment Results 1.1.2 / Profile / POA&M) as a secondary export projection from Obligation-First records. **Not adopted as substrate** (2026-05-27): JSON-LD + JSON Schema + gist binding + LegalRuleML alignment is the canonical substrate. OSCAL is layer-mismatched — it models assessments of operational systems against controls, while Obligation-First models normative content itself. The natural OSCAL home in the PAICE legal graph is **AI Posture** (the assessor), not Obligation-First (the substrate). A `reference/crosswalks/oscal.md` doc and an export script that projects OF records into OSCAL Profile / AR shapes are deferred. | First external GRC consumer (FedRAMP, ISO 27001 auditor, GRC platform) requests OSCAL ingest of OF records; OR a US federal regulator (NIST, OMB, agency adopting NIST AI RMF) publishes an OSCAL catalog for AI obligations that OF would need to ingest; OR AI Posture ships an OSCAL Assessment Results wrapping and needs OF-side alignment notes. |
| 17 | Identity-fidelity enforcement. v0.6 adds Tombstones, weaker record-correspondence links, versioned naming profiles, and local graph checks. Live HTTP resolution remains a release audit concern. | External adopter or resolver evidence exposes a remaining ambiguity |
| 18 | ~~Example IRI policy for not-yet-minted entities.~~ **Resolved v0.3.1 (2026-06-02):** worked examples use the neutral, suffixless `https://obligationfirst.org/v1/examples/` namespace; real adopter identities ride in crosswalks only when they exist. | — |
| 19 | ~~`.json` suffix in `@id`: adopt suffixless canonical `@id` with `.json` reached by content negotiation, or keep the served-file suffix as canonical.~~ **Resolved v0.4.0 (2026-06-03):** the spec does not mandate either; each adopter records its actual scheme descriptively in its naming-profile `void:uriRegexPattern` (the three live adopters' profiles will carry `.json`), while suffixless canonical with content-negotiated representations remains the recommended target, not a conformance gate. Examples stay suffixless under the neutral namespace. | — |
| 20 | Non-EU instrument join key. **Advanced 2026-08-04:** the first real US or Canadian cross-adopter join triggers a bounded citation-normalization trial before any universal identifier becomes required. | First real US or Canadian instrument join across two adopters |
## Resolved in v0.2 (originally raised as deferred)

Surfaced by Semantic Arts review (Dave McComb, 2026-05-26) and a roadmap sweep on the same date. All resolved as binding-only / additive changes — no breaking impact on v0.1 adopter records.

| # | Resolution | Where |
|---|---|---|
| 1 | `of:Reparation` gist binding closed to the layered pattern `gist:Requirement` + `gist:Intention` (+ `gist:Event` when actuated). Class itself preserved for LegalRuleML 1:1 alignment and SPARQL queryability. | PROTOCOL.md (deontic-quartet section), reference/crosswalks/gist.md (Reparation gist binding section), schema/obligation.schema.json (Reparation description) |
| 6 | `of:executableEncoding` confirmed on both Term and Obligation. Already true in v0.1 schemas; PROTOCOL core-relations table now states this explicitly. | PROTOCOL.md, schema/term.schema.json, schema/obligation.schema.json |
| 13 | `of:violationOf` added as symmetric/inverse of `triggers_on_violation_of`. Adopters MAY assert from either side; if both present, must be consistent. | PROTOCOL.md, schema/context.jsonld |
| 15 | `of:rebuts` and `of:undercuts` added as subproperties of `of:defeats` per LegalRuleML §7.4. `of:defeats` kept as general/fallback predicate. | PROTOCOL.md (Defeasibility / Sub-types), schema/context.jsonld, reference/crosswalks/legalruleml.md |
| — | `of:Allegation` gist binding switched from non-existent `gist:Statement` to `gist:Content` (+ `gist:Intention` when intent-bearing). | PROTOCOL.md, schema/allegation.schema.json, reference/crosswalks/gist.md |

## Resolved in v0.1 (originally raised as deferred)

These items were surfaced by the Colorado SB 24-205 example and resolved in v0.1 rather than deferred. Recorded here for audit:

| # | Resolution | Where |
|---|---|---|
| R1 | `of:enforcement_status` added to Instrument as a flat closed enum (`routine \| constrained \| unsignaled`). Cause of non-routine state is expressed via the proceeding strand, not baked into the enum. Rationale documented in PROTOCOL.md "Why enforcement cause lives in the proceeding strand". | PROTOCOL.md, schema/instrument.schema.json, schema/context.jsonld |
| R2 | `of:supersedes` added as Instrument → Instrument relation (post-enactment, array-valued). Does not imply Term-level defeats — those must still be asserted explicitly via `of:defeats`. Rationale documented in PROTOCOL.md "Supersession vs defeasibility". | PROTOCOL.md, schema/instrument.schema.json, schema/context.jsonld |
| R3 | `of:wouldSupersede` added as the subjunctive form for `proposed` Instruments, parallel to `supersedes`. Migrates to `supersedes` once enactment occurs. | PROTOCOL.md, schema/instrument.schema.json, schema/context.jsonld |

## Strategic directions

These are not v0.1 deliverables but shape the architecture from the beginning so we don't have to retrofit later.

### PAICE legal graph integration

Obligation-First should now be treated as the shared contract between PAICE legal projects:

1. EveryAILaw is the statutory source of truth for Instruments, Terms, and Obligations.
2. AI Incident Law is the proceeding source of truth for Proceedings, Allegations, and adjudicative Determinations arising from public matters.
3. PubLedge is the joint-interpretation source of truth for negotiated Instruments, re-allocated Obligations, and administrative issuance Determinations attached to its Instruments.
4. Obligation-First owns the common `@context`, JSON Schemas, crosswalks, and validation harness that let those records join without centralizing the products.

Near-term integration work belongs in the adopter repos. Durable contracts and acceptance evidence live in tracked reference documents; remaining session queues live temporarily in ignored `handoffs/`. This repo remains the stable vocabulary and conformance source.

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
3. **Agent-friendly** — `llms.txt`, `agents.json`, JSON-LD, structured RSS/Atom, and explicit AI-crawler `robots.txt` allow-lists from day one. Obligation-First itself is a static discovery and validation surface, not an MCP service. Interactive adopters may publish MCP servers when they expose tool calls. Aligned with [Siteline](https://siteline.to/) audits.

The cost of adding these later is high; the cost of designing for them at v0.1 is low. The ROADMAP commits to this as a non-negotiable design constraint.

## Versioning policy

- **Pre-v0.1:** drafting in public. Breaking changes allowed. Recorded in CHANGELOG.md.
- **v0.1 → v0.x:** additive changes preferred. Breaking changes require a 14-day comment window if any external adopter has bound.
- **v0.x → v1.0:** no breaking changes after the v1.0 freeze. v2.0 path required for breaking changes thereafter.
- IRI scheme: `https://w3id.org/of/v1/` for v1.x; `https://w3id.org/of/v2/` for v2.x.

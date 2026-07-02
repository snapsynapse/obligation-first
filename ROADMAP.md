# Roadmap

## v0.4.2 (current)

`@id` federation and identifier crosswalks: record `@id` values are adopter-local and permanent (renames preserved via HTTP 301), cross-adopter interoperability is carried by standard identifier crosswalks (ELI, ECLI, Akoma Ntoso, Wikidata) declared in a per-adopter `.well-known` naming profile, and jurisdiction is a typed ISO 3166 field. Reverses the earlier Term-`@id`-is-standard-IRI guidance; additive and non-breaking to v0.1 / v0.2 records. Decision record: [reference/iri-naming-and-crosswalks.md](reference/iri-naming-and-crosswalks.md). v0.4.0 defines the naming-profile format itself: a JSON-LD `of:NamingProfile` document at `/.well-known/obligation-first-naming-profile.jsonld` validated by `schema/naming-profile.schema.json`, with a `text/plain` provenance sidecar — closing a v0.3 freeze gate. The prior v0.2.x line absorbed Semantic Arts feedback (Dave McComb, 2026-05-26) as binding-only updates. v0.4.1 is a documentation-consistency patch from an external semantic review; the substantive findings and their remediation plan are tracked in an internal review handoff (2026-06-09) and will land here as decision records as they are taken up. See [CHANGELOG.md](CHANGELOG.md).

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

Still planned for v0.2:

- [ ] Provision lifecycle state machine (effective / amended / sunset / repealed) — drives the visualization layer
- [ ] Cross-jurisdictional equivalence relation (`of:correspondsTo`) — drives the cross-jurisdictional diff visualization
- [ ] Akoma Ntoso element-level binding (formalized, not just IRI compatibility)
- [ ] Multi-language source text handling
- [x] Second adopter (PubLedge) has bound

## v1.0 (target: 12 months after v0.1 freeze)

**Gate:** three live adopters, conformance suite, w3id permanent IRI.

- [x] EveryAILaw, PubLedge, AI Incident Law all bound to v0.1
- [ ] w3id.org/of/v1/ permanent redirect filed and live
- [ ] SHACL validator
- [ ] Conformance test suite
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
| 11 | Typed `of:Remedy` entity for monetary awards and other Determination consequences (currently unstructured object on Determination) | First adopter that needs structured remedy queries; surfaced by Air Canada example |
| 12 | Closed party-role vocabulary for `Allegation.asserted_by` (currently free-form string) | First adopter that needs to filter allegations by asserter role; surfaced by Air Canada example |
| 13 | ~~Symmetric `of:violationOf` relation parallel to `of:creates` for Reparations~~ **Resolved v0.2 (2026-05-26):** `of:violationOf` added as the symmetric/inverse predicate of `triggers_on_violation_of`. Adopters MAY assert it from either side; if both directions are present they must be consistent. | — |
| 14 | LegalRuleML encoding pointer (`of:legalRuleMLEncoding`) parallel to `of:executableEncoding` | First Term that has authoritative LegalRuleML encoding |
| 15 | ~~Defeasibility sub-types — `of:rebuts` and `of:undercuts` as subproperties of `of:defeats`~~ **Resolved v0.2 (2026-05-26):** added per LegalRuleML §7.4. `of:defeats` retained as general/fallback predicate; `of:rebuts` denies the conclusion; `of:undercuts` denies applicability. Subproperty entailment: rebut/undercut implies defeats. | — |
| 16 | OSCAL (NIST Assessment Results 1.1.2 / Profile / POA&M) as a secondary export projection from Obligation-First records. **Not adopted as substrate** (2026-05-27): JSON-LD + JSON Schema + gist binding + LegalRuleML alignment is the canonical substrate. OSCAL is layer-mismatched — it models assessments of operational systems against controls, while Obligation-First models normative content itself. The natural OSCAL home in the PAICE legal graph is **AI Posture** (the assessor), not Obligation-First (the substrate). A `reference/crosswalks/oscal.md` doc and an export script that projects OF records into OSCAL Profile / AR shapes are deferred. | First external GRC consumer (FedRAMP, ISO 27001 auditor, GRC platform) requests OSCAL ingest of OF records; OR a US federal regulator (NIST, OMB, agency adopting NIST AI RMF) publishes an OSCAL catalog for AI obligations that OF would need to ingest; OR AI Posture ships an OSCAL Assessment Results wrapping and needs OF-side alignment notes. |
| 17 | Identity-fidelity enforcement: how a worked example or cross-adopter reference is checked against an adopter's actual minted IRIs — live HTTP resolution, a vendored registry snapshot (like `vendor/gist/`), or both. Surfaced by the `@id`-federation decision (2026-06-02, `reference/iri-naming-and-crosswalks.md`). **Advanced v0.4.0 (2026-06-03):** `schema/naming-profile.schema.json` + `scripts/validate-naming-profile.mjs` make a profile machine-validatable, so an adopter's `void:uriRegexPattern` is now the enforceable contract a reference can be checked against. Still open: checking a specific cross-adopter reference against the live or snapshotted profile (regex match) and against actual resolution. | The first CI run that must catch an example or anchor referencing a non-conformant adopter IRI. |
| 18 | Example IRI policy for not-yet-minted entities: when a worked example needs an entity the adopter has not published (recitals, paragraph-level terms, draft guidelines), does the example use a neutral `obligationfirst.org` example namespace or an adopter-host IRI with a proposed-extension marker? Surfaced 2026-06-02. | Realigning the four worked examples to the federation convention. |
| 19 | ~~`.json` suffix in `@id`: adopt suffixless canonical `@id` with `.json` reached by content negotiation, or keep the served-file suffix as canonical.~~ **Resolved v0.4.0 (2026-06-03):** the spec does not mandate either; each adopter records its actual scheme descriptively in its naming-profile `void:uriRegexPattern` (the three live adopters' profiles will carry `.json`), while suffixless canonical with content-negotiated representations remains the recommended target, not a conformance gate. Examples stay suffixless under the neutral namespace. | — |
| 20 | Non-EU instrument join key: whether to tighten urn:lex (currently MAY) or another universal legal-source identifier to SHOULD/MUST for jurisdictions without ELI, so US and Canadian statutes get a guaranteed cross-adopter join key. Left best-effort by the 2026-06-02 decision (rests on `citation` consistency). | urn:lex ratifies as an RFC; OR a cross-adopter query needs to join US/Canada instruments and `citation`-matching proves insufficient. |
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
2. AI Incident Law is the proceeding source of truth for Proceedings, Allegations, and Determinations.
3. PubLedge is the joint-interpretation source of truth for negotiated Instruments and re-allocated Obligations.
4. Obligation-First owns the common `@context`, JSON Schemas, crosswalks, and validation harness that let those records join without centralizing the products.

Near-term integration work belongs in the adopter repos, using the handoffs in `reference/handoffs/` as the execution checklist. This repo should remain the stable vocabulary and conformance source.

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

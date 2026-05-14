# Changelog

All notable changes to the Obligation-First specification.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/) once it reaches v0.1.0 freeze.

## [Unreleased] — drafting

### Added

- 2026-05-14: Added `scripts/report-anchor-graph.mjs` and `npm run report:anchors` to measure cross-project `anchors` across worked examples and adopter exports. The report validates present anchor targets, summarizes source/target hosts, distinguishes omitted versus empty anchor fields, and lists unresolved external anchors for enrichment.
- 2026-05-14: Added optional `npm run report:anchors:implementations` for local sibling checkouts of EveryAILaw, PubLedge, and AI Incident Law; kept it out of `npm test` because it depends on portfolio-local repositories.
- 2026-05-13: Clarified the post-local-delivery scope: Obligation-First is the interstitial validation and identifier contract joining EveryAILaw, AI Incident Law, PubLedge, and related PAICE legal projects. Updated INTENT, README, ROADMAP, and PROTOCOL status language.
- 2026-05-13: Added the adopter kit: reusable validation/bundle helpers plus `validate-adopter-records.mjs`, so PubLedge and later adopters can reuse the EveryAILaw binding pattern.
- 2026-05-13: Updated public copy to reflect that EveryAILaw, PubLedge, and AI Incident Law now publish Obligation-First bindings. Obligation-First is live as the PAICE legal graph contract, not merely a planned schema.

- 2026-05-04: Initial repository scaffold. README, INTENT, PROTOCOL outline, PRIOR-ART survey, ROADMAP, license split (CC-BY-4.0 spec / Apache-2.0 code).
- 2026-05-04: Locked v0.1 design — four-role spine (Authority/Instrument/Term/Obligation), proceeding strand (Proceeding/Allegation/Determination), deontic quartet (Requirement/Restriction/Permission/Reparation), defeasibility relation (`of:defeats`), polymorphic `of:executableEncoding`, recursive Authority basis.
- 2026-05-04: Domain registered — `obligationfirst.org`. IRI prefix planned at `https://w3id.org/of/v1/` with `obligationfirst.org/v1/` as resolution target.
- 2026-05-04: Vendored gist 14.1.0 snapshot at `vendor/gist/`.
- 2026-05-04: JSON-LD context starter published at `schema/context.jsonld`.
- 2026-05-04: Three worked examples — Air Canada (proceeding strand), Colorado SB 24-205 (spine), Utah JIA (joint interpretation). All three round-trip cleanly through v0.1.
- 2026-05-04: Crosswalk tables — gist, LegalRuleML, Akoma Ntoso, ELI/ECLI.
- 2026-05-04: External review question packet drafted at `reference/review/external-review-questions.md`. Pending outreach to Semantic Arts and LegalRuleML reviewers before v0.1 freeze.

### Findings

Worked examples revealed the following items to defer to v0.2:

- Typed `of:Remedy` entity for monetary awards
- Closed party-role vocabulary for `Allegation.asserted_by`
- Symmetric `of:violationOf` relation for Reparations
- LegalRuleML encoding pointer (`of:legalRuleMLEncoding`)
- Defeasibility sub-types (rebut vs undercut)

PubLedge → v0.1 adoption confirmed purely additive — no breaking changes required.

### Added (continued)

- 2026-05-04: Per-entity JSON Schemas published at `schema/*.schema.json` — Authority, Instrument, Term, Obligation (with deontic-quartet `oneOf` discriminator), Proceeding, Allegation, Determination, ExecutableEncoding.
- 2026-05-04: Defeasibility semantics formalized in PROTOCOL.md — precedence rules, transitive closure, no mutual defeat, cross-Instrument allowed, inferred conflict out of scope.
- 2026-05-04: ExecutableEncoding reference shape formalized — polymorphic typed reference (kind + uri + version + engine_version + notes); kind enum: catala, blawx, openfisca, logical-english, l4, lkif, lrml, other.
- 2026-05-04: Conformance levels defined — Level 1 (IRI-only), Level 2 (schema-conformant, recommended), Level 3 (crosswalk-conformant). All three current adopters target Level 2 for v0.1.
- 2026-05-04: Versioning policy committed — SemVer 2.0.0; major-version IRI prefix (`/v1/`, `/v2/`); 14-day comment window post-freeze; v1.0 commits to no breaking changes within v1.x; 12-month maintenance overlap on major transitions.
- 2026-05-04: Repo published at https://github.com/snapsynapse/obligation-first (Path B — transfer to neutral org deferred).
- 2026-05-04: Canonical landing site published at https://obligationfirst.org/. All machine endpoints (`/v1/context.jsonld`, `/v1/schema/*.schema.json`, `/llms.txt`, `/agents.json`, `/sitemap.xml`, `/robots.txt`, `/site.webmanifest`, `/404.html`) verified resolving.
- 2026-05-04: Colorado SB 24-205 worked example rewritten to model the three-layer regulatory reality (enacted statute / federally-stayed enforcement / pending ADMT replacement) rather than a flat enacted-law case. Surfaced three v0.1 additions: enforcement_status field, of:supersedes relation, of:wouldSupersede relation.

### Added (continued, post-Colorado-rework)

- 2026-05-04: `of:enforcement_status` field added to Instrument. Closed enum: `routine | constrained | unsignaled`. Default `routine` when omitted. Independent from `of:status`. The cause of a non-routine state is expressed via the proceeding strand (a `Determination` that `anchors` to the affected `Obligation`) rather than baked into the enum. PROTOCOL.md gains a new section, "Why enforcement cause lives in the proceeding strand", documenting the design rationale.
- 2026-05-04: `of:supersedes` predicate added — Instrument → Instrument, array-valued, post-enactment relation for whole-Instrument replacement. Does NOT imply Term-level defeats; cross-Term overrides must still be asserted explicitly via `of:defeats`. PROTOCOL.md gains a "Supersession vs defeasibility" section that draws the line between the two predicates.
- 2026-05-04: `of:wouldSupersede` predicate added — subjunctive form of `supersedes` for `proposed` (or `amended`-in-flux) Instruments that would replace another if enacted. Migrates to `supersedes` once enactment occurs.
- 2026-05-04: Colorado SB 24-205 example re-rendered to use the new field and predicates. Findings section updated to reflect resolution; ROADMAP deferred-decision entries 8/9/10 closed and recorded as R1/R2/R3 in a new "Resolved in v0.1" table.

All three additions are purely additive — no breaking changes for adopters.

### Added (continued, audit-pass findings)

- 2026-05-04: Audit pass surfaced two more v0.1 schema extensions, both purely additive:
  - `of:anchors` predicate domain extended from Determination only to also allow Term and Obligation. Term → Term: a JIA term interprets a statutory term. Obligation → Obligation: a re-allocated obligation references its statutory ground. Determination → Obligation case unchanged. Distinct from `of:defeats`: anchors is interpretation without override; defeats is override.
  - `Determination.decides` `minItems: 1` constraint relaxed. Adjudicative Determinations SHOULD have decides[] populated; administrative Determinations (disposition: `issued`, used when promulgating an Instrument or recording a posture statement) MAY leave it empty. Both cases now validate.

- 2026-05-04: Filled out worked-example record sets to fully back the README narratives.
  - Colorado: added 6 records (CO AI Policy Work Group Authority, federal district court Authority, federal-litigation Proceeding, enforcement-challenge Allegation, federal-stay Determination, AG non-enforcement-statement Determination). The narrative's Layer 2 (proceeding strand) and Layer 3 (political direction) are now fully realized as JSON.
  - Utah JIA: created records/ subdirectory with 5 records (OAIP Authority, JIA Instrument, Term, Requirement Obligation, issuance Determination). Previously the example had no JSON records — only the README narrative referencing the upstream PubLedge file. Now the binding has bytes adopters can fetch and validate.
  - All records pass `npm run validate`. 23/23 valid.

- 2026-05-04: Added directory index pages so `/v1/schema/` and `/v1/examples/` resolve as 200 (previously 404 because GitHub Pages doesn't auto-index). Per-records subdirectories also gain index pages listing each canonical JSON record.

- 2026-05-04: Added IRI resolution conventions section to PROTOCOL.md (MUST resolve / SHOULD resolve / MAY resolve), making clear that gist's per-class IRI 404s are an upstream publishing choice and that worked-example record `@id` values are aspirational adopter URLs.

- 2026-05-04: Three adopter handoff documents added under reference/handoffs/ — everyailaw-binding.md, aiincidentlaw-binding.md, publedge-binding.md. Each describes what real binding entails, not name-only adoption: structured queryability, cross-portfolio joins, schema-validated records. Each ships with a verification checklist and effort estimate.

### Decisions

- Adoption order: EveryAILaw first, PubLedge second, AI Incident Law third. Smallest binding effort first.
- License split: CC-BY-4.0 for spec text and reference material; Apache-2.0 for code, schemas, scripts, examples. Same as PubLedge.
- Repo home: `~/Git/obligation-first/`. GitHub: `snapsynapse/obligation-first` for now (Path B); transfer to dedicated org or PAICE Foundation org deferred.
- Reparation added as fourth deontic operator after LegalRuleML 1.0 §5.3 alignment review.

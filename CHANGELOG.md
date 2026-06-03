# Changelog

All notable changes to the Obligation-First specification.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/) once it reaches v0.1.0 freeze.

## [0.3.1] - 2026-06-02

The `-draft` suffix is dropped from this release forward; versions are plain SemVer (`0.x` already signals pre-1.0 instability). This release makes every surface reflect the v0.3 federation model.

### Changed

- **Worked examples realigned to the v0.3 federation convention.** All 49 records across the four examples (air-canada, colorado-sb24-205, eu-ai-act-article-50, publedge-jia-utah-72) now use neutral, opaque, suffixless `@id` values under `https://obligationfirst.org/v1/examples/<slug>/...`, never adopter hosts. Jurisdiction moved out of slugs into a typed `gist:Jurisdiction` field with an ISO 3166 `ref`. Real-world identity rides in crosswalks: `sameAs` to the adopter's real published IRI where the entity exists (14 of 49 records), `eli_uri`/`neutral_citation`/`akn_uri` where a standard identifier genuinely exists; the other 35 records are teaching constructs with no adopter counterpart. Every example README rewritten to use `@context: https://obligationfirst.org/v1/` (not `w3id`), the new neutral IRIs, and typed jurisdiction; the air-canada `/doctrine/` anchor and the publedge broken cross-adopter anchor were removed or repointed to the real target.
- **Decisions #18 (example namespace), #19 (`.json` suffix), and crosswalk-field scope resolved** in `reference/iri-naming-and-crosswalks.md`: neutral example namespace, suffixless canonical `@id` with content-negotiated representations, and crosswalk terms added to `schema/context.jsonld` (`neutral_citation`, `urn_lex`, `sameAs` via owl, `exactMatch` via skos, alongside the existing `eli_uri`/`ecli_uri`/`akn_uri`).
- **The three binding handoffs reconciled to live adopter data.** `reference/handoffs/{everyailaw,publedge,aiincidentlaw}-binding.md` previously prescribed slug schemes no adopter follows; they now document the v0.3 rule (adopter declares its own grammar in a `.well-known` profile) and what each adopter actually publishes.
- **Crosswalk docs corrected.** `reference/crosswalks/eli-ecli.md` and `akomantoso.md` previously showed ELI/ECLI/CanLII/AKN IRIs as the record `@id`; they now show those as typed crosswalk fields with an adopter-local `@id`. `legalruleml.md` example slugs updated.
- **Conformance and concept surfaces updated for v0.3.** The `docs/index.html` conformance table and embedded record snippet, `docs/llms-full.txt`, `docs/llms.txt`, and `docs/agents.json` now reflect the redefined Level 2 (`.well-known` profile + ISO 3166 jurisdiction) and Level 3 (declared crosswalks present), plus `id_federation`, `identifier_crosswalks`, `naming_profiles`, and `jurisdiction` concepts.
- **NOTICE corrected.** Example records no longer bear `everyailaw.com` `@id` values; the EveryAILaw-corpus reproduction clause is replaced with a crosswalk-reference statement.
- **Version tooling.** `scripts/sync-version.mjs` propagates the single source of truth (`package.json`) across all surfaces and stamps the homepage date; a drift check runs inside `npm test` so version errors cannot strand. The two `.mjs` validators read the version at runtime rather than hardcoding it. `package-lock.json` is managed by npm, never string-synced (a `/g` version pattern would rewrite dependency versions and break `npm ci`); a `validate:lockfile` gate (`npm ci --dry-run`) at the front of `npm test` catches any `package.json`/lockfile mismatch locally rather than only in CI.

### Compatibility

No `of:` vocabulary or schema change. The crosswalk fields are additive (the schemas already admit them via `additionalProperties`). v0.1/v0.2 adopter records remain valid.

## [0.3.0-draft] - 2026-06-02

### Changed

- **2026-06-02: `@id` federation and identifier crosswalks adopted (direction).** Decision record: `reference/iri-naming-and-crosswalks.md`. Prompted by an audit showing that all four worked examples mint adopter-host IRIs that do not resolve against the live adopters (because of the `.json` suffix alone, zero of the 50 example `@id` values match), and that the examples followed the binding handoffs while all three adopters implemented differently from their own handoffs. Resolution: record `@id` values are adopter-local, opaque, and permanent (renames preserved via HTTP 301, per "Cool URIs Don't Change"); external standard identifiers (ELI, ECLI, Akoma Ntoso, urn:lex, Wikidata) ride as typed crosswalks, never as the `@id`; cross-adopter joins key on crosswalks, not slugs; each adopter publishes a `.well-known` naming profile (VoID `uriSpace` / `uriRegexPattern` + RFC 6570 template) that obligation-first consumes rather than prescribes; jurisdiction is a typed ISO 3166 field, never a slug component. A recommended crosswalk matrix per entity type is added, with Wikidata at SHOULD for authorities and urn:lex at MAY for instruments. This reverses the prior guidance that a Term's `@id` should be the standard source-text IRI; no live adopter ever did this. Additive and non-breaking to v0.1 / v0.2 records (`additionalProperties` already admits the crosswalk fields); the matrix governs Level 3, and the new Level 2 naming-profile + jurisdiction requirements are a pre-freeze conformance tightening, not a validation break. Files touched: `PROTOCOL.md` (new "`@id` federation and crosswalks" and "Naming profiles and identifier crosswalks" sections; reversed Term-`@id` guidance; Level 2 / Level 3 redefinitions; worked-example paragraph), `reference/iri-naming-and-crosswalks.md` (new), `ROADMAP.md` (deferred decisions #17 enforcement mechanism, #18 not-yet-minted example IRIs, #19 `.json` suffix, #20 non-EU join key). Deferred to follow-on rounds: schema and `context.jsonld` crosswalk fields, the `.well-known` profile format and schema, the conformance validator, handoff reconciliation, and example realignment.

### Added

- **2026-06-02: EU AI Act Article 50 worked example completed.** Expanded the `examples/eu-ai-act-article-50/` set from 7 records (Article 50(2) only) to 26 records covering the full Article 50 transparency obligation hierarchy.
  - New article Terms: `term-art-50-1.json` (interaction disclosure), `term-art-50-3.json` (emotion recognition and biometric categorisation), `term-art-50-4.json` (deepfakes), `term-art-50-5.json` (AI-generated text for public interest).
  - New Obligations: `obligation-provider-design-for-disclosure.json`, `obligation-deployer-disclose-ai-interaction.json` (both created by Art 50(1)), `obligation-disclose-emotion-biometric.json`, `obligation-label-deepfake-content.json`, `obligation-disclose-ai-generated-text.json`.
  - New Recital Terms (all `creates: []`): `term-recital-132.json` through `term-recital-136.json`. Guideline Terms anchor to them.
  - New Code of Practice Instrument: `instrument-eu-art50-cop.json` (`status: proposed`, `enforcement_status: unsignaled`), the forthcoming Art 50(2)/(4) marking-and-labelling co-regulatory instrument.
  - New Guideline section Terms: `term-guidelines-section-3-chatbot-disclosure.json`, `term-guidelines-section-5-emotion-biometric.json`, `term-guidelines-section-6-deepfakes.json`, `term-guidelines-section-7-ai-text.json` — each `anchors` the corresponding statutory Term and Recital.
  - Updated `instrument-eu-ai-act.json` `hasTerm` to include all five Article Terms and all five Recital Terms.
  - Updated `instrument-eu-art50-guidelines.json` `hasTerm` to include the four new section-level guideline Terms.
  - Mirrored to `docs/v1/examples/eu-ai-act-article-50/`.
  - Added `examples/eu-ai-act-article-50/records` to `validate:adopter-kit` and `report:anchors` in `package.json`.
  - `npm test` green: 49/49 schema-valid, 4/4 graph-valid, all contracts and hashes clean.
  - Built during the Commission's Article 50 transparency-guidelines stakeholder consultation (closed 2026-06-03). Recital text is approximate; verify against OJ L 2024/1689. Guideline section Terms are section-level stubs; exact paragraph numbers should be added on verification against the adopted text.

## [0.2.2-draft] - 2026-05-30

### Security hardening

- Hardened graph validation by moving the stricter worked-example graph rules into the shared adopter-kit validator. `of:Determination` records with `disposition: issued` now require either `target_instrument` or at least one `anchors` target; this prevents administrative determinations from becoming unanchored authority assertions.
- Collapsed duplicate graph-validation logic so `scripts/validate-example-graphs.mjs` and adopter validation use the same implementation.
- Added focused hardening regressions for the confirmed `issued` Determination bypass, false-positive controls for valid `target_instrument` and `anchors` cases, validator parity, stale release hashes, assistant-guide byte identity, and stale content-manifest hashes.
- Made the content provenance manifest real: `MANIFEST.yaml` now carries SHA-256 entries for the documented canonical content set, enforced by `npm run validate:hashes`.
- Strengthened CI so GitHub Actions runs `npm test`, not only shape validation.
- Refreshed GuideCheck assistant-guide metadata to `guide-version: 0.1.2` and the current `0.2.x-draft` applicability line, with updated sidecar manifests.
- Published a new `v0.2.2-draft` release package manifest and checksum index for the hardened draft line.

### Compatibility

- No schema vocabulary or adopter-record migration is required. The only behavior change is stricter graph validation for administrative Determinations that were previously accepted without an instrument target or anchor.

## [0.2.1-draft] - 2026-05-26

### Decisions

- **2026-05-27: OSCAL not adopted as substrate; deferred as secondary export projection (deferred decision #16).** A format-comparison experiment in the GuideCheck session (Markdown / YAML / SARIF 2.1.0 / OSCAL Assessment Results 1.1.2) was forwarded to Obligation-First on the conjecture that OSCAL might be a genuine fit here. Assessment finding: OSCAL is layer-mismatched to OF. OF is an upper schema for normative content (what an Obligation *is*); OSCAL is an operational schema for assessments of deployed systems against controls. Adopting OSCAL as substrate would violate the "bind, don't reinvent" design principle, displace the JSON-LD + gist + LegalRuleML alignment that the three live adopters (EveryAILaw, PubLedge, AI Incident Law) bind against, and break the cross-instrument anchors machinery (`of:anchors`, `of:defeats`, `of:rebuts`, `of:undercuts`, `of:violationOf`). The natural OSCAL home in the PAICE legal graph is **AI Posture** — the project that actually assesses organizations/systems against obligations. OF will: (a) keep JSON-LD + JSON Schema canonical, (b) defer an OSCAL crosswalk doc and export projection to v0.3+ behind the re-open triggers in ROADMAP deferred decision #16, (c) hand the OSCAL exemplar files off to AI Posture for its own format evaluation. SARIF: not applicable to the PAICE legal graph. YAML front matter on Markdown: already in use across INTENT.md, PROTOCOL.md, GuideCheck guides — no re-decision needed. Files touched: `ROADMAP.md` (deferred decision #16 added), `handoffs/2026-05-27-ai-posture-oscal-assessment.md` (handoff to AI Posture session). Source: handoff `handoffs/2026-05-27-format-comparison-for-obligation-first.md` from the GuideCheck session.

### Added

- Release package for v0.2.1-draft under `docs/releases/v0.2.1-draft/`, including a machine-readable manifest and SHA-256 checksum index for the public spec, schema, agent, GuideCheck, and feed artifacts.

### Changed

- Project semver bumped from `0.2.0-draft` to `0.2.1-draft` across package metadata, protocol front matter, public docs, LLM context, agent inventory, roadmap, and JSON-LD context mirrors.

## [0.2.0-draft] — 2026-05-26

### Changed (binding-only — non-breaking)

- **2026-05-26: Semantic Arts feedback (Dave McComb) absorbed into v0.2.** Dave responded on 2026-05-26 to the 2026-05-19 review-packet outreach (see `reference/review/external-review-questions.md`). v0.2 is a binding-only refinement: the of: vocabulary is unchanged from v0.1, and adopter records require no migration. Two gist-binding updates:
  1. **`of:Reparation` gist binding closed.** v0.1 left this open. v0.2 binds Reparation to the layered pattern: `gist:Requirement` for the secondary duty itself; `gist:Intention` for the declared legislative intent (compensation, restitution, deterrence) attached to the creating Term; `gist:Event` for the actuated reparation, recorded via the proceeding strand (formal of:→gist:Event binding for the actuated act deferred to a later minor version). Dave's rationale: gist treats a reparation declaration as an intention linked to a description of behavior, with the actuated reparation itself a `gist:Event` — mirroring how a contract is `gist:Content` while the commitments it creates are `gist:Commitment`-shaped. gist therefore does not need a fourth deontic class. **The `of:Reparation` class itself is preserved** to keep LegalRuleML 1:1 alignment (`of:Reparation` ↔ `lrml:Reparation`) and SPARQL queryability (`?r a of:Reparation`) — both of which would degrade if we compressed Reparation into a Requirement-with-flag.
  2. **`of:Allegation` no longer binds to `gist:Statement`.** Dave confirmed gist defines no `gist:Statement` class. v0.2 binds the assertion text to `gist:Content` and reaches for `gist:Intention` only when the asserted claim is itself intent-bearing (libel, fraud, defamation, similar). Dave noted RDF 1.2's statements-about-statements mechanism as a parallel layer of interest, not adopted in v0.2.
- Sense-check note (also 2026-05-26): an earlier draft of v0.2 collapsed `of:Reparation` into `of:Requirement` carrying `triggers_on_violation_of`. On review, this conflated gist's modeling pattern with Obligation-First's vocabulary, weakened LegalRuleML alignment, and complicated SPARQL querying. Rolled back before release. Dave's feedback applies to the gist crosswalk, not to the of: class set.
- Files touched: `schema/obligation.schema.json` (Reparation description refined; structure unchanged from v0.1), `schema/allegation.schema.json` (description), `schema/context.jsonld` (no class change; version comment bumped), `reference/crosswalks/gist.md`, `reference/crosswalks/legalruleml.md`, `reference/review/external-review-questions.md`, `PROTOCOL.md`, `INTENT.md`, `README.md`, `ROADMAP.md`, `PRIOR-ART.md`, `examples/colorado-sb24-205/records/determination-co-sb24-205-stay-order.json` (note text), `examples/colorado-sb24-205/README.md`. The Colorado `obligation-violation-reparation.json` record is unchanged from v0.1 (`@type: of:Reparation`).
- Migration: none required. v0.1 adopter records remain valid.

### Added

- **2026-05-26: `of:rebuts` and `of:undercuts` predicates** added as subproperties of `of:defeats`, formalizing the LegalRuleML §7.4 rebut/undercut distinction. `of:rebuts(A, B)` asserts that defeating Term A reaches the opposite conclusion of defeated Term B; `of:undercuts(A, B)` asserts that A denies B's applicability in this context. Both entail `of:defeats(A, B)`. `of:defeats` is kept as the general/fallback predicate for the v0.1-compatible binary case. Files touched: `schema/context.jsonld`, `PROTOCOL.md` (core relations table + Defeasibility/Sub-types section), `reference/crosswalks/legalruleml.md`. Closes deferred decision #15. Resolves the deferred LegalRuleML §7.4 rebut/undercut note that v0.1 said v0.2 might introduce.
- **2026-05-26: `of:violationOf` predicate** added as the symmetric/inverse of `triggers_on_violation_of`. Adopters MAY assert it from the primary-Obligation side as well as (or instead of) the Reparation side; if both directions are present, they must be consistent. Enables SPARQL queries that walk the violation relation without traversing `triggers_on_violation_of`. Files touched: `schema/context.jsonld`, `PROTOCOL.md` (core relations table). Closes deferred decision #13.
- **2026-05-26: `of:executableEncoding` domain clarified** in PROTOCOL.md core-relations table as `Term | Obligation`. v0.1 schemas already accepted the field on both — `schema/term.schema.json` and `schema/obligation.schema.json` are unchanged. Documentation-only. Closes deferred decision #6.
- **2026-05-26: Atom/RSS feed entry** for v0.2.0-draft added at `docs/atom.xml` and `docs/feed.xml`. Feed updated timestamp bumped.
- **2026-05-26: ROADMAP currency refresh.** Top heading bumped to v0.2.0-draft. v0.2 section split into "Landed in v0.2.0-draft" and "Still planned for v0.2". New "Resolved in v0.2" table records deferred decisions #1, #6, #13, #15 plus the Allegation binding shift.
- **2026-05-26: User-facing copy + agentic surface refresh.** README spec badge bumped to v0.2.0-draft; "bind to v0.1" / "once v0.1 freezes" framing replaced with current-draft phrasing throughout README and docs/index.html. New v0.2 predicates (`of:rebuts`, `of:undercuts`, `of:violationOf`) and the `executableEncoding`-on-both-domains clarification surfaced in `docs/llms.txt`, `docs/llms-full.txt` (relations list + defeasibility section), and `docs/agents.json` (new `concepts.relations` block plus `allegation_gist_binding` entry). Files touched: `README.md`, `docs/index.html`, `docs/llms.txt`, `docs/llms-full.txt`, `docs/agents.json`.

### Acknowledgements

- Dave McComb (CEO, Semantic Arts) — for the v0.2 gist-binding feedback that this release is built on.

## [Unreleased] — drafting

### Added

- 2026-05-24: Upgraded the GuideCheck assistant guide to Level 4 posture with a sidecar manifest at `/.well-known/assistant-guide-manifest.txt`, a repository-copy anchor via `source-path: assistant-guide.txt`, and repo contract checks that verify guide bytes, SHA-256, byte count, and manifest URL consistency.
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

# Changelog

## Unreleased

## [0.6.2] - 2026-08-04

Hardens conformance verification without changing the v0.6 vocabulary, JSON Schema shapes, context mappings, or adopter records.

### Added

- Stable `OF-GRAPH-*` diagnostic codes for every shared graph rule, with 24 paired valid and invalid mutations exercised through the shared, example, and adopter validation paths.
- JSON-LD expansion, exact-IRI, compact/expand round-trip, local-extension, remote-context, and core-term-remapping checks using the standards-conformant `jsonld` processor.
- Cross-release identifier-continuity validation independent of structural fingerprints, including Tombstone, reviewed-retirement, replacement-link, type-drift, duplicate-ID, and active-plus-Tombstone controls.
- Adopter-owned identifier baselines for EveryAILaw, PubLedge, and AI Incident Law, wired into their canonical verification paths and the central federation gate.

### Changed

- Version synchronization now uses explicit managed markers and structural JSON metadata instead of wording-sensitive release prose. Missing or duplicate markers, stale unmanaged current-version claims, and stale release URLs fail closed.
- The federation gate now expands and round-trips all 993 adopter records and checks all 993 adopter identifiers in addition to schema, graph, fingerprint, naming-profile, and anchor validation.
- Added the `jsonld` runtime dependency and refreshed the lockfile, including the nonbreaking transitive `fast-uri` security update reported by `npm audit`.

### Compatibility

No schema shape, vocabulary, JSON-LD context mapping, IRI, legal semantic, migration, or adopter projection changes. Existing `obligation-first >=0.6.0 <0.7.0` naming-profile ranges accept this patch, and graph validator messages retain their human-readable text with stable codes prepended.

## [0.6.1] - 2026-08-04

Corrects public release-state drift after v0.6.0 and adds a deterministic gate so a packaged release cannot continue to describe itself as a local candidate.

### Fixed

- Reconciled the homepage, README, namespace page, LLM context files, protocol, roadmap, review packet, and migration fixture with the published v0.6 contract.
- Promoted the five v0.6 semantic decision records from `accepted-direction` to `implemented`, with their released target and present contract impact recorded explicitly.
- Narrowed version synchronization to update version tokens without regenerating candidate or publication-state prose.

### Added

- `npm run validate:release-state`, which activates when the current release package exists, rejects stale candidate and pending-publication claims on current public surfaces, and requires semantic decisions targeted at an already-packaged version to be implemented or superseded.
- Hardening regressions for case and whitespace variants of stale release claims, already-packaged decision state, and the legitimate case of a future-version `accepted-direction` record.

### Compatibility

No schema shape, context mapping, vocabulary, identifier, migration, or adopter projection changes. Every v0.6.0 adopter remains compatible, and the existing `obligation-first >=0.6.0 <0.7.0` naming-profile range accepts this patch.

## [0.6.0] - 2026-08-04

Implements the accepted three-adopter semantic contract while keeping the v1 IRI major and accepting legacy v0.5 record shapes during migration.

### Added

- `of:Party`, `of:Jurisdiction`, and `of:Tombstone` record schemas.
- Shared reference, jurisdiction, lifecycle, normative-force, enforcement, actor-role, remedy, and authority-basis shapes in `common.schema.json`.
- Separate `heardBy`, `administeredBy`, `regulatedBy`, `enforcedBy`, `constrains`, `vacates`, `repeals`, `amends`, and `resulting_instrument` relations.
- Typed actor fields for proceedings, obligations, and allegations, including `parties`, `duty_holders`, `owed_to`, `asserted_by_party`, and `related_to_party`.
- Controlled `duty_holder_roles` and `owed_to_roles` IRI fields, kept separate from concrete Party identity and applicability prose.
- Evidence-bearing `binding_basis` for incorporated or adopted voluntary content.
- `describesSameEntityAs` for record correspondence that is weaker than `owl:sameAs`.
- Shared provenance fields for source citation, locator, version, language, evidence type, verification, retrieval, and asserting adopter.
- A deterministic v0.5 to v0.6 migration script and paired fixtures.
- Defeasibility-cycle detection and validator identity output containing version, commit, and dirty state.
- Relation-domain, same-level amendment, lifecycle-coherence, contractual multi-type Term, and vacatur checks in the shared graph validator.

### Changed

- Category membership now uses `gist:isCategorizedBy`. `skos:exactMatch` remains for concept-to-concept alignment.
- `Term.text` is reserved for exact source text; editorial paraphrases use `summary`.
- Contractual Terms may assert a JSON-LD type set containing both `of:Term` and `gist:ContractTerm`; statutory and regulatory Terms remain `of:Term` over `gist:Specification`.
- `issuedBy` is array-capable and means issuer or promulgator only. Proceedings use `heardBy`.
- Authority bases are multi-valued and evidence-bearing. Missing evidence is omitted rather than replaced with a fabricated self-reference.
- Normative force, lifecycle, operative effect, enforcement, and temporal facts are independent fields.
- A concrete record with an unverified deontic operator uses base `of:Obligation` instead of silently defaulting to `of:Requirement`.
- Obligations may be grounded by Terms, recognized by Determinations, or imposed by Determinations.
- Administrative issuance joins a forward-looking Instrument explicitly through `resulting_instrument`.
- The Air Canada example now exercises Parties, a common-law Obligation, typed allegation relations, recognition by Determination, and a remedy-to-Obligation link.

### Adopter migration

- EveryAILaw emits editorial summaries, explicit unclassified deontic state, controlled duty-holder role IRIs, separated authority roles, `isCategorizedBy`, extension-context fields, two EU co-legislator issuers, and queryable Tombstones for retired composite and category-shaped IRIs.
- PubLedge emits exact JIA Term text where its native source carries it, contractual multi-type Terms, Party and actor-role records from curated agreement parties, explicit issuance Determinations, separated temporal semantics, and named extension fields.
- AI Incident Law emits `heardBy`, typed deployer Parties, legal-competence jurisdiction objects, weaker record correspondences, shared provenance, and no fabricated court class, authority basis, or determination date.

### Compatibility

The context remains `https://obligationfirst.org/v1/context.jsonld` and the vocabulary major remains `v1`. Legacy v0.5 jurisdiction, status, scalar-reference, and source-text shapes remain schema-valid. Migrated naming profiles use `obligation-first >=0.6.0 <0.7.0`. The unpublished v0.5.1 correction candidate was folded into this release; no v0.5.1 tag or GitHub Release was created.

## 0.5.1 release candidate, unpublished and superseded - 2026-08-04

This candidate packaged v0.5-compatible corrections after the v0.5.0 release package, but it was never committed, tagged, or published. Its corrections are included in v0.6.0. The immutable v0.5.0 artifacts are unchanged.

### Fixed

- Enforce `https://obligationfirst.org/v1/context.jsonld` in the shared adopter validator and naming-profile schema; the bare namespace landing page is no longer accepted as a JSON-LD context for current records.
- Complete the `of:Determination` administrative/adjudicative contract in JSON Schema: `issued` records have empty `decides` and identify at least one `target_instrument` or `anchors` target, while adjudicative records continue to require populated `decides`.
- Clarify graph ownership: AI Incident Law owns adjudicative Determinations for public matters; PubLedge owns administrative issuance Determinations attached to its Instruments; `issuedBy` identifies the Authority that acted.
- Align the cross-adopter anchor reporter and Obligation schema guidance with the existing `Obligation | Term | ObligationCategory` range, including category-level PubLedge and AI Incident Law edges.
- Reconcile the PubLedge JIA worked example with its upstream proposed-draft state by removing the unevidenced issuance Determination and enacted/effective assertions.

### Decisions

- Add five tracked accepted-direction records for identity and classification; authority, text, and scope; normative force and lifecycle; actors and deontic grounding; and provenance, extensions, and conformance.
- Assign shared vocabulary and semantic implementation to v0.6.0 with migration fixtures and versioned conformance. No v0.6 primitive was added to the unpublished v0.5.1 candidate.

### Compatibility

Existing v0.5.0 adopter records remain valid. The IRI major remains `v1`. The stricter Determination and context checks codify the published contract rather than introduce a new vocabulary. Accepted v0.6 directions require a later minor release and explicit migration notes before they affect conformance.

All notable changes to the Obligation-First specification.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/) once it reaches v0.1.0 freeze.

## [0.5.0] - 2026-07-25

Adds the category layer: `of:ObligationCategory`, a jurisdiction-neutral duty concept that Obligations are classified under and that interpretive records may reference when they concern the concept rather than any single statutory duty. Additive; no existing record changes meaning.

This closes a gap the adopters had already worked around badly. EveryAILaw was publishing ten abstract concepts (`transparency`, `human-oversight`, and so on) *as* its Obligations, so 134 Terms collapsed into 10 Obligation records, 128 of the resulting `creates` edges failed the `created_by` back-reference rule, and every cross-adopter anchor in the graph pointed at a concept rather than a duty. The concepts were the right idea in the wrong slot: commensurability across jurisdictions is genuinely valuable, but the thing a duty holder owes and the concept that duty falls under are different entities.

### Added

- **`of:ObligationCategory`** (`schema/obligation-category.schema.json`). Required: `@type`, `@id`, `title`. Optional: `content`, `scheme`, `sameAs`, `exactMatch`, `notes`. Deliberately carries no `jurisdiction`, no `created_by`, and no duty holder. A Category is not a duty, and one carrying `created_by` is a modelling error.
- **`of:scheme`** predicate (ObligationCategory to IRI, skos:inScheme) so an adopter can publish more than one taxonomy and a consumer can tell whose taxonomy a Category came from.
- **`ObligationCategory` accepted in naming profiles** (`schema/naming-profile.schema.json` entity enum).
- **`appliesTo` accepts a version range** in adopter naming profiles: `obligation-first >=0.5.0 <0.6.0`. Range parsing, comparison, and the rationale live in `scripts/lib/version-range.mjs`, with regression coverage in the hardening suite.

### Changed

- **`of:anchors` range extended** to `Obligation | Term | ObligationCategory`. A Determination about a named statutory duty anchors the Obligation; one about the duty concept generally anchors the Category. The second case was already the majority of live anchor edges (47 of 59 AI Incident Law determinations pointed at `human-oversight`), asserted against records that were concepts wearing an Obligation type. The spec now describes what the graph actually holds.
- **`isType` accepts an array of expected types**, and `validateReference` renders multi-type expectations, so a predicate with more than one range can be checked rather than skipped.
- **`report-anchor-graph` derives its aggregate-collection keys** from `DEFAULT_COMPANION_DIRS` instead of a hardcoded list. A collection an adopter declared in `index.json` but the reporter did not know about was skipped in silence, so anchors into it read as unresolved. Adding `ObligationCategory` surfaced this: the scanned count over the three adopters stayed at 565 while a whole collection was ignored. It now reads 575.
- **Pinned-minor `appliesTo` is no longer the only form.** `obligation-first 0.4.x` still parses and still means `>=0.4.0 <0.5.0`, so every profile published before this release keeps working. It made each additive spec release a flag day: an adopter using nothing new still had to move its profile in lockstep or go red. Adopters that do not depend on a new entity type should widen to a range; PubLedge and AI Incident Law now declare `>=0.4.0 <0.6.0` and ride this release without changes, while EveryAILaw declares `>=0.5.0 <0.6.0` because it publishes `ObligationCategory` records.

### Migration

Nothing breaks. Adopters classifying Obligations under concepts should publish those concepts as `of:ObligationCategory` records, join from each Obligation via `exactMatch`, and repoint concept-directed anchors at the Category IRIs. EveryAILaw's split is tracked separately; until it lands, its ten concept records remain typed `of:Requirement`.

## [0.4.3] - 2026-07-05

Reverts an unintended breaking change shipped in v0.4.2. The code-review pass added a `pattern` constraint (`^[a-z]{2}(-[a-z0-9]{1,3})?$`) to `jurisdiction/ref` across seven schemas, restricting the field to ISO 3166 codes. That constraint never existed before v0.4.2 and rejected already-published conforming records from adopters tracking supranational bodies (OECD, G7, Council of Europe, ISO) that have no ISO 3166 alpha-2 code — despite the field's own description promising "country/supranational" coverage. v0.4.2 described itself as additive at the schema level; this constraint was not.

### Fixed

- **`jurisdiction/ref` pattern constraint removed** from `authority`, `instrument`, `obligation`, `proceeding`, `allegation`, `determination`, and `naming-profile` schemas, restoring the v0.4.1 contract (description-only guidance; ISO 3166 codes remain the recommended form). How the spec should model non-territorial issuers — including whether bodies without enforcement power belong under `Authority` at all — is deliberately **not** decided here; it is an open design question for v0.5.

## [0.4.2] - 2026-07-01

Correctness patch from a full multi-agent code review of the repo (schemas, validators, examples, publishing surfaces, CI). Fixes three high-severity defects — records were unprocessable as JSON-LD, advertised release URLs 404'd, and the adopter-kit validators passed silently on missing directories — plus a batch of schema/prose/publishing drift. Additive at the schema level; one migration note (the record `@context` reference changes).

### Fixed

- **Records are processable as JSON-LD again.** Every record's `@context` referenced `https://obligationfirst.org/v1/`, which GitHub Pages serves as `text/html` (no content negotiation), so a conforming JSON-LD processor threw on context load. The mandated reference is now `https://obligationfirst.org/v1/context.jsonld` (the actual JSON-LD document) across all 49 example records, the worked naming profile, `PROTOCOL.md` Level 1 conformance, and the reference binding note. The `/v1/` namespace URL remains the human-facing landing page.
- **Release package URLs resolve.** `https://obligationfirst.org/releases/v<x>/` 404'd from v0.3.0 onward — `make-release` had stopped emitting a release `index.html`. Index pages are restored for v0.3.0-draft, v0.3.1, v0.4.0, v0.4.1, and generated for v0.4.2, and `make-release` now emits one for every future release.
- **Adopter-kit validators fail on missing or empty record directories.** `validate-adopter-records.mjs` and the graph/example validators returned exit 0 on a nonexistent or zero-record directory, so a renamed example would keep CI green while validating nothing. Missing/empty directories are now hard failures.
- **Phantom `gist:Court` removed from records for real.** v0.4.1 corrected the schema annotations but the actual `authority-bccrt` and Colorado federal-district-court records (and the air-canada / ai-incident-law binding notes) still declared `gist:Court`, a class gist 14.1.0 does not define. They now use `gist:GovernmentOrganization` with `authority_basis.kind = judicial`.
- **Determination `decides`/`disposition` co-constraint enforced.** PROTOCOL required non-empty `decides` for every adjudicative disposition; the schema only said SHOULD. Added a Draft 2020-12 `if/then` so `disposition != "issued"` requires `decides` with `minItems: 1`.
- **Publedge example status corrected.** The Utah JIA instrument carried `status: "proposed"` alongside populated `enacted`/`effective` dates and an issuance Determination; it is now `in-force`. The migration README anchor now matches the naming profile's `void:uriRegexPattern`.

### Added

- **Defeasibility and crosswalk fields are now schema-validated.** `rebuts`, `undercuts` (Term), and `violationOf` (Obligation) — v0.2 subproperties defined in prose and context but absent from the schemas — are declared with LegalRuleML §7.4 semantics. `jurisdiction`, `sameAs`, `exactMatch`, `neutral_citation`, `urn_lex`, and `notes` are declared on the entity schemas that use them (records stay open; these gain shape validation instead of expanding blindly via `@vocab`).
- **`executableEncoding` accepts multiple encodings.** PROTOCOL always allowed one encoding per engine; the schema forced a single object. Term and Obligation now accept a single object or a non-empty array.
- **New publishing-drift guards in `validate-repo-contracts.mjs`.** Every `docs/releases/*` dir must carry an `index.html`; `feed.xml`/`atom.xml` must each contain an entry for the current version with a correct `rel="self"`; `sitemap.xml` must list the current release URL; `sha256.txt` orphan lines are flagged. `make-release` now updates `feed.xml`, `atom.xml`, and `sitemap.xml` alongside the package.

### Changed

- **Validator hardening.** Path-traversal guard on `record.id` in the adopter-kit writer; JSON-LD context-coverage check now recurses into nested properties and `$defs`; shared `TYPE_TO_SCHEMA` and manifest-parsing helpers deduplicated into `scripts/lib/`; `validate:adopter-kit` and `report:anchors` auto-discover `examples/*/records`; `sync-version` write mode globalizes its replacement patterns; `validate-hashes --update` preserves comments.
- **Publishing surfaces reconciled.** `naming-profile.schema.json` jurisdiction `ref` pattern and the authority `ref` field aligned to the lowercase ISO-3166 form the records use; `context.jsonld` duplicate `authorityBasis` alias removed and `name` mapped explicitly; `docs/v1/index.html`, README example counts, `llms.txt`/`llms-full.txt`, feeds, and sitemap brought current; the `ecli`/`ecli_uri` prose naming reconciled.
- **CI.** GitHub Pages deploy is gated on the test suite; the post-deploy probe polls for the live version instead of a fixed sleep and covers the naming-profile schema, context, and release URLs; workflow actions pinned to commit SHAs.

### Compatibility

Adopter records MUST update their `@context` from `https://obligationfirst.org/v1/` to `https://obligationfirst.org/v1/context.jsonld` (the bare form never resolved as JSON-LD). All new schema fields are optional, and `executableEncoding` is widened, so existing records that already carried the correct `@context` remain valid. The Determination `if/then` codifies a rule PROTOCOL already stated as mandatory; a record with an adjudicative `disposition` and empty `decides` was always non-conformant and now fails schema validation. `of:` vocabulary is unchanged; IRI major version is unchanged. Releases v0.4.0 and v0.4.1 are now git-tagged so their manifests verify.

## [0.4.1] - 2026-06-09

Documentation-consistency patch following an external semantic review. No `of:` vocabulary change; no validation-relevant schema change (one annotation-only `examples` correction). The full review and the remediation plan for the substantive findings are tracked in an internal review handoff (2026-06-09; the `handoffs/` directory is untracked by design) and will surface here as decision records and ROADMAP items as they are taken up.

### Fixed

- **README license note reconciled with NOTICE.** The README still claimed example records "are reproduced from the EveryAILaw corpus by express permission"; NOTICE (since v0.3.1) correctly states no corpus content is reproduced and adopter IRIs appear only as crosswalk citations. README now matches NOTICE.
- **Phantom `gist:Court` removed.** gist 14.1.0 defines no Court class. `schema/authority.schema.json` annotation examples and `reference/crosswalks/gist.md` now point courts and tribunals at `gist:GovernmentOrganization` (locally subtyped if needed). Annotation-only; no record validates differently.
- **Schema count corrected.** README and PROTOCOL said "eight per-entity schemas"; the published set is seven per-entity plus `executable-encoding` and `naming-profile` (nine total). The README endpoint table gains the naming-profile schema row.
- **w3id resolution claim made truthful.** PROTOCOL core principle 3 stated `https://w3id.org/of/v1/` "resolves" to obligationfirst.org; the w3id PR is not yet filed. The principle now states it is the canonical prefix and will resolve once the redirect is filed, and that obligationfirst.org is the only CI-verified resolution target today.
- **Version-narrative drift.** README "Subject to revision before the v0.3 freeze" (at v0.4) now points at the ROADMAP gates; "v0.1 bindings remain valid through v0.3" updated to v0.4 with a pointer to the tightened Level 2; the PROTOCOL conformance lead no longer says adopters bind "to v0.1".
- **Colorado example: SB26-189 issuer corrected.** The enacted statute's `issuedBy` pointed at the Colorado AI Policy Work Group, which the same example describes as an advisory body that cannot enact. It now points at the Colorado General Assembly. The work-group Authority record is retained as the recursive-authority-basis illustration, and its known dangling executive-order reference is now called out in the example README.

### Compatibility

v0.1 through v0.4.0 adopter records remain valid without migration.

## [0.4.0] - 2026-06-03

Defines the naming-profile format. The `.well-known` naming profile — announced in v0.3 as a Level 2 requirement but specified only in prose — is now a concrete, validatable standard. This closes one of the v0.3 freeze gates.

### Added

- **`schema/naming-profile.schema.json`** (mirrored to `docs/v1/schema/`). A JSON-LD document of `@type` `of:NamingProfile` declaring, per entity type, the VoID `void:uriSpace` / `void:uriRegexPattern`, an RFC 6570 `uriTemplate`, and the `crosswalks` the adopter supplies. The body is structured RDF-native data so it rides the existing AJV schema validator and is directly consumable by Linked Data tooling.
- **Canonical location and media type.** The profile is served at `/.well-known/obligation-first-naming-profile.jsonld` as `application/ld+json`. A flat `key: value` provenance sidecar (`profile-sha256` / `profile-bytes` over the profile bytes) is served at `/.well-known/obligation-first-naming-profile-manifest.txt` as `text/plain`. This splits the artifact the way GuideCheck already splits its pair: structured data body, human-reviewable hashed sidecar. The body deliberately is not forced into the GuideCheck `.txt` byte profile — that profile exists for instruction-injection review integrity, a threat a data declaration does not share.
- **Worked profile** under `examples/naming-profiles/` (`everyailaw.jsonld` + `everyailaw-manifest.txt`), modelled on EveryAILaw's actual live IRI scheme (singular path segments with a `.json` suffix), declaring only the entity types EveryAILaw publishes (Authority, Instrument, Term, Obligation). The profile is descriptive of what the adopter mints today, not aspirational.
- **`scripts/validate-naming-profile.mjs`** wired into `npm test`. Compiles the schema, validates every worked profile against it, checks each `void:uriRegexPattern` compiles and anchors and that its `uriTemplate` expansion satisfies the pattern, and verifies each sidecar's `profile-sha256` / `profile-bytes` match the profile bytes.

### Changed

- **`schema/context.jsonld`** adds the `void` prefix (`http://rdfs.org/ns/void#`), the `of:NamingProfile` class, and the `profileVersion`, `appliesTo`, `adopter`, `entities`, `uriTemplate`, and `crosswalks` terms. `scripts/validate-repo-contracts.mjs` allowlists the VoID namespace (a non-HTTPS standards namespace, alongside the existing AKN / ELI / LegalRuleML entries).
- **`PROTOCOL.md`** "Naming profile" section rewritten from prose into a normative standard: canonical path, media type, profile shape, sidecar fields, and discovery, with RFC 2119 keywords.
- **ROADMAP** decision #19 (`.json` suffix) reconciled: the adopter's choice is recorded descriptively in its profile's `void:uriRegexPattern`, not mandated by the spec; #17 (identity-fidelity enforcement) advanced now that a profile is machine-validatable.

### Compatibility

No `of:` vocabulary or record-schema change. The naming-profile artifact is additive. v0.1/v0.2/v0.3 adopter records remain valid without migration. The Level 2 naming-profile requirement, in force since v0.3, is now actually satisfiable.

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

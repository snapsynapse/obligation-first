# Changelog

All notable changes to the Obligation-First specification.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/) once it reaches v0.1.0 freeze.

## [Unreleased] — drafting

### Added

- 2026-05-04: Initial repository scaffold. README, INTENT, PROTOCOL outline, PRIOR-ART survey, ROADMAP, license split (CC-BY-4.0 spec / Apache-2.0 code).
- 2026-05-04: Locked v0.1 design — four-role spine (Authority/Instrument/Term/Obligation), proceeding strand (Proceeding/Allegation/Determination), deontic quartet (Requirement/Restriction/Permission/Reparation), defeasibility relation (`of:defeats`), polymorphic `of:executableEncoding`, recursive Authority basis.
- 2026-05-04: Domain registered — `obligationfirst.org`. IRI prefix planned at `https://w3id.org/of/v1/` with `obligationfirst.org/v1/` as resolution target.
- 2026-05-04: Vendored gist 14.1.0 snapshot at `vendor/gist/`.
- 2026-05-04: JSON-LD context starter published at `schema/context.jsonld`.
- 2026-05-04: Three worked examples — Air Canada (proceeding strand), Colorado SB 24-205 (spine), Utah JIA (joint interpretation). All three round-trip cleanly through v0.1.
- 2026-05-04: Crosswalk tables — gist, LegalRuleML, Akoma Ntoso, ELI/ECLI.
- 2026-05-04: McComb / Semantic Arts one-pager drafted at `reference/outreach/mccomb-one-pager.md`. Pending v0.1 PROTOCOL completion before send.

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

### Decisions

- Adoption order: EveryAILaw first, PubLedge second, AI Incident Law third. Smallest binding effort first.
- License split: CC-BY-4.0 for spec text and reference material; Apache-2.0 for code, schemas, scripts, examples. Same as PubLedge.
- Repo home: `~/Git/obligation-first/`. GitHub: `snapsynapse/obligation-first` for now (Path B); transfer to dedicated org or PAICE Foundation org deferred.
- Reparation added as fourth deontic operator after LegalRuleML 1.0 §5.3 alignment review.

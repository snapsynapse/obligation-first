# Project context — obligation-first

## What this project is

Obligation-First is an open upper schema (methodology + JSON-LD `@context`)
for modeling normative content — laws, cases, and agreements — by what it
*requires* rather than what it *says*. It defines a small, opinionated
four-role spine (Authority, Instrument, Term, Obligation) plus a proceeding
strand (Proceeding, Allegation, Determination), bound to the Semantic Arts
gist upper ontology. It is a spec + JSON Schemas + worked examples, not an
application.

It is the shared interstitial layer for the PAICE legal-graph portfolio:
EveryAILaw, AI Incident Law, and PubLedge each publish Obligation-First
records that join through a shared `@context`, schema validation, stable
`@id`s, and cross-project `anchors`.

## Audience

- Legal-graph builders, compliance-tool developers, and ontologists who need
  normative content to be queryable consistently across sources.
- Rules-as-code implementers (Catala, Blawx, OpenFisca and similar) who want
  a schema-level anchor for executable encodings of legal obligations.
- Adopter projects binding their own data to the Obligation-First context
  (currently EveryAILaw, PubLedge, AI Incident Law).

## Style / tone

Precise, technical, standards-body register — closer to a W3C/IETF spec
than marketing copy. README and PROTOCOL.md favor short declarative
sentences, explicit versioning language ("current pre-v1.0 release, subject
to revision until spec freeze"), and named provenance for decisions (e.g. "Semantic Arts
review, Dave McComb, 2026-05-26"). Claims about status are qualified and
dated rather than aspirational. Diagrams/badges used sparingly at the top of
README for spec version and licenses.

## Key URLs

- Canonical site: https://obligationfirst.org/
- Repo: https://github.com/snapsynapse/obligation-first
- Canonical context: https://obligationfirst.org/v1/context.jsonld
- Canonical schemas: https://obligationfirst.org/v1/schema/
- Adopters: https://everyailaw.com/, https://publedge.org/, https://aiincidentlaw.org/
- Upstream ontology: https://semanticarts.com/gist/
- Portfolio canon: https://paice.foundation/ (see sibling repo `paice-foundation/INTENT.md`)

## Current status

- <!-- of-version: project-context-current -->
  Spec version v0.6.5, pre-v1.0.
- Three adopters live and bound (EveryAILaw, PubLedge, AI Incident Law).
- Remaining v1.0 gates are tracked in ROADMAP.md; the w3id.org redirect for
  `https://w3id.org/of/v1/` remains planned rather than live.
- CI covers the full validation suite, GitHub Pages deploy, and a monthly a11y
  audit. Dated hosted acceptance is in `reference/release-delivery-v0.6.4.json`;
  it is not a continuously refreshed CI claim.
- F14 ships in v0.6.5 as offline reference tooling, with owner sidecars in EveryAILaw and
  PubLedge. It does not change the v0.6 record contract or production exports.
  `reference/implementation-status.json` owns that boundary and is mirrored to
  `docs/evaluation-status.json`.

## Documentation audit map

- `README.md` indexes current usage; `ROADMAP.md` indexes pending work.
- `reference/README.md` indexes reference contracts, decisions, and dated evidence.
- `reference/decisions/README.md` indexes the implemented semantic decisions.
- `docs/index.html` is hand-edited website source. `docs/v1/` mirrors schema and
  example sources. `docs/agents.json`, `docs/llms*.txt`, and the assistant guide
  describe the immutable reference package and are release-pinned.
- `handoffs/` contains ignored, temporary queues. Remove a queue only after all
  items are processed and durable material is preserved in its owning scope.
- Dated preparation and acceptance records are historical evidence; append a
  correction or a pointer to later acceptance instead of rewriting their results.
- Keep existing Markdown and frontmatter conventions. This pass adds no new
  status taxonomy to historical documents. The local reporting date uses
  America/Denver; UTC timestamps remain explicitly UTC.
- Authority order: code and git evidence, repo INTENT for repo scope, then
  reference/roadmap summaries and handoffs. Portfolio decisions belong to the
  Foundation INTENT. Verification commands are in `package.json`; exclude
  `node_modules`, vendor files, and immutable release archives from current-copy edits.

# OF v0.6.4 release preparation

Scope: OF's shared evaluator release and the required adopter CI dependency. This is a dated preparation record, not a delivered revision set. Prepared 2026-09-05 under the request to update SemVer, documentation, website and agent surfaces, then prepare staging, commit and push. No original index, commit, remote, tag, registry or hosted deployment was changed.

## Version decision

| Repository | Version | Reason |
|---|---|---|
| Obligation-First | 0.6.3 to 0.6.4 | Patch-level validation hardening; no record shape, vocabulary mapping, identifier or legal-semantic change |
| EveryAILaw | 0.8.1 unchanged | All 30 packaged files byte-identical to source HEAD |
| PubLedge | MCP 0.2.1 and protocol 0.2.0 unchanged | All 75 packaged files byte-identical to source HEAD |
| AI Incident Law | 0.4.0 unchanged | All 355 packaged files byte-identical to source HEAD |
| EveryAILaw Pro | 0.1.0 unchanged | Three filter-vocabulary tests; no runtime change |

OF scope inventory contract v1 is independently versioned. Assistant guide advances from 0.1.3 to 0.1.4 with matching source/mirror bytes, SHA-256, byte count and Git blob anchor. The new guide's remote anchor can only be verified after push.

## Verification evidence

The full OF gate passed, including the shared scope suite, release inventory, missing-link mutations, version propagation, published mirrors and hashes. Final metadata-only date changes passed contract and hash checks again. The combined federation gate passed on the original checkouts, including 1,467 exact scope claims, source rebuilds, JSON-LD, inventory comparison and resolved cross-repository anchors. Fresh isolated snapshots passed all three canonical adopter CI gates with the required OF checkout. Pro passed all three filter tests. Package dry runs found zero modified files in any adopter's published package inventory.

The machine-readable [acceptance record](scope-eval-acceptance-2026-09-05.json) contains base heads, candidate path digests and log hashes. The [release state](release-preparation-v0.6.4.json) distinguishes completed preparation from unperformed delivery. Original source heads are the baseline for the diff, not evidence of a committed candidate. Disposable test commits are not delivery revisions. Acceptance and these two preparation records are excluded from candidate hashes to avoid self-reference.

## Delivery order after approval

1. Recheck the path digests, original indexes, remote main heads and existing tag state. Stage only the OF paths below, inspect the staged diff, and commit with proposed message `Release v0.6.4 scope continuity evaluators`. Push the accepted OF commit and verify its `Deploy to GitHub Pages` workflow at that exact SHA, including the test job and deployment source revision.
2. Use that actual OF commit SHA in all six references across five adopter workflow files listed below. Do not use a test-snapshot SHA, guessed future SHA, branch name, or floating tag. Run EveryAILaw's existing delivery-wiring checker with the actual checker SHA and moving-adopters mode. Recompute PubLedge's manifest after the workflow edit and rebuild its generated mirror. Re-run the affected canonical gates and federation against these final files.
3. Stage and commit PubLedge and AI Incident Law with their exact checker pins and generated artifacts, then push and verify PubLedge `CI` and AI Incident Law `Validate` plus their actual publishing workflows. Proposed messages: `Enforce adopter-owned scope continuity`.
4. Stage and commit EveryAILaw's inventories, source evals, documentation and all three workflow pins. Push after both other adopter revisions are available so its `Federation` workflow can exercise a compatible set. Require exact-head `Build`, `Federation`, and actual deployment evidence. Proposed message: `Enforce scope vocabulary and continuity contracts`.
5. Stage the independent Pro test-only path and commit with `Test territorial filter identity boundaries`. Push and inspect its exact-head `Build` result; do not trigger dispatch or webhook delivery.
6. Record the accepted OF/EveryAILaw/PubLedge/AI Incident Law revision tuple and compare live manifest, guide and changed public surfaces to accepted local hashes. Use the owning production probes after the new URLs are deployed. A green local check or static wiring check alone does not establish hosted acceptance.

Pushing default branches can trigger their existing deployments. A tag and GitHub Release are separate publication steps: proposed tag `v0.6.4`, title `Obligation-First v0.6.4`, body from `docs/releases/v0.6.4/RELEASE_NOTES-v0.6.4.md`, and assets `manifest.json` and `sha256.txt` from that directory. Confirm the final remote commit and tag absence before any tag/publication action. No npm publication is required. Existing historical release directories remain unchanged.

## Required follow-on pin paths

These paths are deliberately absent from the current changed-file set because the real OF commit does not yet exist. They must be added to each adopter's staging set after replacement and verification.

- EveryAILaw `.github/workflows/build.yml`: OF checkout ref.
- EveryAILaw `.github/workflows/weekly-maintenance.yml`: OF checkout ref.
- EveryAILaw `.github/workflows/federation.yml`: OF checkout ref and delivery-checker `--checker-sha` argument.
- PubLedge `.github/workflows/build.yml`: OF checkout ref; regenerate `MANIFEST.yaml` and `docs/MANIFEST.yaml`.
- AI Incident Law `.github/workflows/validate.yml`: OF checkout ref.

All six currently name `b40380366e390828bff2965b17154c3b9ec86d68`. The new wrappers fail closed on that older OF checkout, so adopter commits are not independently ready for push before this step.

## Current staging inventory

Paths below are explicit and repository-relative. Preserve ignored handoffs, unrelated files and existing fingerprint-v2 baselines. No blanket stage or cleanup. All five original indexes were empty when this record was prepared. Refresh this inventory if new changes appear.

### obligation-first

Base `b40380366e390828bff2965b17154c3b9ec86d68` on `main`. 49 paths.

- `CHANGELOG.md`
- `CLAUDE.md`
- `INTENT.md`
- `MANIFEST.yaml`
- `PROJECT_CONTEXT.md`
- `PROTOCOL.md`
- `README.md`
- `ROADMAP.md`
- `SECURITY.md`
- `assistant-guide-manifest.txt`
- `assistant-guide.txt`
- `docs/.well-known/assistant-guide-manifest.txt`
- `docs/.well-known/assistant-guide.txt`
- `docs/agents.json`
- `docs/atom.xml`
- `docs/feed.xml`
- `docs/index.html`
- `docs/llms-full.txt`
- `docs/llms.txt`
- `docs/releases/v0.6.4/RELEASE_NOTES-v0.6.4.md`
- `docs/releases/v0.6.4/index.html`
- `docs/releases/v0.6.4/manifest.json`
- `docs/releases/v0.6.4/sha256.txt`
- `docs/sitemap.xml`
- `docs/v1/context.jsonld`
- `docs/v1/index.html`
- `package-lock.json`
- `package.json`
- `reference/contracts/scope-contract-v1.md`
- `reference/contracts/scope-inventory-v1.schema.json`
- `reference/fixtures/scope-contract-v1/README.md`
- `reference/fixtures/scope-contract-v1/baseline.json`
- `reference/fixtures/scope-contract-v1/inventory.json`
- `reference/fixtures/scope-contract-v1/profile.json`
- `reference/fixtures/scope-contract-v1/records.json`
- `reference/release-preparation-v0.6.4.json`
- `reference/release-preparation-v0.6.4.md`
- `reference/review/external-review-questions.md`
- `reference/scope-eval-acceptance-2026-09-05.json`
- `schema/context.jsonld`
- `scripts/check-scope-contract.mjs`
- `scripts/check-scope-inventories.mjs`
- `scripts/lib/contract-inventory.mjs`
- `scripts/lib/scope-contract.mjs`
- `scripts/test-hardening-regressions.mjs`
- `scripts/test-relation-coverage.mjs`
- `scripts/test-scope-contract.mjs`
- `scripts/validate-repo-contracts.mjs`
- `scripts/verify-federation.mjs`

### publedge

Base `a20eb9e2e53f3fdad5b8739cfc480dcd64f9fad0` on `main`. 8 paths.

- `CHANGELOG.md`
- `MANIFEST.yaml`
- `docs/MANIFEST.yaml`
- `docs/reference/SCOPE-CONTRACT.md`
- `reference/SCOPE-CONTRACT.md`
- `scripts/check-of-fingerprint.js`
- `tests/fixtures/of-scope-baseline.json`
- `tests/fixtures/of-scope-inventory.json`

### ai-incident-law

Base `c9b5335f9f6f1f6887b362a39c2803a122bc4b12` on `main`. 5 paths.

- `CHANGELOG.md`
- `docs/SCOPE-CONTRACT.md`
- `scripts/check-of-fingerprint.mjs`
- `tests/fixtures/of-scope-baseline.json`
- `tests/fixtures/of-scope-inventory.json`

### every-ai-law

Base `b8b67bf340f21194f6abc28d40f8011277a07f6f` on `codex/legal-graph-p1-reconciled`. 6 paths.

- `CHANGELOG.md`
- `design/SCOPE-CONTRACT.md`
- `scripts/check-of-fingerprint.js`
- `scripts/check-of-scope-vocabulary.js`
- `tests/fixtures/of-scope-baseline.json`
- `tests/fixtures/of-scope-inventory.json`

### every-ai-law-pro

Base `365045a29dc62972402dd08f0b85a85859691c37` on `codex/pro-dispatch-accepted`. 1 paths.

- `lib/filter-vocabulary.test.ts`

## Remaining P2 scope

F11 design and deterministic evaluation are complete locally. Exact CI-pin adoption and hosted acceptance remain pending. F10, F13, F14, F15 and other owning evidence/publication work remain in their existing unprocessed queues. This patch does not add qualified temporal semantics, consumer journeys, legal-source certification, or new corpus records.

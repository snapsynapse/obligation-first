# Obligation-First v0.6.6 preparation

Scope: repository reference-package preparation, initially authority R1. The user explicitly authorized R2 delivery on 2026-09-12 after refreshing npm login. Prepared 2026-09-12 from fresh origin/main `81df02431f218a4f93ed84f778461ca2168d9692` on isolated branch `codex/release-0.6.6-2026-09-12`. Original checkout, unrelated work and stashes are preserved. This preparation record preserves pre-delivery evidence; final delivery outcomes belong in the release-delivery record.

## Reconciled starting point

The base matches the handoff. Exact-base Test [34664355776](https://github.com/snapsynapse/obligation-first/actions/runs/34664355776) and Pages [34664355771](https://github.com/snapsynapse/obligation-first/actions/runs/34664355771) succeeded. Latest GitHub release remains v0.6.5. New candidate CI has not run because the candidate is uncommitted. Existing released-state prose in candidate files describes the intended publication content, not evidence that publication occurred.

## Prepared change

- Bump package and managed version surfaces to 0.6.6; preserve v0.6 schema shapes, mappings, IRIs and naming ranges.
- Patch the sole changed dependency entry, `jsonld@9.0.0 -> @digitalbazaar/http-client@4.3.0 -> undici@6.28.1`, from 6.28.0. The maintainer confirms the cited [WebSocket denial-of-service fix](https://github.com/nodejs/undici/security/advisories/GHSA-rfgv-xxqx-mfg5).
- Generate `docs/releases/v0.6.6/` from the final notes: manifest, 49-artifact checksum list, release notes and HTML index. Refresh feeds, sitemap and MANIFEST bundle date/hashes.
- Reconcile current offline-tooling, reviewed checker pin and proposed namespace wording. Keep historical dated evidence intact.
- Preserve assistant guide content/profile and its INTENT exception. No guide migration is part of this patch.

The 49-artifact manifest is the reference distribution, not an inventory of all checker source. Its checksums identify fixed expected bytes, while its GitHub main and canonical endpoint URLs are mutable current locators. Historical reproduction uses the exact tagged source rather than assuming those URLs still serve an old release. The initial independent package review verified all 49 paths and digests, with no compatibility defect. The subsequent broader eval/documentation audit found the concrete checker gaps recorded below; it does not invalidate the earlier bounded inventory check. Operational reconciliation remains repository tooling outside that manifest. Existing adopter pins remain unchanged; the new publication/documentation guards require review with this candidate. OF has `private: true`; npm and MCP Registry publication are not applicable.

## Verification

`npm ci --ignore-scripts --no-audit --no-fund`, exact dependency-tree inspection, full `npm test`, vocabulary producer check, and search-contract validation passed. Search checked 21 sitemap pages with zero defects/infrastructure failures. An initial full test identified the old MANIFEST bundle date; correcting it made the complete suite pass. Local runtime is Node 26.7.0; remote exact-candidate Node 20 CI remains a publication gate.

The bulk dependency audit was not run. Earlier automatic approval review rejected uploading the dependency inventory. Public advisory plus exact lockfile evidence supports the bounded repair; it does not establish a full clean dependency audit.

Combined federation passed in CI mode with explicit owner-specific parent comparison commits: 1,061 validated and JSON-LD round-tripped records, 66 resolved cross-host anchors, three bounded consumer journeys, and two mandatory explicit-unknown assertions. Comparison bases: EveryAILaw `f2cc6cbc61c65ba575bf6a2ef42327742a9b9286`, PubLedge `3a07bba0b9f2b51c298a84fc50a42b66b341ad43`, AI Incident Law `8d8c7913d2015c05ea133f0846c3472807b68005`. This verifies those exact transitions and supplied artifacts; it does not certify whole-corpus currentness or legal truth. The first attempt preceded the EveryAILaw dependency installation; the final explicit-base run passed after installation. The initial standalone copy passed outside the Git worktree. After the broader documentation audit, a fresh standalone copy of 432 source/reference files passed clean dependency installation and the full npm suite again. The working-tree fingerprint is recorded in the accompanying preparation JSON. Private receipt audit files and commitment nonces are not copied into this release.

## Prepublication review and approved implementation

The user first authorized factual documentation corrections following the complete prior-step/eval review, then explicitly approved E1-E6. [The audit](prepublication-audit-2026-09-12.md) preserves reproduced findings and maps them to the implemented synchronization, documentation, search, release metadata, hosted verification, and frozen replay checks. All new regressions are reachable through the canonical test suite. Install sites consistently disable audit uploads.

The Colorado choice is original snapshot plus evolution companion. Original record bytes remain unchanged. A separately identified demonstration explains current modeling distinctions and unresolved evidence; it does not refresh legal facts or resolve the predecessor lifecycle question. The website source and agent entry points expose both.

Final local test and fresh 451-file post-cleanup standalone-consumer full suites passed, including all 33 test scripts. Candidate source and an isolated prospective commit index exclude handoffs; the actual Git staging area is unchanged. Search checked 21 pages; schemas validated 63 records and graph checks passed five worked sets. The release package has 49 artifacts and the selected-content ledger has 101 entries. Combined explicit-base federation passed again. Fingerprint evidence is recorded in the accompanying preparation JSON. Earlier verification above remains dated to its original candidate; no new live acceptance is implied. Independent missed-run/recovery acceptance, external issue/w3id actions and publication remain separate work.

## Publication criteria

Publication was explicitly authorized on 2026-09-12. A final candidate needs a reviewed diff, explicit staged-path inventory with no handoffs, successful exact-commit CI, verified merge/tag targets, release metadata/assets, and independent hosted-byte acceptance. The permanent release mechanics are in AGENTS.md and the hosted-verifier reference. Local preparation does not establish any of these delivery outcomes.

Historical release packages and tags must not be overwritten. External issue and w3id state is recorded in `reference/issue-namespace-reconciliation-2026-09-12.md`; it is not automatic authority to act.

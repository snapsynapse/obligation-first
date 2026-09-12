# Prepublication eval and documentation audit, 2026-09-12

Scope: review of the preceding Sessions 1-20 and shared known-findings history, read-only evaluation of existing deterministic checks, then authorized factual documentation corrections across Obligation-First root, references, examples, website source and agent surfaces. The initial findings below were followed by explicit user authorization to implement E1-E6 and preserve Colorado as an original snapshot plus evolution companion. The implementation section records that local follow-up. The audit compared committed `origin/main` at `81df02431f218a4f93ed84f778461ca2168d9692` (v0.6.5) with the uncommitted v0.6.6 candidate. It did not treat candidate prose as evidence that a tag, GitHub Release, registry publication, or deployment has occurred.

## Evidence and limits

- The candidate version remains 0.6.6. The initial documentation-only pass left code and workflows unchanged; the later authorized implementation changes checker and workflow behavior while preserving schema shapes and original record payloads. Its final regenerated package and validation results are recorded in the release-preparation state. Prior acceptance remains bound to its original inputs.
- `git diff --check` passed after the documentation corrections. All 27 `reference/**/*.json` files parse as JSON.
- Release-pinned documentation changes require a regenerated v0.6.6 manifest/checksum list and refreshed selected-content hashes. Historical release directories remain unchanged. This is a code/documentation consistency audit, not a fresh independent review of every upstream standard or legal source.
- Historical release records, dated acceptance data, fixture inputs, and legal-example records were not rewritten. Their claims remain scoped to their recorded dates and inputs.

## Factual corrections applied

| File | Correction | Evidence |
|---|---|---|
| `PROTOCOL.md` | Updated `modified` from 2026-09-05 to 2026-09-12 with the v0.6.6 version change. | Frontmatter had v0.6.6 while retaining the older modification date. |
| `INTENT.md` | Updated `last_updated` from 2026-09-09 to 2026-09-12. | The candidate updates its managed version surface. |
| `CONTRIBUTING.md` | Replaced the forward-facing v0.1 adopter-feedback baseline with the current v0.6 release line. | `package.json` and managed surfaces are v0.6.6. |
| `reference/decisions/README.md` | Removed links to two consumed, absent handoff files and described the decision records as their durable home. | Neither `handoffs/2026-08-04-everyailaw-alignment-remediation.md` nor `handoffs/2026-06-09-semantic-review.md` exists. |
| `reference/crosswalks/legalruleml.md` | Preserved original questions with current resolved/deferred status; replaced a rejected remote-context, incomplete Term example with a schema-valid synthetic inline extension. | `of:rebuts` and `of:undercuts` are documented in `PROTOCOL.md`; `of:legalRuleMLEncoding` remains deferred in `ROADMAP.md`. |
| Dated implementation records | Added historical pointers to P1 mitigation, candidate integration, known corrections, documentation audit, the IRI decision's initial implementation plan, and the v0.1 handoff archive. | Current owner workflows use exact checker pins and dependency installs; later delivery and release-preparation records supersede their present-tense queues. |
| `reference/colorado-ai-law-paice-briefing.md` | Marked the briefing historical and unsuitable as current legal-status guidance; recorded its missing local citation bibliography. | Its unlinked `[cite:n]` markers cannot support a currentness claim, and later OF evidence preserves unknown predecessor operation/enforcement. |
| `reference/README.md` | Added current contracts and candidate-preparation entries; labeled historical records and the historical handoff archive. | The old index called the dated 2026-09-05 audit current and omitted active migration, term-boundary, and v0.6.6 preparation references. |

## Coverage inventory

### Root technical documentation

| Classification and review | Files |
|---|---|
| Current, fully reviewed against candidate source and package metadata | `PROTOCOL.md`, `README.md`, `INTENT.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md`, `PROJECT_CONTEXT.md`, `assistant-guide.txt`, `assistant-guide-manifest.txt`, `package.json`, `package-lock.json`, `MANIFEST.yaml`, `search-audit.config.json` |
| Historical or attribution record, classified without rewriting substance | `CHANGELOG.md`, `PRIOR-ART.md`, `ATTRIBUTION.md` |
| Current agent/served-surface source, reviewed for ownership and version parity only | `CLAUDE.md` |

### Reference documentation

| Classification and review | Files |
|---|---|
| Current contracts or operational references, fully read and claim-checked against scripts, schemas, package wiring, or owner workflow configuration | `reference/README.md`, `reference/adopter-kit.md`, `reference/contracts/qualified-time-fixture-v1.md`, `reference/contracts/scope-contract-v1.md`, `reference/crosswalks/akomantoso.md`, `reference/crosswalks/eli-ecli.md`, `reference/crosswalks/gist.md`, `reference/crosswalks/legalruleml.md`, `reference/decisions/README.md`, `reference/decisions/actors-and-deontic-grounding.md`, `reference/decisions/authority-text-and-scope.md`, `reference/decisions/identity-and-classification.md`, `reference/decisions/normative-force-and-lifecycle.md`, `reference/decisions/provenance-extensions-and-conformance.md`, `reference/federation-reconciliation-v1.md`, `reference/implementation-status.json`, `reference/iri-naming-and-crosswalks.md`, `reference/issue-namespace-reconciliation-2026-09-12.md`, `reference/relationship-migration-review.md`, `reference/term-boundary-checks.md`, `reference/w3id-pr.md`, `reference/w3id/of/README.md`, `reference/w3id/of/.htaccess` |
| Current candidate evidence, fully read or structurally checked; publication remains unperformed | `reference/release-preparation-v0.6.6.md`, `reference/release-preparation-v0.6.6.json`, `reference/release-candidate-v0.6.6-inventory.json`, `reference/review/external-review-questions.md` |
| Historical implementation, preparation, delivery, or decision evidence; classified and preserved with dated pointers | `reference/F13-local-verification-2026-09-06.json`, `reference/F14-acceptance-2026-09-05.json`, `reference/F14-contract-decision-2026-09-05.md`, `reference/F14-source-reconciliation-2026-09-05.json`, `reference/P1-mitigation-2026-09-04.md`, `reference/candidate-integration-2026-09-11.md`, `reference/documentation-audit-2026-09-05.md`, `reference/documentation-audit-2026-09-05.json`, `reference/known-corrections-2026-09-09.md`, `reference/known-corrections-acceptance-2026-09-09.json`, `reference/release-delivery-v0.6.4.json`, `reference/release-delivery-v0.6.5.json`, `reference/release-preparation-v0.6.4.md`, `reference/release-preparation-v0.6.4.json`, `reference/scope-eval-acceptance-2026-09-05.json` |
| Initial inventory: temporary v0.1 handoffs, subsequently removed after durable provenance migration | `reference/handoffs/README.md`, `reference/handoffs/everyailaw-binding.md`, `reference/handoffs/publedge-binding.md`, `reference/handoffs/aiincidentlaw-binding.md` |
| Non-current creative or portfolio material, classified and not treated as technical authority | `reference/og-image-prompt.md`, `reference/colorado-ai-law-paice-briefing.md` |
| Fixture scope READMEs and data; JSON structures parsed, frozen inputs/outputs preserved rather than treated as current legal claims | `reference/contracts/qualified-time-fixture-v1.schema.json`, `reference/contracts/scope-inventory-v1.schema.json`, `reference/fixtures/consumer-traversals-2026-09-09.json`, `reference/fixtures/qualified-time-v1/README.md`, `reference/fixtures/qualified-time-v1/pending-amendment.json`, `reference/fixtures/scope-contract-v1/README.md`, `reference/fixtures/scope-contract-v1/baseline.json`, `reference/fixtures/scope-contract-v1/inventory.json`, `reference/fixtures/scope-contract-v1/profile.json`, `reference/fixtures/scope-contract-v1/records.json`, `reference/fixtures/source-meaning-v1/README.md`, `reference/fixtures/source-meaning-v1/adjudication-2026-09-09.json`, `reference/fixtures/source-meaning-v1/cases.json`, `reference/fixtures/source-meaning-v1/labels-initial-2026-09-09.json`, `reference/fixtures/source-meaning-v1/labels.json`, `reference/fixtures/source-meaning-v1/predictions-sol-2026-09-09.json`, `reference/fixtures/source-meaning-v1/score-initial-sol-2026-09-09.json`, `reference/fixtures/source-meaning-v1/score-sol-2026-09-09.json` |

The initial documentation-pass reference inventory contained 67 files: 39 Markdown documents, 27 JSON documents including the two schema files, and one `.htaccess` file.

### Worked-example READMEs

| Classification and review | Files |
|---|---|
| Current structural fixture documentation, fully read | `examples/air-canada/README.md`, `examples/migration-v0.5-v0.6/README.md`, `examples/publedge-jia-utah-72/README.md` |
| Historical or time-sensitive legal teaching fixture, fully read and preserved | `examples/colorado-sb24-205/README.md`, `examples/eu-ai-act-article-50/README.md` |

## Prior-step trace and ownership

The review followed the LocalBrain session chain and its shared findings map. Session 1 was traced through `reference/candidate-integration-2026-09-11.md`; the LocalBrain index predates the later session notes, so Sessions 2-20 were read from their named files. Private source-note paths and review hashes remain in the local audit evidence, not a runtime dependency of this repository.

| Previous work | Existing OF coverage or owning boundary | Assessment |
|---|---|---|
| Session 1, comparison-base isolation | `test-admission-base.mjs`, migration tests, owner-specific bases in `verify-federation.mjs` | Existing malformed, missing, self, divergent and mixed-owner controls should be retained. |
| Sessions 2-6, provenance filtering, source corrections and typed locators | Owner source admission plus OF category/authority/role retirement adapters and nested fingerprints | Existing bounded migration adapters and negative cases protect the demonstrated transitions. Typed-locator meaning and source review remain owner responsibilities. |
| Session 7, pinned history and event integrity | `check-projection-freshness.mjs`, semantic-federation tests, preserved-symlink entrypoint checks | Existing isolation and actual execution regressions address the skipped-rebuild failure; duplicate tests are unnecessary. Producer event persistence belongs to EveryAILaw. |
| Sessions 8-10, candidate tuples, source and website delivery | Existing exact-base federation and dated delivery receipts | Manual live byte sweeps are useful candidates for a reusable acceptance script. Historical delivery is separate from this unpublished package. |
| Sessions 11-17, fixture isolation and durable intake receipts | EveryAILaw and Pro contract, database, concurrency and hosted acceptance suites | Do not move customer routing, nonce commitments, migrations or receiver runtime tests into OF. Stored intake does not imply customer delivery or independent missing-run notification. |
| Sessions 18-20, package preparation and AI Tool Watch diagnosis | OF version/package/hash gates plus owner packed-consumer tests | This review found release tooling and documentation gaps below. ATW provider budgets and no-npm release policy remain in that repository. |
| Earlier source-meaning evaluation | `score-source-meaning.mjs`, synthetic scorer tests, frozen 22-case fixture | Manual replay matched the retained final score. This verifies arithmetic and retained evidence, not a new evaluator run or corpus accuracy. |

A static import/script traversal found every one of the 25 `scripts/test-*.mjs` files reachable from `npm test`. The suite already covers admission, nested provenance, exact relationships, scope, time, identifier continuity and consumer journeys. More test files alone would not improve assurance.

## Proposed deterministic changes

These are concrete proposals for a subsequent local implementation tranche. No script, schema or workflow was changed here.

| ID | Recommendation | Reproduced gap and acceptance cases |
|---|---|---|
| E1 | Extend `sync-version.mjs` and its tests to own all current version/status/date summaries. | In an isolated copy, advancing to 0.6.7 with `--date 2026-09-13` made both write and `--check` exit 0 while implementation-status stayed 0.6.6, MANIFEST bundle date stayed 2026-09-12, and scope prose stayed 0.6.6. Test patch/minor bumps, explicit dates, missing/duplicate markers, idempotence, source/served parity and unchanged historical releases. Full contract validation currently catches some drift later; the narrow synchronizer check should not report complete synchronization. |
| E2 | Expand implementation-status parity and validate executable documentation examples. | The namespace page's stale unreleased F14 claim escaped `check-implementation-status.mjs`, which checks only README/homepage prose. Include namespace and agent summaries in a declared coverage inventory; mutate each surface to stale release, false production semantics or missing discovery. Extract explicitly executable doc fixtures and run the applicable schema/JSON-LD check; the prior LegalRuleML example used a non-allowlisted remote context and omitted `parent_instrument`. Preserve illustrative and historical snippets as separately classified. |
| E3 | Put search in the canonical predeployment gate. | Test runs `check-search.mjs` separately, but the independent Pages workflow gates only on `npm test`, which omits search. Add `check:search` to the canonical command or an explicit required Pages job, and seed a search defect that blocks deploy readiness. Passing an independent Test run must not be assumed from a Pages result. |
| E4 | Harden existing release metadata validation. | `make-release.mjs` accepted 2026-02-30 in an isolated output directory; `validateReleaseManifestContract` accepted that date with a wrong name and repository. The real candidate values are correct. Reject impossible calendar dates, wrong identity and mismatched bundle dates; exercise leap days and wrong-type values before writing output. |
| E5 | Add a separate hosted-artifact acceptance verifier. | `probe-public-endpoints.mjs` is an HTTP HEAD/200 reachability probe. Keep that scope; add bounded GET plus expected digest checks for the served context, schemas, agent files and release package, with structured evidence tied to the exact source revision. Test stale/wrong 200 bodies, missing/extra files, redirects, MIME mismatches and unavailable sources. GitHub blob/main locators are mutable; verify historical source against the exact tag/commit rather than treating rendered HTML as artifact bytes. |
| E6 | Add deterministic replay checks for retained source-meaning evidence. | The scorer test uses synthetic arithmetic controls but does not replay the checked-in initial/final labels and original predictions against both retained score reports. Assert input/label/prediction bindings, exact case coverage and score equality; seed changed excerpt, stale digest, duplicated case and disputed-label cases. This is frozen evidence integrity, not a new legal-accuracy benchmark or provider call. |

These were the pre-implementation recommendations. The user subsequently authorized all six; see the implementation results below.

The approved execution-policy alignment encodes `--no-audit --no-fund` in `validate:lockfile` and all three workflow install sites. The lockfile dry run and CI installs also ignore install scripts; the Puppeteer audit installation retains its installation lifecycle. Dependency audit submission remains a separate operation. This is not a finding that prior CI was invalid, nor a claim that disabling audit improves dependency security. No audit upload was performed by this review.

## Website and agent-surface coverage

The pass covered current `docs/index.html`, `docs/v1/index.html`, vocabulary HTML/JSON, schema/context mirrors, all served example README mirrors, `docs/agents.json`, both LLM text files, assistant-guide and manifest pairs, robots, feeds, sitemap, current release metadata, AGENTS, CLAUDE and PROJECT_CONTEXT. Historical versioned release directories were classified as immutable evidence, not rewritten to today's state.

Corrections add the missing `llms_full` discovery entry; mark F14 as released offline tooling; distinguish JSON-LD expansion from pending IRI dereferencing; document expanded version/date/status synchronization, the canonical search gate and the two hash inventories; and distinguish GuideCheck integrity evidence from an achieved conformance level. The guide and its retained profile are unchanged. Its documented frozen-verifier exception remains in INTENT.

Read-only live samples covered the homepage, agents, both LLM files, guide pair, context and v0.6.5/v0.6.6 manifest URLs. Live still served v0.6.5; the v0.6.6 manifest returned 404, as expected before publication. Local corrections do not establish a deployed website correction. Publication remains paused.

## Remaining record and ownership decisions

1. The user selected original snapshot plus evolution companion. Preserve the original Colorado record bytes and historical narrative, link a separately identified demonstration of the current contract, and retain unresolved evidence. This settles presentation, not issue 6 or the legal meaning of predecessor lifecycle. No refreshed legal evidence or automatic property-merging identity is inferred.
2. `reference/colorado-ai-law-paice-briefing.md` is product analysis with unresolved citation markers. It is labeled historical. Reissuing or moving it requires its portfolio owner's direction.
3. User clarification resolved the handoff boundary: handoffs are temporary, never historical documentation. The four legacy `reference/handoffs/` files were removed after verified first-binding commit provenance was retained in `reference/adopter-kit.md`. Current reference and agent indexes no longer route readers to handoffs. Historical changelog entries remain factual records of past changes, not retained handoff files.
4. Issue 4 production semantics, issue 6 predecessor lifecycle/source history, external issue reconciliation and w3id acceptance remain unresolved. The known-finding map also retains source-review capacity and independent missed-run/recovery acceptance. Durable receipt delivery does not automatically close those different criteria.

## Initial documentation-pass verification

The uncommitted 0.6.6 reference package was regenerated after the factual edits and MANIFEST hashes refreshed. The full `npm test` passed, including published-mirror, release-state, package-contract and hash checks. The separate search gate passed on 21 pages with zero defects/infrastructure failures; version sync and vocabulary checks passed. The corrected LegalRuleML example passed Term-schema and JSON-LD round-trip checks; its prior form was independently reproduced as failing both. The source-meaning replay matched the retained 22-case final score. The refreshed candidate fingerprint is recorded in the preparation record. Commits, pushes, PRs, tags, releases, deployment and new evaluator/provider runs remain unperformed. The later authorized implementation is recorded below.

## Authorized improvement implementation

Scope: repository tooling and documentation, local only. The user approved E1-E6 and chose original snapshot plus evolution companion for Colorado. Commit, push, merge, tag, release and deployment remain paused.

| Item | Implemented behavior | Deterministic evidence |
|---|---|---|
| E1 | Synchronize current version, strict bundle/page/status dates, source/served implementation status and declared summaries; reject missing/duplicate markers and incompatible guide scope before writes. | `test-version-sync.mjs`: patch/minor fixtures, explicit dates, drift, idempotence, guide guard and historical release preservation. |
| E2 | Check README, homepage, namespace, both LLM summaries and agent discovery; schema/JSON-LD check explicitly inventoried current executable documentation while classifying historical material separately. | `test-implementation-status.mjs`, `test-executable-doc-examples.mjs`: real baseline and seeded stale/missing/invalid examples. This inventory does not claim every prose snippet is executable. |
| E3 | `npm test` starts with `validate:search`; Pages build requires that test job and deployment requires build. | `test-core-gates.mjs`: clean search baseline, seeded wrong canonical URL, missing/bypassed search command and broken Pages dependency mutations. |
| E4 | Generator rejects impossible dates before output, fixes project identity and requires bundle-date parity; validator checks identity and calendar/date parity. | `test-release-metadata.mjs`: leap/century/month/day boundaries, invalid types, wrong identity, mismatched/duplicate dates and no artifacts on invalid input. |
| E5 | Separate bounded GET/SHA-256 verification binds expected artifacts to an exact tag/commit and served bytes; HEAD probe remains reachability only. | `test-hosted-artifact-verifier.mjs`: correct/wrong bodies, inventory, HTTP/network, MIME, redirect, size and tag/revision controls. No new live acceptance claim. |
| E6 | Replay original predictions against both frozen label sets and byte-compare retained score reports; bind adjudication hashes and disagreements. | `test-source-meaning-replay.mjs`: original 19/22 and final 20/22 reproduced; altered excerpt, stale digest, duplicate prediction and changed adjudication status fail. No model/provider call. |

The new suites run through the canonical hardening command. Full candidate and standalone-consumer results, inventory fingerprint and publication boundary are recorded in `release-preparation-v0.6.6.json` after final package regeneration.

## Final improvement verification

The integrated canonical suite passed, followed by a new standalone copy of 453 candidate files with no Git metadata or preseeded dependencies. The standalone copy installed with `npm ci --ignore-scripts --no-audit --no-fund` and passed the full suite, including all 32 test scripts, 63 schema-valid example records, five graph-valid worked sets, source/served mirrors, 21-page search contract, 49-artifact release package and 101-entry selected-content hash ledger. The original 13 Colorado record files and served copies, historical tracked release directories, and assistant-guide pair are unchanged against the base commit. The homepage's current companion excerpt is checked against the companion record.

Combined federation passed again using explicit owner comparison bases: 1,061 records, 66 resolved anchors, three bounded journeys and two explicit-unknown assertions. The hosted verifier's 49 manifest artifacts and 87 supplemental surfaces (72 served example paths) were checked deterministically, not fetched as a new deployment acceptance. Version/date synchronization, vocabulary generation and whitespace checks passed. No provider evaluation, commit, push, PR, tag, release or deployment occurred. Final source identity is in the candidate inventory; local logs and a checksummed recovery snapshot accompany the LocalBrain session capture.

## Handoff exclusion follow-up

The user required all handoffs to remain outside commits. OF's four legacy handoff files are deleted in this candidate; their unique verified first-binding commit provenance is now in the adopter kit. No raw handoff was renamed as an archive. The candidate publication-hygiene check runs in `npm test`, and a separate `--staged` check inspects the actual Git index before any authorized commit. Its regression demonstrates that an unstaged working-tree deletion cannot clear a handoff from the commit index. Ignored local queues remain usable; a standalone source archive containing a handoff fails validation.

Current release-evidence records retain measured candidate state and acceptance boundaries. Future session execution instructions belong in ignored queues. The earlier 453-file/32-suite verification above records the pre-cleanup improvement snapshot; the final preparation JSON and candidate inventory carry the refreshed post-cleanup evidence.

Post-cleanup verification: full canonical suite and a fresh 451-file standalone source copy passed all 33 test scripts. The source hygiene check passed, and an isolated prospective Git index containing the intended deletions passed the staged hygiene check; the actual Git staging area was unchanged. The 49-artifact package and 101-entry selected-content hashes were regenerated and validated. No handoff file remains in the candidate source.

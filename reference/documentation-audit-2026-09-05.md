# Documentation and deterministic-eval pass

Scope: Obligation-First current documentation, website source and agent discovery, with the EveryAILaw/PubLedge F14 notes checked for the same ownership boundary. Date: 2026-09-05 America/Denver. This is local work; no delivery commit, push, release, deployment, or external filing is authorized by this record.

## Additional checks worth adding now

| Check | Failure prevented | Result |
|---|---|---|
| Require EveryAILaw native mapping | Deleting `pending_mapping` silently skips the two-date check | Implemented in federation with `--require-pending-mapping`; omission mutation fails |
| Stable fixture/record input diagnostics | Missing files, malformed JSON, null roots or invalid record paths expose raw errors | Implemented; failures use F14-ADOPTER-READ or F14-ADOPTER-SHAPE |
| Calendar, evidence and timezone boundaries | Year-zero acceptance, century leap-year errors, fallback evidence borrowing or host-timezone dependence | Implemented; 60 total F14 synthetic checks |
| Code-backed documentation parity | Website/README/machine status advertise a production temporal feature, omit discovery, drift from release version, or claim unwired checks | Implemented; baseline plus 15 seeded drift mutations |

These checks extend the existing suite rather than creating a second test harness. `npm test` runs both suites through `test:hardening`; `validate:contracts` also checks implementation-status parity. `verify:federation` runs both real owner sidecars with the required EveryAILaw mapping. The status guard verifies declared paths, release inventory, command wiring and exact status summaries; successful execution is established by the full test run, not by lexical wiring checks alone.

The canonical status is `reference/implementation-status.json`, mirrored byte-for-byte to `docs/evaluation-status.json`. README and website summaries are checked against it. The website remains hand-edited. A missing-code, missing-wire, false-production claim, version drift, undiscoverable status, or mirror mismatch fails deterministically.

## Documentation reconciliation

| Surface | Finding | Action |
|---|---|---|
| README | No F14/released-tooling distinction; example-only command described as validating the user's records | Added scoped status/discovery, standalone eval command, correct adopter CLI and command labels |
| PROJECT_CONTEXT | No documentation ownership/index map; unqualified current CI-green assertion | Added map, scope boundary and dated delivery-evidence pointer |
| INTENT | w3id redirect described in present tense | Corrected to pending readiness; preserved existing identifiers and schema strategy |
| ROADMAP | Local F14 fixture already recorded in prior tranche | Retained remaining source-history/schema-decision scope |
| Reference index | No current index separating contracts from preparation evidence | Added reference/README.md |
| Adopter kit | Three worked examples claimed where discovery finds four; guessed record path labeled literal | Corrected discovery count, parameterized user path, separated F14 from production writer |
| Website homepage and v1 index | No unreleased F14 scope/discovery; Colorado text called enacted successor a bill | Added status and machine link; identified Colorado as a historical fixture |
| Colorado example README and published mirror | Historical scenario read like a current operative-status assessment | Qualified the example's scope and successor-date limitation; records unchanged |
| w3id preparation | Ready-to-file label and eight-schema count, with no per-term redirect coverage | Marked incomplete, updated 14-document inventory and explicit term-target/test gap; no F13 implementation |
| v0.6.4 preparation | Historical pending-delivery instructions could be mistaken for current work | Added pointer to later accepted delivery; preserved original preparation evidence |
| F14 contract | Initial acceptance hashes and 42-check count could be read as current after edits | Identified first acceptance as historical and linked this expanded pass |
| Released agents.json, llms.txt, llms-full.txt and GuideCheck pair | Correctly versioned to the released v0.6.4 reference package | Preserved release-pinned bytes; new evaluation-status JSON supplements them with unreleased-tooling scope |
| EveryAILaw/PubLedge F14 notes | Correctly identify offline sidecars and pending production serialization/history | Checked; no additional adopter source or website edits in this pass |

No existing immutable release package was rewritten. The new status supplement is independently served working-tree documentation; it does not add F14 to v0.6.4's packaged capabilities. A future release that includes the evaluator must deliberately update this status and its checks.

## Live evidence and limitations

Direct HTTP checks of the homepage, agents.json, llms.txt, llms-full.txt, and both GuideCheck files returned 200 and matched local HEAD's v0.6.4 SHA-256 values. The web tool returned an older v0.6.3 homepage representation; direct byte comparisons resolved that discrepancy. Sandboxed curl initially could not resolve DNS; the unchanged read-only check succeeded with network-capable execution. Neither the cached response nor the DNS error was treated as a deployment defect.

The new evaluation-status endpoint and the website edits are local and are not yet deployed. Before delivery, the live site accurately describes the released reference package, while the local candidate additionally exposes F14's unreleased status. Deployment is required to make the new supplement live. No current hosted-CI claim is inferred from these HTTP checks. Both the w3id namespace and its Instrument term returned 404 in a separate direct check; the redirect-readiness gap remains real.

## Deferred evals

- F13 target/redirect tests belong with the reviewed namespace contribution.
- F15 fixed IRI traversal and curated/inferred evidence tests belong with consumer fixtures.
- General temporal causality and source-specific predecessor-history claims need reviewed evidence and policy before expectations are frozen.
- Raw-source digest requirements and reviewed relationship migrations remain adopter-owned work; the F14 syntax checks do not certify source truth.

The acceptance JSON accompanying this note records final results, current path hashes and the six live responses. Prior F14 acceptance remains evidence of the earlier candidate, not a current-hash assertion.

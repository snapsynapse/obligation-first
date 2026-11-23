# RUML quickstart local validation

Observed 2026-11-22. Scope: local documentation and synthetic integration fixture, followed by Sam's requested review, fixes and local commit. Based on OF `16d3810e6ddbd9041f1849acc85a4cc3fa4dfc62` on `codex/ruml-quickstart-20261122`; Git history identifies the resulting local commit. This is validation evidence, not publication, source admission or external conformance acceptance.

## Changes

- Added `reference/ruml-quickstart.md`, `reference/crosswalks/ruml.md` and `reference/fixtures/ruml-v1/`, linked from the existing README, reference index and adopter kit.
- Added an offline fixture checker and ten negative controls, included in the existing hardening gate. The checker reuses current OF/JSON-LD validation and AJV with two unmodified, pinned Apache-2.0 RUML schemas.
- Added the literal LegalDocML.de 1.8.2 XML namespace to the existing URL validator's standards-namespace allowlist so the upstream schema remains byte-identical. No URL rewriting or general scan exemption was introduced.
- Added the crosswalk to the existing MANIFEST hash coverage. Version, shared schemas/context, package manifest/lockfile, protocol and published artifacts were not changed.

## Validation

| Check | Result and limit |
|---|---|
| `node scripts/check-ruml-example.mjs` | Passed: four OF records, graph/JSON-LD checks, one RUML rulemap, three expected results, raw-file hashes and local bindings |
| `node scripts/test-ruml-example.mjs` | Passed with ten negative controls: unsupported kind, broken grounding, promoted enforcement, missing-to-false conversion, wrong result reference, changed inputs, wrong local file, omitted hash coverage, unresolved source anchor and altered upstream schema. Fixture edits are rehashed before checking. |
| JSONata 2.2.0 expression execution | Both expressions executed against all three input objects using the temporary official npm distribution. Leaf statuses matched; root expectations were separately checked against complete-mode AND in section 3.6. This was not a full RUML evaluator run. |
| `npm run validate:doc-examples` | Passed existing inventoried documentation checks; new examples live in fixture files and are covered by their dedicated checker |
| `npm test` | Passed the complete existing suite, including new hardening checks, publication parity, URL/context contracts and hashes |
| Shared-contract diff | No changes to `schema/`, `docs/`, `PROTOCOL.md`, `package.json` or `package-lock.json` |

An initial full run failed because the copied upstream schema contains the LegalDocML.de namespace with a non-HTTPS spelling. The narrow standards-namespace addition resolved it. The complete suite was rerun after the subsequent correctness fixes below. No dependencies were added and no lifecycle install scripts or audit submissions were used for this work.

## Correctness and usability review

The initial checker accepted four reproduced faults after rehashing: changed case inputs with stale expected answers, an incorrect `local_rulemap`, an empty byte-hash inventory and an unresolved root text anchor. It also trusted the editable ledger alone for the upstream schema identity. The reviewed checker now freezes the inputs, requires the exact file inventory, pins upstream byte identities independently, validates the local mapping/text anchor and checks required capability declarations and node UUID uniqueness. These are bounded checks for this teaching fixture, not a general RUML semantic validator.

Five additional negative controls cover those faults, including an altered upstream schema with an updated ledger hash. The new controls match their intended diagnostic so an unrelated failure cannot masquerade as rejection at the expected check. The original five controls remain. JSONata execution is still separate from static fixture checks.

The crosswalk now distinguishes a LexID (a local numeric-string node key) from tree position and result path, and qualifies XOR early exit as optimized-mode behavior. The quickstart links directly to each OF record, rulemap and case file and clarifies that the case called `complete` is an eligible-case label, while all cases use complete evaluation mode. Fixture licensing now explicitly separates original example data from explanatory Markdown and upstream schemas.

## Acceptance limits

The RUML sources and copied schemas are pinned to `d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4`, specification 1.0.0 / serialized format 1.0. JSON Schema validation does not establish all semantic rules. Expected `.ruml-result` files remain author-written fixtures; no full RUML evaluator output, certification, official endorsement or legal applicability is claimed. The synthetic URI mapping and byte-hash ledger are not a proposed shared evidence schema or signed RUML container.

Sam subsequently authorized a local commit after review and fixes; push, PR, merge, release and deployment remain outside that request. Ignored owner-local continuation queues were added in EveryAILaw, PubLedge, AI Incident Law and EveryAILaw Pro. Behind/diverged checkouts received only the expressly permitted handoff writes; no reconciliation was performed. Foundation and its existing dirty INTENT remained untouched. The continuation queues must be consumed and deleted under the normal handoff policy; they are not release artifacts.

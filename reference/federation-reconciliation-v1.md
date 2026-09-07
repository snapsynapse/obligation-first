# Federation reconciliation evidence v1
Status: operational companion contract, September 7, 2026.
Scope: daily and publication-triggered reconciliation by EveryAILaw's private runner. This file does not change the Obligation-First record schema, JSON-LD context, or adopter export shape.

The runner supplies one JSON evidence envelope to `node scripts/check-federation-reconciliation.mjs --evidence FILE [--previous FILE]`. The envelope records the pinned Obligation-First checker commit/version, each shared-schema adopter's exact source commit, compatible naming-profile range, reviewed exact-edge digest, rebuilt-projection source/digest/artifact hash, and deployed artifact source/digest/hash. `every-ai-law-pro` is a downstream service and is rejected as an adopter.

The checker fails closed when an exact-edge baseline changes, a projection is stale, an adopter range excludes the pinned checker, or deployed bytes identify another source or edge digest. It emits a stable fingerprint and `notification.notify`; a runner persists the result and notifies the listed owner only for a new or changed failure. Healthy and unchanged failures still produce evidence but do not repeat alerts.

`upstream_reviews` records low-frequency shared-spec and release review work outside the record schema. Each item names its source, positive `cadence_days`, and `reviewed_at`; overdue reviews fail with `OF-RECONCILIATION-UPSTREAM-REVIEW-DUE`. This is a maintenance queue, not a claim that an upstream specification changed.

The private runner retains collection, persistence, live HTTP retrieval, notification transport, and credentials. The public shared checker only evaluates supplied evidence. Its daily schedule remains in EveryAILaw because that private repository can read the complete legal graph.

When a collector compares a complete declared artifact set, byte equality may establish `deployed.equivalent_source_commit` with `identity: byte_equivalent_to_checked_out_source`. Keep `deployed.source_commit` null unless independently attested by the deployment. The evaluator accepts this explicit equivalence mode only when the complete artifact hash and exact-edge digest also match. An index with counts and filenames alone cannot establish deployed record equivalence.

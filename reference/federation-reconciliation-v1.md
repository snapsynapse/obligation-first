# Federation reconciliation evidence v1
Status: operational companion contract, September 7, 2026.
Scope: daily and publication-triggered reconciliation by EveryAILaw's private runner. This file does not change the Obligation-First record schema, JSON-LD context, or adopter export shape.

The runner supplies one JSON evidence envelope to `node scripts/check-federation-reconciliation.mjs --evidence FILE [--previous FILE]`. The envelope records the pinned Obligation-First checker commit/version, each shared-schema adopter's exact source commit, compatible naming-profile range, reviewed exact-edge digest, rebuilt-projection source/digest/artifact hash, and deployed artifact source/digest/hash. `every-ai-law-pro` is a downstream service and is rejected as an adopter.

The checker fails closed when an exact-edge baseline changes, a projection is stale, an adopter range excludes the pinned checker, or deployed bytes identify another source or edge digest. It emits a stable fingerprint and a `notification.notify` recommendation. Passing `--previous` lets a caller suppress a repeated unchanged failure. The current EveryAILaw workflow does not pass previous evidence or implement a persistent notification store or owner-mail adapter: it retains the result as a GitHub artifact and fails red on invalid evidence. Deduplicated owner delivery requires that additional integration; the recommendation is not a send receipt.

`upstream_reviews` records low-frequency shared-spec and release review work outside the record schema. Each item names its source, positive `cadence_days`, and `reviewed_at`; overdue reviews fail with `OF-RECONCILIATION-UPSTREAM-REVIEW-DUE`. This is a maintenance queue, not a claim that an upstream specification changed.

The private runner owns collection, live HTTP retrieval, and GitHub artifact retention. Durable previous-result storage and independent notification transport remain unconfigured. The public shared checker only evaluates supplied evidence. Its daily schedule remains in EveryAILaw because that private repository can read the complete legal graph.

When a collector compares a complete declared artifact set, byte equality may establish `deployed.equivalent_source_commit` with `identity: byte_equivalent_to_checked_out_source`. Keep `deployed.source_commit` null unless independently attested by the deployment. The evaluator accepts this explicit equivalence mode only when the complete artifact hash and exact-edge digest also match. An index with counts and filenames alone cannot establish deployed record equivalence.

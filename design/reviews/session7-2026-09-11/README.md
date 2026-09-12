# Session 7 isolated projection validation

The retained EveryAILaw event baseline requires exact committed source objects during a build. Federation previously copied source files into a directory without Git history, so that legitimate validator failed. The projection checker now creates a private local shared clone without checking out files, then overlays tracked and new unignored working-tree inputs while excluding the projection under review. It can read pinned objects through Git alternates, while its index and refs remain private to the temporary clone. The temporary clone is removed after the check; the owning source object store must remain available during validation.

The direct-execution guard now resolves a CLI symlink before comparing module identity. Previously, invoking this checker through a symlink could exit successfully without running its checks. The Session 7 coordinator rejected that preliminary federation result and reran with a real worktree.

Regression coverage checks pinned historical source reads, no seeded projection, preservation of the original index and refs even when the fixture builder writes its private Git state, stale and orphaned output rejection, and actual CLI execution through a symlink. The focused semantic suite and full repository suite pass. Accepted federation records fresh projections for EveryAILaw (605 artifacts), PubLedge (137) and AI Incident Law (340), 1,061 validated records, 66 resolved cross-host anchors and three bounded consumer journeys.

Scope is local validation integration only. No schema or release-pinned artifact changed; no release, push, merge or deployment occurred. The cross-repository candidate receipt and logs are retained in `/Users/snap/Git/every-ai-law/.verification-reports/session7-2026-09-11/`.

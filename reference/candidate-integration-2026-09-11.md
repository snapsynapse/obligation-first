# Candidate integration preparation, 2026-09-11

Session 1 prepares correction branches and draft PRs. Main merges, deployment, release packaging, paid providers and dispatch remain held.

## Checker review

The reviewed 34efddc repair rejects an explicit relationship-migration comparison against the owner HEAD and adds the bounded sunset/operative diagnostic. Existing tests cover malformed/unavailable/self bases and partial/same-day/unknown temporal states. The stray tests/verification-workflow.test.js belonged to AI Tool Watch, whose tracked test supersedes its scenarios; the redundant local copy was removed after inspection, with a temporary recovery copy outside the repository.

## Comparison-base contract

The shared resolver validates a full lowercase SHA, its presence in the owner repository, inequality to owner HEAD and ancestry of HEAD. PR validation selects the PR base; push validation selects the before commit. Manual validation requires an explicit comparison_base input and rejects an omitted, self, unavailable or divergent base.

Scheduled and publication-triggered observations replay the checked-out owner's first-parent transition. Moving sibling mains use their own first parents, never another repository's event SHA or untrusted dispatch payload. This is a bounded audit of the latest committed transition, not historical source certification. A root commit has no such transition and fails closed.

CI federation requires OF_ADMISSION_BASES to identify a JSON file containing exactly every-ai-law, publedge and ai-incident-law, each mapped to its own full comparison SHA. Every source-admission and relationship-fingerprint invocation receives that owner's base. Local calls without the file retain the existing working-tree mode and are not committed-diff acceptance.

Candidate integration uses explicitly reviewed owner main-base SHAs and exact candidate commits. EveryAILaw owns private candidate CI and the final tuple receipt. The production federation workflow continues checking moving sibling mains and remains blocked until coordinated delivery; candidate success does not replace that gate.

## Remaining decisions

OF issues 4 and 6 retain source-history/production-semantic criteria; issue 7 has prepared reconciliation evidence but no external action in this session. The w3id contribution remains prepared, unfiled and unaccepted. Release-pinned wording corrections wait for authorized packaging. GuideCheck profile retention remains the recorded INTENT exception.

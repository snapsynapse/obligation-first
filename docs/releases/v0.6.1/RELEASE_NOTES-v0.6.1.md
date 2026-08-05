# Obligation-First v0.6.1 Release Notes

Release date: 2026-08-04

## Summary

Corrects release-state drift left after v0.6.0 and adds a deterministic gate so a packaged release cannot continue to describe its current contract as a local candidate or pending publication. The patch aligns the human, agent-facing, reviewer, and semantic-decision surfaces with the already-published v0.6 adopter federation.

## Fixed

- Reconciles the homepage, README, namespace page, LLM context files, protocol, roadmap, review packet, and migration fixture with the released v0.6 contract.
- Records the five v0.6 semantic decisions as implemented in v0.6.0, with their present contract impact stated explicitly.
- Narrows version synchronization so version bumps do not regenerate stale candidate or publication-state prose.

## Drift prevention

- Adds `npm run validate:release-state`, activated whenever the current package version has a release manifest.
- Rejects stale current-surface claims such as local candidate, locally validated, and pending publication language.
- Requires decisions targeted at an already-packaged version to be implemented or superseded while permitting accepted directions for future versions.
- Adds regressions for case and whitespace evasions, packaged-version decision drift, future-version decisions, and safe module import.

## Compatibility

There are no schema shape, context mapping, vocabulary, identifier, migration, or adopter projection changes. Every v0.6.0 adopter remains compatible, and existing `obligation-first >=0.6.0 <0.7.0` naming-profile ranges accept this patch. No adopter republish is required.

## Verification

- Full repository gate: `npm test`
- Packaged release-state gate: `npm run validate:release-state`
- Federation verification: 993 records across EveryAILaw, PubLedge, and AI Incident Law; 61 resolved cross-repo anchors; 0 unresolved anchors
- Release manifest and SHA-256 checksum validation

Immutable prior release packages remain unchanged.

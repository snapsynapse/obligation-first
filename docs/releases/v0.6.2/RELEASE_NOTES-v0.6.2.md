# Obligation-First v0.6.2 Release Notes

Release date: 2026-08-04

## Summary

Hardens the v0.6 conformance contract with machine-stable graph diagnostics, JSON-LD semantic round trips, identifier continuity across releases, and marker-managed version metadata. This patch changes verification behavior only. It does not change the vocabulary, JSON Schema shapes, JSON-LD mappings, IRIs, legal semantics, or adopter projections.

## Conformance hardening

- Adds stable `OF-GRAPH-*` codes for all 24 shared graph rules while preserving human-readable diagnostic text.
- Exercises every graph rule with paired valid and invalid mutations through the shared, example, and adopter validator paths.
- Expands and compacts JSON-LD using a local allowlisted context loader, verifies exact full IRIs, accepts inline adopter extensions, rejects remote contexts and core-term remapping, and detects semantic round-trip drift.
- Checks identifier continuity independently of structural fingerprints. Active identifiers must remain active, become reviewed Tombstones, or have an explicit reviewed retirement with valid replacement handling.
- Rejects duplicate current identifiers, active and Tombstone records sharing one `@id`, Tombstone disappearance or reactivation, and unreviewed type drift.

## Federation and release controls

- Adds adopter-owned continuity baselines for 585 EveryAILaw, 130 PubLedge, and 278 AI Incident Law identifiers.
- Extends federation verification to round-trip all 993 adopter JSON-LD records and check all 993 identifiers alongside the existing 61 cross-repository anchors.
- Replaces wording-sensitive version substitutions with explicit managed markers and structural JSON metadata.
- Rejects missing or duplicate version markers and unmanaged stale current-version claims, with regressions covering wording changes and large managed lines.

## Dependency security

- Adds the `jsonld` processor used by the conformance checks.
- Refreshes the lockfile with the nonbreaking transitive `fast-uri` security update; `npm audit` reports no known vulnerabilities for the candidate tree.

## Compatibility

Existing v0.6 adopter records remain compatible, and existing `obligation-first >=0.6.0 <0.7.0` naming-profile ranges accept this patch. Immutable prior release packages remain unchanged.

## Verification

- Full repository gate: `npm test`
- Federation gate: `npm run verify:federation`
- Adopter canonical gates: `npm run verify:ci` in EveryAILaw, PubLedge, and AI Incident Law
- Package and dependency checks: release manifest validation, SHA-256 validation, tarball content and dependency-install smoke, and `npm audit`

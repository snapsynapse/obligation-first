# Obligation-First v0.6.7 Release Notes
Release date: 2026-11-08
## Summary
Package the retained dependency security fix against current main with fresh v0.6.7 checksums. Historical release directories remain unchanged.
## What changed
- Update transitive fast-uri from 3.1.5 to 3.1.9 and Undici from 6.28.1 to 6.29.1, carrying the exact lockfile repair from security commit 38fb5a7.
- Synchronize the package version, managed discovery surfaces and operational implementation-status date, then generate a new reference manifest and checksum index.
- Retain current main's previously merged lifecycle checks and consumer-provenance expectations. Operational checker source remains repository tooling; the reference manifest is not a complete checker-source inventory.
## Compatibility
The v0.6 JSON Schema shapes, JSON-LD term mappings, canonical IRIs, worked-example records and adopter naming ranges are unchanged. The context comment changes only its version metadata. Dependency entries and release metadata change; no new source admission, legal interpretation, human attestation or verification-date renewal follows.
## Verification and delivery
The PR must pass the full repository suite, staged publication hygiene and independent simplicity review before merge. Clean-consumer validation uses dependency installation with audit uploads disabled. Exact-head CI and automatic Pages deployment are observed separately from local preparation. Dependency inventory audit submission is not part of this change, and no zero-vulnerability claim is made.
The versioned reference package is prepared for the authorized PR and main merge. An annotated tag and GitHub Release require a separate publication step; this package's existence does not establish either action. Historical release manifests retain their original hashes.

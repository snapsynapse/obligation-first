# Obligation-First v0.6.3 Release Notes

Release date: 2026-08-04

## Summary

This patch repairs public and agent-facing discovery surfaces and adds deterministic link, feed, sitemap, guide-scope, and repository-documentation drift gates. It does not change the v0.6 semantic contract.

## What changed

- Replaced broken worked-example directory links with concrete representative JSON records.
- Completed sitemap coverage and reconciled current-surface modification dates.
- Replaced placeholder historical feed summaries with final descriptions.
- Updated the assistant guide, its integrity manifest, and its published mirror for the v0.6 release line.
- Reconciled stale version and freeze-gate claims in agent-facing repository documentation.
- Clarified the static agent-service boundary: Obligation-First publishes discovery and validation contracts, not an MCP server.
- Added regression checks for internal HTML links, feed placeholders, sitemap coverage and dates, assistant-guide applicability, and managed documentation versions.

## Compatibility

There are no schema shape, vocabulary, JSON-LD context mapping, IRI, legal semantic, migration, or adopter projection changes. v0.6 adopter records retain native v0.6 conformance after schema-and-graph validation. Legacy v0.5 records remain schema-valid during the v0.6 migration window and must migrate for v0.6 conformance. The IRI major remains v1.

## Verification

Literal
```bash
npm test
npm run validate:release-state
npm run verify:federation
npm run report:anchors:implementations
git diff --check
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

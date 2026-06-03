# Obligation-First v0.3.1 Release Notes

Release date: 2026-06-02

## Summary

v0.3.1 makes every user-facing, agent-facing, and documentation surface reflect the v0.3 `@id`-federation model, and realigns all four worked examples to it. The `-draft` suffix is dropped from this release forward; versions are plain SemVer (major version zero already signals pre-1.0 instability).

## What changed

- All 49 worked-example records realigned: neutral, opaque, suffixless `@id` under `https://obligationfirst.org/v1/examples/<slug>/...`; jurisdiction as a typed ISO 3166 field, never in a slug; real-world identity carried by crosswalks (`sameAs`, `eli_uri`, `neutral_citation`, `akn_uri`).
- Decisions #18, #19, and crosswalk-field scope resolved (neutral example namespace, suffixless canonical `@id`, crosswalk terms added to the JSON-LD context).
- The three binding handoffs reconciled to live adopter data; the ELI/ECLI and Akoma Ntoso crosswalk docs corrected to show standard identifiers as crosswalk fields rather than `@id` values.
- Conformance tables and concept inventories (index.html, llms-full.txt, llms.txt, agents.json) updated to the redefined Level 2 / Level 3 and the federation concepts.
- NOTICE corrected: examples no longer bear adopter-host `@id` values.
- Version tooling: a single source of truth (`package.json`) syncs all surfaces, with a drift check wired into `npm test`.

## Compatibility

No `of:` vocabulary or schema change; crosswalk fields are additive. v0.1/v0.2 adopter records remain valid.

## Verification

```bash
npm test
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

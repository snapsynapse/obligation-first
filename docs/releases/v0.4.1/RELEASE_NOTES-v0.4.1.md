# Obligation-First v0.4.1 Release Notes

Release date: 2026-06-09

## Summary

v0.4.1 is a documentation-consistency patch produced by an external semantic review of the full repo (spec, schemas, context, crosswalks, worked examples, vendored gist). It fixes every low-risk inconsistency the review found. The substantive findings (gist binding gaps, predicate overloading, identity semantics, party modeling) are deliberately NOT resolved in a patch; they are catalogued with suggested mitigations in an internal review handoff (2026-06-09) for decision-by-decision treatment, and will surface as decision records and ROADMAP items.

## What changed

- README license note reconciled with NOTICE: example records reproduce no EveryAILaw corpus content; adopter IRIs appear only as crosswalk citations (true since v0.3.1, README had drifted).
- Phantom `gist:Court` removed from `schema/authority.schema.json` annotation examples and `reference/crosswalks/gist.md`; gist 14.1.0 defines no Court class. Annotation-only.
- Schema count corrected across README and PROTOCOL: seven per-entity schemas plus `executable-encoding` and `naming-profile` (nine published). README endpoint table gains the naming-profile row.
- PROTOCOL core principle 3 corrected to future tense: the w3id.org redirect is planned, not live; `https://obligationfirst.org/v1/` is the only CI-verified resolution target today.
- Version-narrative drift fixed: README freeze wording now points at ROADMAP gates; binding-validity wording updated through v0.4; PROTOCOL conformance lead is version-neutral.
- Colorado worked example: SB26-189 `issuedBy` corrected from the advisory AI Policy Work Group to the Colorado General Assembly; the work group's dangling executive-order reference is now explicitly flagged as a teaching construct in the example README.

## Compatibility

No `of:` vocabulary change. No validation-relevant schema change (the authority schema change is in non-validating `examples`/`description` annotations). v0.1 through v0.4.0 adopter records remain valid without migration.

## Verification

```bash
npm test
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

# Obligation-First v0.2.2-draft Release Notes

Release date: 2026-05-30

## Summary

v0.2.2-draft is a security hardening release for the v0.2 draft line. It tightens graph validation, makes release and content integrity checks executable, and adds focused hardening regressions for the confirmed administrative Determination bypass and related false-positive controls.

## Security hardening

- Shared graph validation now rejects `of:Determination` records with `disposition: issued` unless they cite a `target_instrument` or at least one `anchors` target.
- Worked-example graph validation and adopter graph validation now use the same implementation.
- CI runs the full local contract suite with `npm test`.
- Release package hashes, GuideCheck assistant-guide byte identity, and canonical content hashes are enforced locally.
- `MANIFEST.yaml` now hashes the documented canonical content set.

## Compatibility

No schema vocabulary or adopter-record migration is required. The behavior change is stricter validation for administrative Determinations that were previously accepted without an instrument target or anchor.

## Verification

Before release, run:

```bash
npm test
npm run test:hardening
git diff --check
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

## Residual risks

- Two worked-example anchors remain unresolved external references by design; `report:anchors --require-all-targets` remains available for stricter cross-repository checks.
- Live endpoint verification runs through the existing post-deploy CI probe after `main` deploys.

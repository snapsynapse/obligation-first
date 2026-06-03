# Obligation-First v0.4.0 Release Notes

Release date: 2026-06-03

## Summary

v0.4.0 defines the naming-profile format. The `.well-known` naming profile was announced in v0.3 as a Level 2 requirement but specified only in prose — no path, no schema, no validator, so no adopter could satisfy it in a checkable way. This release makes it a concrete, validatable standard and closes one of the v0.3 freeze gates.

## What changed

- **`schema/naming-profile.schema.json`** (mirrored to `docs/v1/schema/`): a JSON-LD `of:NamingProfile` document declaring, per entity type, the VoID `void:uriSpace` / `void:uriRegexPattern`, an RFC 6570 `uriTemplate`, and the `crosswalks` the adopter supplies.
- **Canonical location and media type:** the profile is served at `/.well-known/obligation-first-naming-profile.jsonld` as `application/ld+json`; a flat `key: value` provenance sidecar (`profile-sha256` / `profile-bytes`) is served at `/.well-known/obligation-first-naming-profile-manifest.txt` as `text/plain`. The body stays structured RDF-native data so it rides the existing schema validator; the `.txt` is reserved for the human-reviewable hashed sidecar — the same split GuideCheck uses.
- **Worked profile** under `examples/naming-profiles/`, modelled on EveryAILaw's actual live IRI scheme.
- **`scripts/validate-naming-profile.mjs`** wired into `npm test`: schema compiles, profiles validate, each regex anchors and agrees with its template, each sidecar hash matches.
- **Context + spec:** `schema/context.jsonld` gains the `void` prefix and the profile terms; `PROTOCOL.md` "Naming profile" section is now normative (RFC 2119).
- **ROADMAP:** decision #19 (`.json` suffix) resolved — recorded descriptively per-adopter in `void:uriRegexPattern`, not mandated; #17 (identity-fidelity enforcement) advanced.

## Compatibility

No `of:` vocabulary or record-schema change. The naming-profile artifact is additive. v0.1/v0.2/v0.3 adopter records remain valid without migration.

## Verification

```bash
npm test
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

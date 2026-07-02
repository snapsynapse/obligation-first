# Obligation-First v0.4.2 Release Notes

Release date: 2026-07-01

## Summary

v0.4.2 is a correctness patch from a full multi-agent code review of the repository — schemas, validators, worked examples, publishing surfaces, and CI. It closes three high-severity defects: shipped records could not be processed as JSON-LD (the mandated `@context` served HTML), the advertised release-package URLs returned 404, and the adopter-kit validators reported success on missing or empty record directories. It also lands the schema declarations for fields the spec defined in prose but never validated, and reconciles the hand-maintained publishing surfaces (feeds, sitemap, `docs/v1/index.html`) that had drifted from the generated ones.

## What changed

- Record `@context` corrected from `https://obligationfirst.org/v1/` to `https://obligationfirst.org/v1/context.jsonld` across all 49 examples, the worked naming profile, PROTOCOL Level 1 conformance, and the reference binding note.
- Release `index.html` pages restored (v0.3.0-draft through v0.4.2) so the release-package URLs resolve; `make-release` now emits them and updates `feed.xml`/`atom.xml`/`sitemap.xml` for every future release.
- Adopter-kit and example/graph validators now fail hard on a missing or zero-record directory; path-traversal guard added on `record.id` in the writer path.
- `rebuts`, `undercuts`, `violationOf`, `jurisdiction`, `sameAs`, `exactMatch`, `neutral_citation`, `urn_lex`, and `notes` are now declared and shape-validated; `executableEncoding` accepts a single object or a non-empty array.
- Determination `if/then`: adjudicative dispositions (everything except `issued`) require non-empty `decides`.
- Phantom `gist:Court` purged from the actual records and binding notes (→ `gist:GovernmentOrganization`); Utah JIA instrument status `proposed` → `in-force`.
- New publishing-drift guards in `validate-repo-contracts.mjs`; CI Pages deploy gated on the test suite; post-deploy probe polls for the live version and covers the naming-profile schema, context, and release URLs; workflow actions pinned to commit SHAs.

## Compatibility

Adopter records MUST update their `@context` to `https://obligationfirst.org/v1/context.jsonld`; the bare `/v1/` form never resolved as JSON-LD. All new schema fields are optional and `executableEncoding` is widened, so records already using the correct context remain valid. The Determination constraint codifies a rule PROTOCOL already stated as mandatory. No `of:` vocabulary change; IRI major version unchanged. Releases v0.4.0 and v0.4.1 are now git-tagged so their manifests verify.

## Verification

```bash
npm test
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

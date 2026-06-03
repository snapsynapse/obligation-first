# Obligation-First v0.3.0-draft Release Notes

Release date: 2026-06-02

## Summary

v0.3.0-draft federates record identity and binds cross-adopter interoperability to standard identifier crosswalks. It is additive and non-breaking to v0.1 and v0.2 adopter records.

## `@id` federation and identifier crosswalks

- Record `@id` values are adopter-local, opaque, and permanent. An `@id` identifies the adopter's record about a legal entity, not the entity's canonical external identifier. Renames are preserved via HTTP 301 ("Cool URIs Don't Change"), so a namespace reorganization is not a breaking change.
- External standard identifiers (ELI, ECLI, Akoma Ntoso, urn:lex, Wikidata) ride as typed crosswalk properties, never as the `@id`. Cross-adopter joins key on crosswalks, not slugs.
- Each adopter publishes a `.well-known` naming profile (VoID `uriSpace` / `uriRegexPattern` plus an RFC 6570 URI Template and a declared list of supplied crosswalks). The profile is adopter-owned; Obligation-First consumes and validates against it rather than prescribing slug grammar.
- Jurisdiction is a typed ISO 3166 field, never a slug component.
- A recommended identifier crosswalk matrix is added per entity type, with Wikidata at SHOULD for authorities and urn:lex at MAY for instruments.
- This reverses the earlier guidance that a Term's `@id` should be the standard source-text IRI. No live adopter ever did this; the spec is corrected to match practice.

Full decision record: `reference/iri-naming-and-crosswalks.md`.

## Conformance level changes

- Level 2 additionally requires a published `.well-known` naming profile and `jurisdiction` as an ISO 3166 code. This tightens Level 2 going forward; it is a pre-freeze conformance change, not a record-validation break, since `additionalProperties` already admits the crosswalk fields.
- Level 3 is redefined: every crosswalk the adopter's naming profile declares is present on every applicable record, with the matrix as the recommended baseline.

## Also in this release

- EU AI Act Article 50 worked example completed: expanded from 7 to 26 records covering all of Article 50, recitals 132 to 136, the Commission transparency Guidelines, and the forthcoming Code of Practice.

## Compatibility

No schema vocabulary or adopter-record migration is required. The `of:` class set is unchanged from v0.1. The crosswalk fields are optional at the JSON-Schema layer; the matrix governs Level 3 conformance, and the new Level 2 naming-profile and jurisdiction requirements are a pre-freeze conformance tightening.

## Verification

Before release, run:

```bash
npm test
npm run test:hardening
git diff --check
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

## Residual work

- Schema and `context.jsonld` crosswalk fields, the `.well-known` profile format and its schema, the conformance validator, binding-handoff reconciliation, and worked-example realignment are tracked as follow-on rounds (ROADMAP deferred decisions #17 to #20).
- Two worked-example anchors remain unresolved external references by design.

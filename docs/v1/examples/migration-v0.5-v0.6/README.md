# v0.5 to v0.6 migration fixture

This paired fixture is the executable compatibility contract for the released v0.6 line. `input/` contains valid legacy shapes and `output/` contains their deterministic v0.6 projections.

The migration automates only transformations whose meaning is unambiguous:

- embedded `gist:Jurisdiction` plus `ref` to `of:Jurisdiction` plus `territorial_scope`
- Proceeding `issuedBy` to `heardBy`
- explicitly marked editorial Term `text` to `summary`
- Obligation-to-Category `exactMatch` to `isCategorizedBy`
- removal of the duplicate `implemented_by_terms` alias
- explicitly deprecated EveryAILaw compatibility records to Tombstones

The migration does not infer facts that require source review. It does not guess issuer roles, authority bases, deontic operators, actor identity, normative force, lifecycle state, source-text fidelity, or whether an existing `sameAs` assertion is genuine OWL identity.

Literal
```bash
node scripts/migrate-v0.5-to-v0.6.mjs INPUT.json OUTPUT.json
```
`INPUT.json` may be a record array or an object with a `records` array. Review the generated output against source evidence before publishing it.

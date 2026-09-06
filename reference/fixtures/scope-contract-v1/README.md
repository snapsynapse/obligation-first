# Scope contract synthetic fixtures

These fixtures are original illustrative data under this repository's CC BY 4.0 license. Every record IRI uses example.com. The named ISO/OECD institutions exercise identity substitution; no actual standard text, legal duty or restricted adopter record is reproduced.

`records.json` covers ISO issuance, distinct administration, missing scope, territorial sets, a local Jurisdiction reference and legacy `gist:Jurisdiction.ref`. `inventory.json` supplies explicit recognition and one synthetic uncovered scope. `baseline.json` is the reviewed expected scope oracle, checked in independently of the evaluator's runtime. Tests must not regenerate it as setup.

Run through `npm run test:hardening`. Baseline changes require a semantic reason and review of exact identity/path/value changes.

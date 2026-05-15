# Contributing to Obligation-First

Obligation-First is drafting in public. Contributions are welcome.

## What we want

- **Adopter feedback.** If you bind an existing dataset to v0.1 and something doesn't fit, file an issue. Adopter pain is the strongest design signal.
- **Crosswalk improvements.** If a mapping in `reference/crosswalks/` is wrong or incomplete, send a PR.
- **Worked examples.** New examples in `examples/` that exercise edge cases are welcome.
- **Standards review.** If you work on Akoma Ntoso, LegalRuleML, ELI, ECLI, gist, Catala, Blawx, or any adjacent standard and notice we've misrepresented your work, please correct us.

## What we don't want

- Speculative additions to the spine. The four-role spine is small on purpose.
- New deontic operators beyond the LegalRuleML quartet. If you need a fifth, the bar is high.
- Scope expansion beyond the three target domains (statutes, proceedings, joint interpretations).

## How to contribute

1. **Open an issue first** for anything beyond a typo. Discussion before code.
2. For spec changes: PR against `PROTOCOL.md` with a CHANGELOG entry.
3. For schema changes: PR against `schema/context.jsonld` and the relevant `schema/*.schema.json`.
4. For crosswalks or examples: PR with the new file and a short rationale.

## Example records and restricted source data

Examples may reference real laws, but example records must not silently
import another project's restricted data under this repo's open licenses.

- Do not add a record bearing `https://everyailaw.com/` identifiers (or any
  other restricted-corpus identifier) to `examples/` unless it is covered by
  the carve in `NOTICE`, and the carve plus the README License exception are
  updated to name what was added.
- The carve is per-record and by express permission. Adding new restricted
  records without updating `NOTICE` is not allowed, because the repo's
  Apache-2.0 / CC-BY-4.0 grant would otherwise sweep them in.
- Prefer a neutral example namespace or synthetic records. Use a restricted
  identifier only when the worked example genuinely requires the real one,
  and then carve it explicitly.
- A PR that adds or changes `examples/` must state whether it touches any
  restricted identifiers and, if so, show the matching `NOTICE` update.

## License

By contributing, you agree that:

- Spec text and reference material is licensed CC-BY-4.0
- Code, schemas, and scripts are licensed Apache-2.0

## Governance

Stewarded by PAICE.work PBC. Material changes after v0.1 freeze require a 14-day comment window if any external adopter has bound to the schema. See [INTENT.md](INTENT.md) for full governance posture.

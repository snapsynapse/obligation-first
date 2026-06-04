# Obligation-First — agent instructions

## Build pipeline

**`docs/index.html` is hand-edited.** No script writes it. Safe to edit directly. The repo's MANIFEST.yaml does not hash `docs/index.html`.

Generated and validated files:

- `docs/v1/context.jsonld` — copied from `schema/context.jsonld` by CI. Edit `schema/context.jsonld`, then CI mirrors.
- `docs/v1/schema/*.schema.json` — copied from `schema/*.schema.json` by CI. Edit `schema/*`, then CI mirrors.
- `docs/releases/v*/` — release-package manifests. Generated; do NOT hand-edit.
- Version strings across multiple files — `scripts/sync-version.mjs` is the single source of truth (reads `package.json` `version`). Run `node scripts/sync-version.mjs` after bumping the package version; `--check` mode verifies drift.
- Content hashes — tracked in `MANIFEST.yaml` for select files (NOT `docs/index.html`). `npm run validate:hashes` checks them; `npm run hashes:update` updates them after intentional content changes.

Validators that must pass before commit:

```bash
npm run validate              # validate-examples (every JSON record vs schema)
npm run validate:contracts    # URL conventions, JSON-LD context coverage, endpoint inventory
npm run validate:published    # docs/ mirror matches schema/ and examples/
npm run validate:hashes       # MANIFEST.yaml hash drift check
npm test                      # all of the above + adopter-kit + hardening + anchor reports
```

When editing `docs/index.html` (hand-edited but contract-validated): also run `npm run validate:contracts` to ensure URL conventions and endpoint inventory still match.

## Cross-portfolio context

Obligation-First is the shared upper schema for the PAICE legal graph. Adopters: EveryAILaw, PubLedge, AI Incident Law. Portfolio canon at https://paice.foundation/ (`~/Git/paice-foundation/INTENT.md`).

# Adopter kit

The adopter kit is the reusable path from a project-local model to Obligation-First v0.1 records. It exists because the EveryAILaw binding surfaced a repeatable pattern that PubLedge and AI Incident Law should not have to rediscover.

Status: v0.1-draft helper. Not a separately published npm package yet.

## What it provides

- `scripts/lib/adopter-kit.mjs`: shared helpers for loading records, validating schemas, validating local graph links, and writing aggregate JSON bundles.
- `scripts/validate-adopter-records.mjs`: CLI validator for one or more record directories.
- `npm run validate:adopter-kit`: smoke test that runs the kit against the three Obligation-First worked examples.

## Validator use

From this repo:

```bash
node scripts/validate-adopter-records.mjs examples/publedge-jia-utah-72/records
```

From an adopter repo with this repo checked out as a sibling:

```bash
node ../obligation-first/scripts/validate-adopter-records.mjs data/examples/records
```

The validator checks two layers:

1. JSON Schema conformance for each record's `@type`.
2. Local graph coherence for links that should resolve inside the same record set.

External `anchors` are allowed to point outside the local record set. This is intentional: under the v0.3 federation model, cross-adopter links are typed crosswalks (`anchors` / `sameAs`) that target the other adopter's real published IRI — the actual `@id` resolved from that adopter's live export or its `.well-known` naming profile. A PubLedge anchor points at EveryAILaw's real published Term, Obligation, or ObligationCategory `@id`, and an AI Incident Law Determination does the same. The join keys on those real IRIs and on shared standard identifiers, never on a slug guessed from a naming convention.

## Naming profile

To reach Level 2, an adopter publishes a naming profile declaring the IRI scheme it actually mints. Format and serving requirements are normative in [PROTOCOL.md](../PROTOCOL.md) ("Naming profiles and identifier crosswalks"); this is the practical path.

1. Copy [`examples/naming-profiles/everyailaw.jsonld`](../examples/naming-profiles/everyailaw.jsonld) as a starting point. Keep `@type: of:NamingProfile` and `@context: https://obligationfirst.org/v1/context.jsonld`.
2. For each entity type you publish, set `void:uriSpace`, a `void:uriRegexPattern` that matches your live `@id` values exactly (including any `.json` suffix you actually serve), the `uriTemplate`, and the `crosswalks` you supply. Declare only the entity types you mint — omit the rest.
3. Validate it: `node ../obligation-first/scripts/validate-naming-profile.mjs` after dropping your profile into `examples/naming-profiles/`, or compile it against [`schema/naming-profile.schema.json`](../schema/naming-profile.schema.json) in your own pipeline.
4. Generate the provenance sidecar (`*-manifest.txt`): `profile-sha256` is the SHA-256 of the profile bytes, `profile-bytes` its byte length. The validator fails if either drifts.
5. Serve the profile at `/.well-known/obligation-first-naming-profile.jsonld` (`application/ld+json`) and the sidecar at `/.well-known/obligation-first-naming-profile-manifest.txt` (`text/plain`), and reference the profile from your `agents.json` and `llms.txt`.

The profile is descriptive, not aspirational. Record what you mint today; the spec's suffixless-canonical recommendation is a target you can migrate toward later without re-issuing the profile as a breaking change.

## Anchor graph report

Use `scripts/report-anchor-graph.mjs` when the question is no longer "does one adopter validate?" but "are multiple adopters forming the intended graph?"

```bash
npm run report:anchors:implementations
```

The report accepts either flat `records/` directories or aggregate export directories containing `index.json` plus kind files such as `obligations.json` and `determinations.json`. It summarizes `anchors` by source and target host, distinguishes records that omit `anchors` from records that publish an empty `anchors: []`, validates anchor target type when the target record is present, and lists unresolved external anchors for enrichment work.

By default unresolved targets are reported but do not fail the command, because real adopter graphs often point to records that live in another repo or have not been mirrored locally yet. Add `--require-all-targets` when running against a complete local mirror and every anchor should resolve.

`npm run report:anchors:implementations` is intentionally not part of `npm test`; it assumes local sibling checkouts of EveryAILaw, PubLedge, and AI Incident Law.

The report measures anchor enrichment only. It does not determine whether an adopter has completed its base Obligation-First export; a repo can publish valid Proceedings, Allegations, and Determinations before it has enough curated obligation targets to populate `Determination.anchors`.

This is the current cross-project enrichment loop:

1. Export each adopter's Obligation-First records.
2. Run the anchor graph report across all available adopter exports.
3. Add missing `anchors` where a Determination, Term, or Obligation has a supported statutory, category, or joint-interpretation target.
4. Re-run the report and commit the adopter-side export.

## Bundle writer

Adopters can import `writeAdopterExport` to publish the three surfaces that EveryAILaw and PubLedge now need:

```js
import { writeAdopterExport } from "../obligation-first/scripts/lib/adopter-kit.mjs";

await writeAdopterExport({
  apiDir: "docs/api/v1/of",
  docsDir: "docs",
  recordsByKind: {
    authorities,
    instruments,
    terms,
    obligations,
    determinations,
  },
});
```

This writes:

1. one aggregate per kind plus `index.json` with file names and counts;
2. a validator-ready `records/` directory containing every record by local `id`;
3. optional companion JSON records at canonical path families such as `/authority/{id}.json`, `/instrument/{id}.json`, `/term/{id}.json`, `/obligation/{id}.json`, and `/determination/{id}.json`.

`writeAdopterExport` cleans the generated output directories by default. That matters when an adopter changes export strategy, because stale generated records can otherwise remain valid JSON while no longer being part of the intended graph.

For lower-level integrations, the kit also exports:

- `writeRecordBundle`, for aggregate files only;
- `writeRecordFiles`, for a flat validator-ready record directory;
- `writeCompanionRecords`, for canonical companion JSON files.
- `validateAdopterExport`, for checking aggregate counts, flat record parity, companion record parity, and stale generated JSON files.

`validateAdopterExport` is an export-shape check, not a project semantics check. Pair it with local evals that know the adopter's source model. For AI Incident Law, that means checking that every `included` record produces a Proceeding and Allegation, that pending matters do not produce Determinations, and that `review` / `global` queue records are not exported.

## PubLedge path

For PubLedge, use the kit after generating these records:

- Authorities: `of:Authority`
- Instruments: `of:Instrument`
- Terms: `of:Term`
- Obligations: `of:Requirement`, `of:Restriction`, or `of:Permission`
- Issuance records: `of:Determination` with `disposition: issued`

The minimum first pass is:

1. Generate the record set into a local directory.
2. Run `node ../obligation-first/scripts/validate-adopter-records.mjs <records-dir>`.
3. Publish aggregate, flat record, and companion records with `writeAdopterExport`.
4. Add the same validator command to CI.

PubLedge exposed one important modeling rule: if a project has a shared native obligation that is implemented by multiple provisions or instruments, the Obligation-First export should usually emit one concrete obligation record per creating term. Keep the adopter's native shared identifier as source metadata, such as `publedge_primary_id`, and let each exported `of:Term.creates` point to an `of:Requirement`, `of:Restriction`, or `of:Permission` whose `created_by` points back to that same term.

That preserves the reciprocal OF graph while leaving the adopter's native model intact.

The kit does not decide PubLedge's native migration strategy. It only makes the conformance surface reusable.

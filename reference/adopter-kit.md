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

External `anchors` are allowed to point outside the local record set. This is intentional: PubLedge anchors should point to EveryAILaw IDs, and AI Incident Law Determinations should do the same.

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

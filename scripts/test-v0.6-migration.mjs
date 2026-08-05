#!/usr/bin/env node
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrateRecords } from "./migrate-v0.5-to-v0.6.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = path.join(root, "examples", "migration-v0.5-v0.6");

async function readRecords(dir) {
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(dir, file), "utf8"))));
}

const input = await readRecords(path.join(base, "input"));
const expected = await readRecords(path.join(base, "output"));
const inputBefore = JSON.stringify(input);
const actual = migrateRecords(input);

if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  console.error("v0.5 to v0.6 migration fixture mismatch");
  console.error(JSON.stringify({ expected, actual }, null, 2));
  process.exit(1);
}

assert.equal(JSON.stringify(input), inputBefore, "migration must not mutate its input records");
assert.deepEqual(migrateRecords(actual), actual, "migration must be idempotent on v0.6 output");
assert.deepEqual(migrateRecords(input), actual, "migration output must be deterministic");
assert.deepEqual(
  actual.map((record) => record["@id"]),
  input.map((record) => record["@id"]),
  "migration must preserve record order and identity",
);

const fixtureCoverage = {
  typed_jurisdiction: input.some((record) => record.jurisdiction?.["@type"] === "gist:Jurisdiction" && record.jurisdiction.ref),
  proceeding_forum: input.some((record) => record["@type"] === "of:Proceeding" && record.issuedBy),
  editorial_term_summary: input.some((record) => record["@type"] === "of:Term" && record.text_is_editorial === true),
  category_relation: input.some((record) => record.exactMatch),
  duplicate_term_relation: input.some((record) => record.implemented_by_terms),
  compatibility_tombstone: input.some((record) => record.everyailaw_replaced_by),
};
for (const [rule, covered] of Object.entries(fixtureCoverage)) {
  assert.ok(covered, `migration rule ${rule} needs a named input fixture`);
}

const ambiguous = [{
  "@context": "https://obligationfirst.org/v1/context.jsonld",
  "@type": "of:Term",
  "@id": "https://example.com/term/ambiguous",
  text: "Text whose source fidelity has not been classified.",
  notes: "The migrator must not invent legal force, deontic type, actors, or provenance.",
}];
assert.deepEqual(
  migrateRecords(ambiguous),
  ambiguous,
  "migration must leave judgment-dependent fields unchanged when no deterministic signal exists",
);

const temp = await mkdtemp(path.join(os.tmpdir(), "of-migration-properties-"));
try {
  const inputPath = path.join(temp, "input.json");
  const outputA = path.join(temp, "output-a.json");
  const outputB = path.join(temp, "output-b.json");
  await writeFile(inputPath, `${JSON.stringify(input, null, 2)}\n`);
  for (const outputPath of [outputA, outputB]) {
    const result = spawnSync(process.execPath, [path.join(root, "scripts/migrate-v0.5-to-v0.6.mjs"), inputPath, outputPath], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  assert.equal(
    await readFile(outputA, "utf8"),
    await readFile(outputB, "utf8"),
    "migration CLI output must be byte-identical across repeated runs",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}

console.log(`v0.5 to v0.6 migration fixture and property checks passed (${actual.length} records, ${Object.keys(fixtureCoverage).length} rules).`);

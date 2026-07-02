#!/usr/bin/env node
/**
 * Validate every JSON record under examples/*\/records/ against the
 * Obligation-First v0.1 JSON Schemas. Fails CI when records drift from
 * the schemas. Run via `npm run validate`.
 */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
// TYPE_TO_SCHEMA (the @type -> schema-file map; the obligation schema's
// deontic-quartet dispatch happens via its own `oneOf`, so all four obligation
// types map to the same schema file) and the AJV loader are shared with the
// adopter kit so the two cannot drift.
import { TYPE_TO_SCHEMA, loadSchemas } from "./lib/adopter-kit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const schemaDir = path.join(repoRoot, "schema");
const examplesDir = path.join(repoRoot, "examples");

const { ajv, schemaByFile: schemaById } = await loadSchemas(schemaDir);

async function* walkRecords(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkRecords(p);
    } else if (entry.name.endsWith(".json")) {
      yield p;
    }
  }
}

let total = 0;
let failed = 0;
const failures = [];

for await (const recordPath of walkRecords(examplesDir)) {
  const rel = path.relative(repoRoot, recordPath);
  let record;
  try {
    record = JSON.parse(await readFile(recordPath, "utf8"));
  } catch (err) {
    console.log(`✗ ${rel}: invalid JSON — ${err.message}`);
    failures.push(rel);
    failed++;
    total++;
    continue;
  }

  total++;
  const type = record["@type"];
  if (!type) {
    console.log(`✗ ${rel}: missing @type`);
    failures.push(rel);
    failed++;
    continue;
  }

  const schemaFile = TYPE_TO_SCHEMA[type];
  if (!schemaFile) {
    console.log(`✗ ${rel}: no schema mapped for @type=${type}`);
    failures.push(rel);
    failed++;
    continue;
  }

  const schemaId = schemaById[schemaFile];
  const validate = ajv.getSchema(schemaId);
  if (validate(record)) {
    console.log(`✓ ${rel}  (${type})`);
  } else {
    console.log(`✗ ${rel}  (${type}):`);
    for (const err of validate.errors) {
      console.log(`    ${err.instancePath || "/"}  ${err.message}`);
    }
    failures.push(rel);
    failed++;
  }
}

console.log(`\n${total - failed}/${total} valid`);
if (total === 0) {
  console.log("✗ no records found under examples/ — a validation run over 0 records is a failure, not a pass");
  process.exit(1);
}
process.exit(failed > 0 ? 1 : 0);

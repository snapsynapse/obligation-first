#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { loadRecordDir } from "./lib/adopter-kit.mjs";
import { validateJsonLdRecords } from "./lib/jsonld-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

async function discover() {
  const root = path.join(repoRoot, "examples");
  const dirs = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const records = path.join(root, entry.name, "records");
    try { await readdir(records); dirs.push(records); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return dirs.sort();
}

export async function validateJsonLdDirectories(dirs, { root = repoRoot } = {}) {
  const contextDocument = JSON.parse(await readFile(path.join(repoRoot, "schema/context.jsonld"), "utf8"));
  const results = [];
  for (const dir of dirs) {
    const recordsDir = path.resolve(process.cwd(), dir);
    const documents = await loadRecordDir(recordsDir, { root });
    // Adopter export roots also contain index and aggregate bundle documents.
    // Their embedded records are byte-for-byte represented by the @id-bearing
    // flat files, which are the conformance unit for round-trip validation.
    const entries = documents.filter((entry) => typeof entry.record["@id"] === "string");
    results.push({ recordsDir, count: entries.length, failures: await validateJsonLdRecords(entries, { contextDocument }) });
  }
  return results;
}

async function main() {
  const dirs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : await discover();
  const results = await validateJsonLdDirectories(dirs);
  let failed = 0;
  let total = 0;
  for (const result of results) {
    total += result.count;
    if (result.count === 0) result.failures.push({ code: "OF-JSONLD-EMPTY-RECORD-SET", message: "record directory contains 0 records" });
    if (result.failures.length === 0) {
      console.log(`✓ ${path.relative(repoRoot, result.recordsDir)} (${result.count} records)`);
      continue;
    }
    failed += result.failures.length;
    console.log(`✗ ${path.relative(repoRoot, result.recordsDir)} (${result.count} records)`);
    for (const failure of result.failures) console.log(`  [${failure.code}] ${failure.message}`);
  }
  console.log(`\n${total} JSON-LD record(s) expanded and round-tripped`);
  process.exit(failed > 0 ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

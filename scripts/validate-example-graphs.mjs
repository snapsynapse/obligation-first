#!/usr/bin/env node
/**
 * Validate semantic links inside each worked-example record set.
 *
 * JSON Schema catches record shape. This catches graph drift through the same
 * shared graph validator exposed to adopters.
 */

import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { loadRecordDir, validateRecordGraph } from "./lib/adopter-kit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const examplesDir = path.join(repoRoot, "examples");

export async function* walkRecordDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    const recordsDir = path.join(p, "records");
    try {
      await readdir(recordsDir);
      yield recordsDir;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}

export function validateExampleRecordSet(recordsDir, entries, { root = repoRoot } = {}) {
  return {
    rel: path.relative(root, recordsDir),
    failures: validateRecordGraph(entries),
    count: entries.length,
  };
}

export async function validateExampleGraphs({ root = repoRoot, examplesRoot = examplesDir } = {}) {
  const results = [];
  for await (const recordsDir of walkRecordDirs(examplesRoot)) {
    const entries = await loadRecordDir(recordsDir, { root });
    results.push(validateExampleRecordSet(recordsDir, entries, { root }));
  }
  return results;
}

async function main() {
  const results = await validateExampleGraphs();

  let failed = 0;
  for (const result of results) {
    if (result.failures.length === 0) {
      console.log(`✓ ${result.rel} (${result.count} records)`);
      continue;
    }

    failed++;
    console.log(`✗ ${result.rel}:`);
    for (const failure of result.failures) {
      console.log(`    ${failure}`);
    }
  }

  console.log(`\n${results.length - failed}/${results.length} record sets semantically valid`);
  process.exit(failed > 0 ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

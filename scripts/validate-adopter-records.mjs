#!/usr/bin/env node
/**
 * Validate one or more adopter record directories against the Obligation-First
 * v0.1 schemas and local graph rules.
 *
 * Usage:
 *   node scripts/validate-adopter-records.mjs path/to/records [path/to/other-records]
 *   node scripts/validate-adopter-records.mjs           # auto-discover examples/*\/records
 */

import { readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import {
  loadRecordDir,
  loadSchemas,
  validateRecordGraph,
  validateRecordShapes,
} from "./lib/adopter-kit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const schemaDir = path.join(repoRoot, "schema");

async function validatorIdentity() {
  const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  let commit = "unknown";
  let dirty = "unknown";
  try {
    commit = execFileSync("git", ["-C", repoRoot, "rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
    dirty = execFileSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" }).trim() ? "dirty" : "clean";
  } catch {
    // A source archive has a meaningful package version even without .git.
  }
  return { version: pkg.version, commit, dirty };
}

async function discoverExampleRecordDirs() {
  const examplesDir = path.join(repoRoot, "examples");
  const dirs = [];
  for (const entry of await readdir(examplesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const recordsDir = path.join(examplesDir, entry.name, "records");
      await readdir(recordsDir);
      dirs.push(recordsDir);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
  return dirs.sort();
}

export function validateAdopterRecordSet(entries, schemas) {
  return {
    shapeFailures: validateRecordShapes(entries, schemas),
    graphFailures: validateRecordGraph(entries),
  };
}

async function main() {
  const dirs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : await discoverExampleRecordDirs();

  if (dirs.length === 0) {
    console.error("No records directories found under examples/*/records/ and none given on the command line.");
    process.exit(1);
  }

  const schemas = await loadSchemas(schemaDir);
  const identity = await validatorIdentity();
  console.log(`Obligation-First validator v${identity.version} (${identity.commit}, ${identity.dirty})`);
  let total = 0;
  let failed = 0;

  for (const dirArg of dirs) {
    const recordsDir = path.resolve(process.cwd(), dirArg);
    let entries;
    try {
      entries = await loadRecordDir(recordsDir, { root: repoRoot });
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      console.log(`✗ ${path.relative(repoRoot, recordsDir)}: records directory does not exist`);
      failed += 1;
      continue;
    }
    if (entries.length === 0) {
      console.log(`✗ ${path.relative(repoRoot, recordsDir)}: contains 0 records`);
      failed += 1;
      continue;
    }
    total += entries.length;

    const { shapeFailures, graphFailures } = validateAdopterRecordSet(entries, schemas);

    if (shapeFailures.length === 0 && graphFailures.length === 0) {
      console.log(`✓ ${path.relative(repoRoot, recordsDir)} (${entries.length} records)`);
      continue;
    }

    failed += shapeFailures.length + graphFailures.length;
    console.log(`✗ ${path.relative(repoRoot, recordsDir)} (${entries.length} records)`);

    for (const failure of shapeFailures) {
      console.log(`  ${failure.entry.rel}: ${failure.message}`);
      for (const err of failure.errors) {
        console.log(`    ${err.instancePath || "/"} ${err.message}`);
      }
    }

    for (const failure of graphFailures) {
      console.log(`  ${failure}`);
    }
  }

  console.log(`\n${total} record(s) checked`);
  process.exit(failed > 0 ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

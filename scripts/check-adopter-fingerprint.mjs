#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildAdopterFingerprint,
  fingerprintDifferences,
  stableFingerprintJson,
} from "./lib/adopter-fingerprint.mjs";

function parseArgs(argv) {
  const options = { write: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write") {
      options.write = true;
      continue;
    }
    const key = { "--records": "recordsDir", "--profile": "profilePath", "--expected": "expectedPath" }[arg];
    if (!key || argv[i + 1] === undefined) throw new Error(`unknown or incomplete argument: ${arg}`);
    options[key] = path.resolve(argv[i + 1]);
    i += 1;
  }
  for (const key of ["recordsDir", "profilePath", "expectedPath"]) {
    if (!options[key]) throw new Error(`missing --${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/-path$/, "")}`);
  }
  return options;
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(`check-adopter-fingerprint: ${error.message}`);
  console.error("Usage: node scripts/check-adopter-fingerprint.mjs --records DIR --profile FILE --expected FILE [--write]");
  process.exit(2);
}

const actual = await buildAdopterFingerprint(options);
if (options.write) {
  await mkdir(path.dirname(options.expectedPath), { recursive: true });
  await writeFile(options.expectedPath, stableFingerprintJson(actual));
  console.log(`Wrote Obligation-First contract fingerprint: ${options.expectedPath}`);
  process.exit(0);
}

let expected;
try {
  expected = JSON.parse(await readFile(options.expectedPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.error(`Contract fingerprint is missing: ${options.expectedPath}`);
  console.error("Generate it intentionally with --write and review the structural diff.");
  process.exit(1);
}

const differences = fingerprintDifferences(expected, actual);
if (differences.length > 0) {
  console.error(`Obligation-First contract fingerprint drifted (${differences.length}${differences.length === 50 ? "+" : ""} difference(s) shown):`);
  for (const difference of differences) console.error(`- ${difference}`);
  console.error("Regenerate with --write only when the semantic projection change is intentional.");
  process.exit(1);
}

console.log(`Obligation-First contract fingerprint matches (${actual.records.total} records).`);

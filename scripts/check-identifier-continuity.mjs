#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadRecordDir } from "./lib/adopter-kit.mjs";
import { createContinuityBaseline, validateIdentifierContinuity } from "./lib/identifier-continuity.mjs";

function parseArgs(argv) {
  const options = { writeBaseline: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write-baseline") { options.writeBaseline = true; continue; }
    const key = { "--records": "recordsDir", "--baseline": "baselinePath", "--adopter": "adopter", "--release": "release" }[arg];
    if (!key || argv[index + 1] === undefined) throw new Error(`unknown or incomplete argument: ${arg}`);
    options[key] = key.endsWith("Dir") || key.endsWith("Path") ? path.resolve(argv[index + 1]) : argv[index + 1];
    index += 1;
  }
  for (const key of ["recordsDir", "baselinePath"]) if (!options[key]) throw new Error(`missing ${key}`);
  if (options.writeBaseline && (!options.adopter || !options.release)) throw new Error("--write-baseline requires --adopter and --release");
  return options;
}

let options;
try { options = parseArgs(process.argv.slice(2)); } catch (error) {
  console.error(`check-identifier-continuity: ${error.message}`);
  console.error("Usage: node scripts/check-identifier-continuity.mjs --records DIR --baseline FILE [--write-baseline --adopter NAME --release VERSION]");
  process.exit(2);
}

const entries = await loadRecordDir(options.recordsDir, { root: options.recordsDir });
if (options.writeBaseline) {
  let reviewedRetirements = [];
  try { reviewedRetirements = JSON.parse(await readFile(options.baselinePath, "utf8")).reviewed_retirements || []; } catch (error) { if (error.code !== "ENOENT") throw error; }
  const baseline = createContinuityBaseline({ adopter: options.adopter, release: options.release, entries, reviewedRetirements });
  await mkdir(path.dirname(options.baselinePath), { recursive: true });
  await writeFile(options.baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`Wrote ${baseline.identifiers.length}-identifier continuity baseline: ${options.baselinePath}`);
  process.exit(0);
}

const baseline = JSON.parse(await readFile(options.baselinePath, "utf8"));
const failures = validateIdentifierContinuity(entries, baseline);
if (failures.length > 0) {
  console.error(`Identifier continuity failed (${failures.length} diagnostic(s)):`);
  for (const failure of failures) console.error(`- [${failure.code}] ${failure.message}`);
  process.exit(1);
}
console.log(`Identifier continuity matches ${baseline.adopter} ${baseline.baseline_release} baseline (${baseline.identifiers.length} identifiers; ${entries.length} current records).`);

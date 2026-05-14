#!/usr/bin/env node
/**
 * Report cross-record and cross-project `anchors` edges.
 *
 * Shape validation tells us whether records are valid in isolation. This report
 * shows whether adopter bindings are starting to form the intended PAICE legal
 * graph: Determinations, Terms, and Obligations pointing at the records they
 * interpret or re-allocate.
 *
 * Usage:
 *   node scripts/report-anchor-graph.mjs <record-dir-or-export-dir> [...]
 *   node scripts/report-anchor-graph.mjs --require-all-targets <source> [...]
 */

import { readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { asArray, isType, loadJson, loadRecordDir } from "./lib/adopter-kit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const requireAllTargets = args.includes("--require-all-targets");
const sourceArgs = args.filter((arg) => arg !== "--require-all-targets");

if (sourceArgs.length === 0) {
  console.error("Usage: node scripts/report-anchor-graph.mjs [--require-all-targets] <record-dir-or-export-dir> [...]");
  process.exit(2);
}

const AGGREGATE_KINDS = [
  "authorities",
  "instruments",
  "terms",
  "obligations",
  "proceedings",
  "allegations",
  "determinations",
];

function rel(file) {
  return path.relative(repoRoot, file);
}

function hostOf(id) {
  try {
    return new URL(id).hostname.replace(/^www\./, "");
  } catch {
    return "(non-url)";
  }
}

function expectedAnchorType(record) {
  return record?.["@type"] === "of:Term" ? "of:Term" : "of:Obligation";
}

async function loadAggregateExport(dir) {
  const indexFile = path.join(dir, "index.json");
  const index = await loadJson(indexFile);
  if (!index.files || typeof index.files !== "object") return null;

  const entries = [];
  for (const kind of AGGREGATE_KINDS) {
    const fileName = index.files[kind];
    if (!fileName) continue;

    const aggregateFile = path.join(dir, fileName);
    const aggregate = await loadJson(aggregateFile);
    for (const [i, record] of asArray(aggregate[kind]).entries()) {
      entries.push({
        file: aggregateFile,
        rel: `${rel(aggregateFile)}#/${kind}/${i}`,
        record,
      });
    }
  }

  return entries;
}

async function loadSource(sourceArg) {
  const source = path.resolve(process.cwd(), sourceArg);
  const info = await stat(source);

  if (info.isFile()) {
    const record = await loadJson(source);
    return [{ file: source, rel: rel(source), record }];
  }

  if (!info.isDirectory()) {
    throw new Error(`${sourceArg} is not a file or directory`);
  }

  try {
    const aggregateEntries = await loadAggregateExport(source);
    if (aggregateEntries) return aggregateEntries;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  return loadRecordDir(source, { root: repoRoot });
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

let entries = [];
for (const sourceArg of sourceArgs) entries = entries.concat(await loadSource(sourceArg));

const byId = new Map();
const failures = [];
for (const entry of entries) {
  const id = entry.record["@id"];
  if (!id) {
    failures.push(`${entry.rel}: missing @id`);
    continue;
  }
  if (byId.has(id)) failures.push(`${entry.rel}: duplicate @id also used by ${byId.get(id).rel}`);
  byId.set(id, entry);
}

const edgeCounts = new Map();
const unresolved = [];
let totalAnchors = 0;
let resolvedAnchors = 0;
let crossHostAnchors = 0;
let anchorFieldsPresent = 0;
let recordsWithAnchors = 0;

for (const entry of entries) {
  const sourceId = entry.record["@id"];
  const anchors = asArray(entry.record.anchors);
  if (Object.hasOwn(entry.record, "anchors")) anchorFieldsPresent++;
  if (anchors.length > 0) recordsWithAnchors++;

  for (const targetId of anchors) {
    totalAnchors++;
    const sourceHost = hostOf(sourceId);
    const targetHost = hostOf(targetId);
    const edgeKey = `${sourceHost} -> ${targetHost}`;
    increment(edgeCounts, edgeKey);
    if (sourceHost !== targetHost) crossHostAnchors++;

    const target = byId.get(targetId);
    if (!target) {
      unresolved.push({ from: entry, targetId });
      continue;
    }

    resolvedAnchors++;
    const expected = expectedAnchorType(entry.record);
    if (!isType(target.record, expected)) {
      failures.push(`${entry.rel}: anchors points to ${targetId} (${target.record["@type"]}), expected ${expected}`);
    }
  }
}

if (requireAllTargets) {
  for (const item of unresolved) {
    failures.push(`${item.from.rel}: anchors points to unresolved target ${item.targetId}`);
  }
}

console.log("Anchor graph report");
console.log(`Records scanned: ${entries.length}`);
console.log(`Records with anchors field: ${anchorFieldsPresent}`);
console.log(`Records with populated anchors: ${recordsWithAnchors}`);
console.log(`Anchors: ${totalAnchors}`);
console.log(`Resolved locally: ${resolvedAnchors}`);
console.log(`Unresolved external: ${unresolved.length}`);
console.log(`Cross-host anchors: ${crossHostAnchors}`);

if (edgeCounts.size > 0) {
  console.log("\nEdges by host:");
  for (const [edge, count] of [...edgeCounts.entries()].sort()) {
    console.log(`- ${edge}: ${count}`);
  }
}

if (unresolved.length > 0) {
  console.log("\nUnresolved anchors:");
  for (const item of unresolved) {
    console.log(`- ${item.from.rel} -> ${item.targetId}`);
  }
}

if (failures.length > 0) {
  console.log("\nAnchor graph validation failed:");
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Verify that GitHub Pages artifacts under docs/v1 mirror the canonical
 * source files used by the spec and examples.
 */

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

async function* walkFiles(dir, predicate = () => true) {
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
      yield* walkFiles(p, predicate);
    } else if (predicate(p)) {
      yield p;
    }
  }
}

async function compareFiles(sourceRel, publishedRel, failures) {
  const sourcePath = path.join(repoRoot, sourceRel);
  const publishedPath = path.join(repoRoot, publishedRel);

  let source;
  let published;
  try {
    [source, published] = await Promise.all([
      readFile(sourcePath, "utf8"),
      readFile(publishedPath, "utf8"),
    ]);
  } catch (err) {
    failures.push(`${publishedRel}: missing mirror for ${sourceRel} (${err.code || err.message})`);
    return;
  }

  if (source !== published) {
    failures.push(`${publishedRel}: differs from ${sourceRel}`);
  }
}

const failures = [];
const expectedPublished = new Set();

async function expectMirror(sourceRel, publishedRel) {
  expectedPublished.add(publishedRel);
  await compareFiles(sourceRel, publishedRel, failures);
}

await expectMirror("schema/context.jsonld", "docs/v1/context.jsonld");

for await (const sourcePath of walkFiles(
  path.join(repoRoot, "schema"),
  (p) => p.endsWith(".schema.json"),
)) {
  const rel = path.relative(repoRoot, sourcePath);
  const publishedRel = path.join("docs/v1/schema", path.basename(sourcePath));
  await expectMirror(rel, publishedRel);
}

for await (const sourcePath of walkFiles(
  path.join(repoRoot, "examples"),
  (p) => p.endsWith(".json") || path.basename(p) === "README.md",
)) {
  const rel = path.relative(repoRoot, sourcePath);
  const publishedRel = path.join("docs/v1", rel);
  await expectMirror(rel, publishedRel);
}

for await (const publishedPath of walkFiles(
  path.join(repoRoot, "docs/v1/schema"),
  (p) => p.endsWith(".schema.json"),
)) {
  const rel = path.relative(repoRoot, publishedPath);
  if (!expectedPublished.has(rel)) {
    failures.push(`${rel}: extra published schema with no source counterpart`);
  }
}

for await (const publishedPath of walkFiles(
  path.join(repoRoot, "docs/v1/examples"),
  (p) => p.endsWith(".json") || path.basename(p) === "README.md",
)) {
  const rel = path.relative(repoRoot, publishedPath);
  if (!expectedPublished.has(rel)) {
    failures.push(`${rel}: extra published example artifact with no source counterpart`);
  }
}

if (failures.length > 0) {
  console.log("Published artifact mirror is stale:");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Published artifact mirror matches schema/ and examples/.");

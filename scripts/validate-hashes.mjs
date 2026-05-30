#!/usr/bin/env node
/**
 * Validate or refresh MANIFEST.yaml SHA-256 entries for canonical content.
 */

import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "MANIFEST.yaml");

const HASH_ROOTS = [
  "PROTOCOL.md",
  "PRIOR-ART.md",
  "INTENT.md",
  "ROADMAP.md",
  "schema",
  "vendor/gist",
  "examples",
  "reference/crosswalks",
  "LICENSE-APACHE",
  "LICENSE-CC-BY-4.0",
  "NOTICE",
];

async function* walk(start, root = repoRoot) {
  const full = path.join(root, start);
  let entries;
  try {
    entries = await readdir(full, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOTDIR") {
      yield start;
      return;
    }
    if (err.code === "ENOENT") return;
    throw err;
  }

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const rel = path.join(start, entry.name);
    if (entry.isDirectory()) {
      yield* walk(rel, root);
    } else if (entry.isFile()) {
      yield rel;
    }
  }
}

export async function canonicalHashPaths(root = repoRoot) {
  const paths = [];
  for (const hashRoot of HASH_ROOTS) {
    for await (const rel of walk(hashRoot, root)) paths.push(rel);
  }
  return paths.sort();
}

export async function sha256File(rel, root = repoRoot) {
  const bytes = await readFile(path.join(root, rel));
  return createHash("sha256").update(bytes).digest("hex");
}

export function parseManifest(text) {
  const files = {};
  const lines = text.split("\n");
  const filesLine = lines.findIndex((line) => line.trim() === "files:" || line.trim() === "files: {}");
  if (filesLine === -1) throw new Error("missing files section");

  for (let i = filesLine + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^  ([^:]+): ([a-f0-9]{64})$/);
    if (!match) throw new Error(`malformed files entry on line ${i + 1}`);
    files[match[1]] = match[2];
  }

  return { files };
}

export function renderManifest(existingText, files) {
  const lines = existingText.split("\n");
  const filesLine = lines.findIndex((line) => line.trim() === "files:" || line.trim() === "files: {}");
  const prefix = filesLine === -1 ? lines : lines.slice(0, filesLine);
  while (prefix.length > 0 && prefix[prefix.length - 1] === "") prefix.pop();

  const out = [...prefix, "", "files:"];
  for (const [rel, hash] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    out.push(`  ${rel}: ${hash}`);
  }
  return `${out.join("\n")}\n`;
}

export async function computeManifestHashes(root = repoRoot) {
  const files = {};
  for (const rel of await canonicalHashPaths(root)) {
    files[rel] = await sha256File(rel, root);
  }
  return files;
}

export async function validateHashManifest(root = repoRoot) {
  const manifest = parseManifest(await readFile(path.join(root, "MANIFEST.yaml"), "utf8"));
  const expected = await computeManifestHashes(root);
  const failures = [];

  for (const rel of Object.keys(expected)) {
    if (!manifest.files[rel]) {
      failures.push(`MANIFEST.yaml: missing hash for ${rel}`);
    } else if (manifest.files[rel] !== expected[rel]) {
      failures.push(`MANIFEST.yaml: stale hash for ${rel}`);
    }
  }

  for (const rel of Object.keys(manifest.files)) {
    if (!expected[rel]) failures.push(`MANIFEST.yaml: unexpected hash entry for ${rel}`);
  }

  return failures;
}

async function main() {
  const shouldUpdate = process.argv.includes("--update");
  if (shouldUpdate) {
    const text = await readFile(manifestPath, "utf8");
    const files = await computeManifestHashes();
    await writeFile(manifestPath, renderManifest(text, files));
    console.log(`Updated MANIFEST.yaml with ${Object.keys(files).length} hash entries.`);
    return;
  }

  const failures = await validateHashManifest();
  if (failures.length > 0) {
    console.log("Content hash validation failed:");
    for (const failure of failures) console.log(`- ${failure}`);
    process.exit(1);
  }

  console.log("Content hashes are valid.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

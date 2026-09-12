#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { releaseArtifactInventory } from "./lib/contract-inventory.mjs";
import { canonicalSupplementalArtifacts, verifyHostedArtifacts } from "./lib/hosted-artifact-verifier.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  console.error("Usage: node scripts/verify-hosted-artifacts.mjs --version X.Y.Z --source-revision <40-hex-commit> --source-tag vX.Y.Z [--allow-draft] [--json]");
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

async function main() {
  const version = argument("--version");
  const sourceRevision = argument("--source-revision");
  const sourceTag = argument("--source-tag");
  const json = process.argv.includes("--json");
  if (!version || !sourceRevision || !sourceTag || !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(version)) {
    usage();
    process.exit(2);
  }
  const manifestPath = path.join(root, `docs/releases/v${version}/manifest.json`);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    console.error(`Hosted artifact verification cannot read ${manifestPath}: ${error.message}`);
    process.exit(2);
  }
  if (manifest.status === "draft" && !process.argv.includes("--allow-draft")) {
    console.error(`Hosted artifact verification refused draft v${version}. Use only after the explicit publication step with --allow-draft if the release manifest retains its draft status.`);
    process.exit(2);
  }
  const allowedRedirects = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== "--allow-redirect") continue;
    const [from, to, extra] = String(process.argv[index + 1] || "").split("=");
    if (!from || !to || extra) {
      usage();
      process.exit(2);
    }
    allowedRedirects.push({ from, to });
  }
  const result = await verifyHostedArtifacts({
    manifest,
    expectedInventory: await releaseArtifactInventory(root, version),
    identity: {
      name: "obligation-first",
      version,
      expectedRoot: "https://github.com/snapsynapse/obligation-first",
      sourceRevision,
      sourceTag,
    },
    allowedRedirects,
    supplementalArtifacts: await canonicalSupplementalArtifacts(root, version),
  });
  if (json) {
    console.log(JSON.stringify(result.evidence, null, 2));
  } else if (result.ok) {
    console.log(`Hosted artifact bytes and immutable v${version} tag/source identity match.`);
  } else {
    console.error(`Hosted artifact verification failed for v${version}:`);
    for (const error of result.evidence.errors) console.error(`- ${error.code}: ${error.detail}`);
    for (const artifact of result.evidence.artifacts.filter(item => !item.ok)) {
      console.error(`- ${artifact.kind} ${artifact.path}: ${(artifact.errors || []).map(error => error.code).join(", ")}`);
    }
  }
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

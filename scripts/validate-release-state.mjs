#!/usr/bin/env node
/**
 * Fail closed when a packaged release still describes itself as a local
 * candidate or leaves already-shipped semantic decisions in planning state.
 *
 * The gate activates only after docs/releases/v<package version>/manifest.json
 * exists. That lets future draft work use explicit candidate language before
 * release packaging, while making the final package and public surfaces agree.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export const RELEASE_STATE_SURFACES = [
  "README.md",
  "INTENT.md",
  "ROADMAP.md",
  "PROTOCOL.md",
  "docs/index.html",
  "docs/llms.txt",
  "docs/llms-full.txt",
  "docs/v1/index.html",
  "examples/migration-v0.5-v0.6/README.md",
  "docs/v1/examples/migration-v0.5-v0.6/README.md",
  "reference/decisions/README.md",
  "reference/review/external-review-questions.md",
];

const STALE_RELEASE_CLAIMS = [
  ["implemented-locally", /\bimplemented\s+locally\b/giu],
  ["locally-validated", /\blocally\s+validated\b/giu],
  ["local-release-candidate", /\blocal\s+release\s+candidate\b/giu],
  ["candidate-line", /\bcandidate\s+line\b/giu],
  ["v0.6-candidate", /\bv0\.6\s+candidate\b/giu],
  ["publication-not-performed", /\bpublication\s+has\s+not\s+been\s+performed\b/giu],
  ["publication-remains-separate", /\bpublication\s+remains\s+(?:a\s+)?separate(?:\s+release)?\s+(?:decision|authority)\b/giu],
  ["pending-publication-authority", /\bpending\b[^.\n]{0,160}\bpublication\s+authority\b/giu],
  ["pre-v0.6-binding", /\blive\s+pre-v0\.6\s+bindings?\b/giu],
];

function lineFor(text, index) {
  return text.slice(0, index).split("\n").length;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return {};
  const fields = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = line.match(/^([a-z_]+):\s*(.*)$/);
    if (match) fields[match[1]] = match[2].trim();
  }
  return fields;
}

function semverTuple(value) {
  const match = String(value ?? "").match(/v?(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}

function compareSemver(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

async function readRequired(failures, root, rel) {
  try {
    return await readFile(path.join(root, rel), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    failures.push(`${rel}: released-state surface is missing`);
    return null;
  }
}

export async function validateReleaseState(failures, root = repoRoot, versionOverride) {
  const version = versionOverride
    ?? JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version;
  const releaseManifest = path.join(root, `docs/releases/v${version}/manifest.json`);
  if (!existsSync(releaseManifest)) return { active: false, version };

  for (const rel of RELEASE_STATE_SURFACES) {
    const text = await readRequired(failures, root, rel);
    if (text === null) continue;
    for (const [code, pattern] of STALE_RELEASE_CLAIMS) {
      for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
        failures.push(`${rel}:${lineFor(text, match.index)}: stale released-state claim (${code}): ${match[0].replace(/\s+/g, " ")}`);
      }
    }
  }

  const currentVersion = semverTuple(version);
  const decisionsDir = path.join(root, "reference/decisions");
  let decisionFiles = [];
  try {
    decisionFiles = (await readdir(decisionsDir)).filter((file) => file.endsWith(".md") && file !== "README.md");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    failures.push("reference/decisions: released decision registry is missing");
  }

  for (const file of decisionFiles.sort()) {
    const rel = `reference/decisions/${file}`;
    const text = await readFile(path.join(root, rel), "utf8");
    const fields = parseFrontmatter(text);
    const target = semverTuple(fields.implementation_target);
    if (!target) {
      failures.push(`${rel}: implementation_target must contain a semantic version`);
      continue;
    }
    if (!currentVersion || compareSemver(target, currentVersion) > 0) continue;

    if (!new Set(["implemented", "superseded"]).has(fields.status)) {
      failures.push(`${rel}: ${fields.implementation_target} is packaged at v${version}, so status must be implemented or superseded`);
    }
    if (/\bcandidate\b/i.test(fields.implementation_target)) {
      failures.push(`${rel}: packaged implementation_target must not remain a candidate`);
    }
    if (fields.status === "implemented" && (!fields.current_contract_impact || fields.current_contract_impact === "none")) {
      failures.push(`${rel}: implemented decision must describe its current_contract_impact`);
    }

    const releasedTarget = `${target.join(".")}-candidate`;
    const staleTargetIndex = text.indexOf(releasedTarget);
    if (staleTargetIndex !== -1) {
      failures.push(`${rel}:${lineFor(text, staleTargetIndex)}: released decision still cites ${releasedTarget}`);
    }
  }

  return { active: true, version };
}

async function main() {
  const failures = [];
  const result = await validateReleaseState(failures);
  if (failures.length > 0) {
    console.log("Release-state validation failed:");
    for (const failure of failures) console.log(`- ${failure}`);
    process.exit(1);
  }
  if (!result.active) {
    console.log(`Release-state validation skipped: no package exists for v${result.version}.`);
    return;
  }
  console.log(`Release-state claims and decisions are current for v${result.version}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

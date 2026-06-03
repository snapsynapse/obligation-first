#!/usr/bin/env node
/**
 * Single source of truth for the version string is package.json "version".
 * This script propagates it to every doc/data file that displays it, and
 * (in write mode) stamps the "updated" date on the homepage.
 *
 * Usage:
 *   node scripts/sync-version.mjs            # write: sync version + stamp today's date
 *   node scripts/sync-version.mjs --check    # verify only; non-zero exit on drift
 *   node scripts/sync-version.mjs --date 2026-06-02   # write with an explicit date
 *
 * The check is also imported by validate-repo-contracts.mjs, so `npm test`
 * fails if any file drifts from package.json. That is what stops version
 * errors from getting stranded: you bump package.json, run this once, done.
 *
 * Code (this file and the other .mjs validators) reads the version from
 * package.json at runtime, so it is never in the list below.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export async function versionForms() {
  const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  const full = pkg.version; // e.g. 0.3.0-draft
  const core = full.replace(/-.*$/, ""); // 0.3.0
  const mm = core.split(".").slice(0, 2).join("."); // 0.3
  return {
    full, // 0.3.0-draft
    vfull: `v${full}`, // v0.3.0-draft
    badge: `v${full.replace(/-/g, "--")}`, // v0.3.0--draft  (shields encodes - as --)
    core, // 0.3.0
    vcore: `v${core}`, // v0.3.0
    vmm: `v${mm}`, // v0.3
  };
}

// Each location rebuilds the full version-bearing substring from `f`, so the
// regex must match exactly that substring (anchors are constant text).
function locations(f) {
  // `-draft` is optional so the same patterns work before and after the
  // de-draft (v0.3.1 onward versions carry no suffix).
  // NOTE: package-lock.json is intentionally NOT synced here. A /g version
  // pattern would also rewrite every dependency's "version" field (e.g.
  // ajv 8.20.0 -> 0.3.1), which `npm ci` then rejects. The lockfile's project
  // version is managed by npm: bump package.json, then run `npm install` (or
  // edit the two project-version fields) so the lockfile stays valid.
  return [
    ["MANIFEST.yaml", /bundle_version: \d+\.\d+\.\d+(?:-draft)?/, `bundle_version: ${f.full}`],
    ["SECURITY.md", /`v\d+\.\d+\.\d+(?:-draft)?`/, `\`${f.vfull}\``],
    ["PROTOCOL.md", /version: "\d+\.\d+\.\d+(?:-draft)?"/, `version: "${f.full}"`],
    ["PROTOCOL.md", /\*\*Status: v\d+\.\d+\.\d+(?:-draft)?\.\*\*/, `**Status: ${f.vfull}.**`],
    ["docs/v1/context.jsonld", /context\. v\d+\.\d+\.\d+(?:-draft)?\. Spec/, `context. ${f.vfull}. Spec`],
    ["schema/context.jsonld", /context\. v\d+\.\d+\.\d+(?:-draft)?\. Spec/, `context. ${f.vfull}. Spec`],
    ["reference/review/external-review-questions.md", /Status: v\d+\.\d+\.\d+(?:-draft)?/, `Status: ${f.vfull}`],
    ["INTENT.md", /version: "\d+\.\d+\.\d+(?:-draft)?"/, `version: "${f.full}"`],
    ["docs/agents.json", /"version": "v\d+\.\d+\.\d+(?:-draft)?"/, `"version": "${f.vfull}"`],
    ["docs/llms.txt", /Status: v\d+\.\d+\.\d+(?:-draft)?,/, `Status: ${f.vfull},`],
    ["docs/llms-full.txt", /gist\. v\d+\.\d+\.\d+(?:-draft)?\./, `gist. ${f.vfull}.`],
    ["README.md", /spec-v\d+\.\d+\.\d+(?:--draft)?-orange/, `spec-${f.badge}-orange`],
    ["README.md", /public\. v\d+\.\d+\.\d+(?:-draft)?\./, `public. ${f.vfull}.`],
    ["README.md", /^v\d+\.\d+\.\d+(?:-draft)?\. v0\.1 spec/m, `${f.vfull}. v0.1 spec`],
    ["ROADMAP.md", /## v\d+\.\d+\.\d+(?:-draft)? \(current\)/, `## ${f.vfull} (current)`],
    ["docs/index.html", /<span class="version">v\d+\.\d+\.\d+(?:-draft)?<\/span>/, `<span class="version">${f.vfull}</span>`],
    ["docs/index.html", /live v\d+\.\d+\.\d+(?:-draft)? of Obligation-First/, `live ${f.vfull} of Obligation-First`],
    ["docs/index.html", /Obligation-First v\d+\.\d+\.\d+(?:-draft)? &middot;/, `Obligation-First ${f.vfull} &middot;`],
    ["docs/index.html", /current draft: v\d+\.\d+\)/g, `current draft: ${f.vmm})`],
    ["docs/index.html", /current draft \(v\d+\.\d+\)/g, `current draft (${f.vmm})`],
    ["docs/index.html", /valid through v\d+\.\d+ with no migration/g, `valid through ${f.vmm} with no migration`],
    ["docs/index.html", /validate against v\d+\.\d+\./g, `validate against ${f.vmm}.`],
    ["README.md", /\/releases\/v\d+\.\d+\.\d+(?:-draft)?\//g, `/releases/v${f.full}/`],
    ["docs/llms.txt", /\/releases\/v\d+\.\d+\.\d+(?:-draft)?\//g, `/releases/v${f.full}/`],
    ["docs/llms-full.txt", /\/releases\/v\d+\.\d+\.\d+(?:-draft)?\//g, `/releases/v${f.full}/`],
    ["docs/agents.json", /\/releases\/v\d+\.\d+\.\d+(?:-draft)?\//g, `/releases/v${f.full}/`],
  ];
}

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

// Homepage "updated" date fields. Write-only: the date legitimately changes,
// so it is never part of the drift check.
function dateLocations(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const human = `${MONTHS[m - 1]} ${d}, ${y}`;
  return [
    ["docs/index.html", /(article:modified_time" content=")\d{4}-\d{2}-\d{2}(T)/, `$1${iso}$2`],
    ["docs/index.html", /("dateModified": ")\d{4}-\d{2}-\d{2}(")/, `$1${iso}$2`],
    ["docs/index.html", /(Updated <time datetime=")\d{4}-\d{2}-\d{2}(">)[^<]*(<\/time>)/, `$1${iso}$2${human}$3`],
    ["docs/index.html", /(Last revision: <time datetime=")\d{4}-\d{2}-\d{2}(">)\d{4}-\d{2}-\d{2}(<\/time>)/, `$1${iso}$2${iso}$3`],
  ];
}

/** Returns an array of drift problems (empty = clean). Version only. */
export async function checkVersions() {
  const f = await versionForms();
  const problems = [];
  const byFile = new Map();
  for (const [file, re, replacement] of locations(f)) {
    if (!byFile.has(file)) byFile.set(file, await readFile(path.join(repoRoot, file), "utf8"));
    const content = byFile.get(file);
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    if (!g.test(content)) {
      problems.push(`${file}: version anchor not found (/${re.source}/) — update scripts/sync-version.mjs`);
      continue;
    }
    if (content.replace(new RegExp(re.source, g.flags), replacement) !== content) {
      problems.push(`${file}: version drift — run \`node scripts/sync-version.mjs\` to match package.json (${f.full})`);
    }
  }
  return problems;
}

async function write(dateIso) {
  const f = await versionForms();
  const edits = [...locations(f), ...dateLocations(dateIso)];
  const byFile = new Map();
  for (const [file, re, replacement] of edits) {
    if (!byFile.has(file)) byFile.set(file, await readFile(path.join(repoRoot, file), "utf8"));
    byFile.set(file, byFile.get(file).replace(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags), replacement));
  }
  for (const [file, content] of byFile) await writeFile(path.join(repoRoot, file), content);
  console.log(`Synced version ${f.full} and date ${dateIso} across ${byFile.size} files.`);
}

// CLI
if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--check")) {
    const problems = await checkVersions();
    if (problems.length) {
      console.error("Version drift:\n" + problems.map((p) => `- ${p}`).join("\n"));
      process.exit(1);
    }
    console.log("Version strings are in sync with package.json.");
  } else {
    const dateArg = args[args.indexOf("--date") + 1];
    const iso = args.includes("--date") ? dateArg : new Date().toISOString().slice(0, 10);
    await write(iso);
  }
}

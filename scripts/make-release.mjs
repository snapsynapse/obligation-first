#!/usr/bin/env node
// Generate the docs/releases/v<version>/ release package (manifest.json,
// sha256.txt, RELEASE_NOTES stub). The artifact list and URL patterns are
// derived from the previous release's manifest.json; hashes are recomputed
// from the current tree. Fails if the target release dir already exists.
//
// Usage:
//   node scripts/make-release.mjs [options]
//     --date YYYY-MM-DD     release_date (default: today)
//     --summary "text"      manifest summary (default: TODO placeholder)
//     --status NAME         manifest status (default: prior release's status)
//     --notes-from PATH     copy an existing release-notes file instead of
//                           writing a stub (used when notes are written first)
//     --out-dir PATH        parent dir for the new package (default:
//                           docs/releases). Prior releases are always read
//                           from docs/releases.
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releasesRoot = path.join(repoRoot, "docs/releases");

function fail(message) {
  console.error(`make-release: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const want = { "--date": "date", "--summary": "summary", "--status": "status", "--notes-from": "notesFrom", "--out-dir": "outDir" }[flag];
    if (!want) fail(`unknown argument: ${flag}`);
    const value = argv[i + 1];
    if (value === undefined) fail(`${flag} requires a value`);
    opts[want] = value;
    i += 1;
  }
  if (opts.date && !/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) fail("--date must be YYYY-MM-DD");
  return opts;
}

function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return match.slice(1, 4).map(Number);
}

function compareSemver(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

async function findPriorRelease(version) {
  const target = parseSemver(version);
  if (!target) fail(`package.json version ${version} is not plain semver`);
  let best = null;
  for (const entry of await readdir(releasesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const prior = parseSemver(entry.name.replace(/^v/, ""));
    if (!prior) continue; // skip -draft and other non-semver dirs
    if (compareSemver(prior, target) >= 0) continue;
    if (!existsSync(path.join(releasesRoot, entry.name, "manifest.json"))) continue;
    if (!best || compareSemver(prior, best) > 0) best = prior;
  }
  if (!best) fail(`no prior release with a manifest.json found below v${version} in docs/releases/`);
  return best.join(".");
}

function retargetVersion(text, priorVersion, version) {
  return text.split(priorVersion).join(version);
}

function deriveCompatibility(prior, priorVersion) {
  const compat = {};
  const priorKey = `v${priorVersion.replaceAll(".", "_")}_adopter_records`;
  for (const [key, value] of Object.entries(prior.compatibility ?? {})) {
    if (key === "iri_major" && !(priorKey in compat) && !(priorKey in (prior.compatibility ?? {}))) {
      compat[priorKey] = "valid without migration";
    }
    compat[key] = value;
  }
  return compat;
}

function releaseNotesStub(version, date) {
  return `# Obligation-First v${version} Release Notes

Release date: ${date}

## Summary

TODO: one-paragraph summary of this release.

## What changed

- TODO

## Compatibility

TODO: state adopter-record compatibility and IRI major version.

## Verification

\`\`\`bash
npm test
\`\`\`

The release package includes \`manifest.json\` and \`sha256.txt\` checksums for public release artifacts.
`;
}

async function sha256Of(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  const version = pkg.version;
  const date = opts.date ?? new Date().toISOString().slice(0, 10);

  const priorVersion = await findPriorRelease(version);
  const prior = JSON.parse(
    await readFile(path.join(releasesRoot, `v${priorVersion}`, "manifest.json"), "utf8"),
  );

  const outParent = opts.outDir ? path.resolve(opts.outDir) : releasesRoot;
  const releaseDir = path.join(outParent, `v${version}`);
  if (existsSync(releaseDir)) {
    fail(`${releaseDir} already exists; refusing to overwrite a release package. Delete it first if you intend to regenerate.`);
  }
  await mkdir(releaseDir, { recursive: true });

  const notesName = `RELEASE_NOTES-v${version}.md`;
  const notesPath = path.join(releaseDir, notesName);
  const notes = opts.notesFrom
    ? await readFile(path.resolve(opts.notesFrom), "utf8")
    : releaseNotesStub(version, date);
  await writeFile(notesPath, notes);

  const artifacts = [];
  for (const artifact of prior.artifacts ?? []) {
    const newPath = retargetVersion(artifact.path, priorVersion, version);
    const newUrl = retargetVersion(artifact.url, priorVersion, version);
    // The release-notes artifact lives in the package being generated; every
    // other artifact is hashed from the current working tree.
    const sourcePath =
      newPath === `docs/releases/v${version}/${notesName}` ? notesPath : path.join(repoRoot, newPath);
    if (!existsSync(sourcePath)) fail(`artifact missing from tree: ${newPath}`);
    artifacts.push({ path: newPath, url: newUrl, sha256: await sha256Of(sourcePath) });
  }

  const manifest = {
    name: prior.name,
    version,
    status: opts.status ?? prior.status,
    release_date: date,
    canonical_url: retargetVersion(prior.canonical_url, priorVersion, version),
    repository: prior.repository,
    summary: opts.summary ?? `TODO: summarize the v${version} release.`,
    compatibility: deriveCompatibility(prior, priorVersion),
    artifacts,
  };

  await writeFile(path.join(releaseDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    path.join(releaseDir, "sha256.txt"),
    `${artifacts.map((a) => `${a.sha256}  ${a.path}`).join("\n")}\n`,
  );

  console.log(`Release package written to ${releaseDir}`);
  console.log(`  derived from v${priorVersion} (${artifacts.length} artifacts)`);
  if (!opts.notesFrom) {
    console.log(`  ${notesName} is a stub; write the real notes, delete the dir, and regenerate with --notes-from`);
  }
  if (!opts.summary) {
    console.log("  manifest.json summary is a TODO placeholder; regenerate with --summary");
  }
}

await main();

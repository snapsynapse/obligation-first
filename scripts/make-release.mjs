#!/usr/bin/env node
// Generate the docs/releases/v<version>/ release package (manifest.json,
// sha256.txt, RELEASE_NOTES stub, index.html). The artifact list and URL
// patterns are derived from the previous release's manifest.json; hashes are
// recomputed from the current tree. Fails if the target release dir already
// exists. Unless --out-dir points elsewhere, the run also inserts a release
// <entry> into docs/feed.xml and docs/atom.xml and a release <url> into
// docs/sitemap.xml (idempotently, so a delete-and-regenerate rerun does not
// duplicate them).
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

function escapeXml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Simple accessible release index page (the site has an a11y CI gate:
// <html lang>, <title>, <h1>, real links). Style mirrors the existing
// docs/releases/v*/index.html pages.
function releaseIndexHtml(version, summary) {
  const safeSummary = escapeXml(summary);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Obligation-First v${version} release package</title>
  <meta name="description" content="Release package for Obligation-First v${version} with manifest and SHA-256 checksums.">
  <link rel="canonical" href="https://obligationfirst.org/releases/v${version}/">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 760px; margin: 3rem auto; padding: 0 1.5rem; color: #15181f; }
    a { color: #5b3fd6; }
    code { font-family: "SF Mono", Menlo, Consolas, monospace; background: #f3f4f6; padding: 0.1rem 0.25rem; border-radius: 4px; }
    li { margin: 0.4rem 0; }
  </style>
</head>
<body>
  <main>
    <h1>Obligation-First v${version}</h1>
    <p>${safeSummary}</p>
    <ul>
      <li><a href="manifest.json"><code>manifest.json</code></a> - machine-readable release package manifest</li>
      <li><a href="sha256.txt"><code>sha256.txt</code></a> - SHA-256 checksum index</li>
      <li><a href="RELEASE_NOTES-v${version}.md"><code>RELEASE_NOTES-v${version}.md</code></a> - release notes and verification summary</li>
      <li><a href="/v1/context.jsonld"><code>/v1/context.jsonld</code></a> - JSON-LD context</li>
      <li><a href="/v1/schema/"><code>/v1/schema/</code></a> - JSON Schemas</li>
      <li><a href="/.well-known/assistant-guide.txt"><code>/.well-known/assistant-guide.txt</code></a> - GuideCheck assistant guide</li>
    </ul>
    <p><a href="/changelog.html">Full changelog</a></p>
  </main>
</body>
</html>
`;
}

// Insert a release <entry> after the feed header (entries are sorted
// newest-first below the header) and bump the feed-level <updated>. The
// rel="self" link is left alone so each feed keeps pointing at its own
// filename. Idempotent: skips when the release id is already present.
function insertFeedEntry(feedText, { version, date, summary }) {
  const entryId = `https://obligationfirst.org/releases/v${version}`;
  if (feedText.includes(`<id>${entryId}</id>`)) return null;

  const stamp = `${date}T12:00:00Z`;
  const entry = `  <entry>
    <title>Obligation-First v${version} released</title>
    <link href="https://obligationfirst.org/changelog.html" rel="alternate"/>
    <id>${entryId}</id>
    <updated>${stamp}</updated>
    <published>${stamp}</published>
    <summary>${escapeXml(summary)}</summary>
    <category term="release"/>
  </entry>

`;

  const insertAt = feedText.includes("  <entry>")
    ? feedText.indexOf("  <entry>")
    : feedText.indexOf("</feed>");
  if (insertAt === -1) fail("feed has neither an <entry> nor a closing </feed> tag");

  let header = feedText.slice(0, insertAt);
  // The first <updated> above the entries is the feed-level one.
  header = header.replace(/<updated>[^<]*<\/updated>/, `<updated>${stamp}</updated>`);
  return header + entry + feedText.slice(insertAt);
}

// Add the release directory URL before </urlset>. Idempotent: skips when the
// <loc> is already present.
function insertSitemapUrl(sitemapText, { version, date }) {
  const loc = `https://obligationfirst.org/releases/v${version}/`;
  if (sitemapText.includes(`<loc>${loc}</loc>`)) return null;

  const urlBlock = `  <url>
    <loc>${loc}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  const insertAt = sitemapText.indexOf("</urlset>");
  if (insertAt === -1) fail("docs/sitemap.xml has no closing </urlset> tag");
  return sitemapText.slice(0, insertAt) + urlBlock + sitemapText.slice(insertAt);
}

async function updatePublishingSurfaces({ version, date, summary }) {
  const touched = [];
  for (const feedRel of ["docs/feed.xml", "docs/atom.xml"]) {
    const feedPath = path.join(repoRoot, feedRel);
    const updated = insertFeedEntry(await readFile(feedPath, "utf8"), { version, date, summary });
    if (updated !== null) {
      await writeFile(feedPath, updated);
      touched.push(feedRel);
    }
  }

  const sitemapPath = path.join(repoRoot, "docs/sitemap.xml");
  const updatedSitemap = insertSitemapUrl(await readFile(sitemapPath, "utf8"), { version, date });
  if (updatedSitemap !== null) {
    await writeFile(sitemapPath, updatedSitemap);
    touched.push("docs/sitemap.xml");
  }
  return touched;
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
  await writeFile(path.join(releaseDir, "index.html"), releaseIndexHtml(version, manifest.summary));

  // Insert release entries into the feeds and sitemap, unless writing the
  // package to an alternate --out-dir (in which case the canonical publishing
  // surfaces should not be touched).
  if (!opts.outDir) {
    const touched = await updatePublishingSurfaces({ version, date, summary: manifest.summary });
    for (const rel of touched) console.log(`Updated ${rel}`);
  }

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

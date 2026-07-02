#!/usr/bin/env node
/**
 * Validate repo-wide public contracts that are easy to regress:
 * - URL conventions for project-owned and portfolio URLs
 * - JSON-LD context coverage for schema-defined fields
 * - endpoint inventory consistency across agent-facing docs
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import { checkVersions } from "./sync-version.mjs";
import { parseKeyValueManifest } from "./lib/manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SCANNED_ROOTS = [
  "README.md",
  "ROADMAP.md",
  "PROTOCOL.md",
  "PRIOR-ART.md",
  "CHANGELOG.md",
  "INTENT.md",
  "ATTRIBUTION.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "assistant-guide.txt",
  "assistant-guide-manifest.txt",
  "docs",
  "reference",
  "examples",
  "schema",
  "package.json",
  ".github",
  "scripts",
];

const PROJECT_OWNED_HOSTS = new Set([
  "obligationfirst.org",
  "www.obligationfirst.org",
  "guidecheck.org",
  "www.guidecheck.org",
  "sam-rogers.com",
  "www.sam-rogers.com",
  "snapsynapse.com",
  "www.snapsynapse.com",
  "agentlink.run",
  "www.agentlink.run",
  "prompterkit.app",
  "www.prompterkit.app",
  "virtualclassroom.watch",
  "www.virtualclassroom.watch",
  "paice.foundation",
  "www.paice.foundation",
  "paice.work",
  "www.paice.work",
  "siteline.to",
  "www.siteline.to",
  "everyailaw.com",
  "www.everyailaw.com",
  "gracefulboundaries.dev",
  "www.gracefulboundaries.dev",
  "aitool.watch",
  "www.aitool.watch",
  "skillprovenance.dev",
  "www.skillprovenance.dev",
  "hardguard25.com",
  "www.hardguard25.com",
  "skilla11y.dev",
  "www.skilla11y.dev",
  "turnfile.work",
  "www.turnfile.work",
  "knowledge-as-code.com",
  "www.knowledge-as-code.com",
  "publedge.org",
  "www.publedge.org",
  "aiposture.org",
  "www.aiposture.org",
  "aiincidentlaw.org",
  "www.aiincidentlaw.org",
]);

const ALLOWED_HTTP_PREFIXES = [
  "http://www.w3.org/",
  "http://docs.oasis-open.org/legaldocml/ns/akn/3.0",
  "http://docs.oasis-open.org/legalruleml/ns/v1.0/",
  "http://data.europa.eu/eli/",
  "http://www.sitemaps.org/schemas/sitemap/0.9",
  "http://rdfs.org/ns/void#",
];

const ALLOWED_WWW_HOSTS = new Set([
  "www.w3.org",
  "www.sitemaps.org",
  "www.linkedin.com",
  "www.apache.org",
]);

const CORE_ENDPOINTS = [
  "https://obligationfirst.org/v1/context.jsonld",
  "https://obligationfirst.org/v1/schema/authority.schema.json",
  "https://obligationfirst.org/v1/schema/instrument.schema.json",
  "https://obligationfirst.org/v1/schema/term.schema.json",
  "https://obligationfirst.org/v1/schema/obligation.schema.json",
  "https://obligationfirst.org/v1/schema/proceeding.schema.json",
  "https://obligationfirst.org/v1/schema/allegation.schema.json",
  "https://obligationfirst.org/v1/schema/determination.schema.json",
  "https://obligationfirst.org/v1/schema/executable-encoding.schema.json",
];

const ASSISTANT_GUIDE_ENDPOINT = "https://obligationfirst.org/.well-known/assistant-guide.txt";
const ASSISTANT_GUIDE_MANIFEST_ENDPOINT = "https://obligationfirst.org/.well-known/assistant-guide-manifest.txt";
const RELEASE_VERSION = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8")).version;
const RELEASE_PACKAGE_ENDPOINT = `https://obligationfirst.org/releases/v${RELEASE_VERSION}/`;

async function* walk(start) {
  const full = path.join(repoRoot, start);
  let entries;
  try {
    entries = await readdir(full, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOTDIR") {
      yield full;
      return;
    }
    if (err.code === "ENOENT") return;
    throw err;
  }

  for (const entry of entries) {
    const p = path.join(full, entry.name);
    const rel = path.relative(repoRoot, p);
    if (entry.isDirectory()) {
      if (rel === "node_modules" || rel === ".git") continue;
      yield* walk(rel);
    } else if (
      [".md", ".json", ".jsonld", ".html", ".xml", ".txt", ".yml", ".yaml", ".svg", ".js", ".mjs"].some((ext) =>
        entry.name.endsWith(ext),
      )
    ) {
      yield p;
    }
  }
}

function lineFor(text, index) {
  return text.slice(0, index).split("\n").length;
}

async function validateUrls(failures) {
  const urlRe = /\bhttps?:\/\/[^\s<>"')\]]+/g;
  for (const root of SCANNED_ROOTS) {
    for await (const file of walk(root)) {
      const rel = path.relative(repoRoot, file);
      const text = await readFile(file, "utf8");
      for (const match of text.matchAll(urlRe)) {
        const rawUrl = match[0].replace(/[.,;:]+$/, "");
        let url;
        try {
          url = new URL(rawUrl);
        } catch {
          continue;
        }

        const line = lineFor(text, match.index || 0);
        const host = url.hostname.toLowerCase();
        if (url.protocol === "http:" && !ALLOWED_HTTP_PREFIXES.some((prefix) => rawUrl.startsWith(prefix))) {
          failures.push(`${rel}:${line}: non-HTTPS URL is not an allowed standards namespace: ${rawUrl}`);
        }

        if (host.startsWith("www.") && !ALLOWED_WWW_HOSTS.has(host)) {
          failures.push(`${rel}:${line}: remove www from URL: ${rawUrl}`);
        }

        if (PROJECT_OWNED_HOSTS.has(host) && host.startsWith("www.")) {
          failures.push(`${rel}:${line}: project-owned URL must use bare domain: ${rawUrl}`);
        }
      }
    }
  }
}

// Nested field names that legitimately carry no explicit context term. These
// are sub-object keys resolved under the context's @vocab, not standalone
// graph properties; extend this list (with a reason) rather than weakening
// the recursion in collectSchemaProperties.
const CONTEXT_COVERAGE_ALLOWLIST = new Set([
  "name", // display label nested inside the `organization` object (authority.schema.json)
  "ref", // IRI pointer nested inside the `jurisdiction` object (authority + naming-profile schemas)
]);

function collectSchemaProperties(schema, out = new Set()) {
  if (!schema || typeof schema !== "object") return out;
  for (const [key, subschema] of Object.entries(schema.properties || {})) {
    out.add(key);
    collectSchemaProperties(subschema, out); // nested object properties
  }
  for (const keyword of ["oneOf", "anyOf", "allOf"]) {
    for (const branch of schema[keyword] || []) collectSchemaProperties(branch, out);
  }
  for (const items of [schema.items].flat()) collectSchemaProperties(items, out);
  for (const def of Object.values(schema.$defs || {})) collectSchemaProperties(def, out);
  return out;
}

async function validateContextCoverage(failures) {
  const context = JSON.parse(await readFile(path.join(repoRoot, "schema/context.jsonld"), "utf8"))["@context"];
  const ignored = new Set(["@context", "@id", "@type"]);

  const schemaFiles = (await readdir(path.join(repoRoot, "schema"))).filter((f) => f.endsWith(".schema.json"));
  const missing = new Map();

  for (const file of schemaFiles) {
    const schema = JSON.parse(await readFile(path.join(repoRoot, "schema", file), "utf8"));
    for (const property of collectSchemaProperties(schema)) {
      if (ignored.has(property)) continue;
      // Keys like "void:uriSpace" are already prefixed; they resolve through
      // the declared prefix, not through a standalone context term.
      if (property.includes(":")) continue;
      if (CONTEXT_COVERAGE_ALLOWLIST.has(property)) continue;
      if (!Object.hasOwn(context, property)) {
        if (!missing.has(property)) missing.set(property, []);
        missing.get(property).push(file);
      }
    }
  }

  for (const [property, files] of [...missing.entries()].sort()) {
    failures.push(`schema/context.jsonld: missing explicit context term "${property}" used by ${files.join(", ")}`);
  }
}

function endpointVisible(text, endpoint) {
  const url = new URL(endpoint);
  return text.includes(endpoint) || text.includes(url.pathname);
}

async function validateEndpointInventory(failures) {
  const agents = JSON.parse(await readFile(path.join(repoRoot, "docs/agents.json"), "utf8"));
  const agentEndpoints = [
    agents.endpoints.context,
    agents.endpoints.assistant_guide,
    agents.endpoints.assistant_guide_manifest,
    agents.endpoints.release_package,
    ...Object.values(agents.endpoints.schemas || {}),
  ];

  for (const endpoint of CORE_ENDPOINTS) {
    if (!agentEndpoints.includes(endpoint)) {
      failures.push(`docs/agents.json: missing core endpoint ${endpoint}`);
    }
  }

  const docsToCheck = [
    "README.md",
    "docs/llms.txt",
    "docs/llms-full.txt",
    "docs/v1/index.html",
  ];

  for (const rel of docsToCheck) {
    const text = await readFile(path.join(repoRoot, rel), "utf8");
    for (const endpoint of CORE_ENDPOINTS) {
      if (!endpointVisible(text, endpoint)) {
        failures.push(`${rel}: missing core endpoint inventory entry for ${endpoint}`);
      }
    }
    if (!endpointVisible(text, ASSISTANT_GUIDE_ENDPOINT)) {
      failures.push(`${rel}: missing assistant guide endpoint ${ASSISTANT_GUIDE_ENDPOINT}`);
    }
    if (!endpointVisible(text, ASSISTANT_GUIDE_MANIFEST_ENDPOINT)) {
      failures.push(`${rel}: missing assistant guide manifest endpoint ${ASSISTANT_GUIDE_MANIFEST_ENDPOINT}`);
    }
  }

  const releaseDocsToCheck = [
    "README.md",
    "docs/llms.txt",
    "docs/llms-full.txt",
  ];

  for (const rel of releaseDocsToCheck) {
    const text = await readFile(path.join(repoRoot, rel), "utf8");
    if (!endpointVisible(text, RELEASE_PACKAGE_ENDPOINT)) {
      failures.push(`${rel}: missing release package endpoint ${RELEASE_PACKAGE_ENDPOINT}`);
    }
  }
}

async function validateW3idResolutionClaims(failures) {
  const activeDocs = [
    "README.md",
    "docs/index.html",
    "docs/llms.txt",
    "docs/llms-full.txt",
    "docs/v1/index.html",
  ];

  const forbiddenClaims = [
    "`https://w3id.org/of/v1/` resolves to `https://obligationfirst.org/v1/`",
    "https://w3id.org/of/v1/ resolves to https://obligationfirst.org/v1/",
    "The w3id IRI is canonical.",
    "permanent canonical IRI",
    "canonical IRI prefix",
  ];

  for (const rel of activeDocs) {
    const text = await readFile(path.join(repoRoot, rel), "utf8");
    for (const claim of forbiddenClaims) {
      const index = text.indexOf(claim);
      if (index !== -1) {
        failures.push(`${rel}:${lineFor(text, index)}: w3id.org/of/v1/ redirect is planned, not live: ${claim}`);
      }
    }
  }
}

export async function validateAssistantGuide(failures, root = repoRoot) {
  const rootPath = path.join(root, "assistant-guide.txt");
  const docsPath = path.join(root, "docs/.well-known/assistant-guide.txt");
  const manifestPath = path.join(root, "assistant-guide-manifest.txt");
  const docsManifestPath = path.join(root, "docs/.well-known/assistant-guide-manifest.txt");
  const rootBytes = await readFile(rootPath);
  const docsBytes = await readFile(docsPath);
  const manifestBytes = await readFile(manifestPath);
  const docsManifestBytes = await readFile(docsManifestPath);

  if (!rootBytes.equals(docsBytes)) {
    failures.push("assistant-guide.txt: repository and docs/.well-known copies must be byte-identical");
  }
  if (!manifestBytes.equals(docsManifestBytes)) {
    failures.push("assistant-guide-manifest.txt: repository and docs/.well-known copies must be byte-identical");
  }

  if (rootBytes.length > 8192) {
    failures.push(`assistant-guide.txt: file exceeds GuideCheck 8192-byte limit (${rootBytes.length})`);
  }

  const text = rootBytes.toString("utf8");
  const lines = text.split("\n");
  if (lines.length > 400) {
    failures.push(`assistant-guide.txt: file exceeds GuideCheck 400-line limit (${lines.length})`);
  }

  for (let i = 0; i < rootBytes.length; i += 1) {
    const byte = rootBytes[i];
    if (byte !== 0x0a && (byte < 0x20 || byte > 0x7e)) {
      failures.push(`assistant-guide.txt:${lineFor(text, i)}: byte outside GuideCheck ASCII profile`);
      break;
    }
  }

  lines.forEach((line, index) => {
    if (Buffer.byteLength(line, "utf8") > 120) {
      failures.push(`assistant-guide.txt:${index + 1}: line exceeds GuideCheck 120-byte limit`);
    }
  });

  const requiredSnippets = [
    "[assistant-guide-metadata]",
    "profile: human-verifiable-assistant-guide",
    "canonical-url: https://obligationfirst.org/.well-known/assistant-guide.txt",
    "source-path: assistant-guide.txt",
    "recommended-verifier: https://guidecheck.org/verify",
    "manifest-url: https://obligationfirst.org/.well-known/assistant-guide-manifest.txt",
    "Before acting",
    "[action]",
    "Stop and ask",
    "Acceptance checklist",
    "Threat model",
    "Untrusted content handling",
    "GuideCheck conformance is a form claim, not a safety claim.",
  ];

  for (const snippet of requiredSnippets) {
    if (!text.includes(snippet)) {
      failures.push(`assistant-guide.txt: missing required GuideCheck content: ${snippet}`);
    }
  }

  let manifest;
  try {
    manifest = parseKeyValueManifest(manifestBytes.toString("utf8"));
  } catch (err) {
    failures.push(`assistant-guide-manifest.txt: ${err.message}`);
    return;
  }

  const guideSha256 = createHash("sha256").update(rootBytes).digest("hex");
  const gitBlobSha1 = createHash("sha1")
    .update(Buffer.from(`blob ${rootBytes.length}\0`, "utf8"))
    .update(rootBytes)
    .digest("hex");

  // NOTE: "guide-version" is intentionally hardcoded (the assistant guide is
  // versioned independently of package.json). Bumping the assistant-guide
  // version requires editing this constant alongside the guide + manifest.
  const expectedManifest = {
    "guide-path": "/.well-known/assistant-guide.txt",
    "guide-version": "0.1.2",
    "guide-sha256": guideSha256,
    "guide-bytes": String(rootBytes.length),
    "immutable-release-url": `https://api.github.com/repos/snapsynapse/obligation-first/git/blobs/${gitBlobSha1}`,
  };

  for (const [key, value] of Object.entries(expectedManifest)) {
    if (manifest[key] !== value) {
      failures.push(`assistant-guide-manifest.txt: expected ${key}: ${value}`);
    }
  }
}

export async function validateReleasePackage(failures, root = repoRoot) {
  const rel = `docs/releases/v${RELEASE_VERSION}`;
  const releaseDir = path.join(root, rel);
  const manifest = JSON.parse(await readFile(path.join(releaseDir, "manifest.json"), "utf8"));
  const shaIndex = await readFile(path.join(releaseDir, "sha256.txt"), "utf8");
  const shaLines = new Map();

  for (const line of shaIndex.trim().split("\n")) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) {
      failures.push(`${rel}/sha256.txt: malformed line: ${line}`);
      continue;
    }
    shaLines.set(match[2], match[1]);
  }

  if (manifest.version !== RELEASE_VERSION) {
    failures.push(`${rel}/manifest.json: expected version ${RELEASE_VERSION}`);
  }

  for (const artifact of manifest.artifacts || []) {
    const artifactPath = path.join(root, artifact.path);
    let bytes;
    try {
      bytes = await readFile(artifactPath);
    } catch (err) {
      failures.push(`${rel}/manifest.json: missing artifact ${artifact.path}`);
      continue;
    }

    const actualSha = createHash("sha256").update(bytes).digest("hex");
    if (artifact.sha256 !== actualSha) {
      failures.push(`${rel}/manifest.json: stale sha256 for ${artifact.path}`);
    }
    if (shaLines.get(artifact.path) !== actualSha) {
      failures.push(`${rel}/sha256.txt: stale sha256 for ${artifact.path}`);
    }
  }

  // Orphans: well-formed sha256.txt lines naming files the manifest does not
  // carry are drift (a checksum with no provenance entry).
  const manifestPaths = new Set((manifest.artifacts || []).map((artifact) => artifact.path));
  for (const shaPath of shaLines.keys()) {
    if (!manifestPaths.has(shaPath)) {
      failures.push(`${rel}/sha256.txt: orphan line for ${shaPath} — not listed in manifest.json artifacts`);
    }
  }
}

// Publishing surfaces (release index pages, feeds, sitemap) are generated by
// scripts/make-release.mjs for new releases; these guards catch hand-edit
// drift on the current version.
export async function validatePublishingSurfaces(failures, root = repoRoot, version = RELEASE_VERSION) {
  const releasesDir = path.join(root, "docs/releases");
  let releaseEntries = [];
  try {
    releaseEntries = await readdir(releasesDir, { withFileTypes: true });
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    failures.push("docs/releases: directory missing");
  }
  for (const entry of releaseEntries) {
    if (!entry.isDirectory()) continue;
    if (!existsSync(path.join(releasesDir, entry.name, "index.html"))) {
      failures.push(`docs/releases/${entry.name}: missing index.html`);
    }
  }

  for (const [feedRel, selfSuffix] of [
    ["docs/feed.xml", "/feed.xml"],
    ["docs/atom.xml", "/atom.xml"],
  ]) {
    let feed;
    try {
      feed = await readFile(path.join(root, feedRel), "utf8");
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      failures.push(`${feedRel}: file missing`);
      continue;
    }

    const entryTitles = [...feed.matchAll(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/g)].map((m) => m[1]);
    if (!entryTitles.some((title) => title.includes(`v${version}`))) {
      failures.push(`${feedRel}: no <entry><title> mentions v${version} (current package.json version)`);
    }

    const selfMatch = feed.match(/<link href="([^"]+)" rel="self"\s*\/>/);
    if (!selfMatch) {
      failures.push(`${feedRel}: missing atom:link rel="self"`);
    } else if (!selfMatch[1].endsWith(selfSuffix)) {
      failures.push(`${feedRel}: rel="self" href must end with ${selfSuffix} (got ${selfMatch[1]})`);
    }
  }

  try {
    const sitemap = await readFile(path.join(root, "docs/sitemap.xml"), "utf8");
    const releaseUrl = `https://obligationfirst.org/releases/v${version}/`;
    if (!sitemap.includes(releaseUrl)) {
      failures.push(`docs/sitemap.xml: missing entry for ${releaseUrl}`);
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    failures.push("docs/sitemap.xml: file missing");
  }
}

export async function validateRepoContracts() {
  const failures = [];
  await validateUrls(failures);
  await validateContextCoverage(failures);
  await validateEndpointInventory(failures);
  await validateW3idResolutionClaims(failures);
  await validateAssistantGuide(failures);
  await validateReleasePackage(failures);
  await validatePublishingSurfaces(failures);
  for (const problem of await checkVersions()) failures.push(problem);
  return failures;
}

async function main() {
  const failures = await validateRepoContracts();

  if (failures.length > 0) {
    console.log("Repo contract validation failed:");
    for (const failure of failures) console.log(`- ${failure}`);
    process.exit(1);
  }

  console.log("Repo URL, context, and endpoint contracts are valid.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

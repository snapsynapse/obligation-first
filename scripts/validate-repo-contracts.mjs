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
import { validateReleaseState } from "./validate-release-state.mjs";
import { validateImplementationStatus } from "./check-implementation-status.mjs";
import { parseKeyValueManifest } from "./lib/manifest.mjs";
import {
  coreEndpointInventory,
  releaseArtifactInventory,
} from "./lib/contract-inventory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SCANNED_ROOTS = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "PROJECT_CONTEXT.md",
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

export function validateScopeDiscovery(failures, agents, surfaces) {
  const base = "https://github.com/snapsynapse/obligation-first";
  const endpoints = {
    contract: `${base}/blob/main/reference/contracts/scope-contract-v1.md`,
    inventory_schema: `${base}/blob/main/reference/contracts/scope-inventory-v1.schema.json`,
    fixtures: `${base}/tree/main/reference/fixtures/scope-contract-v1`,
  };
  if (!agents.capabilities?.includes("exact-scope-continuity-evaluation")) {
    failures.push("docs/agents.json: missing scope evaluator capability");
  }
  for (const [name, url] of Object.entries(endpoints)) {
    if (agents.endpoints?.scope_evaluator?.[name] !== url) {
      failures.push(`docs/agents.json: missing scope evaluator endpoint ${name}`);
    }
    for (const [rel, text] of Object.entries(surfaces)) {
      if (!text.includes(url)) failures.push(`${rel}: missing scope evaluator endpoint ${name}`);
    }
  }
}

async function validateEndpointInventory(failures) {
  const coreEndpoints = await coreEndpointInventory(repoRoot);
  const agents = JSON.parse(await readFile(path.join(repoRoot, "docs/agents.json"), "utf8"));
  const scopeSurfaces = {};
  for (const rel of ["README.md", "docs/index.html", "docs/llms.txt", "docs/llms-full.txt"]) {
    scopeSurfaces[rel] = await readFile(path.join(repoRoot, rel), "utf8");
  }
  validateScopeDiscovery(failures, agents, scopeSurfaces);
  const agentEndpoints = [
    agents.endpoints.context,
    agents.endpoints.assistant_guide,
    agents.endpoints.assistant_guide_manifest,
    agents.endpoints.release_package,
    ...Object.values(agents.endpoints.schemas || {}),
  ];

  for (const endpoint of coreEndpoints) {
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
    for (const endpoint of coreEndpoints) {
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
    "guide-version": "0.1.4",
    "guide-sha256": guideSha256,
    "guide-bytes": String(rootBytes.length),
    "immutable-release-url": `https://api.github.com/repos/snapsynapse/obligation-first/git/blobs/${gitBlobSha1}`,
  };

  for (const [key, value] of Object.entries(expectedManifest)) {
    if (manifest[key] !== value) {
      failures.push(`assistant-guide-manifest.txt: expected ${key}: ${value}`);
    }
  }

  const [major, minor] = RELEASE_VERSION.split(".").map(Number);
  const expectedAppliesTo = `applies-to: obligation-first >=${major}.${minor}.0 <${major}.${minor + 1}.0`;
  if (!text.includes(expectedAppliesTo)) {
    failures.push(`assistant-guide.txt: expected current-minor scope ${expectedAppliesTo}`);
  }
}

function localHtmlTarget(root, htmlPath, rawReference) {
  const reference = rawReference.split("#", 1)[0].split("?", 1)[0];
  if (!reference || /^(?:mailto|tel|data|javascript):/i.test(reference)) return null;
  let pathname;
  if (/^https?:\/\//i.test(reference)) {
    const url = new URL(reference);
    if (url.hostname !== "obligationfirst.org") return null;
    pathname = decodeURIComponent(url.pathname);
  } else if (reference.startsWith("//")) {
    return null;
  } else if (reference.startsWith("/")) {
    pathname = decodeURIComponent(reference);
  } else {
    return path.resolve(path.dirname(htmlPath), decodeURIComponent(reference));
  }
  return path.join(root, "docs", pathname.replace(/^\/+/, ""));
}

export async function validateInternalHtmlLinks(failures, root = repoRoot) {
  const docsRoot = path.join(root, "docs");
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await inspect(file);
        continue;
      }
      if (!entry.name.endsWith(".html")) continue;
      const text = await readFile(file, "utf8");
      for (const match of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        let target = localHtmlTarget(root, file, match[1]);
        if (target === null) continue;
        if (match[1].split(/[?#]/, 1)[0].endsWith("/")) target = path.join(target, "index.html");
        if (!existsSync(target)) {
          failures.push(`${path.relative(root, file)}:${lineFor(text, match.index || 0)}: broken internal reference ${match[1]}`);
        }
      }
    }
  }
  await inspect(docsRoot);
}

function releaseCompatibilityKey(version) {
  return `v${version.replaceAll(".", "_")}_adopter_records`;
}

export function validateReleaseManifestContract(
  failures,
  { manifest, expectedArtifacts, shaPaths, releaseNotes, version },
) {
  const rel = `docs/releases/v${version}`;
  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  const expectedByPath = new Map(expectedArtifacts.map((artifact) => [artifact.path, artifact]));
  const seenPaths = new Set();
  const seenUrls = new Set();

  if (manifest.version !== version) {
    failures.push(`${rel}/manifest.json: expected version ${version}`);
  }
  if (manifest.canonical_url !== `https://obligationfirst.org/releases/v${version}/`) {
    failures.push(`${rel}/manifest.json: canonical_url must identify the current release directory`);
  }
  if (!manifest.summary || /\bTODO\b/i.test(manifest.summary)) {
    failures.push(`${rel}/manifest.json: summary must be final and contain no TODO placeholder`);
  }

  for (const artifact of artifacts) {
    if (!artifact || typeof artifact.path !== "string") {
      failures.push(`${rel}/manifest.json: every artifact needs a string path`);
      continue;
    }
    if (seenPaths.has(artifact.path)) {
      failures.push(`${rel}/manifest.json: duplicate artifact path ${artifact.path}`);
    }
    seenPaths.add(artifact.path);
    if (typeof artifact.url !== "string") {
      failures.push(`${rel}/manifest.json: ${artifact.path} needs a canonical URL`);
    } else if (seenUrls.has(artifact.url)) {
      failures.push(`${rel}/manifest.json: duplicate artifact URL ${artifact.url}`);
    } else {
      seenUrls.add(artifact.url);
    }

    const expected = expectedByPath.get(artifact.path);
    if (!expected) {
      failures.push(`${rel}/manifest.json: unexpected artifact ${artifact.path}`);
    } else if (artifact.url !== expected.url) {
      failures.push(`${rel}/manifest.json: noncanonical URL for ${artifact.path}; expected ${expected.url}`);
    }
  }

  for (const expected of expectedArtifacts) {
    if (!seenPaths.has(expected.path)) {
      failures.push(`${rel}/manifest.json: missing required artifact ${expected.path}`);
    }
  }
  for (const shaPath of shaPaths) {
    if (!seenPaths.has(shaPath)) {
      failures.push(`${rel}/sha256.txt: orphan line for ${shaPath} - not listed in manifest.json artifacts`);
    }
  }

  const compatibility = manifest.compatibility && typeof manifest.compatibility === "object"
    ? manifest.compatibility
    : {};
  const [major, minor] = version.split(".").map(Number);
  const targetMinor = `v${major}.${minor}`;
  const currentKey = releaseCompatibilityKey(version);
  const expectedCurrent = `native ${targetMinor} conformance after schema-and-graph validation`;
  if (compatibility.iri_major !== "v1") {
    failures.push(`${rel}/manifest.json: compatibility.iri_major must remain v1`);
  }
  if (compatibility[currentKey] !== expectedCurrent) {
    failures.push(`${rel}/manifest.json: compatibility.${currentKey} must be "${expectedCurrent}"`);
  }

  const priorEntries = Object.entries(compatibility)
    .map(([key, value]) => ({ key, value, match: key.match(/^v(\d+)_(\d+)(?:_(\d+))?_adopter_records$/) }))
    .filter(({ key, match }) => match && key !== currentKey);
  const sameMinorEntries = priorEntries
    .filter(({ match }) => Number(match[1]) === major && Number(match[2]) === minor);
  const legacyEntries = priorEntries
    .filter(({ match }) => Number(match[1]) !== major || Number(match[2]) !== minor);
  if (minor > 0 && legacyEntries.length === 0) {
    failures.push(`${rel}/manifest.json: compatibility must describe the legacy-record migration window`);
  }
  for (const { key, value } of sameMinorEntries) {
    if (String(value) !== expectedCurrent) {
      failures.push(`${rel}/manifest.json: compatibility.${key} must preserve native ${targetMinor} conformance for same-minor adopter records`);
    }
  }
  for (const { key, value } of legacyEntries) {
    const text = String(value);
    if (
      !text.includes(`schema-valid during the ${targetMinor} migration window`)
      || !text.includes(`migrate for ${targetMinor} conformance`)
      || /without migration/i.test(text)
    ) {
      failures.push(`${rel}/manifest.json: compatibility.${key} must distinguish schema validity from ${targetMinor} conformance`);
    }
  }

  if (releaseNotes !== undefined && /\bTODO\b/i.test(releaseNotes)) {
    failures.push(`${rel}: release notes must contain no TODO placeholders`);
  }
}

export async function validateReleasePackage(failures, root = repoRoot, options = {}) {
  const version = options.version ?? RELEASE_VERSION;
  const rel = `docs/releases/v${version}`;
  const releaseDir = path.join(root, rel);
  const manifest = JSON.parse(await readFile(path.join(releaseDir, "manifest.json"), "utf8"));
  const shaIndex = await readFile(path.join(releaseDir, "sha256.txt"), "utf8");
  const shaLines = new Map();
  const shaPaths = [];

  for (const line of shaIndex.trim().split("\n")) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) {
      failures.push(`${rel}/sha256.txt: malformed line: ${line}`);
      continue;
    }
    if (shaLines.has(match[2])) {
      failures.push(`${rel}/sha256.txt: duplicate line for ${match[2]}`);
    }
    shaLines.set(match[2], match[1]);
    shaPaths.push(match[2]);
  }

  const expectedArtifacts = options.expectedArtifacts ?? await releaseArtifactInventory(root, version);
  const notesArtifact = expectedArtifacts.find((artifact) => artifact.path.endsWith(`/RELEASE_NOTES-v${version}.md`));
  let releaseNotes;
  if (notesArtifact) {
    try {
      releaseNotes = await readFile(path.join(root, notesArtifact.path), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  validateReleaseManifestContract(failures, {
    manifest,
    expectedArtifacts,
    shaPaths,
    releaseNotes,
    version,
  });

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
    if (/<summary>[^<]*\bTODO\b/i.test(feed)) {
      failures.push(`${feedRel}: release summaries must contain no TODO placeholders`);
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

    const sitemapEntries = new Map(
      [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)]
        .map((match) => [match[1], match[2]]),
    );
    const docsRoot = path.join(root, "docs");
    async function requireIndexCoverage(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await requireIndexCoverage(file);
          continue;
        }
        if (entry.name !== "index.html") continue;
        const html = await readFile(file, "utf8");
        if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) continue;
        const rel = path.relative(docsRoot, file).replaceAll(path.sep, "/");
        const pathname = rel === "index.html" ? "/" : `/${rel.replace(/index\.html$/, "")}`;
        const url = `https://obligationfirst.org${pathname}`;
        if (!sitemapEntries.has(url)) {
          failures.push(`docs/sitemap.xml: missing non-noindex page ${url}`);
        }
      }
    }
    await requireIndexCoverage(docsRoot);

    let bundleDate;
    try {
      const manifestText = await readFile(path.join(root, "MANIFEST.yaml"), "utf8");
      bundleDate = manifestText.match(/^bundle_date:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1];
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    if (bundleDate) {
      for (const pathname of ["/", "/v1/", "/v1/schema/", "/v1/examples/"]) {
        const url = `https://obligationfirst.org${pathname}`;
        if (sitemapEntries.get(url) !== bundleDate) {
          failures.push(`docs/sitemap.xml: ${url} lastmod must match MANIFEST.yaml bundle_date ${bundleDate}`);
        }
      }
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
  await validateInternalHtmlLinks(failures);
  await validateReleasePackage(failures);
  await validatePublishingSurfaces(failures);
  await validateReleaseState(failures);
  await validateImplementationStatus(failures);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

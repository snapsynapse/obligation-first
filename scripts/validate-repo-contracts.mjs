#!/usr/bin/env node
/**
 * Validate repo-wide public contracts that are easy to regress:
 * - URL conventions for project-owned and portfolio URLs
 * - JSON-LD context coverage for schema-defined fields
 * - endpoint inventory consistency across agent-facing docs
 */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

function collectSchemaProperties(schema, out = new Set()) {
  for (const key of Object.keys(schema.properties || {})) out.add(key);
  for (const keyword of ["oneOf", "anyOf", "allOf"]) {
    for (const branch of schema[keyword] || []) collectSchemaProperties(branch, out);
  }
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
    "docs/v1/index.html",
  ];

  for (const rel of docsToCheck) {
    const text = await readFile(path.join(repoRoot, rel), "utf8");
    for (const endpoint of CORE_ENDPOINTS) {
      if (!endpointVisible(text, endpoint)) {
        failures.push(`${rel}: missing core endpoint inventory entry for ${endpoint}`);
      }
    }
  }
}

const failures = [];
await validateUrls(failures);
await validateContextCoverage(failures);
await validateEndpointInventory(failures);

if (failures.length > 0) {
  console.log("Repo contract validation failed:");
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}

console.log("Repo URL, context, and endpoint contracts are valid.");

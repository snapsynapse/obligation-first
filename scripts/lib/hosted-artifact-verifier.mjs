import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const DEFAULT_LIMITS = Object.freeze({ timeoutMs: 20_000, maxBytes: 2 * 1024 * 1024, maxRedirects: 3 });

function issue(code, detail) {
  return { code, detail };
}

function normalizeContentType(value) {
  return String(value || "").split(";", 1)[0].trim().toLowerCase();
}

function allowedContentTypes(path, kind) {
  if (kind.startsWith("source")) {
    // raw.githubusercontent.com normally serves text/plain. JSON-specific values
    // remain acceptable when a source host preserves the file's registered type.
    if (path.endsWith(".jsonld")) return ["text/plain", "application/ld+json", "application/json"];
    if (path.endsWith(".json")) return ["text/plain", "application/json"];
    if (path.endsWith(".md")) return ["text/plain", "text/markdown"];
    return ["text/plain"];
  }
  if (path.endsWith(".jsonld")) return ["application/ld+json", "application/json"];
  if (path.endsWith(".json")) return ["application/json"];
  if (path.endsWith(".txt")) return ["text/plain"];
  if (path.endsWith(".md")) return ["text/markdown", "text/plain"];
  if (path.endsWith(".html")) return ["text/html"];
  if (path.endsWith(".xml")) return ["application/xml", "text/xml"];
  return ["application/octet-stream"];
}

function parseGitHubRoot(root) {
  let url;
  try {
    url = new URL(root);
  } catch {
    return null;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.protocol !== "https:" || url.hostname !== "github.com" || parts.length !== 2 || url.search || url.hash) return null;
  return { owner: parts[0], repository: parts[1] };
}

function isSafeArtifactPath(value) {
  return typeof value === "string"
    && value.length > 0
    && !value.startsWith("/")
    && !value.split("/").includes("..")
    && !value.includes("\\");
}

function exactInventoryErrors(manifest, expectedInventory) {
  const errors = [];
  const actual = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  const expectedByPath = new Map(expectedInventory.map(item => [item.path, item]));
  const actualByPath = new Map();
  for (const artifact of actual) {
    if (!artifact || !isSafeArtifactPath(artifact.path)) {
      errors.push(issue("MANIFEST_PATH_INVALID", String(artifact?.path)));
      continue;
    }
    if (actualByPath.has(artifact.path)) errors.push(issue("MANIFEST_PATH_DUPLICATE", artifact.path));
    actualByPath.set(artifact.path, artifact);
    if (!SHA256.test(artifact.sha256 || "")) errors.push(issue("MANIFEST_SHA256_INVALID", artifact.path));
    const expected = expectedByPath.get(artifact.path);
    if (!expected) {
      errors.push(issue("MANIFEST_ARTIFACT_EXTRA", artifact.path));
    } else if (artifact.url !== expected.url) {
      errors.push(issue("MANIFEST_URL_MISMATCH", artifact.path));
    }
  }
  for (const expected of expectedInventory) {
    if (!actualByPath.has(expected.path)) errors.push(issue("MANIFEST_ARTIFACT_MISSING", expected.path));
  }
  return errors;
}

function identityErrors(manifest, identity) {
  const errors = [];
  if (!identity || typeof identity !== "object") return [issue("IDENTITY_MISSING", "identity is required")];
  if (manifest.name !== identity.name) errors.push(issue("IDENTITY_NAME_MISMATCH", `${manifest.name} != ${identity.name}`));
  if (manifest.version !== identity.version) errors.push(issue("IDENTITY_VERSION_MISMATCH", `${manifest.version} != ${identity.version}`));
  if (manifest.repository !== identity.expectedRoot) errors.push(issue("IDENTITY_ROOT_MISMATCH", `${manifest.repository} != ${identity.expectedRoot}`));
  if (!COMMIT.test(identity.sourceRevision || "")) errors.push(issue("IDENTITY_REVISION_INVALID", String(identity.sourceRevision)));
  if (identity.sourceTag !== `v${identity.version}`) errors.push(issue("IDENTITY_TAG_MISMATCH", `${identity.sourceTag} != v${identity.version}`));
  if (!parseGitHubRoot(identity.expectedRoot || "")) errors.push(issue("IDENTITY_ROOT_INVALID", String(identity.expectedRoot)));
  return errors;
}

async function digestResponse(response, maxBytes, captureBody) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    if (response.body) await response.body.cancel().catch(() => {});
    return { error: issue("BODY_TOO_LARGE", `declared ${declared} bytes exceeds ${maxBytes}`) };
  }
  if (!response.body) return { bytes: 0, sha256: createHash("sha256").digest("hex") };
  const reader = response.body.getReader();
  const hash = createHash("sha256");
  const chunks = captureBody ? [] : null;
  let bytes = 0;
  try {
    while (true) {
      let next;
      try {
        next = await reader.read();
      } catch (error) {
        return { error: issue("BODY_READ_ERROR", error.message) };
      }
      const { done, value } = next;
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel().catch(() => {});
        return { error: issue("BODY_TOO_LARGE", `received more than ${maxBytes} bytes`) };
      }
      hash.update(value);
      if (chunks) chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return { bytes, sha256: hash.digest("hex"), body: chunks ? Buffer.concat(chunks) : undefined };
}

async function discardBody(response) {
  if (response.body) await response.body.cancel().catch(() => {});
}

async function fetchBounded({ fetchImpl, url, limits, expectedContentTypes, allowedRedirects = [], captureBody = false }) {
  let currentUrl = url;
  const redirects = [];
  for (let hop = 0; hop <= limits.maxRedirects; hop += 1) {
    let response;
    try {
      response = await fetchImpl(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(limits.timeoutMs),
      });
    } catch (error) {
      return { ok: false, url: currentUrl, redirects, errors: [issue("NETWORK_ERROR", error.message)] };
    }
    if (REDIRECT_STATUS.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        await discardBody(response);
        return { ok: false, url: currentUrl, redirects, errors: [issue("REDIRECT_LOCATION_MISSING", String(response.status))] };
      }
      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl).href;
      } catch (error) {
        await discardBody(response);
        return { ok: false, url: currentUrl, redirects, errors: [issue("REDIRECT_LOCATION_INVALID", error.message)] };
      }
      if (!allowedRedirects.some(rule => rule.from === currentUrl && rule.to === nextUrl)) {
        await discardBody(response);
        return { ok: false, url: currentUrl, redirects, errors: [issue("REDIRECT_NOT_ALLOWED", `${currentUrl} -> ${nextUrl}`)] };
      }
      await discardBody(response);
      redirects.push({ status: response.status, from: currentUrl, to: nextUrl });
      currentUrl = nextUrl;
      continue;
    }
    if (response.status !== 200) {
      await discardBody(response);
      return { ok: false, url: currentUrl, redirects, status: response.status, errors: [issue("HTTP_STATUS", String(response.status))] };
    }
    const contentType = normalizeContentType(response.headers.get("content-type"));
    if (!expectedContentTypes.includes(contentType)) {
      await discardBody(response);
      return { ok: false, url: currentUrl, redirects, status: response.status, content_type: contentType, errors: [issue("CONTENT_TYPE_MISMATCH", `${contentType || "missing"}; expected ${expectedContentTypes.join(", ")}`)] };
    }
    const body = await digestResponse(response, limits.maxBytes, captureBody);
    if (body.error) return { ok: false, url: currentUrl, redirects, status: response.status, content_type: contentType, errors: [body.error] };
    return { ok: true, url: currentUrl, redirects, status: response.status, content_type: contentType, ...body };
  }
  return { ok: false, url: currentUrl, redirects, errors: [issue("REDIRECT_LIMIT", String(limits.maxRedirects))] };
}

async function resolveSourceTag({ fetchImpl, identity, limits }) {
  const parsed = parseGitHubRoot(identity.expectedRoot);
  const base = `https://api.github.com/repos/${parsed.owner}/${parsed.repository}`;
  const refUrl = `${base}/git/ref/tags/${encodeURIComponent(identity.sourceTag)}`;
  const first = await fetchBounded({
    fetchImpl, url: refUrl, limits: { ...limits, maxBytes: Math.min(limits.maxBytes, 64 * 1024) },
    expectedContentTypes: ["application/json"], captureBody: true,
  });
  if (!first.ok) return { ok: false, tag: identity.sourceTag, ref_url: refUrl, ...first };
  let ref;
  try {
    ref = JSON.parse(first.body.toString("utf8"));
  } catch (error) {
    return { ok: false, tag: identity.sourceTag, ref_url: refUrl, errors: [issue("SOURCE_TAG_JSON_INVALID", error.message)] };
  }
  let object = ref.object;
  if (!object || !COMMIT.test(object.sha || "")) return { ok: false, tag: identity.sourceTag, ref_url: refUrl, errors: [issue("SOURCE_TAG_OBJECT_INVALID", "missing tag object sha")] };
  const evidence = { tag: identity.sourceTag, ref_url: refUrl, tag_object: object.sha, tag_type: object.type };
  if (object.type === "tag") {
    const tagUrl = `${base}/git/tags/${object.sha}`;
    const nested = await fetchBounded({ fetchImpl, url: tagUrl, limits: { ...limits, maxBytes: Math.min(limits.maxBytes, 64 * 1024) }, expectedContentTypes: ["application/json"], captureBody: true });
    if (!nested.ok) return { ok: false, ...evidence, tag_url: tagUrl, ...nested };
    try {
      const value = JSON.parse(nested.body.toString("utf8"));
      object = value.object;
    } catch (error) {
      return { ok: false, ...evidence, tag_url: tagUrl, errors: [issue("SOURCE_TAG_JSON_INVALID", error.message)] };
    }
    if (!object || object.type !== "commit" || !COMMIT.test(object.sha || "")) return { ok: false, ...evidence, tag_url: tagUrl, errors: [issue("SOURCE_TAG_TARGET_INVALID", "annotated tag must target a commit")] };
    evidence.resolved_revision = object.sha;
  } else if (object.type === "commit") {
    evidence.resolved_revision = object.sha;
  } else {
    return { ok: false, ...evidence, errors: [issue("SOURCE_TAG_TYPE_INVALID", String(object.type))] };
  }
  if (evidence.resolved_revision !== identity.sourceRevision) {
    return { ok: false, ...evidence, errors: [issue("SOURCE_TAG_REVISION_MISMATCH", `${evidence.resolved_revision} != ${identity.sourceRevision}`)] };
  }
  return { ok: true, ...evidence };
}

function sourceUrl(identity, path) {
  const { owner, repository } = parseGitHubRoot(identity.expectedRoot);
  return `https://raw.githubusercontent.com/${owner}/${repository}/${identity.sourceRevision}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

async function verifyOne({ kind, artifact, url, fetchImpl, limits, allowedRedirects }) {
  const expectedContentTypes = allowedContentTypes(artifact.path, kind);
  const checked = await fetchBounded({ fetchImpl, url, limits, expectedContentTypes, allowedRedirects });
  const result = {
    kind,
    path: artifact.path,
    expected_url: url,
    expected_sha256: artifact.sha256,
    expected_content_types: expectedContentTypes,
    ...checked,
  };
  if (checked.ok && artifact.sha256 && checked.sha256 !== artifact.sha256) {
    result.ok = false;
    result.errors = [issue("SHA256_MISMATCH", `${checked.sha256} != ${artifact.sha256}`)];
  }
  return result;
}

function supplementalErrors(artifacts, canonicalOrigins) {
  const errors = [];
  const seen = new Set();
  for (const artifact of artifacts) {
    if (!artifact || !isSafeArtifactPath(artifact.path)) {
      errors.push(issue("SUPPLEMENTAL_PATH_INVALID", String(artifact?.path)));
      continue;
    }
    if (typeof artifact.url !== "string" || !canonicalOrigins.some(origin => artifact.url.startsWith(`${origin}/`))) {
      errors.push(issue("SUPPLEMENTAL_URL_INVALID", `${artifact.path}: ${artifact?.url}`));
      continue;
    }
    if (seen.has(artifact.url)) errors.push(issue("SUPPLEMENTAL_URL_DUPLICATE", artifact.url));
    seen.add(artifact.url);
  }
  return errors;
}

async function currentExampleArtifacts(root) {
  const base = path.join(root, "docs/v1/examples");
  const found = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.name === "README.md" || /\.(?:json|jsonld|txt)$/.test(entry.name)) {
        found.push(path.relative(root, absolute).split(path.sep).join("/"));
      }
    }
  }
  await walk(base);
  return found.sort();
}

export async function canonicalSupplementalArtifacts(root, version) {
  const site = "https://obligationfirst.org";
  const fixed = [
    ["docs/index.html", `${site}/`],
    ["docs/v1/index.html", `${site}/v1/`],
    ["docs/v1/schema/index.html", `${site}/v1/schema/`],
    ["docs/v1/examples/index.html", `${site}/v1/examples/`],
    ["docs/v1/vocabulary/index.html", `${site}/v1/vocabulary/`],
    ["docs/v1/vocabulary/terms.json", `${site}/v1/vocabulary/terms.json`],
    ["docs/evaluation-status.json", `${site}/evaluation-status.json`],
    ["docs/robots.txt", `${site}/robots.txt`],
    ["docs/sitemap.xml", `${site}/sitemap.xml`],
    ["docs/feed.xml", `${site}/feed.xml`],
    ["docs/atom.xml", `${site}/atom.xml`],
    ["docs/changelog.html", `${site}/changelog.html`],
    ["docs/.well-known/security.txt", `${site}/.well-known/security.txt`],
    [`docs/releases/v${version}/index.html`, `${site}/releases/v${version}/`],
    [`docs/releases/v${version}/manifest.json`, `${site}/releases/v${version}/manifest.json`],
    [`docs/releases/v${version}/sha256.txt`, `${site}/releases/v${version}/sha256.txt`],
  ].map(([artifactPath, url]) => ({ path: artifactPath, url }));
  const examples = (await currentExampleArtifacts(root)).map(artifactPath => ({
    path: artifactPath,
    url: `${site}/${artifactPath.slice("docs/".length).split("/").map(encodeURIComponent).join("/")}`,
  }));
  return [...fixed, ...examples];
}

async function verifySupplemental({ artifact, identity, fetchImpl, limits, allowedRedirects }) {
  const source = await verifyOne({
    kind: "source-supplemental", artifact, url: sourceUrl(identity, artifact.path), fetchImpl, limits, allowedRedirects,
  });
  if (!source.ok) return [source];
  const canonical = await verifyOne({
    kind: "canonical-supplemental", artifact: { ...artifact, sha256: source.sha256 }, url: artifact.url, fetchImpl, limits, allowedRedirects,
  });
  canonical.expected_sha256_origin = "immutable-source";
  return [source, canonical];
}

/**
 * Verify a release manifest against canonical served URLs and immutable raw
 * GitHub source URLs. `identity` must name the exact tag and commit expected
 * after publication. No mutable /blob/main URL is ever fetched as source.
 */
export async function verifyHostedArtifacts({
  manifest,
  expectedInventory,
  identity,
  fetchImpl = fetch,
  limits = {},
  canonicalOrigins = ["https://obligationfirst.org"],
  allowedRedirects = [],
  supplementalArtifacts = [],
}) {
  const bounded = { ...DEFAULT_LIMITS, ...limits };
  const errors = [
    ...identityErrors(manifest, identity),
    ...exactInventoryErrors(manifest, expectedInventory),
    ...supplementalErrors(supplementalArtifacts, canonicalOrigins),
  ];
  const evidence = {
    schema_version: "1.0",
    verifier: "of-hosted-artifact-verifier",
    identity: {
      name: identity?.name,
      version: identity?.version,
      expected_root: identity?.expectedRoot,
      source_tag: identity?.sourceTag,
      source_revision: identity?.sourceRevision,
    },
    manifest: { version: manifest?.version, status: manifest?.status, canonical_url: manifest?.canonical_url },
    source_tag: null,
    artifacts: [],
    errors,
  };
  if (errors.length) return { ok: false, evidence };

  evidence.source_tag = await resolveSourceTag({ fetchImpl, identity, limits: bounded });
  if (!evidence.source_tag.ok) {
    evidence.errors.push(...(evidence.source_tag.errors || []));
    return { ok: false, evidence };
  }

  for (const artifact of manifest.artifacts) {
    evidence.artifacts.push(await verifyOne({
      kind: "source", artifact, url: sourceUrl(identity, artifact.path), fetchImpl, limits: bounded, allowedRedirects,
    }));
    if (canonicalOrigins.some(origin => artifact.url.startsWith(`${origin}/`))) {
      evidence.artifacts.push(await verifyOne({
        kind: "canonical", artifact, url: artifact.url, fetchImpl, limits: bounded, allowedRedirects,
      }));
    }
  }
  for (const artifact of supplementalArtifacts) {
    evidence.artifacts.push(...await verifySupplemental({ artifact, identity, fetchImpl, limits: bounded, allowedRedirects }));
  }
  evidence.errors = evidence.artifacts.flatMap(artifact => artifact.errors || []);
  return { ok: evidence.errors.length === 0, evidence };
}

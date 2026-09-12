#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { canonicalSupplementalArtifacts, verifyHostedArtifacts } from "./lib/hosted-artifact-verifier.mjs";

const revision = "a".repeat(40);
const tagObject = "b".repeat(40);
const identity = {
  name: "obligation-first",
  version: "1.2.3",
  expectedRoot: "https://github.com/example/obligation-first",
  sourceRevision: revision,
  sourceTag: "v1.2.3",
};
const sourceBase = `https://raw.githubusercontent.com/example/obligation-first/${revision}`;
const apiBase = "https://api.github.com/repos/example/obligation-first";
const sha256 = value => createHash("sha256").update(value).digest("hex");
const expectedInventory = [
  { path: "schema/context.jsonld", url: "https://served.example/v1/context.jsonld" },
  { path: "docs/agents.json", url: "https://served.example/agents.json" },
];
const body = {
  "schema/context.jsonld": '{"@context":{}}\n',
  "docs/agents.json": '{"name":"obligation-first"}\n',
};
const manifest = {
  name: "obligation-first",
  version: "1.2.3",
  status: "released",
  repository: "https://github.com/example/obligation-first",
  canonical_url: "https://served.example/releases/v1.2.3/",
  artifacts: expectedInventory.map(artifact => ({ ...artifact, sha256: sha256(body[artifact.path]) })),
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function response(value, contentType, status = 200, headers = {}) {
  return new Response(value, { status, headers: { "content-type": contentType, ...headers } });
}

function brokenResponse(contentType) {
  return new Response(new ReadableStream({ start(controller) { controller.error(new Error("synthetic stream interruption")); } }), { headers: { "content-type": contentType } });
}

function routes(overrides = {}) {
  const route = {
    [`${apiBase}/git/ref/tags/v1.2.3`]: () => json({ object: { type: "tag", sha: tagObject } }),
    [`${apiBase}/git/tags/${tagObject}`]: () => json({ object: { type: "commit", sha: revision } }),
  };
  for (const artifact of manifest.artifacts) {
    const contentType = artifact.path.endsWith(".jsonld") ? "application/ld+json" : "application/json";
    route[`${sourceBase}/${artifact.path}`] = () => response(body[artifact.path], "text/plain");
    route[artifact.url] = () => response(body[artifact.path], contentType);
  }
  return { ...route, ...overrides };
}

function mockFetch(table) {
  return async url => {
    const handler = table[String(url)];
    if (!handler) throw new Error(`unmocked URL ${url}`);
    if (handler instanceof Error) throw handler;
    return handler();
  };
}

async function check({ routes: routeOverrides = {}, manifestOverride = manifest, identityOverride = identity, allowedRedirects = [], limits = {}, supplementalArtifacts = [] } = {}) {
  return verifyHostedArtifacts({
    manifest: manifestOverride,
    expectedInventory,
    identity: identityOverride,
    fetchImpl: mockFetch(routes(routeOverrides)),
    canonicalOrigins: ["https://served.example"],
    allowedRedirects,
    limits,
    supplementalArtifacts,
  });
}

function codes(result) {
  return [
    ...result.evidence.errors.map(error => error.code),
    ...(result.evidence.source_tag?.errors || []).map(error => error.code),
    ...result.evidence.artifacts.flatMap(artifact => (artifact.errors || []).map(error => error.code)),
  ];
}

const good = await check();
assert.equal(good.ok, true, JSON.stringify(good.evidence, null, 2));
assert.equal(good.evidence.source_tag.resolved_revision, revision);
assert.equal(good.evidence.artifacts.length, 4, "must verify immutable source and canonical served bytes");
assert(good.evidence.artifacts.every(artifact => artifact.expected_url !== `https://github.com/example/obligation-first/blob/main/${artifact.path}`));
const supplement = { path: "docs/index.html", url: "https://served.example/" };
const supplementalGood = await check({
  supplementalArtifacts: [supplement],
  routes: {
    [`${sourceBase}/${supplement.path}`]: () => response("<h1>Obligation-First</h1>\n", "text/plain"),
    [supplement.url]: () => response("<h1>Obligation-First</h1>\n", "text/html"),
  },
});
assert.equal(supplementalGood.ok, true, JSON.stringify(supplementalGood.evidence, null, 2));
assert.equal(supplementalGood.evidence.artifacts.at(-1).expected_sha256_origin, "immutable-source");
const currentSupplemental = await canonicalSupplementalArtifacts(process.cwd(), "0.6.6");
assert(currentSupplemental.some(artifact => artifact.url === "https://obligationfirst.org/v1/examples/"));
assert(currentSupplemental.some(artifact => artifact.url === "https://obligationfirst.org/releases/v0.6.6/manifest.json"));
assert(currentSupplemental.some(artifact => artifact.path === "docs/v1/examples/colorado-evolution/README.md"));
assert(currentSupplemental.some(artifact => artifact.path === "docs/v1/examples/colorado-evolution/records/instrument-co-sb24-205-predecessor.json"));
assert(currentSupplemental.some(artifact => artifact.path === "docs/v1/examples/colorado-evolution/records/instrument-co-sb26-189-successor.json"));

const wrong200 = await check({
  routes: { "https://served.example/agents.json": () => response('{"name":"stale"}\n', "application/json") },
});
assert.equal(wrong200.ok, false);
assert(codes(wrong200).includes("SHA256_MISMATCH"), "200 stale bytes must fail their expected digest");

const missing = await check({ manifestOverride: { ...manifest, artifacts: manifest.artifacts.slice(1) } });
assert.equal(missing.ok, false);
assert(codes(missing).includes("MANIFEST_ARTIFACT_MISSING"), "missing inventory entry accepted");

const extra = await check({ manifestOverride: { ...manifest, artifacts: [...manifest.artifacts, { path: "extra.json", url: "https://served.example/extra.json", sha256: sha256("extra") }] } });
assert.equal(extra.ok, false);
assert(codes(extra).includes("MANIFEST_ARTIFACT_EXTRA"), "extra inventory entry accepted");

const unavailable = await check({
  routes: { "https://served.example/agents.json": () => response("missing", "text/plain", 404) },
});
assert.equal(unavailable.ok, false);
assert(codes(unavailable).includes("HTTP_STATUS"), "404 accepted");

const network = await check({ routes: { "https://served.example/agents.json": new Error("offline fixture") } });
assert.equal(network.ok, false);
assert(codes(network).includes("NETWORK_ERROR"), "network failure accepted");

const wrongMime = await check({
  routes: { "https://served.example/agents.json": () => response(body["docs/agents.json"], "text/html") },
});
assert.equal(wrongMime.ok, false);
assert(codes(wrongMime).includes("CONTENT_TYPE_MISMATCH"), "HTML response accepted for JSON endpoint");

const interrupted = await check({ routes: { "https://served.example/agents.json": () => brokenResponse("application/json") } });
assert.equal(interrupted.ok, false);
assert(codes(interrupted).includes("BODY_READ_ERROR"), "interrupted response body escaped structured verification evidence");

const redirectFrom = "https://served.example/agents.json";
const redirectTo = "https://cdn.example/agents.json";
const redirectRoutes = {
  [redirectFrom]: () => response("", "text/plain", 302, { location: redirectTo }),
  [redirectTo]: () => response(body["docs/agents.json"], "application/json"),
};
const blockedRedirect = await check({ routes: redirectRoutes });
assert.equal(blockedRedirect.ok, false);
assert(codes(blockedRedirect).includes("REDIRECT_NOT_ALLOWED"), "unspecified redirect accepted");
const allowedRedirect = await check({ routes: redirectRoutes, allowedRedirects: [{ from: redirectFrom, to: redirectTo }] });
assert.equal(allowedRedirect.ok, true, JSON.stringify(allowedRedirect.evidence, null, 2));
const malformedRedirect = await check({
  routes: { [redirectFrom]: () => response("", "text/plain", 302, { location: "http://[bad" }) },
});
assert.equal(malformedRedirect.ok, false);
assert(codes(malformedRedirect).includes("REDIRECT_LOCATION_INVALID"), "malformed redirect escaped structured verification evidence");

const tooLarge = await check({
  routes: { "https://served.example/agents.json": () => response(body["docs/agents.json"].repeat(10), "application/json") },
  limits: { maxBytes: 128 },
});
assert.equal(tooLarge.ok, false);
assert(codes(tooLarge).includes("BODY_TOO_LARGE"), "oversized body accepted");

const staleRevision = await check({
  identityOverride: { ...identity, sourceRevision: "c".repeat(40) },
});
assert.equal(staleRevision.ok, false);
assert(codes(staleRevision).includes("SOURCE_TAG_REVISION_MISMATCH"), "tag pointing to a different revision accepted");
const staleTag = await check({ identityOverride: { ...identity, sourceTag: "v1.2.2" } });
assert.equal(staleTag.ok, false);
assert(codes(staleTag).includes("IDENTITY_TAG_MISMATCH"), "stale version tag evidence accepted");

console.log("Hosted-artifact verifier regressions passed (good bytes, digest, inventory, network, MIME, redirects, size, and source tag/revision evidence).");

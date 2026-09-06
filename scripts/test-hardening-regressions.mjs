#!/usr/bin/env node
/**
 * Focused security hardening regressions for verifier-visible behavior.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { OF_CONTEXT, validateRecordGraph, validateRecordShapes } from "./lib/adopter-kit.mjs";
import { validateExampleRecordSet } from "./validate-example-graphs.mjs";
import {
  validateAssistantGuide,
  validateInternalHtmlLinks,
  validatePublishingSurfaces,
  validateReleaseManifestContract,
  validateReleasePackage,
  validateScopeDiscovery,
} from "./validate-repo-contracts.mjs";
import { validateHashManifest } from "./validate-hashes.mjs";
import { RELEASE_STATE_SURFACES, validateReleaseState } from "./validate-release-state.mjs";
import { rewriteManagedSurface, staleClaims, versionForms } from "./sync-version.mjs";
import { satisfies } from "./lib/version-range.mjs";
import { scopeArtifactInventory } from "./lib/contract-inventory.mjs";

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function hasFailure(items, needle) {
  return items.some((item) => item.includes(needle));
}

// Release hashes must cover the scope tools without retroactively changing
// historical release inventories. Discovery must expose all three resources.
{
  const inventory = scopeArtifactInventory("0.6.4");
  assert(scopeArtifactInventory("0.6.3").length === 0, "scope artifacts changed the historical release inventory");
  for (const rel of ["scripts/lib/scope-contract.mjs", "scripts/check-scope-contract.mjs",
    "scripts/check-scope-inventories.mjs", "scripts/test-scope-contract.mjs",
    "reference/contracts/scope-inventory-v1.schema.json", "reference/fixtures/scope-contract-v1/baseline.json"]) {
    assert(inventory.some((item) => item.path === rel), `release omits scope artifact ${rel}`);
  }
  const base = "https://github.com/snapsynapse/obligation-first";
  const endpoints = {
    contract: `${base}/blob/main/reference/contracts/scope-contract-v1.md`,
    inventory_schema: `${base}/blob/main/reference/contracts/scope-inventory-v1.schema.json`,
    fixtures: `${base}/tree/main/reference/fixtures/scope-contract-v1`,
  };
  const agents = { capabilities: ["exact-scope-continuity-evaluation"], endpoints: { scope_evaluator: endpoints } };
  const text = Object.values(endpoints).join("\n");
  const valid = [];
  validateScopeDiscovery(valid, agents, { "fixture.md": text });
  assert(valid.length === 0, "complete scope discovery was rejected");
  for (const [name, url] of Object.entries(endpoints)) {
    const missingLink = [];
    validateScopeDiscovery(missingLink, agents, { "fixture.md": text.replace(url, "") });
    assert(hasFailure(missingLink, `fixture.md: missing scope evaluator endpoint ${name}`), `missing scope link ${name} was accepted`);
    const altered = structuredClone(agents);
    delete altered.endpoints.scope_evaluator[name];
    const missingAgent = [];
    validateScopeDiscovery(missingAgent, altered, { "fixture.md": text });
    assert(hasFailure(missingAgent, `docs/agents.json: missing scope evaluator endpoint ${name}`), `missing agent scope endpoint ${name} was accepted`);
  }
  const missingCapability = [];
  validateScopeDiscovery(missingCapability, { ...agents, capabilities: [] }, { "fixture.md": text });
  assert(hasFailure(missingCapability, "missing scope evaluator capability"), "missing scope capability was accepted");
}

function stableFailures(items) {
  return [...items].sort().join("\n");
}

const versionFixture = { full: "0.6.3", vfull: "v0.6.3", vmm: "v0.6", badge: "v0.6.3" };
const wordingChanged = rewriteManagedSurface(
  "<!-- of-version: fixture -->\nCompletely different release prose now names v0.6.1.\n",
  { marker: "<!-- of-version: fixture -->", mode: "vfull" },
  versionFixture,
);
assert(wordingChanged.content.includes("v0.6.3"), "version marker stopped working after harmless prose changes");
assert(
  rewriteManagedSurface("no marker\n", { marker: "<!-- of-version: fixture -->", mode: "vfull" }, versionFixture).problem,
  "version synchronizer accepted a missing marker",
);
assert(
  rewriteManagedSurface("<!-- of-version: fixture -->\nv0.6.1\n<!-- of-version: fixture -->\nv0.6.1\n", { marker: "<!-- of-version: fixture -->", mode: "vfull" }, versionFixture).problem,
  "version synchronizer accepted a duplicate marker",
);
assert(
  staleClaims("v0.6.1 is the current release.\n", new Set()).length === 1,
  "version synchronizer missed an unmanaged stale current-version claim",
);
const largeManagedLine = `<!-- of-version: fixture -->\n${"x".repeat(1_000_000)} v0.6.1\n`;
assert(
  rewriteManagedSurface(largeManagedLine, { marker: "<!-- of-version: fixture -->", mode: "vfull" }, versionFixture).content.endsWith("v0.6.3\n"),
  "version marker failed on a large managed line",
);

function determination(overrides = {}) {
  return {
    "@context": OF_CONTEXT,
    "@id": "https://example.com/determination",
    "@type": "of:Determination",
    disposition: "issued",
    decides: [],
    ...overrides,
  };
}

const fakeSchemaSet = {
  ajv: {
    getSchema() {
      return () => true;
    },
  },
  schemaByFile: {
    "determination.schema.json": "fixture",
  },
};
const legacyContextFailures = validateRecordShapes(
  [{
    rel: "fixture/legacy-context.json",
    record: determination({ "@context": "https://obligationfirst.org/v1/" }),
  }],
  fakeSchemaSet,
);
assert(
  legacyContextFailures.some((failure) => failure.message.includes("@context must reference")),
  "adopter shape validator accepted the bare namespace URL as JSON-LD context",
);
assert(
  validateRecordShapes(
    [{
      rel: "fixture/extended-context.json",
      record: determination({ "@context": [OF_CONTEXT, { local: "https://example.com/local#" }] }),
    }],
    fakeSchemaSet,
  ).length === 0,
  "adopter shape validator rejected canonical context with a local extension",
);

const issuedWithoutAnchor = [{ rel: "fixture/determination.json", record: determination() }];
const issuedWithoutAnchorFailures = validateRecordGraph(issuedWithoutAnchor);
assert(
  hasFailure(issuedWithoutAnchorFailures, "disposition issued needs target_instrument or anchors"),
  "adopter graph validator accepted issued Determination without target_instrument or anchors",
);

const issuedWithTarget = [
  {
    rel: "fixture/instrument.json",
    record: { "@id": "https://example.com/instrument", "@type": "of:Instrument" },
  },
  {
    rel: "fixture/determination.json",
    record: determination({ target_instrument: "https://example.com/instrument" }),
  },
];
assert(
  validateRecordGraph(issuedWithTarget).length === 0,
  "adopter graph validator rejected issued Determination with target_instrument",
);

const issuedWithAnchor = [
  {
    rel: "fixture/obligation.json",
    record: { "@id": "https://example.com/obligation", "@type": "of:Requirement" },
  },
  {
    rel: "fixture/determination.json",
    record: determination({ anchors: ["https://example.com/obligation"] }),
  },
];
assert(
  validateRecordGraph(issuedWithAnchor).length === 0,
  "adopter graph validator rejected issued Determination with valid anchors",
);

const obligationWithCategoryAnchor = [
  {
    rel: "fixture/category.json",
    record: { "@id": "https://example.com/category", "@type": "of:ObligationCategory" },
  },
  {
    rel: "fixture/obligation.json",
    record: {
      "@id": "https://example.com/obligation",
      "@type": "of:Requirement",
      anchors: ["https://example.com/category"],
    },
  },
];
assert(
  validateRecordGraph(obligationWithCategoryAnchor).length === 0,
  "adopter graph validator rejected an Obligation anchor to an ObligationCategory",
);

const defeatsCycle = [
  { rel: "fixture/term-a.json", record: { "@id": "https://example.com/term/a", "@type": "of:Term", defeats: ["https://example.com/term/b"] } },
  { rel: "fixture/term-b.json", record: { "@id": "https://example.com/term/b", "@type": "of:Term", undercuts: ["https://example.com/term/a"] } },
];
assert(
  hasFailure(validateRecordGraph(defeatsCycle), "defeats cycle"),
  "adopter graph validator accepted a defeasibility cycle",
);

const explicitUnknownDeontic = [{
  rel: "fixture/unclassified-obligation.json",
  record: { "@id": "https://example.com/obligation/unclassified", "@type": "of:Obligation" },
}];
assert(
  validateRecordGraph(explicitUnknownDeontic).length === 0,
  "adopter graph validator rejected the explicit unclassified deontic state",
);

const contractualTermShape = validateRecordShapes(
  [{
    rel: "fixture/contractual-term.json",
    record: {
      "@context": OF_CONTEXT,
      "@id": "https://example.com/term/contractual",
      "@type": ["of:Term", "gist:ContractTerm"],
    },
  }],
  fakeSchemaSet,
);
assert(
  contractualTermShape.length === 0,
  "adopter shape validator could not dispatch a JSON-LD multi-type contractual Term",
);

const wrongRelationDomain = [
  { rel: "fixture/authority.json", record: { "@id": "https://example.com/authority", "@type": "of:Authority" } },
  {
    rel: "fixture/instrument.json",
    record: {
      "@id": "https://example.com/instrument",
      "@type": "of:Instrument",
      heardBy: ["https://example.com/authority"],
    },
  },
];
assert(
  hasFailure(validateRecordGraph(wrongRelationDomain), "heardBy is only valid on of:Proceeding"),
  "adopter graph validator accepted heardBy on an Instrument",
);

const impossibleLifecycle = [{
  rel: "fixture/proposed-instrument.json",
  record: {
    "@id": "https://example.com/instrument/proposed",
    "@type": "of:Instrument",
    lifecycle_status: "proposed",
    enforcement_status: "enforceable",
  },
}];
assert(
  hasFailure(validateRecordGraph(impossibleLifecycle), "proposed content cannot claim present enforceable enforcement"),
  "adopter graph validator accepted proposed content as presently enforceable",
);

const voluntaryWithBindingBasis = [{
  rel: "fixture/adopted-standard.json",
  record: {
    "@id": "https://example.com/instrument/adopted-standard",
    "@type": "of:Instrument",
    normative_force: "voluntary",
    enforcement_status: "enforceable",
    binding_basis: { kind: "contractual-adoption", source_citation: "Agreement section 4" },
  },
}];
assert(
  validateRecordGraph(voluntaryWithBindingBasis).length === 0,
  "adopter graph validator rejected voluntary content with an evidenced binding basis",
);

const exampleResult = validateExampleRecordSet("/tmp/fixture/records", issuedWithoutAnchor, { root: "/tmp" });
assert(
  stableFailures(exampleResult.failures) === stableFailures(issuedWithoutAnchorFailures),
  "example graph validator and adopter graph validator diverged on the same fixture",
);

async function testReleasePackageStaleHash() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-release-regression-"));
  try {
    const { full: version } = await versionForms();
    const releaseDir = path.join(root, `docs/releases/v${version}`);
    await mkdir(releaseDir, { recursive: true });
    await writeFile(path.join(root, "artifact.txt"), "current\n");
    const stale = createHash("sha256").update("stale\n").digest("hex");
    await writeFile(
      path.join(releaseDir, "manifest.json"),
      `${JSON.stringify(
        {
          version,
          canonical_url: `https://obligationfirst.org/releases/v${version}/`,
          summary: "Fixture release",
          compatibility: {
            iri_major: "v1",
            [`v${version.replaceAll(".", "_")}_adopter_records`]: `native v${version.split(".").slice(0, 2).join(".")} conformance after schema-and-graph validation`,
            v0_5_0_adopter_records: `schema-valid during the v${version.split(".").slice(0, 2).join(".")} migration window; migrate for v${version.split(".").slice(0, 2).join(".")} conformance`,
          },
          artifacts: [{ path: "artifact.txt", url: "https://example.com/artifact.txt", sha256: stale }],
        },
        null,
        2,
      )}\n`,
    );
    await writeFile(path.join(releaseDir, "sha256.txt"), `${stale}  artifact.txt\n`);

    const releaseFailures = [];
    await validateReleasePackage(releaseFailures, root, {
      expectedArtifacts: [{ path: "artifact.txt", url: "https://example.com/artifact.txt" }],
    });
    assert(
      hasFailure(releaseFailures, "stale sha256 for artifact.txt"),
      "release package validator accepted a stale artifact hash",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testReleasePackageExactInventory() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-release-inventory-"));
  try {
    const { full: version } = await versionForms();
    const targetMinor = `v${version.split(".").slice(0, 2).join(".")}`;
    const releaseDir = path.join(root, `docs/releases/v${version}`);
    await mkdir(releaseDir, { recursive: true });
    await writeFile(path.join(root, "artifact.txt"), "current\n");
    const current = createHash("sha256").update("current\n").digest("hex");
    await writeFile(
      path.join(releaseDir, "manifest.json"),
      `${JSON.stringify({
        version,
        canonical_url: `https://obligationfirst.org/releases/v${version}/`,
        summary: "Fixture release",
        compatibility: {
          iri_major: "v1",
          [`v${version.replaceAll(".", "_")}_adopter_records`]: `native ${targetMinor} conformance after schema-and-graph validation`,
          v0_5_0_adopter_records: `valid without migration`,
        },
        artifacts: [{ path: "artifact.txt", url: "https://example.com/artifact.txt", sha256: current }],
      }, null, 2)}\n`,
    );
    await writeFile(path.join(releaseDir, "sha256.txt"), `${current}  artifact.txt\n`);

    const releaseFailures = [];
    await validateReleasePackage(releaseFailures, root, {
      expectedArtifacts: [
        { path: "artifact.txt", url: "https://example.com/artifact.txt" },
        { path: "missing.txt", url: "https://example.com/missing.txt" },
      ],
    });
    assert(
      hasFailure(releaseFailures, "missing required artifact missing.txt"),
      "release package validator accepted an incomplete canonical artifact inventory",
    );
    assert(
      hasFailure(releaseFailures, "must distinguish schema validity"),
      "release package validator accepted legacy records as conformant without migration",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function testPatchReleaseCompatibility() {
  const version = "0.6.1";
  const expectedCurrent = "native v0.6 conformance after schema-and-graph validation";
  const legacy = "schema-valid during the v0.6 migration window; migrate for v0.6 conformance";
  const base = {
    version,
    canonical_url: "https://obligationfirst.org/releases/v0.6.1/",
    summary: "Fixture release",
    compatibility: {
      iri_major: "v1",
      v0_5_0_adopter_records: legacy,
      v0_6_0_adopter_records: expectedCurrent,
      v0_6_1_adopter_records: expectedCurrent,
    },
    artifacts: [],
  };

  const validFailures = [];
  validateReleaseManifestContract(validFailures, {
    manifest: base,
    expectedArtifacts: [],
    shaPaths: [],
    releaseNotes: "Final release notes",
    version,
  });
  assert(
    validFailures.length === 0,
    `release contract rejected native same-minor adopter compatibility: ${validFailures.join(" | ")}`,
  );

  const staleSameMinorFailures = [];
  validateReleaseManifestContract(staleSameMinorFailures, {
    manifest: {
      ...base,
      compatibility: { ...base.compatibility, v0_6_0_adopter_records: legacy },
    },
    expectedArtifacts: [],
    shaPaths: [],
    releaseNotes: "Final release notes",
    version,
  });
  assert(
    hasFailure(staleSameMinorFailures, "must preserve native v0.6 conformance"),
    "release contract accepted migration-only wording for same-minor adopter records",
  );

  const staleLegacyFailures = [];
  validateReleaseManifestContract(staleLegacyFailures, {
    manifest: {
      ...base,
      compatibility: { ...base.compatibility, v0_5_0_adopter_records: expectedCurrent },
    },
    expectedArtifacts: [],
    shaPaths: [],
    releaseNotes: "Final release notes",
    version,
  });
  assert(
    hasFailure(staleLegacyFailures, "must distinguish schema validity"),
    "release contract accepted native-conformance wording for cross-minor legacy records",
  );
}

async function testPublicProbeUsesCanonicalInventory() {
  const workflow = await readFile(".github/workflows/test.yml", "utf8");
  assert(
    workflow.includes("node scripts/probe-public-endpoints.mjs --version \"$VERSION\""),
    "post-deploy workflow does not call the inventory-backed endpoint probe",
  );
  assert(
    !workflow.includes("https://obligationfirst.org/v1/schema/authority.schema.json"),
    "post-deploy workflow still duplicates individual schema URLs",
  );
}

async function testAssistantGuideByteIdentity() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-guide-regression-"));
  try {
    const wellKnown = path.join(root, "docs/.well-known");
    await mkdir(wellKnown, { recursive: true });
    const guide = await readFile("assistant-guide.txt");
    const manifest = await readFile("assistant-guide-manifest.txt");
    await writeFile(path.join(root, "assistant-guide.txt"), guide);
    await writeFile(path.join(wellKnown, "assistant-guide.txt"), `${guide.toString("utf8")}\n`);
    await writeFile(path.join(root, "assistant-guide-manifest.txt"), manifest);
    await writeFile(path.join(wellKnown, "assistant-guide-manifest.txt"), manifest);

    const guideFailures = [];
    await validateAssistantGuide(guideFailures, root);
    assert(
      hasFailure(guideFailures, "repository and docs/.well-known copies must be byte-identical"),
      "assistant guide validator accepted non-identical guide copies",
    );

    const staleScope = guide.toString("utf8").replace(
      /applies-to: obligation-first[^\n]+/,
      "applies-to: obligation-first 0.3.x",
    );
    await writeFile(path.join(root, "assistant-guide.txt"), staleScope);
    await writeFile(path.join(wellKnown, "assistant-guide.txt"), staleScope);
    const scopeFailures = [];
    await validateAssistantGuide(scopeFailures, root);
    assert(
      hasFailure(scopeFailures, "expected current-minor scope"),
      "assistant guide validator accepted a stale applies-to range",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testInternalHtmlLinks() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-html-links-"));
  try {
    await mkdir(path.join(root, "docs/records"), { recursive: true });
    await writeFile(path.join(root, "docs/records/example.json"), "{}\n");
    await writeFile(
      path.join(root, "docs/index.html"),
      '<a href="records/">Broken directory</a><a href="records/example.json">Valid record</a>\n',
    );
    const linkFailures = [];
    await validateInternalHtmlLinks(linkFailures, root);
    assert(
      hasFailure(linkFailures, "broken internal reference records/"),
      "internal HTML link validator accepted a directory with no index.html",
    );
    assert(
      !linkFailures.some((failure) => failure.includes("records/example.json")),
      "internal HTML link validator rejected an existing JSON record",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testPublishingSurfaceCoverage() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-publishing-surfaces-"));
  const { full: version } = await versionForms();
  try {
    await mkdir(path.join(root, `docs/releases/v${version}`), { recursive: true });
    await mkdir(path.join(root, "docs/v1"), { recursive: true });
    await writeFile(path.join(root, `docs/releases/v${version}/index.html`), "<title>Release</title>\n");
    await writeFile(path.join(root, "docs/index.html"), "<title>Home</title>\n");
    await writeFile(path.join(root, "docs/v1/index.html"), "<title>Namespace</title>\n");
    const feed = `<feed><link href="https://obligationfirst.org/feed.xml" rel="self"/><entry><title>v${version}</title><summary>TODO: stale</summary></entry></feed>\n`;
    const atom = feed.replace("/feed.xml", "/atom.xml");
    await writeFile(path.join(root, "docs/feed.xml"), feed);
    await writeFile(path.join(root, "docs/atom.xml"), atom);
    await writeFile(
      path.join(root, "docs/sitemap.xml"),
      `<?xml version="1.0"?><urlset><url><loc>https://obligationfirst.org/</loc><lastmod>2026-01-01</lastmod></url><url><loc>https://obligationfirst.org/releases/v${version}/</loc><lastmod>2026-08-04</lastmod></url></urlset>\n`,
    );
    await writeFile(path.join(root, "MANIFEST.yaml"), "bundle_date: 2026-08-04\n");
    const publishingFailures = [];
    await validatePublishingSurfaces(publishingFailures, root, version);
    assert(
      hasFailure(publishingFailures, "release summaries must contain no TODO"),
      "publishing validator accepted a TODO feed summary",
    );
    assert(
      hasFailure(publishingFailures, "missing non-noindex page https://obligationfirst.org/v1/"),
      "publishing validator accepted an omitted sitemap page",
    );
    assert(
      hasFailure(publishingFailures, "lastmod must match MANIFEST.yaml bundle_date"),
      "publishing validator accepted a stale current-surface lastmod",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testManifestStaleHash() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-manifest-regression-"));
  try {
    await writeFile(path.join(root, "PROTOCOL.md"), "current\n");
    await writeFile(
      path.join(root, "MANIFEST.yaml"),
      [
        "bundle: obligation-first",
        "bundle_version: test",
        "bundle_date: 2026-05-30",
        "",
        "files:",
        `  PROTOCOL.md: ${createHash("sha256").update("stale\n").digest("hex")}`,
        "",
      ].join("\n"),
    );

    const manifestFailures = await validateHashManifest(root);
    assert(
      hasFailure(manifestFailures, "stale hash for PROTOCOL.md"),
      "MANIFEST.yaml validator accepted a stale hash",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testReleasedStateClaims() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-release-state-"));
  const version = "0.6.1";
  try {
    await mkdir(path.join(root, `docs/releases/v${version}`), { recursive: true });
    await writeFile(path.join(root, `docs/releases/v${version}/manifest.json`), "{}\n");
    for (const rel of RELEASE_STATE_SURFACES) {
      await mkdir(path.dirname(path.join(root, rel)), { recursive: true });
      await writeFile(path.join(root, rel), `Released state for v${version}.\n`);
    }

    await writeFile(
      path.join(root, "docs/llms.txt"),
      "This packaged release is ImPlEmEnTeD\nLoCaLlY even though it is public.\n",
    );
    await writeFile(
      path.join(root, "reference/decisions/current.md"),
      [
        "---",
        "title: Current decision",
        "status: accepted-direction",
        "implementation_target: v0.6.0 candidate",
        "current_contract_impact: none",
        "---",
        "",
        "Current decision.",
        "",
      ].join("\n"),
    );
    await writeFile(
      path.join(root, "reference/decisions/future.md"),
      [
        "---",
        "title: Future decision",
        "status: accepted-direction",
        "implementation_target: v0.7.0 candidate",
        "current_contract_impact: none",
        "---",
        "",
        "Future decision.",
        "",
      ].join("\n"),
    );

    const staleFailures = [];
    const staleResult = await validateReleaseState(staleFailures, root, version);
    assert(staleResult.active, "release-state validator did not activate for a packaged release");
    assert(
      hasFailure(staleFailures, "stale released-state claim (implemented-locally)"),
      "release-state validator missed a case-and-whitespace variant of implemented locally",
    );
    assert(
      hasFailure(staleFailures, "status must be implemented or superseded"),
      "release-state validator accepted an already-packaged decision in planning state",
    );
    assert(
      !staleFailures.some((failure) => failure.includes("future.md")),
      "release-state validator rejected a future-version accepted-direction decision",
    );

    await writeFile(path.join(root, "docs/llms.txt"), `v${version} is released.\n`);
    await writeFile(
      path.join(root, "reference/decisions/current.md"),
      [
        "---",
        "title: Current decision",
        "status: implemented",
        "implementation_target: v0.6.0",
        "current_contract_impact: implemented in v0.6.0",
        "---",
        "",
        "Current decision.",
        "",
      ].join("\n"),
    );
    const validFailures = [];
    await validateReleaseState(validFailures, root, version);
    assert(
      validFailures.length === 0,
      `release-state validator rejected a legitimate released/future-decision corpus: ${validFailures.join(" | ")}`,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function testReleaseStateImportGuard() {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", "await import('./scripts/validate-release-state.mjs')"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert(
    result.status === 0,
    `release-state validator cannot be imported without a CLI argv[1]: ${result.stderr || result.stdout}`,
  );
}

function testVersionSyncImportGuard() {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", "await import('./scripts/sync-version.mjs')"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert(
    result.status === 0,
    `version synchronizer cannot be imported without a CLI argv[1]: ${result.stderr || result.stdout}`,
  );
}

function testRepoContractsImportGuard() {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", "await import('./scripts/validate-repo-contracts.mjs')"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert(
    result.status === 0,
    `repo contract validator cannot be imported without a CLI argv[1]: ${result.stderr || result.stdout}`,
  );
}

function testAppliesToRanges() {
  // The pinned form keeps working: it is what every adopter published before
  // ranges existed, and it must stay exactly as narrow as it always was.
  assert(satisfies("obligation-first 0.4.x", "0.4.3"), "pinned form should accept its own minor");
  assert(!satisfies("obligation-first 0.4.x", "0.5.0"), "pinned form should reject the next minor");
  assert(!satisfies("obligation-first 0.5.x", "0.4.3"), "pinned form should reject an older minor");

  // The range form is the point: an adopter that uses nothing new in 0.5.0
  // rides the bump instead of going red in lockstep.
  assert(satisfies("obligation-first >=0.4.0 <0.6.0", "0.4.3"), "range should accept its floor minor");
  assert(satisfies("obligation-first >=0.4.0 <0.6.0", "0.5.0"), "range should ride an additive bump");
  assert(!satisfies("obligation-first >=0.4.0 <0.6.0", "0.6.0"), "range should reject at its ceiling");
  assert(!satisfies("obligation-first >=0.5.0 <0.6.0", "0.4.3"), "range floor should reject older checkouts");

  // Patch-level comparison, not just major.minor.
  assert(satisfies("obligation-first >=0.4.3", "0.4.3"), ">= should be inclusive at the patch level");
  assert(!satisfies("obligation-first >=0.4.4", "0.4.3"), ">= should compare patch versions");

  // Unparseable input must fail closed rather than pass silently.
  assert(!satisfies("obligation-first 0.4", "0.4.3"), "a bare major.minor is not a range");
  assert(!satisfies("something-else 0.4.x", "0.4.3"), "a profile naming another spec should not satisfy");
  assert(!satisfies(undefined, "0.4.3"), "a missing appliesTo should not satisfy");
}

testAppliesToRanges();
await testReleasePackageStaleHash();
await testReleasePackageExactInventory();
testPatchReleaseCompatibility();
await testPublicProbeUsesCanonicalInventory();
await testAssistantGuideByteIdentity();
await testInternalHtmlLinks();
await testPublishingSurfaceCoverage();
await testManifestStaleHash();
await testReleasedStateClaims();
testReleaseStateImportGuard();
testVersionSyncImportGuard();
testRepoContractsImportGuard();

if (failures.length > 0) {
  console.log("Hardening regression checks failed:");
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}

console.log("Hardening regression checks passed.");

// Cross-repository semantics are tested with synthetic, redistributable fixtures.
await import("./test-semantic-federation.mjs");
await import("./test-relation-coverage.mjs");
await import("./test-scope-contract.mjs");
await import("./test-qualified-time.mjs");
await import("./test-implementation-status.mjs");

await import("./test-vocabulary.mjs");

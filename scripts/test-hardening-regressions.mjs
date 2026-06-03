#!/usr/bin/env node
/**
 * Focused security hardening regressions for verifier-visible behavior.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { validateRecordGraph } from "./lib/adopter-kit.mjs";
import { validateExampleRecordSet } from "./validate-example-graphs.mjs";
import { validateAssistantGuide, validateReleasePackage } from "./validate-repo-contracts.mjs";
import { validateHashManifest } from "./validate-hashes.mjs";
import { versionForms } from "./sync-version.mjs";

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function hasFailure(items, needle) {
  return items.some((item) => item.includes(needle));
}

function stableFailures(items) {
  return [...items].sort().join("\n");
}

function determination(overrides = {}) {
  return {
    "@id": "https://example.com/determination",
    "@type": "of:Determination",
    disposition: "issued",
    decides: [],
    ...overrides,
  };
}

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
          artifacts: [{ path: "artifact.txt", sha256: stale }],
        },
        null,
        2,
      )}\n`,
    );
    await writeFile(path.join(releaseDir, "sha256.txt"), `${stale}  artifact.txt\n`);

    const releaseFailures = [];
    await validateReleasePackage(releaseFailures, root);
    assert(
      hasFailure(releaseFailures, "stale sha256 for artifact.txt"),
      "release package validator accepted a stale artifact hash",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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

await testReleasePackageStaleHash();
await testAssistantGuideByteIdentity();
await testManifestStaleHash();

if (failures.length > 0) {
  console.log("Hardening regression checks failed:");
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}

console.log("Hardening regression checks passed.");

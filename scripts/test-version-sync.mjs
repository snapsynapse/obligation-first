#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile, copyFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STATUS_SURFACES,
  VERSION_SURFACES,
  checkVersions,
  implementationSummary,
  rewriteManagedBlock,
  syncVersion,
} from "./sync-version.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTRA_FILES = [
  "package.json",
  "schema/context.jsonld",
  "docs/v1/context.jsonld",
  "docs/agents.json",
  "assistant-guide.txt",
  "docs/.well-known/assistant-guide.txt",
  "reference/implementation-status.json",
  "docs/evaluation-status.json",
];
const FIXTURE_FILES = [...new Set([
  ...VERSION_SURFACES.map(([file]) => file),
  ...STATUS_SURFACES.map(([file]) => file),
  ...EXTRA_FILES,
])].sort();

async function copyFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "of-version-sync-"));
  for (const file of FIXTURE_FILES) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await copyFile(path.join(repoRoot, file), path.join(root, file));
  }
  const historical = "docs/releases/v0.6.6/manifest.json";
  await mkdir(path.dirname(path.join(root, historical)), { recursive: true });
  await writeFile(path.join(root, historical), "{\n  \"frozen\": true\n}\n");
  return { root, historical };
}

async function setVersion(root, version) {
  const file = path.join(root, "package.json");
  const pkg = JSON.parse(await readFile(file, "utf8"));
  pkg.version = version;
  await writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function snapshot(root) {
  const files = [...FIXTURE_FILES, "docs/releases/v0.6.6/manifest.json"];
  return new Map(await Promise.all(files.map(async (file) => [file, await readFile(path.join(root, file), "utf8")])));
}

async function assertSnapshot(root, expected, message) {
  for (const [file, content] of expected) {
    assert.equal(await readFile(path.join(root, file), "utf8"), content, `${message}: ${file}`);
  }
}

async function assertDrift(root, mutate, pattern) {
  await mutate();
  const problems = await checkVersions(root, { date: "2026-09-13" });
  assert.match(problems.join("\n"), pattern);
  await syncVersion(root, "2026-09-13");
}

async function assertAtomicProducerFailure(mutate, pattern) {
  const { root } = await copyFixture();
  try {
    await mutate(root);
    const before = await snapshot(root);
    await assert.rejects(syncVersion(root, "2026-09-13"), pattern);
    await assertSnapshot(root, before, "producer validation must finish before any write");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function testManagedBlockFailures() {
  const options = { startMarker: "<!-- start -->", endMarker: "<!-- end -->", replacement: "expected" };
  assert.match(rewriteManagedBlock("<!-- end -->", options).problem, /start.*found 0/);
  assert.match(rewriteManagedBlock("<!-- start -->\nold\n<!-- start -->\n<!-- end -->", options).problem, /start.*found 2/);
  assert.match(rewriteManagedBlock("<!-- start -->\n<!-- end -->\n<!-- end -->", options).problem, /end.*found 2/);
  assert.match(rewriteManagedBlock("<!-- end -->\n<!-- start -->", options).problem, /end marker must follow/);
  assert.equal(rewriteManagedBlock("<!-- start -->\nold\n<!-- end -->", options).content, "<!-- start -->\nexpected\n<!-- end -->");
}

async function testPatchSyncAndDrift() {
  const { root, historical } = await copyFixture();
  try {
    await setVersion(root, "0.6.7");
    const frozen = await readFile(path.join(root, historical), "utf8");
    await syncVersion(root, "2026-09-13");
    assert.deepEqual(await checkVersions(root, { date: "2026-09-13" }), []);
    assert.deepEqual(await checkVersions(root), [], "MANIFEST.yaml bundle_date is the default check date");

    const manifest = await readFile(path.join(root, "MANIFEST.yaml"), "utf8");
    assert.match(manifest, /^bundle_version: 0\.6\.7$/m);
    assert.match(manifest, /^bundle_date: 2026-09-13$/m);

    const canonicalStatus = await readFile(path.join(root, "reference/implementation-status.json"), "utf8");
    const servedStatus = await readFile(path.join(root, "docs/evaluation-status.json"), "utf8");
    assert.equal(servedStatus, canonicalStatus, "served status must be a byte-identical mirror");
    assert.deepEqual(
      { version: JSON.parse(canonicalStatus).released_reference_version, date: JSON.parse(canonicalStatus).status_as_of },
      { version: "0.6.7", date: "2026-09-13" },
    );

    const summary = implementationSummary("0.6.7");
    for (const [file] of STATUS_SURFACES) {
      assert.match(await readFile(path.join(root, file), "utf8"), new RegExp(summary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    const homepage = await readFile(path.join(root, "docs/index.html"), "utf8");
    assert.match(homepage, /article:modified_time" content="2026-09-13T/);
    assert.match(homepage, /"dateModified": "2026-09-13"/);
    assert.match(homepage, /Updated <time datetime="2026-09-13">September 13, 2026<\/time>/);
    assert.match(homepage, /Last revision: <time datetime="2026-09-13">2026-09-13<\/time>/);
    assert.equal(await readFile(path.join(root, historical), "utf8"), frozen, "historical release artifacts must remain unchanged");

    const first = await snapshot(root);
    await syncVersion(root, "2026-09-13");
    await assertSnapshot(root, first, "sync must be idempotent");

    await assertDrift(root, async () => {
      const file = path.join(root, "MANIFEST.yaml");
      await writeFile(file, (await readFile(file, "utf8")).replace("bundle_date: 2026-09-13", "bundle_date: 2026-09-12"));
    }, /MANIFEST\.yaml/);
    await assertDrift(root, async () => {
      const file = path.join(root, "reference/implementation-status.json");
      await writeFile(file, (await readFile(file, "utf8")).replace('"status_as_of": "2026-09-13"', '"status_as_of": "2026-09-12"'));
    }, /reference\/implementation-status\.json/);
    await assertDrift(root, async () => {
      const file = path.join(root, "docs/evaluation-status.json");
      await writeFile(file, `${(await readFile(file, "utf8")).trimEnd()} \n`);
    }, /docs\/evaluation-status\.json/);
    await assertDrift(root, async () => {
      const file = path.join(root, "docs/index.html");
      await writeFile(file, (await readFile(file, "utf8")).replace('"dateModified": "2026-09-13"', '"dateModified": "2026-09-12"'));
    }, /docs\/index\.html/);
    await assertDrift(root, async () => {
      const file = path.join(root, "README.md");
      await writeFile(file, (await readFile(file, "utf8")).replace("The v0.6.7 reference package", "The v0.6.6 reference package"));
    }, /README\.md/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testInvalidDateIsAtomic() {
  const { root } = await copyFixture();
  try {
    const before = await snapshot(root);
    await assert.rejects(syncVersion(root, "2026-02-30"), /real YYYY-MM-DD calendar date/);
    await assertSnapshot(root, before, "invalid date must fail before writing");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testMalformedSurfacesAreAtomic() {
  await assertAtomicProducerFailure(async (root) => {
    const file = path.join(root, "README.md");
    await writeFile(file, (await readFile(file, "utf8")).replace("<!-- implementation-status:start -->", "<!-- implementation-status:removed -->"));
  }, /expected exactly one marker, found 0/);
  await assertAtomicProducerFailure(async (root) => {
    const file = path.join(root, "README.md");
    await writeFile(file, (await readFile(file, "utf8")).replace("<!-- implementation-status:start -->", "<!-- implementation-status:start -->\n<!-- implementation-status:start -->"));
  }, /expected exactly one marker, found 2/);
  await assertAtomicProducerFailure(async (root) => {
    const file = path.join(root, "MANIFEST.yaml");
    await writeFile(file, (await readFile(file, "utf8")).replace(/^bundle_date:.*$/m, "bundle_date: 2026-09-12\nbundle_date: 2026-09-12"));
  }, /expected exactly one bundle_date field, found 2/);
  await assertAtomicProducerFailure(async (root) => {
    const file = path.join(root, "docs/index.html");
    await writeFile(file, (await readFile(file, "utf8")).replace("article:modified_time", "article:removed_time"));
  }, /expected exactly one article:modified_time date surface, found 0/);
}

async function testMinorGuideAuthority() {
  const { root, historical } = await copyFixture();
  try {
    await setVersion(root, "0.7.0");
    const semanticStatusBefore = JSON.parse(await readFile(path.join(root, "reference/implementation-status.json"), "utf8"));
    delete semanticStatusBefore.released_reference_version;
    delete semanticStatusBefore.status_as_of;
    const before = await snapshot(root);
    await assert.rejects(syncVersion(root, "2026-10-01"), /update the guide only with guide authority/);
    await assertSnapshot(root, before, "unsupported minor guide range must fail before writing");
    assert.match((await checkVersions(root, { date: "2026-10-01" })).join("\n"), /expected current-minor guide scope/);

    for (const file of ["assistant-guide.txt", "docs/.well-known/assistant-guide.txt"]) {
      const target = path.join(root, file);
      await writeFile(target, (await readFile(target, "utf8")).replace(">=0.6.0 <0.7.0", ">=0.7.0 <0.8.0"));
    }
    const frozen = await readFile(path.join(root, historical), "utf8");
    await syncVersion(root, "2026-10-01");
    assert.deepEqual(await checkVersions(root, { date: "2026-10-01" }), []);
    const semanticStatusAfter = JSON.parse(await readFile(path.join(root, "reference/implementation-status.json"), "utf8"));
    delete semanticStatusAfter.released_reference_version;
    delete semanticStatusAfter.status_as_of;
    assert.deepEqual(semanticStatusAfter, semanticStatusBefore, "version sync must not infer new semantic implementation status");
    assert.equal(await readFile(path.join(root, historical), "utf8"), frozen);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

testManagedBlockFailures();
await testPatchSyncAndDrift();
await testInvalidDateIsAtomic();
await testMalformedSurfacesAreAtomic();
await testMinorGuideAuthority();
console.log("version sync tests passed: patch/minor, dates, status mirror, markers, drift, idempotence, and historical immutability");

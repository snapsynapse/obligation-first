#!/usr/bin/env node

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadRecordDir, validateAdopterExport, writeAdopterExport } from "./lib/adopter-kit.mjs";

const tmp = await mkdtemp(path.join(os.tmpdir(), "of-adopter-kit-"));

try {
  const entries = await loadRecordDir("examples/publedge-jia-utah-72/records", { root: process.cwd() });
  const recordsByKind = {
    authorities: entries.filter((entry) => entry.record["@type"] === "of:Authority").map((entry) => entry.record),
    instruments: entries.filter((entry) => entry.record["@type"] === "of:Instrument").map((entry) => entry.record),
    terms: entries.filter((entry) => entry.record["@type"] === "of:Term").map((entry) => entry.record),
    obligations: entries.filter((entry) => entry.record["@type"] === "of:Requirement").map((entry) => entry.record),
    determinations: entries.filter((entry) => entry.record["@type"] === "of:Determination").map((entry) => entry.record),
  };

  const apiDir = path.join(tmp, "docs", "api", "v1", "of");
  await writeFile(path.join(tmp, "stale-root.txt"), "keep\n");
  await writeAdopterExport({ recordsByKind, apiDir, docsDir: path.join(tmp, "docs") });
  await writeFile(path.join(apiDir, "records", "stale.json"), "{}\n");

  const result = await writeAdopterExport({ recordsByKind, apiDir, docsDir: path.join(tmp, "docs") });
  if (result.recordCount !== entries.length) {
    throw new Error(`Expected ${entries.length} flat records, wrote ${result.recordCount}`);
  }
  const exportFailures = await validateAdopterExport({ apiDir, docsDir: path.join(tmp, "docs") });
  if (exportFailures.length) {
    throw new Error(`Expected clean export, found:\n${exportFailures.join("\n")}`);
  }

  const index = JSON.parse(await readFile(path.join(apiDir, "index.json"), "utf8"));
  if (index.counts.terms !== 1 || index.counts.obligations !== 1) {
    throw new Error("Unexpected aggregate counts in generated index");
  }

  try {
    await readFile(path.join(apiDir, "records", "stale.json"), "utf8");
    throw new Error("Stale flat record survived clean export");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  await writeFile(path.join(apiDir, "records", "stale.json"), "{}\n");
  const staleFailures = await validateAdopterExport({ apiDir, docsDir: path.join(tmp, "docs") });
  if (!staleFailures.some((failure) => failure.includes("stale flat record"))) {
    throw new Error("Export validator did not catch stale flat record");
  }

  console.log("Adopter-kit writer helpers are clean-export safe.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}

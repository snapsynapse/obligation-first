#!/usr/bin/env node
/**
 * Validate semantic links inside each worked-example record set.
 *
 * JSON Schema catches record shape. This catches graph drift: dangling local
 * references, wrong target classes, broken spine reciprocity, and proceeding
 * strand mistakes that still look valid as isolated JSON.
 */

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const examplesDir = path.join(repoRoot, "examples");

const OBLIGATION_TYPES = new Set([
  "of:Requirement",
  "of:Restriction",
  "of:Permission",
  "of:Reparation",
]);

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function isType(record, expected) {
  if (expected === "of:Obligation") return OBLIGATION_TYPES.has(record?.["@type"]);
  return record?.["@type"] === expected;
}

async function* walkRecordDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    const recordsDir = path.join(p, "records");
    try {
      await readdir(recordsDir);
      yield recordsDir;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}

async function loadRecords(recordsDir) {
  const entries = await readdir(recordsDir, { withFileTypes: true });
  const records = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const file = path.join(recordsDir, entry.name);
    const record = JSON.parse(await readFile(file, "utf8"));
    records.push({ file, rel: path.relative(repoRoot, file), record });
  }
  return records;
}

function validateReference({ from, field, targetId, expectedType, byId, failures, required = true }) {
  const target = byId.get(targetId);
  if (!target) {
    if (required) failures.push(`${from.rel}: ${field} points to missing local record ${targetId}`);
    return undefined;
  }
  if (!isType(target.record, expectedType)) {
    failures.push(
      `${from.rel}: ${field} points to ${targetId} (${target.record["@type"]}), expected ${expectedType}`,
    );
  }
  return target;
}

function validateRecordSet(recordsDir, entries) {
  const failures = [];
  const byId = new Map();

  for (const entry of entries) {
    const id = entry.record["@id"];
    if (byId.has(id)) {
      failures.push(`${entry.rel}: duplicate @id also used by ${byId.get(id).rel}`);
    }
    byId.set(id, entry);
  }

  for (const entry of entries) {
    const { record } = entry;
    const type = record["@type"];

    for (const targetId of asArray(record.issuedBy)) {
      validateReference({ from: entry, field: "issuedBy", targetId, expectedType: "of:Authority", byId, failures });
    }

    if (record.authority_basis?.instrument_ref && byId.has(record.authority_basis.instrument_ref)) {
      validateReference({
        from: entry,
        field: "authority_basis.instrument_ref",
        targetId: record.authority_basis.instrument_ref,
        expectedType: "of:Instrument",
        byId,
        failures,
      });
    }

    for (const targetId of asArray(record.hasTerm)) {
      const target = validateReference({ from: entry, field: "hasTerm", targetId, expectedType: "of:Term", byId, failures });
      if (target && target.record.parent_instrument !== record["@id"]) {
        failures.push(`${entry.rel}: hasTerm ${targetId} does not point back via parent_instrument`);
      }
    }

    for (const targetId of asArray(record.parent_instrument)) {
      validateReference({ from: entry, field: "parent_instrument", targetId, expectedType: "of:Instrument", byId, failures });
    }

    for (const targetId of asArray(record.creates)) {
      const target = validateReference({ from: entry, field: "creates", targetId, expectedType: "of:Obligation", byId, failures });
      if (target && target.record.created_by !== record["@id"]) {
        failures.push(`${entry.rel}: creates ${targetId} does not point back via created_by`);
      }
    }

    for (const targetId of asArray(record.created_by)) {
      validateReference({ from: entry, field: "created_by", targetId, expectedType: "of:Term", byId, failures });
    }

    for (const targetId of asArray(record.hasAllegation)) {
      validateReference({
        from: entry,
        field: "hasAllegation",
        targetId,
        expectedType: "of:Allegation",
        byId,
        failures,
      });
    }

    for (const targetId of asArray(record.hasDetermination)) {
      validateReference({
        from: entry,
        field: "hasDetermination",
        targetId,
        expectedType: "of:Determination",
        byId,
        failures,
      });
    }

    for (const targetId of asArray(record.decides)) {
      validateReference({ from: entry, field: "decides", targetId, expectedType: "of:Allegation", byId, failures });
    }

    for (const targetId of asArray(record.target_instrument)) {
      validateReference({
        from: entry,
        field: "target_instrument",
        targetId,
        expectedType: "of:Instrument",
        byId,
        failures,
      });
    }

    for (const targetId of asArray(record.triggers_on_violation_of)) {
      if (targetId === record["@id"]) {
        failures.push(`${entry.rel}: triggers_on_violation_of cannot point to itself`);
      }
      validateReference({
        from: entry,
        field: "triggers_on_violation_of",
        targetId,
        expectedType: "of:Obligation",
        byId,
        failures,
      });
    }

    for (const targetId of asArray(record.enforcement_authority)) {
      validateReference({
        from: entry,
        field: "enforcement_authority",
        targetId,
        expectedType: "of:Authority",
        byId,
        failures,
      });
    }

    for (const targetId of asArray(record.supersedes)) {
      validateReference({ from: entry, field: "supersedes", targetId, expectedType: "of:Instrument", byId, failures });
    }

    for (const targetId of asArray(record.wouldSupersede)) {
      validateReference({
        from: entry,
        field: "wouldSupersede",
        targetId,
        expectedType: "of:Instrument",
        byId,
        failures,
      });
    }

    for (const targetId of asArray(record.defeats)) {
      validateReference({ from: entry, field: "defeats", targetId, expectedType: "of:Term", byId, failures });
    }

    for (const targetId of asArray(record.anchors)) {
      if (!byId.has(targetId)) continue;
      const expected = type === "of:Term" ? "of:Term" : "of:Obligation";
      validateReference({ from: entry, field: "anchors", targetId, expectedType: expected, byId, failures });
    }

    if (type === "of:Determination") {
      const decides = asArray(record.decides);
      if (record.disposition === "issued") {
        if (decides.length > 0) {
          failures.push(`${entry.rel}: disposition issued should not decide Allegations`);
        }
        if (!record.target_instrument && asArray(record.anchors).length === 0) {
          failures.push(`${entry.rel}: disposition issued needs target_instrument or anchors`);
        }
      } else if (decides.length === 0) {
        failures.push(`${entry.rel}: adjudicative disposition ${record.disposition} needs at least one decides target`);
      }
    }

    if (type === "of:Instrument" && record.wouldSupersede) {
      const allowed = new Set(["proposed", "amended"]);
      if (!allowed.has(record.status)) {
        failures.push(`${entry.rel}: wouldSupersede should only appear on proposed or amended Instruments`);
      }
    }
  }

  for (const proceeding of entries.filter((entry) => entry.record["@type"] === "of:Proceeding")) {
    const allegations = new Set(asArray(proceeding.record.hasAllegation));
    for (const determinationId of asArray(proceeding.record.hasDetermination)) {
      const determination = byId.get(determinationId);
      if (!determination) continue;
      for (const allegationId of asArray(determination.record.decides)) {
        if (!allegations.has(allegationId)) {
          failures.push(`${proceeding.rel}: Determination ${determinationId} decides ${allegationId}, not listed in hasAllegation`);
        }
      }
    }
  }

  for (const instrument of entries.filter((entry) => entry.record["@type"] === "of:Instrument")) {
    if (instrument.record.enforcement_status !== "constrained") continue;

    const obligationIds = new Set();
    for (const termId of asArray(instrument.record.hasTerm)) {
      const term = byId.get(termId);
      for (const obligationId of asArray(term?.record.creates)) {
        obligationIds.add(obligationId);
      }
    }

    const hasAnchoredDetermination = entries.some((entry) => {
      if (entry.record["@type"] !== "of:Determination") return false;
      return asArray(entry.record.anchors).some((anchor) => obligationIds.has(anchor));
    });

    if (!hasAnchoredDetermination) {
      failures.push(`${instrument.rel}: constrained enforcement_status needs a Determination anchored to one of its Obligations`);
    }
  }

  return {
    rel: path.relative(repoRoot, recordsDir),
    failures,
    count: entries.length,
  };
}

const results = [];
for await (const recordsDir of walkRecordDirs(examplesDir)) {
  const entries = await loadRecords(recordsDir);
  results.push(validateRecordSet(recordsDir, entries));
}

let failed = 0;
for (const result of results) {
  if (result.failures.length === 0) {
    console.log(`✓ ${result.rel} (${result.count} records)`);
    continue;
  }

  failed++;
  console.log(`✗ ${result.rel}:`);
  for (const failure of result.failures) {
    console.log(`    ${failure}`);
  }
}

console.log(`\n${results.length - failed}/${results.length} record sets semantically valid`);
process.exit(failed > 0 ? 1 : 0);

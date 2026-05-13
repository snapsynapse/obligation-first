import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const OF_CONTEXT = "https://obligationfirst.org/v1/";

export const OBLIGATION_TYPES = new Set([
  "of:Requirement",
  "of:Restriction",
  "of:Permission",
  "of:Reparation",
]);

export const TYPE_TO_SCHEMA = {
  "of:Authority": "authority.schema.json",
  "of:Instrument": "instrument.schema.json",
  "of:Term": "term.schema.json",
  "of:Requirement": "obligation.schema.json",
  "of:Restriction": "obligation.schema.json",
  "of:Permission": "obligation.schema.json",
  "of:Reparation": "obligation.schema.json",
  "of:Proceeding": "proceeding.schema.json",
  "of:Allegation": "allegation.schema.json",
  "of:Determination": "determination.schema.json",
};

export const DEFAULT_COMPANION_DIRS = {
  authorities: "authority",
  instruments: "instrument",
  terms: "term",
  obligations: "obligation",
  proceedings: "proceeding",
  allegations: "allegation",
  determinations: "determination",
};

export function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function isType(record, expected) {
  if (expected === "of:Obligation") return OBLIGATION_TYPES.has(record?.["@type"]);
  return record?.["@type"] === expected;
}

export async function loadJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function* walkJsonFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }

  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkJsonFiles(file);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      yield file;
    }
  }
}

export async function loadRecordDir(dir, { root = process.cwd() } = {}) {
  const entries = [];
  for await (const file of walkJsonFiles(dir)) {
    entries.push({
      file,
      rel: path.relative(root, file),
      record: await loadJson(file),
    });
  }
  return entries;
}

export async function loadSchemas(schemaDir) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);

  const schemaFiles = (await readdir(schemaDir)).filter((file) => file.endsWith(".schema.json"));
  const schemaByFile = {};

  for (const file of schemaFiles) {
    const schema = await loadJson(path.join(schemaDir, file));
    ajv.addSchema(schema, schema.$id);
    schemaByFile[file] = schema.$id;
  }

  return { ajv, schemaByFile };
}

export function validateRecordShapes(entries, { ajv, schemaByFile }) {
  const failures = [];

  for (const entry of entries) {
    const type = entry.record["@type"];
    if (!type) {
      failures.push({ entry, message: "missing @type", errors: [] });
      continue;
    }

    const schemaFile = TYPE_TO_SCHEMA[type];
    if (!schemaFile) {
      failures.push({ entry, message: `no schema mapped for @type=${type}`, errors: [] });
      continue;
    }

    const validate = ajv.getSchema(schemaByFile[schemaFile]);
    if (!validate(entry.record)) {
      failures.push({ entry, message: `schema validation failed for ${type}`, errors: validate.errors || [] });
    }
  }

  return failures;
}

function validateReference({ from, field, targetId, expectedType, byId, failures, required = true }) {
  const target = byId.get(targetId);
  if (!target) {
    if (required) failures.push(`${from.rel}: ${field} points to missing local record ${targetId}`);
    return undefined;
  }
  if (!isType(target.record, expectedType)) {
    failures.push(`${from.rel}: ${field} points to ${targetId} (${target.record["@type"]}), expected ${expectedType}`);
  }
  return target;
}

export function validateRecordGraph(entries) {
  const failures = [];
  const byId = new Map();

  for (const entry of entries) {
    const id = entry.record["@id"];
    if (!id) {
      failures.push(`${entry.rel}: missing @id`);
      continue;
    }
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
      validateReference({ from: entry, field: "hasAllegation", targetId, expectedType: "of:Allegation", byId, failures });
    }

    for (const targetId of asArray(record.hasDetermination)) {
      validateReference({ from: entry, field: "hasDetermination", targetId, expectedType: "of:Determination", byId, failures });
    }

    for (const targetId of asArray(record.decides)) {
      validateReference({ from: entry, field: "decides", targetId, expectedType: "of:Allegation", byId, failures });
    }

    for (const targetId of asArray(record.target_instrument)) {
      validateReference({ from: entry, field: "target_instrument", targetId, expectedType: "of:Instrument", byId, failures });
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
      validateReference({ from: entry, field: "enforcement_authority", targetId, expectedType: "of:Authority", byId, failures });
    }

    for (const targetId of asArray(record.supersedes)) {
      validateReference({ from: entry, field: "supersedes", targetId, expectedType: "of:Instrument", byId, failures });
    }

    for (const targetId of asArray(record.wouldSupersede)) {
      validateReference({ from: entry, field: "wouldSupersede", targetId, expectedType: "of:Instrument", byId, failures });
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
        if (decides.length > 0) failures.push(`${entry.rel}: disposition issued should not decide Allegations`);
      } else if (decides.length === 0) {
        failures.push(`${entry.rel}: adjudicative Determination should decide at least one Allegation`);
      }
    }
  }

  return failures;
}

async function cleanDir(dir, shouldClean) {
  if (shouldClean) await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

function recordFileStem(record) {
  if (record.id) return record.id;
  if (!record["@id"]) throw new Error("Cannot write record without id or @id");
  const urlPath = String(record["@id"]).split(/[?#]/)[0].replace(/\/$/, "");
  const base = urlPath.slice(urlPath.lastIndexOf("/") + 1);
  return base.endsWith(".json") ? base.slice(0, -5) : base;
}

export async function writeRecordBundle({
  recordsByKind,
  outDir,
  context = OF_CONTEXT,
  generated = new Date().toISOString(),
  clean = false,
}) {
  await cleanDir(outDir, clean);

  const files = {};
  const counts = {};
  for (const [kind, records] of Object.entries(recordsByKind)) {
    files[kind] = `${kind}.json`;
    counts[kind] = records.length;
    await writeFile(
      path.join(outDir, `${kind}.json`),
      `${JSON.stringify({ "@context": context, generated, [kind]: records }, null, 2)}\n`,
    );
  }

  const index = { "@context": context, generated, files, counts };
  await writeFile(path.join(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

export async function writeRecordFiles({ recordsByKind, outDir, clean = false }) {
  await cleanDir(outDir, clean);

  let count = 0;
  for (const records of Object.values(recordsByKind)) {
    for (const record of records) {
      await writeFile(path.join(outDir, `${recordFileStem(record)}.json`), `${JSON.stringify(record, null, 2)}\n`);
      count += 1;
    }
  }

  return count;
}

export async function writeCompanionRecords({
  recordsByKind,
  docsDir,
  companionDirs = DEFAULT_COMPANION_DIRS,
  clean = false,
}) {
  if (clean) {
    const dirs = new Set(Object.values(companionDirs).filter(Boolean));
    for (const dir of dirs) await rm(path.join(docsDir, dir), { recursive: true, force: true });
  }

  let count = 0;
  for (const [kind, records] of Object.entries(recordsByKind)) {
    const dir = companionDirs[kind];
    if (!dir) continue;
    const targetDir = path.join(docsDir, dir);
    await mkdir(targetDir, { recursive: true });
    for (const record of records) {
      await writeFile(path.join(targetDir, `${recordFileStem(record)}.json`), `${JSON.stringify(record, null, 2)}\n`);
      count += 1;
    }
  }

  return count;
}

export async function writeAdopterExport({
  recordsByKind,
  apiDir,
  docsDir,
  context = OF_CONTEXT,
  generated = new Date().toISOString(),
  clean = true,
  recordsSubdir = "records",
  companionDirs = DEFAULT_COMPANION_DIRS,
}) {
  const index = await writeRecordBundle({ recordsByKind, outDir: apiDir, context, generated, clean });
  const recordCount = await writeRecordFiles({
    recordsByKind,
    outDir: path.join(apiDir, recordsSubdir),
    clean: true,
  });
  const companionCount = docsDir
    ? await writeCompanionRecords({ recordsByKind, docsDir, companionDirs, clean })
    : 0;

  return { index, recordCount, companionCount };
}

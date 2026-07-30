import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const OF_CONTEXT = "https://obligationfirst.org/v1/context.jsonld";

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
  "of:ObligationCategory": "obligation-category.schema.json",
  "of:Proceeding": "proceeding.schema.json",
  "of:Allegation": "allegation.schema.json",
  "of:Determination": "determination.schema.json",
};

export const DEFAULT_COMPANION_DIRS = {
  authorities: "authority",
  instruments: "instrument",
  terms: "term",
  obligations: "obligation",
  obligationCategories: "obligation-category",
  proceedings: "proceeding",
  allegations: "allegation",
  determinations: "determination",
};

export function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

export function isType(record, expected) {
  // An array means "any of these" — used where a predicate accepts more than
  // one range, e.g. anchors, which may point at an Obligation or at the
  // ObligationCategory that Obligation is classified under.
  if (Array.isArray(expected)) return expected.some((one) => isType(record, one));
  if (expected === "of:Obligation") return OBLIGATION_TYPES.has(record?.["@type"]);
  return record?.["@type"] === expected;
}

export async function loadJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

// File stems become path.join(outDir, `${stem}.json`) in the writers below, so
// a stem carrying a separator or ".." would escape the export directory.
function assertSafeFileStem(stem, source) {
  const value = String(stem);
  if (!value || value.includes("/") || value.includes("\\") || value.includes("..")) {
    throw new Error(`unsafe record file stem from ${source}: ${JSON.stringify(value)} (must not contain "/", "\\\\", or "..")`);
  }
  return value;
}

export function recordFileStem(record) {
  if (record.id) return assertSafeFileStem(record.id, "id");
  if (!record["@id"]) throw new Error("Cannot write record without id or @id");
  const urlPath = String(record["@id"]).split(/[?#]/)[0].replace(/\/$/, "");
  const base = urlPath.slice(urlPath.lastIndexOf("/") + 1);
  return assertSafeFileStem(base.endsWith(".json") ? base.slice(0, -5) : base, "@id");
}

export async function* walkJsonFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      // A missing records directory must be a hard error: silently yielding
      // nothing lets "validated 0 records" masquerade as a green run.
      const missing = new Error(`records directory not found: ${dir}`);
      missing.code = "ENOENT";
      throw missing;
    }
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
    const context = entry.record["@context"];
    const hasCanonicalContext =
      context === OF_CONTEXT ||
      (Array.isArray(context) && context.includes(OF_CONTEXT));
    if (!hasCanonicalContext) {
      failures.push({
        entry,
        message: `@context must reference ${OF_CONTEXT}`,
        errors: [],
      });
      continue;
    }

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
    const expected = Array.isArray(expectedType) ? expectedType.join(" or ") : expectedType;
    failures.push(`${from.rel}: ${field} points to ${targetId} (${target.record["@type"]}), expected ${expected}`);
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
      // A Term interprets another Term. Everything else interprets either a
      // specific Obligation or the Category that Obligation sits under: a
      // ruling about a named statutory duty anchors the Obligation, a ruling
      // about the duty concept generally anchors the Category.
      const expected = type === "of:Term" ? "of:Term" : ["of:Obligation", "of:ObligationCategory"];
      validateReference({ from: entry, field: "anchors", targetId, expectedType: expected, byId, failures });
    }

    if (type === "of:Determination") {
      const decides = asArray(record.decides);
      if (record.disposition === "issued") {
        if (decides.length > 0) failures.push(`${entry.rel}: disposition issued should not decide Allegations`);
        if (!record.target_instrument && asArray(record.anchors).length === 0) {
          failures.push(`${entry.rel}: disposition issued needs target_instrument or anchors`);
        }
      } else if (decides.length === 0) {
        failures.push(`${entry.rel}: adjudicative Determination should decide at least one Allegation`);
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

  return failures;
}

async function cleanDir(dir, shouldClean) {
  if (shouldClean) await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
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

export async function validateAdopterExport({
  apiDir,
  recordsSubdir = "records",
  docsDir,
  companionDirs = DEFAULT_COMPANION_DIRS,
}) {
  const failures = [];
  const indexPath = path.join(apiDir, "index.json");
  let index;

  try {
    index = await loadJson(indexPath);
  } catch {
    return [`missing export index ${indexPath}`];
  }

  const recordsDir = path.join(apiDir, recordsSubdir);
  const expectedFlatFiles = new Set();
  const expectedCompanionFiles = new Map();
  for (const dir of Object.values(companionDirs).filter(Boolean)) expectedCompanionFiles.set(dir, new Set());

  for (const [kind, fileName] of Object.entries(index.files || {})) {
    const aggregatePath = path.join(apiDir, fileName);
    let aggregate;
    try {
      aggregate = await loadJson(aggregatePath);
    } catch {
      failures.push(`missing aggregate file ${aggregatePath}`);
      continue;
    }

    const records = aggregate[kind] || [];
    if (index.counts?.[kind] !== records.length) {
      failures.push(`${kind} count is ${index.counts?.[kind]}, expected ${records.length}`);
    }

    for (const record of records) {
      let stem;
      try {
        stem = recordFileStem(record);
      } catch (err) {
        failures.push(`${kind} record cannot be written: ${err.message}`);
        continue;
      }

      const flatName = `${stem}.json`;
      expectedFlatFiles.add(flatName);
      const flatPath = path.join(recordsDir, flatName);
      try {
        const flatRecord = await loadJson(flatPath);
        if (stableJson(flatRecord) !== stableJson(record)) failures.push(`flat record differs from aggregate ${flatPath}`);
      } catch {
        failures.push(`missing flat record ${flatPath}`);
      }

      if (docsDir) {
        const companionDir = companionDirs[kind];
        if (!companionDir) continue;
        expectedCompanionFiles.get(companionDir)?.add(flatName);
        const companionPath = path.join(docsDir, companionDir, flatName);
        try {
          const companionRecord = await loadJson(companionPath);
          if (stableJson(companionRecord) !== stableJson(record)) {
            failures.push(`companion record differs from aggregate ${companionPath}`);
          }
        } catch {
          failures.push(`missing companion record ${companionPath}`);
        }
      }
    }
  }

  try {
    for (const entry of await readdir(recordsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".json") && !expectedFlatFiles.has(entry.name)) {
        failures.push(`stale flat record ${path.join(recordsDir, entry.name)}`);
      }
    }
  } catch {
    failures.push(`missing flat records directory ${recordsDir}`);
  }

  if (docsDir) {
    for (const [dir, expectedFiles] of expectedCompanionFiles) {
      const companionDir = path.join(docsDir, dir);
      let entries;
      try {
        entries = await readdir(companionDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".json") && !expectedFiles.has(entry.name)) {
          failures.push(`stale companion record ${path.join(companionDir, entry.name)}`);
        }
      }
    }
  }

  return failures;
}

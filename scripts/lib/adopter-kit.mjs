import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const OF_CONTEXT = "https://obligationfirst.org/v1/context.jsonld";

export const OBLIGATION_TYPES = new Set([
  "of:Obligation",
  "of:Requirement",
  "of:Restriction",
  "of:Permission",
  "of:Reparation",
]);

export const TYPE_TO_SCHEMA = {
  "of:Authority": "authority.schema.json",
  "of:Jurisdiction": "jurisdiction.schema.json",
  "of:Party": "party.schema.json",
  "of:Instrument": "instrument.schema.json",
  "of:Term": "term.schema.json",
  "of:Obligation": "obligation.schema.json",
  "of:Requirement": "obligation.schema.json",
  "of:Restriction": "obligation.schema.json",
  "of:Permission": "obligation.schema.json",
  "of:Reparation": "obligation.schema.json",
  "of:ObligationCategory": "obligation-category.schema.json",
  "of:Proceeding": "proceeding.schema.json",
  "of:Allegation": "allegation.schema.json",
  "of:Determination": "determination.schema.json",
  "of:Tombstone": "tombstone.schema.json",
};

export const DEFAULT_COMPANION_DIRS = {
  authorities: "authority",
  jurisdictions: "jurisdiction",
  parties: "party",
  instruments: "instrument",
  terms: "term",
  obligations: "obligation",
  obligationCategories: "obligation-category",
  proceedings: "proceeding",
  allegations: "allegation",
  determinations: "determination",
  tombstones: "tombstone",
};

export const GRAPH_DIAGNOSTIC_CODES = Object.freeze({
  MISSING_ID: "OF-GRAPH-MISSING-ID",
  DUPLICATE_ID: "OF-GRAPH-DUPLICATE-ID",
  MISSING_LOCAL_REFERENCE: "OF-GRAPH-MISSING-LOCAL-REFERENCE",
  WRONG_REFERENCE_TYPE: "OF-GRAPH-WRONG-REFERENCE-TYPE",
  INVALID_FIELD_DOMAIN: "OF-GRAPH-INVALID-FIELD-DOMAIN",
  HAS_TERM_INVERSE: "OF-GRAPH-HAS-TERM-INVERSE",
  CREATES_INVERSE: "OF-GRAPH-CREATES-INVERSE",
  RECOGNIZES_INVERSE: "OF-GRAPH-RECOGNIZES-INVERSE",
  IMPOSES_INVERSE: "OF-GRAPH-IMPOSES-INVERSE",
  SELF_TRIGGER: "OF-GRAPH-SELF-TRIGGER",
  CATEGORY_EXACT_MATCH: "OF-GRAPH-CATEGORY-EXACT-MATCH",
  DUPLICATE_RELATION_ALIAS: "OF-GRAPH-DUPLICATE-RELATION-ALIAS",
  ISSUED_DETERMINATION_DECIDES: "OF-GRAPH-ISSUED-DETERMINATION-DECIDES",
  ISSUED_DETERMINATION_TARGET: "OF-GRAPH-ISSUED-DETERMINATION-TARGET",
  ADJUDICATIVE_DETERMINATION_DECIDES: "OF-GRAPH-ADJUDICATIVE-DETERMINATION-DECIDES",
  WOULD_SUPERSEDE_LIFECYCLE: "OF-GRAPH-WOULD-SUPERSEDE-LIFECYCLE",
  FUTURE_ENFORCEMENT: "OF-GRAPH-FUTURE-ENFORCEMENT",
  VOLUNTARY_ENFORCEMENT_BASIS: "OF-GRAPH-VOLUNTARY-ENFORCEMENT-BASIS",
  INACTIVE_ENFORCEMENT: "OF-GRAPH-INACTIVE-ENFORCEMENT",
  FUTURE_OPERATIVE: "OF-GRAPH-FUTURE-OPERATIVE",
  PROCEEDING_DETERMINATION_SCOPE: "OF-GRAPH-PROCEEDING-DETERMINATION-SCOPE",
  CONSTRAINED_ENFORCEMENT_EVIDENCE: "OF-GRAPH-CONSTRAINED-ENFORCEMENT-EVIDENCE",
  VACATED_DETERMINATION_RELATION: "OF-GRAPH-VACATED-DETERMINATION-RELATION",
  DEFEASIBILITY_CYCLE: "OF-GRAPH-DEFEASIBILITY-CYCLE",
});

export function formatGraphDiagnostic(diagnostic) {
  return `[${diagnostic.code}] ${diagnostic.message}`;
}

export function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function recordTypes(record) {
  return asArray(record?.["@type"]).filter((type) => typeof type === "string");
}

export function obligationFirstType(record) {
  return recordTypes(record).find((type) => Object.hasOwn(TYPE_TO_SCHEMA, type));
}

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

export function isType(record, expected) {
  // An array means "any of these" — used where a predicate accepts more than
  // one range, e.g. anchors, which may point at an Obligation or at the
  // ObligationCategory that Obligation is classified under.
  if (Array.isArray(expected)) return expected.some((one) => isType(record, one));
  const types = recordTypes(record);
  if (expected === "of:Obligation") return types.some((type) => OBLIGATION_TYPES.has(type));
  return types.includes(expected);
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

    const type = obligationFirstType(entry.record);
    if (!type) {
      const asserted = recordTypes(entry.record);
      failures.push({ entry, message: asserted.length ? `no Obligation-First type found in @type=${asserted.join(",")}` : "missing @type", errors: [] });
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

function validateReference({ from, field, targetId, expectedType, byId, fail, required = true }) {
  const target = byId.get(targetId);
  if (!target) {
    if (required) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.MISSING_LOCAL_REFERENCE,
        `${from.rel}: ${field} points to missing local record ${targetId}`,
        { rel: from.rel, field, target: targetId },
      );
    }
    return undefined;
  }
  if (!isType(target.record, expectedType)) {
    const expected = Array.isArray(expectedType) ? expectedType.join(" or ") : expectedType;
    fail(
      GRAPH_DIAGNOSTIC_CODES.WRONG_REFERENCE_TYPE,
      `${from.rel}: ${field} points to ${targetId} (${target.record["@type"]}), expected ${expected}`,
      { rel: from.rel, field, target: targetId, expected },
    );
  }
  return target;
}

export function validateRecordGraphDetailed(entries) {
  const failures = [];
  const byId = new Map();
  const fail = (code, message, details = {}) => failures.push({ code, message, ...details });

  for (const entry of entries) {
    const id = entry.record["@id"];
    if (!id) {
      fail(GRAPH_DIAGNOSTIC_CODES.MISSING_ID, `${entry.rel}: missing @id`, { rel: entry.rel });
      continue;
    }
    if (byId.has(id)) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.DUPLICATE_ID,
        `${entry.rel}: duplicate @id also used by ${byId.get(id).rel}`,
        { rel: entry.rel, target: id },
      );
    }
    byId.set(id, entry);
  }

  function localRefs(entry, field, expectedType, { required = true } = {}) {
    for (const targetId of asArray(entry.record[field])) {
      validateReference({ from: entry, field, targetId, expectedType, byId, fail, required });
    }
  }

  for (const entry of entries) {
    const { record } = entry;
    const type = obligationFirstType(record);

    const fieldDomains = {
      issuedBy: ["of:Instrument", "of:Determination", "of:Proceeding"],
      heardBy: ["of:Proceeding"],
      administeredBy: ["of:Instrument"],
      regulatedBy: ["of:Instrument"],
      enforcedBy: ["of:Instrument"],
      enforcement_authority: ["of:Reparation"],
      hasTerm: ["of:Instrument"],
      parent_instrument: ["of:Term"],
      creates: ["of:Term"],
      created_by: ["of:Obligation"],
      recognized_by: ["of:Obligation"],
      imposed_by: ["of:Obligation"],
      isCategorizedBy: ["of:Obligation"],
      duty_holders: ["of:Obligation"],
      owed_to: ["of:Obligation"],
      duty_holder_roles: ["of:Obligation"],
      owed_to_roles: ["of:Obligation"],
      hasAllegation: ["of:Proceeding"],
      hasDetermination: ["of:Proceeding"],
      decides: ["of:Determination"],
      recognizes: ["of:Determination"],
      imposes: ["of:Determination"],
      allegedly_violates: ["of:Allegation"],
      target_instrument: ["of:Determination"],
      resulting_instrument: ["of:Determination"],
      embodies_determination: ["of:Instrument"],
      supersedes: ["of:Instrument"],
      wouldSupersede: ["of:Instrument"],
      repeals: ["of:Instrument"],
      amends: ["of:Instrument", "of:Term"],
      defeats: ["of:Term"],
      rebuts: ["of:Term"],
      undercuts: ["of:Term"],
      vacates: ["of:Determination"],
      constrains: ["of:Determination"],
    };
    for (const [field, allowed] of Object.entries(fieldDomains)) {
      if (record[field] !== undefined && !isType(record, allowed)) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.INVALID_FIELD_DOMAIN,
          `${entry.rel}: ${field} is only valid on ${allowed.join(" or ")}`,
          { rel: entry.rel, field },
        );
      }
    }

    for (const field of ["issuedBy", "heardBy", "administeredBy", "regulatedBy", "enforcedBy", "enforcement_authority"]) {
      localRefs(entry, field, "of:Authority");
    }

    for (const basis of asArray(record.authority_basis)) {
      if (basis?.instrument_ref && byId.has(basis.instrument_ref)) {
        validateReference({
          from: entry,
          field: "authority_basis.instrument_ref",
          targetId: basis.instrument_ref,
          expectedType: "of:Instrument",
          byId,
          fail,
        });
      }
    }

    if (typeof record.jurisdiction === "string" && byId.has(record.jurisdiction)) {
      validateReference({ from: entry, field: "jurisdiction", targetId: record.jurisdiction, expectedType: "of:Jurisdiction", byId, fail });
    }

    for (const targetId of asArray(record.hasTerm)) {
      const target = validateReference({ from: entry, field: "hasTerm", targetId, expectedType: "of:Term", byId, fail });
      if (target && !asArray(target.record.parent_instrument).includes(record["@id"])) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.HAS_TERM_INVERSE,
          `${entry.rel}: hasTerm ${targetId} does not point back via parent_instrument`,
          { rel: entry.rel, field: "hasTerm", target: targetId },
        );
      }
    }

    localRefs(entry, "parent_instrument", "of:Instrument");

    for (const targetId of asArray(record.creates)) {
      const target = validateReference({ from: entry, field: "creates", targetId, expectedType: "of:Obligation", byId, fail });
      if (target && !asArray(target.record.created_by).includes(record["@id"])) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.CREATES_INVERSE,
          `${entry.rel}: creates ${targetId} does not point back via created_by`,
          { rel: entry.rel, field: "creates", target: targetId },
        );
      }
    }

    localRefs(entry, "created_by", "of:Term");
    localRefs(entry, "recognized_by", "of:Determination");
    localRefs(entry, "imposed_by", "of:Determination");
    localRefs(entry, "isCategorizedBy", "of:ObligationCategory");
    localRefs(entry, "duty_holders", "of:Party");
    localRefs(entry, "owed_to", "of:Party");
    localRefs(entry, "parties", "of:Party");
    localRefs(entry, "asserted_by_party", "of:Party");
    localRefs(entry, "related_to_party", "of:Party");
    for (const actorRole of asArray(record.actor_roles)) {
      if (!actorRole?.party) continue;
      validateReference({ from: entry, field: "actor_roles.party", targetId: actorRole.party, expectedType: "of:Party", byId, fail });
    }

    localRefs(entry, "hasAllegation", "of:Allegation");
    localRefs(entry, "hasDetermination", "of:Determination");
    localRefs(entry, "decides", "of:Allegation");
    localRefs(entry, "target_instrument", "of:Instrument");
    localRefs(entry, "resulting_instrument", "of:Instrument");
    localRefs(entry, "embodies_determination", "of:Determination");
    for (const targetId of asArray(record.recognizes)) {
      const target = validateReference({ from: entry, field: "recognizes", targetId, expectedType: "of:Obligation", byId, fail });
      if (target && !asArray(target.record.recognized_by).includes(record["@id"])) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.RECOGNIZES_INVERSE,
          `${entry.rel}: recognizes ${targetId} does not point back via recognized_by`,
          { rel: entry.rel, field: "recognizes", target: targetId },
        );
      }
    }
    for (const targetId of asArray(record.imposes)) {
      const target = validateReference({ from: entry, field: "imposes", targetId, expectedType: "of:Obligation", byId, fail });
      if (target && !asArray(target.record.imposed_by).includes(record["@id"])) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.IMPOSES_INVERSE,
          `${entry.rel}: imposes ${targetId} does not point back via imposed_by`,
          { rel: entry.rel, field: "imposes", target: targetId },
        );
      }
    }
    localRefs(entry, "allegedly_violates", "of:Obligation", { required: false });

    for (const targetId of asArray(record.triggers_on_violation_of)) {
      if (targetId === record["@id"]) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.SELF_TRIGGER,
          `${entry.rel}: triggers_on_violation_of cannot point to itself`,
          { rel: entry.rel, field: "triggers_on_violation_of", target: targetId },
        );
      }
      validateReference({ from: entry, field: "triggers_on_violation_of", targetId, expectedType: "of:Obligation", byId, fail });
    }

    for (const field of ["supersedes", "wouldSupersede", "repeals"]) {
      localRefs(entry, field, "of:Instrument");
    }
    localRefs(entry, "amends", type === "of:Term" ? "of:Term" : "of:Instrument");
    for (const field of ["defeats", "rebuts", "undercuts"]) localRefs(entry, field, "of:Term");
    localRefs(entry, "vacates", "of:Determination");

    for (const targetId of asArray(record.constrains)) {
      validateReference({
        from: entry,
        field: "constrains",
        targetId,
        expectedType: ["of:Instrument", "of:Term", "of:Obligation", "of:Determination"],
        byId,
        fail,
      });
    }

    for (const targetId of asArray(record.anchors)) {
      if (!byId.has(targetId)) continue;
      const expected = isType(record, "of:Term") ? "of:Term" : ["of:Obligation", "of:ObligationCategory"];
      validateReference({ from: entry, field: "anchors", targetId, expectedType: expected, byId, fail });
    }

    for (const targetId of asArray(record.exactMatch)) {
      const target = byId.get(targetId);
      if (target && isType(target.record, "of:ObligationCategory") && isType(record, "of:Obligation")) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.CATEGORY_EXACT_MATCH,
          `${entry.rel}: category membership must use isCategorizedBy, not exactMatch`,
          { rel: entry.rel, field: "exactMatch", target: targetId },
        );
      }
    }

    if (record.implemented_by_terms !== undefined) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.DUPLICATE_RELATION_ALIAS,
        `${entry.rel}: implemented_by_terms duplicates the shared created_by relation; remove the adopter-local alias`,
        { rel: entry.rel, field: "implemented_by_terms" },
      );
    }

    if (type === "of:Determination") {
      const decides = asArray(record.decides);
      if (record.disposition === "issued") {
        if (decides.length > 0) {
          fail(
            GRAPH_DIAGNOSTIC_CODES.ISSUED_DETERMINATION_DECIDES,
            `${entry.rel}: disposition issued should not decide Allegations`,
            { rel: entry.rel, field: "decides" },
          );
        }
        if (!record.target_instrument && asArray(record.resulting_instrument).length === 0 && asArray(record.anchors).length === 0) {
          fail(
            GRAPH_DIAGNOSTIC_CODES.ISSUED_DETERMINATION_TARGET,
            `${entry.rel}: disposition issued needs target_instrument or anchors, or v0.6 resulting_instrument`,
            { rel: entry.rel },
          );
        }
      } else if (decides.length === 0) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.ADJUDICATIVE_DETERMINATION_DECIDES,
          `${entry.rel}: adjudicative Determination should decide at least one Allegation`,
          { rel: entry.rel, field: "decides" },
        );
      }
    }

    if (type === "of:Instrument" && record.wouldSupersede) {
      const lifecycle = record.lifecycle_status || record.status;
      if (!["draft", "proposed", "amended"].includes(lifecycle)) {
        fail(
          GRAPH_DIAGNOSTIC_CODES.WOULD_SUPERSEDE_LIFECYCLE,
          `${entry.rel}: wouldSupersede should only appear on draft, proposed, or amended Instruments`,
          { rel: entry.rel, field: "wouldSupersede" },
        );
      }
    }

    const lifecycle = record.lifecycle_status || record.status;
    const enforcement = record.enforcement_status;
    if (["draft", "proposed"].includes(lifecycle) && ["routine", "enforceable"].includes(enforcement)) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.FUTURE_ENFORCEMENT,
        `${entry.rel}: ${lifecycle} content cannot claim present ${enforcement} enforcement`,
        { rel: entry.rel, field: "enforcement_status" },
      );
    }
    if (["voluntary", "nonbinding"].includes(record.normative_force) && ["routine", "enforceable"].includes(enforcement) && !record.binding_basis) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.VOLUNTARY_ENFORCEMENT_BASIS,
        `${entry.rel}: ${record.normative_force} content needs an evidenced binding_basis before enforcement can be ${enforcement}`,
        { rel: entry.rel, field: "binding_basis" },
      );
    }
    if (["repealed", "superseded", "sunset", "inactive", "withdrawn"].includes(lifecycle) && ["routine", "enforceable"].includes(enforcement)) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.INACTIVE_ENFORCEMENT,
        `${entry.rel}: ${lifecycle} content cannot claim ${enforcement} enforcement without a separately modeled residual obligation`,
        { rel: entry.rel, field: "enforcement_status" },
      );
    }
    if (record.effective && record.computed_as_of && record.effective > record.computed_as_of && record.operative_status === "operative") {
      fail(
        GRAPH_DIAGNOSTIC_CODES.FUTURE_OPERATIVE,
        `${entry.rel}: future effective date ${record.effective} cannot be operative as of ${record.computed_as_of}`,
        { rel: entry.rel, field: "operative_status" },
      );
    }
  }

  for (const proceeding of entries.filter((entry) => isType(entry.record, "of:Proceeding"))) {
    const allegations = new Set(asArray(proceeding.record.hasAllegation));
    for (const determinationId of asArray(proceeding.record.hasDetermination)) {
      const determination = byId.get(determinationId);
      if (!determination) continue;
      for (const allegationId of asArray(determination.record.decides)) {
        if (!allegations.has(allegationId)) {
          fail(
            GRAPH_DIAGNOSTIC_CODES.PROCEEDING_DETERMINATION_SCOPE,
            `${proceeding.rel}: Determination ${determinationId} decides ${allegationId}, not listed in hasAllegation`,
            { rel: proceeding.rel, field: "hasAllegation", target: allegationId },
          );
        }
      }
    }
  }

  for (const instrument of entries.filter((entry) => isType(entry.record, "of:Instrument"))) {
    if (instrument.record.enforcement_status !== "constrained") continue;

    const obligationIds = new Set();
    for (const termId of asArray(instrument.record.hasTerm)) {
      const term = byId.get(termId);
      for (const obligationId of asArray(term?.record.creates)) {
        obligationIds.add(obligationId);
      }
    }

    const hasAnchoredDetermination = entries.some((entry) => {
      if (!isType(entry.record, "of:Determination")) return false;
      return asArray(entry.record.anchors).some((anchor) => obligationIds.has(anchor)) ||
        asArray(entry.record.constrains).includes(instrument.record["@id"]);
    });

    if (!hasAnchoredDetermination) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.CONSTRAINED_ENFORCEMENT_EVIDENCE,
        `${instrument.rel}: constrained enforcement_status needs a Determination anchored to one of its Obligations`,
        { rel: instrument.rel, field: "enforcement_status" },
      );
    }
  }

  // Defeasibility is directional and acyclic. rebuts and undercuts are
  // subrelations of defeats, so a cycle across any mix of the three fails.
  for (const target of entries.filter((entry) => isType(entry.record, "of:Determination") && entry.record.disposition === "vacated")) {
    const hasVacatingDecision = entries.some((entry) =>
      isType(entry.record, "of:Determination") && asArray(entry.record.vacates).includes(target.record["@id"]),
    );
    if (!hasVacatingDecision) {
      fail(
        GRAPH_DIAGNOSTIC_CODES.VACATED_DETERMINATION_RELATION,
        `${target.rel}: vacated Determination needs an incoming vacates relation when its vacating decision is in the graph`,
        { rel: target.rel, field: "vacates" },
      );
    }
  }

  const termIds = new Set(entries.filter((entry) => isType(entry.record, "of:Term")).map((entry) => entry.record["@id"]));
  const adjacency = new Map();
  for (const entry of entries) {
    if (!termIds.has(entry.record["@id"])) continue;
    adjacency.set(
      entry.record["@id"],
      [...new Set(["defeats", "rebuts", "undercuts"].flatMap((field) => asArray(entry.record[field])))].filter((id) => termIds.has(id)),
    );
  }
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const reportedCycles = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const key = [...new Set(cycle)].sort().join("|");
      if (!reportedCycles.has(key)) {
        reportedCycles.add(key);
        fail(
          GRAPH_DIAGNOSTIC_CODES.DEFEASIBILITY_CYCLE,
          `defeats cycle: ${cycle.join(" -> ")}`,
          { target: cycle },
        );
      }
      return;
    }
    visiting.add(id);
    stack.push(id);
    for (const target of adjacency.get(id) || []) visit(target);
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of termIds) visit(id);

  return failures;
}

export function validateRecordGraph(entries) {
  return validateRecordGraphDetailed(entries).map(formatGraphDiagnostic);
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

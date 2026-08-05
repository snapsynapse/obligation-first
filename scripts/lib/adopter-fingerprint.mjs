import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  asArray,
  loadRecordDir,
  obligationFirstType,
} from "./adopter-kit.mjs";

const RELATION_FIELDS = [
  "issuedBy",
  "heardBy",
  "administeredBy",
  "regulatedBy",
  "enforcedBy",
  "hasTerm",
  "parent_instrument",
  "creates",
  "created_by",
  "recognized_by",
  "imposed_by",
  "isCategorizedBy",
  "duty_holders",
  "owed_to",
  "hasAllegation",
  "hasDetermination",
  "decides",
  "recognizes",
  "imposes",
  "allegedly_violates",
  "target_instrument",
  "resulting_instrument",
  "embodies_determination",
  "supersedes",
  "wouldSupersede",
  "repeals",
  "amends",
  "defeats",
  "rebuts",
  "undercuts",
  "anchors",
  "sameAs",
  "describesSameEntityAs",
  "replaced_by",
  "parties",
  "related_to_party",
];

const EXPLICIT_UNKNOWN = new Set([
  "unknown",
  "not-known",
  "not_known",
  "not-applicable",
  "not_applicable",
]);

function hashStrings(values) {
  return createHash("sha256").update(JSON.stringify([...values].sort())).digest("hex");
}

function increment(object, key, amount = 1) {
  object[key] = (object[key] || 0) + amount;
}

function hostOf(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "non-url";
  }
}

function sortedObject(value) {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, sortedObject(child)]),
  );
}

function valueState(value) {
  if (value === null) return "null";
  if (Array.isArray(value) && value.length === 0) return "empty_array";
  if (value === "") return "empty_string";
  if (typeof value === "string" && EXPLICIT_UNKNOWN.has(value.toLowerCase())) return "explicit_unknown";
  return "populated";
}

function identityField(key) {
  return key !== "@id" && (
    key === "id"
    || key.endsWith(":id")
    || key.endsWith(":primary_id")
    || key.endsWith("_record_id")
    || key.endsWith("_source_id")
  );
}

function relationValues(record, field) {
  return asArray(record[field]).filter((value) => typeof value === "string");
}

export async function buildAdopterFingerprint({ recordsDir, profilePath }) {
  const entries = await loadRecordDir(recordsDir, { root: recordsDir });
  if (entries.length === 0) throw new Error(`refusing to fingerprint 0 records in ${recordsDir}`);

  const profile = JSON.parse(await readFile(profilePath, "utf8"));
  const records = entries.map((entry) => entry.record);
  const types = new Map();
  const filesByType = new Map();
  const fieldsByType = new Map();
  const idsByType = new Map();
  const contexts = {};
  const sourceIdentity = {};
  const relations = {};
  const actorRoles = {};
  const jurisdictionShapes = {};
  const tombstoneFormerTypes = {};
  const tombstoneReplacements = [];

  for (const entry of entries) {
    const record = entry.record;
    const type = obligationFirstType(record) || "untyped";
    types.set(type, (types.get(type) || 0) + 1);
    if (!filesByType.has(type)) filesByType.set(type, []);
    filesByType.get(type).push(path.basename(entry.file));
    if (!idsByType.has(type)) idsByType.set(type, []);
    idsByType.get(type).push(String(record["@id"] || ""));

    const contextKey = JSON.stringify(record["@context"]);
    increment(contexts, contextKey);

    if (!fieldsByType.has(type)) fieldsByType.set(type, new Map());
    const typeFields = fieldsByType.get(type);
    for (const [key, value] of Object.entries(record)) {
      if (!typeFields.has(key)) typeFields.set(key, { present: 0, states: {} });
      const coverage = typeFields.get(key);
      coverage.present += 1;
      increment(coverage.states, valueState(value));

      if (identityField(key)) {
        if (!sourceIdentity[key]) sourceIdentity[key] = { records: 0, values: [] };
        sourceIdentity[key].records += 1;
        sourceIdentity[key].values.push(String(value));
      }
    }

    for (const field of RELATION_FIELDS) {
      const values = relationValues(record, field);
      if (values.length === 0) continue;
      if (!relations[field]) relations[field] = { edges: 0, sources: 0, target_hosts: {} };
      relations[field].edges += values.length;
      relations[field].sources += 1;
      for (const value of values) increment(relations[field].target_hosts, hostOf(value));
    }

    for (const field of ["duty_holder_roles", "owed_to_roles", "roles"]) {
      const values = asArray(record[field]).filter((value) => typeof value === "string");
      if (values.length === 0) continue;
      if (!actorRoles[field]) actorRoles[field] = {};
      for (const value of values) increment(actorRoles[field], value);
    }

    const jurisdiction = record.jurisdiction;
    if (jurisdiction === undefined) {
      increment(jurisdictionShapes, "missing");
    } else if (Array.isArray(jurisdiction)) {
      increment(jurisdictionShapes, "array");
    } else if (jurisdiction && typeof jurisdiction === "object") {
      increment(jurisdictionShapes, `object:${jurisdiction["@type"] || "untyped"}`);
    } else {
      increment(jurisdictionShapes, typeof jurisdiction);
    }

    if (type === "of:Tombstone") {
      increment(tombstoneFormerTypes, String(record.former_type || "missing"));
      tombstoneReplacements.push(...asArray(record.replaced_by).map(String));
    }
  }

  const byType = Object.fromEntries([...types.entries()]);
  const fieldCoverage = {};
  for (const [type, fieldMap] of fieldsByType) {
    const total = types.get(type);
    fieldCoverage[type] = {};
    for (const [field, coverage] of fieldMap) {
      fieldCoverage[type][field] = {
        present: coverage.present,
        missing: total - coverage.present,
        ...coverage.states,
      };
    }
  }

  const identitySummary = {};
  for (const [field, detail] of Object.entries(sourceIdentity)) {
    const unique = [...new Set(detail.values)];
    identitySummary[field] = {
      records: detail.records,
      unique_values: unique.length,
      values_sha256: hashStrings(unique),
    };
  }

  const idInventory = {};
  for (const [type, ids] of idsByType) {
    idInventory[type] = {
      count: ids.length,
      ids_sha256: hashStrings(ids),
      file_names_sha256: hashStrings(filesByType.get(type)),
    };
  }

  return sortedObject({
    fingerprint_version: 1,
    adopter: profile.adopter,
    applies_to: profile.appliesTo,
    naming_profile_version: profile.profileVersion,
    naming_profile_entities: Object.keys(profile.entities || {}).sort(),
    records: {
      total: records.length,
      by_type: byType,
    },
    contexts,
    id_inventory: idInventory,
    source_identity: identitySummary,
    field_coverage: fieldCoverage,
    relations,
    actor_roles: actorRoles,
    jurisdiction_shapes: jurisdictionShapes,
    tombstones: {
      count: byType["of:Tombstone"] || 0,
      former_types: tombstoneFormerTypes,
      replacement_edges: tombstoneReplacements.length,
      replacements_sha256: hashStrings(tombstoneReplacements),
    },
  });
}

export function stableFingerprintJson(fingerprint) {
  return `${JSON.stringify(sortedObject(fingerprint), null, 2)}\n`;
}

export function fingerprintDifferences(expected, actual, prefix = "", out = []) {
  if (out.length >= 50) return out;
  if (Object.is(expected, actual)) return out;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      out.push(`${prefix || "root"}.length: expected ${expected.length}, got ${actual.length}`);
      return out;
    }
    for (let index = 0; index < expected.length; index += 1) {
      fingerprintDifferences(expected[index], actual[index], `${prefix}[${index}]`, out);
      if (out.length >= 50) break;
    }
    return out;
  }
  if (
    !expected || !actual
    || typeof expected !== "object"
    || typeof actual !== "object"
    || Array.isArray(expected)
    || Array.isArray(actual)
  ) {
    out.push(`${prefix || "root"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    return out;
  }
  const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  for (const key of keys) {
    fingerprintDifferences(expected[key], actual[key], prefix ? `${prefix}.${key}` : key, out);
    if (out.length >= 50) break;
  }
  return out;
}

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { asArray, isType } from './adopter-kit.mjs';

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateInventoryShape = ajv.compile(JSON.parse(await readFile(
  new URL('../../reference/contracts/scope-inventory-v1.schema.json', import.meta.url), 'utf8')));

// Paths are part of evaluator v1. A schema-discovery regression independently
// checks that every schema location exposing scope is covered here.
export const SCOPE_PATHS = Object.freeze([
  'jurisdiction', 'jurisdiction/ref', 'jurisdiction/territorial_scope',
  'jurisdiction/institutional_scope', 'territorial_scope', 'institutional_scope',
]);
const key = (kind, id) => JSON.stringify([kind, id]);
const diagnostic = (code, message) => ({ code, message });
const compareJson = (a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0;
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
export const scopeDigest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const scopeBaselineJson = baseline => `${JSON.stringify({ ...baseline, claims: [] }, null, 2)
  .replace('"claims": []', `"claims": [\n${baseline.claims.map(claim => `    ${JSON.stringify(claim)}`).join(',\n')}\n  ]`)}\n`;

export function compareScopeInventories(inventories) {
  const errors = inventories.flatMap(validateScopeInventory);
  if (errors.length) return errors;
  const identities = new Map();
  for (const inventory of inventories) {
    for (const entry of inventory.entries) {
      for (const prior of identities.get(entry.id) || []) {
        if (prior.kind !== entry.kind || (prior.parent !== undefined && entry.parent !== undefined && prior.parent !== entry.parent)) {
          errors.push(diagnostic('OF-SCOPE-CONFLICT', `${entry.id}: incompatible kind/parent in ${prior.owner} and ${inventory.owner}`));
        }
      }
      identities.set(entry.id, [...(identities.get(entry.id) || []), { ...entry, owner: inventory.owner }]);
    }
  }
  return errors;
}

export function validateScopeInventory(inventory) {
  if (!validateInventoryShape(inventory)) return [diagnostic('OF-SCOPE-CONTRACT',
    ajv.errorsText(validateInventoryShape.errors))];
  const errors = [];
  const entries = new Map();
  for (const entry of inventory.entries) {
    const identity = key(entry.kind, entry.id);
    if (entries.has(identity)) errors.push(diagnostic('OF-SCOPE-CONTRACT', `duplicate inventory identity ${identity}`));
    entries.set(identity, entry);
    if (entry.id !== entry.id.trim()) errors.push(diagnostic('OF-SCOPE-CONTRACT', `unreviewed whitespace in ${identity}`));
    if (entry.kind === 'institutional' && entry.parent !== undefined) {
      errors.push(diagnostic('OF-SCOPE-CONTRACT', `territorial parent on institution ${entry.id}`));
    }
  }
  for (const entry of inventory.entries) {
    const seen = new Set([entry.id]);
    let parent = entry.parent;
    while (parent !== undefined) {
      if (seen.has(parent) || !entries.has(key('territorial', parent))) {
        errors.push(diagnostic('OF-SCOPE-CONTRACT', `missing/cyclic territorial parent for ${entry.id}: ${parent}`));
        break;
      }
      seen.add(parent);
      parent = entries.get(key('territorial', parent)).parent;
    }
  }
  const covered = new Set();
  for (const item of inventory.coverage) {
    const identity = key(item.kind, item.id);
    if (!entries.has(identity) || covered.has(identity)) {
      errors.push(diagnostic('OF-SCOPE-CONTRACT', `unknown/duplicate coverage identity ${identity}`));
    }
    covered.add(identity);
  }
  return errors;
}

export function classifyScope(inventory, kind, id) {
  const entry = inventory.entries.find(item => item.kind === kind && item.id === id);
  if (!entry) return { kind, id, recognition: 'unknown', coverage: 'unknown' };
  return { kind, id, recognition: 'recognized',
    coverage: inventory.coverage.find(item => item.kind === kind && item.id === id)?.status || 'unknown',
    owner: inventory.owner, extension: entry.extension, ...(entry.parent ? { parent: entry.parent } : {}) };
}

export function evaluateScopes(records, profile, inventory) {
  const errors = validateScopeInventory(inventory);
  const claims = [];
  const observations = [];
  if (errors.length) return { errors, claims, observations };
  if (profile.adopter !== inventory.owner) errors.push(diagnostic('OF-SCOPE-OWNER', 'inventory owner differs from naming-profile adopter'));
  const byId = new Map();
  for (const record of records) {
    if (typeof record['@id'] !== 'string' || byId.has(record['@id'])) {
      errors.push(diagnostic('OF-SCOPE-RECORDS', 'missing or duplicate record identity'));
    }
    byId.set(record['@id'], record);
  }
  if (!records.length) errors.push(diagnostic('OF-SCOPE-RECORDS', 'refusing empty record set'));

  function values(recordId, field, kind, value) {
    const items = asArray(value);
    if (!items.length || items.some(item => typeof item !== 'string' || !item.length) || new Set(items).size !== items.length) {
      errors.push(diagnostic('OF-SCOPE-SHAPE', `${recordId} ${field}: expected a nonempty string set`));
      return;
    }
    for (const id of items) {
      const state = classifyScope(inventory, kind, id);
      observations.push({ record: recordId, path: field, ...state });
      if (state.recognition === 'unknown') {
        const wrongKind = inventory.entries.some(item => item.id === id && item.kind !== kind);
        errors.push(diagnostic(wrongKind ? 'OF-SCOPE-KIND' : 'OF-SCOPE-UNKNOWN', `${recordId} ${field}: ${id}`));
      }
    }
    // Sorting sets preserves scalar/array compatibility, not identifier aliases.
    claims.push([recordId, field, [...items].sort()]);
  }
  function inspect(record, recordId) {
    for (const kind of ['territorial', 'institutional']) {
      const field = `${kind}_scope`;
      if (Object.hasOwn(record, field)) values(recordId, field, kind, record[field]);
    }
    if (!Object.hasOwn(record, 'jurisdiction')) return;
    const jurisdiction = record.jurisdiction;
    if (typeof jurisdiction === 'string') {
      claims.push([recordId, 'jurisdiction', jurisdiction]);
      const target = byId.get(jurisdiction);
      // External resolution cannot silently become agreement or absence.
      if (!target) errors.push(diagnostic('OF-SCOPE-UNRESOLVED', `${recordId}: ${jurisdiction}`));
      else if (!isType(target, 'of:Jurisdiction')) errors.push(diagnostic('OF-SCOPE-KIND', `${recordId}: jurisdiction target has wrong type`));
      return;
    }
    if (!jurisdiction || Array.isArray(jurisdiction) || typeof jurisdiction !== 'object'
      || !['of:Jurisdiction', 'gist:Jurisdiction'].includes(jurisdiction['@type'])) {
      errors.push(diagnostic('OF-SCOPE-SHAPE', `${recordId}: malformed jurisdiction`));
      return;
    }
    const scopeFields = ['ref', 'territorial_scope', 'institutional_scope'];
    if (!scopeFields.some(field => Object.hasOwn(jurisdiction, field))) {
      errors.push(diagnostic('OF-SCOPE-SHAPE', `${recordId}: jurisdiction has no scope`));
    }
    for (const field of scopeFields) {
      if (Object.hasOwn(jurisdiction, field)) values(recordId, `jurisdiction/${field}`,
        field === 'institutional_scope' ? 'institutional' : 'territorial', jurisdiction[field]);
    }
  }
  for (const record of records) inspect(record, record['@id']);
  inspect(profile, '@naming-profile');
  claims.sort(compareJson);
  observations.sort(compareJson);
  return { errors, claims, observations };
}

export function makeScopeBaseline(records, profile, inventory) {
  const result = evaluateScopes(records, profile, inventory);
  if (result.errors.length) throw new Error(result.errors.map(item => `${item.code}: ${item.message}`).join('\n'));
  return { baseline_version: 1, contract_version: 1, owner: inventory.owner,
    inventory_version: inventory.inventory_version, inventory_sha256: scopeDigest(inventory), claims: result.claims };
}

export function checkScopeBaseline(records, profile, inventory, baseline) {
  const result = evaluateScopes(records, profile, inventory);
  if (result.errors.length) return result;
  if (!baseline || baseline.baseline_version !== 1 || baseline.contract_version !== 1
    || baseline.owner !== inventory.owner || baseline.inventory_version !== inventory.inventory_version
    || baseline.inventory_sha256 !== scopeDigest(inventory) || !Array.isArray(baseline.claims)) {
    result.errors.push(diagnostic('OF-SCOPE-BASELINE', 'missing, incompatible or changed inventory/baseline identity'));
  } else if (JSON.stringify(baseline.claims) !== JSON.stringify(result.claims)) {
    const expected = new Set(baseline.claims.map(item => JSON.stringify(item)));
    const actual = new Set(result.claims.map(item => JSON.stringify(item)));
    const changed = [...expected].filter(item => !actual.has(item)).map(item => `removed ${item}`)
      .concat([...actual].filter(item => !expected.has(item)).map(item => `added ${item}`));
    result.errors.push(diagnostic('OF-SCOPE-DRIFT', changed.slice(0, 12).join('; ')));
  }
  return result;
}

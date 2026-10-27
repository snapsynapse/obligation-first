#!/usr/bin/env node
import { loadRecordDir, asArray } from './lib/adopter-kit.mjs';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

export const ENTITY_FIELDS = ['lifecycle_status', 'operative_status', 'effective', 'enacted'];
export const ENTITY_RELATIONS = ['supersedes', 'wouldSupersede', 'repeals', 'amends'];
const isInstrument = record => asArray(record?.['@type']).includes('of:Instrument');

// Correspondence components are used only to compare targets. They do not
// merge records or propagate scalar assertions, sameAs, dates or legal effect.
function targetClasses(records, byId) {
  const parent = new Map(records.filter(isInstrument).map(record => [record['@id'], record['@id']]));
  function root(id) {
    if (parent.get(id) !== id) parent.set(id, root(parent.get(id)));
    return parent.get(id);
  }
  for (const record of records.filter(isInstrument)) for (const target of asArray(record.describesSameEntityAs)) {
    if (!isInstrument(byId.get(target))) continue;
    const [first, second] = [root(record['@id']), root(target)].sort();
    parent.set(second, first);
  }
  return id => parent.has(id) ? root(id) : null;
}

function relationTargets(value, classify) {
  const targets = asArray(value);
  if (!targets.length) return { reason: 'missing-assertion' };
  if (targets.some(target => typeof target !== 'string' || !target.trim())) return { reason: 'malformed-assertion' };
  const classes = targets.map(classify);
  if (classes.includes(null)) return { reason: 'unresolved-target' };
  return { targets: [...new Set(classes)].sort() };
}

function lifecycleReview(records, report) {
  const byId = new Map(records.map(record => [record['@id'], record]));
  for (const record of records.filter(isInstrument)) {
    const lifecycle = record.lifecycle_status || record.status;
    for (const field of ENTITY_RELATIONS) for (const target of asArray(record[field])) {
      if (typeof target !== 'string') continue;
      if (target === record['@id']) report.conflicts.push(`OF-RELATION-SELF: ${record['@id']} ${field} cannot target itself`);
      if (field === 'supersedes' && ['draft', 'proposed'].includes(lifecycle)) {
        report.conflicts.push(`OF-RELATION-STAGE: ${record['@id']} ${lifecycle} replacement must use wouldSupersede, not supersedes`);
      }
      if (field === 'supersedes' && asArray(record.repeals).includes(target)) {
        report.conflicts.push(`OF-RELATION-KIND-CONFLICT: ${record['@id']} cannot both supersede and purely repeal ${target}`);
      }
      const expected = { supersedes: 'superseded', repeals: 'repealed' }[field];
      const predecessor = byId.get(target);
      const actual = predecessor?.lifecycle_status || predecessor?.status;
      if (expected && isInstrument(predecessor) && asserted(actual) && actual !== expected) {
        report.warnings.push(`OF-LIFECYCLE-REVIEW: ${record['@id']} ${field} ${target}, whose lifecycle is ${actual}; review ${expected} disposition, scope and timing with the source owner`);
      }
    }
  }
}

function asserted(value) {
  return value !== undefined && value !== null && value !== '' && value !== 'unknown';
}

function pairKey(source, target) {
  return JSON.stringify([source, target].sort());
}

export function entityAgreement(records, { requiredPairs = [] } = {}) {
  const byId = new Map(records.map(record => [record['@id'], record]));
  const classify = targetClasses(records, byId);
  const report = {
    counts: { declared_links: 0, resolved_pairs: 0, compared_pairs: 0, compared_fields: 0, unknown_fields: 0, unresolved_targets: 0, required_pairs: requiredPairs.length },
    pairs: [], unresolved_targets: [], conflicts: [], warnings: [], requirement_errors: [], expected_unknown_checks: [],
  };
  const pairs = new Map();
  for (const record of records) {
    for (const target of asArray(record.describesSameEntityAs)) {
      report.counts.declared_links += 1;
      const other = byId.get(target);
      if (!other) {
        report.unresolved_targets.push({ source: record['@id'], target });
        continue;
      }
      if (!asArray(record['@type']).includes('of:Instrument') || !asArray(other['@type']).includes('of:Instrument')) continue;
      const key = pairKey(record['@id'], target);
      if (pairs.has(key)) continue;
      const pair = { source: record['@id'], target, compared_fields: [], unknown_fields: [], compared_relations: [], unknown_relations: [] };
      for (const field of ENTITY_FIELDS) {
        if (!asserted(record[field]) || !asserted(other[field])) {
          pair.unknown_fields.push({ field, source_value: record[field] ?? null, target_value: other[field] ?? null });
          continue;
        }
        const equal = record[field] === other[field];
        pair.compared_fields.push({ field, source_value: record[field], target_value: other[field], equal });
        if (!equal) {
          report.conflicts.push(`OF-ENTITY-CONFLICT: ${record['@id']} ${field}=${record[field]} differs from ${target} (${other[field]})`);
        }
      }
      for (const field of ENTITY_RELATIONS) {
        const source = relationTargets(record[field], classify);
        const destination = relationTargets(other[field], classify);
        const values = { field, source_value: record[field] ?? null, target_value: other[field] ?? null };
        if ([source.reason, destination.reason].includes('malformed-assertion')) {
          report.conflicts.push(`OF-ENTITY-RELATION-SHAPE: ${record['@id']} <-> ${target} ${field} requires nonempty target IRIs`);
        }
        if (source.reason || destination.reason) {
          pair.unknown_relations.push({ ...values, reason: source.reason || destination.reason });
          continue;
        }
        const equal = JSON.stringify(source.targets) === JSON.stringify(destination.targets);
        pair.compared_relations.push({ ...values, equal });
        if (!equal) report.conflicts.push(`OF-ENTITY-RELATION-CONFLICT: ${record['@id']} ${field} targets differ from ${target} after declared correspondence`);
      }
      // Missing fields are unknown, but two explicit, incompatible kinds for
      // the same target still disagree even when neither field is shared.
      for (const [left, right] of [['supersedes', 'repeals'], ['repeals', 'supersedes']]) {
        const source = relationTargets(record[left], classify);
        const destination = relationTargets(other[right], classify);
        if (source.targets?.some(id => destination.targets?.includes(id))) {
          report.conflicts.push(`OF-ENTITY-RELATION-KIND: ${record['@id']} ${left} conflicts with ${target} ${right} for a corresponding target`);
        }
      }
      pairs.set(key, pair);
      report.pairs.push(pair);
    }
  }
  for (const required of requiredPairs) {
    const fields = required?.fields ?? [];
    const relations = required?.relations ?? [];
    if (!required || typeof required.source !== 'string' || typeof required.target !== 'string' || required.source === required.target ||
        !Array.isArray(fields) || !Array.isArray(relations) || !(fields.length + relations.length) ||
        fields.some(field => !ENTITY_FIELDS.includes(field)) || relations.some(field => !ENTITY_RELATIONS.includes(field)) ||
        new Set(relations).size !== relations.length) {
      throw new Error('OF-ENTITY-REQUIRED-CONFIG: each pair needs distinct source/target IDs and supported fields or relations');
    }
    const expectedUnknown = required.expected_unknown_fields ?? [];
    if (!Array.isArray(expectedUnknown) || new Set(expectedUnknown).size !== expectedUnknown.length ||
        expectedUnknown.some(field => !['operative_status', 'enforcement_status'].includes(field) || fields.includes(field)) ||
        (expectedUnknown.length && (typeof required.unknown_reason !== 'string' || !required.unknown_reason.trim()))) {
      throw new Error('OF-ENTITY-REQUIRED-CONFIG: expected unknown operation or enforcement needs a separate field assertion and review reason');
    }
    const label = `${required.source} <-> ${required.target}`;
    if (!byId.has(required.source) || !byId.has(required.target)) {
      report.requirement_errors.push(`OF-ENTITY-REQUIRED-TARGET: ${label} must resolve both records`);
      continue;
    }
    const pair = pairs.get(pairKey(required.source, required.target));
    if (!pair) {
      report.requirement_errors.push(`OF-ENTITY-REQUIRED-PAIR: ${label} has no declared Instrument comparison`);
      continue;
    }
    const comparable = new Set(pair.compared_fields.map(item => item.field));
    const missing = fields.filter(field => !comparable.has(field));
    if (missing.length) {
      report.requirement_errors.push(`OF-ENTITY-REQUIRED-FIELD: ${label} lacks comparable assertions for ${missing.join(', ')}`);
    }
    const comparableRelations = new Set(pair.compared_relations.map(item => item.field));
    const missingRelations = relations.filter(field => !comparableRelations.has(field));
    if (missingRelations.length) report.requirement_errors.push(`OF-ENTITY-REQUIRED-RELATION: ${label} lacks comparable targets for ${missingRelations.join(', ')}`);
    for (const field of expectedUnknown) {
      const sourceValue = byId.get(required.source)[field];
      const targetValue = byId.get(required.target)[field];
      const retained = sourceValue === 'unknown' && targetValue === 'unknown';
      report.expected_unknown_checks.push({ source: required.source, target: required.target, field,
        source_value: sourceValue ?? null, target_value: targetValue ?? null,
        status: retained ? 'explicit-unknown-retained' : 'failed', reason: required.unknown_reason });
      if (!retained) report.requirement_errors.push(`OF-ENTITY-EXPECTED-UNKNOWN: ${label} must explicitly retain unknown ${field} on both records`);
    }
  }
  lifecycleReview(records, report);
  report.counts.resolved_pairs = report.pairs.length;
  report.counts.compared_pairs = report.pairs.filter(pair => pair.compared_fields.length).length;
  report.counts.compared_fields = report.pairs.reduce((sum, pair) => sum + pair.compared_fields.length, 0);
  report.counts.unknown_fields = report.pairs.reduce((sum, pair) => sum + pair.unknown_fields.length, 0);
  report.counts.unresolved_targets = report.unresolved_targets.length;
  return report;
}

export function entityConflicts(records) {
  return entityAgreement(records).conflicts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dirs = [];
  let requiredPairs = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === '--required') {
      const file = process.argv[++index];
      if (!file || file.startsWith('--')) throw new Error('OF-ENTITY-REQUIRED-CONFIG: --required needs a JSON file');
      const config = JSON.parse(await readFile(file, 'utf8'));
      if (config.schema_version !== 1 || !Array.isArray(config.pairs) || !config.pairs.length) {
        throw new Error('OF-ENTITY-REQUIRED-CONFIG: schema_version 1 and nonempty pairs are required');
      }
      requiredPairs.push(...config.pairs);
    } else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    else dirs.push(arg);
  }
  const records = (await Promise.all(dirs.map(dir => loadRecordDir(dir, { root: dir })))).flat().map(entry => entry.record);
  if (!records.length) throw new Error('OF-ENTITY-EMPTY: no records');
  const report = entityAgreement(records, { requiredPairs });
  console.log(JSON.stringify(report, null, 2));
  const errors = [...report.conflicts, ...report.requirement_errors];
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
}

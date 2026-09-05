#!/usr/bin/env node
import { loadRecordDir, asArray } from './lib/adopter-kit.mjs';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

export const ENTITY_FIELDS = ['lifecycle_status', 'operative_status', 'effective', 'enacted'];

function asserted(value) {
  return value !== undefined && value !== null && value !== '' && value !== 'unknown';
}

function pairKey(source, target) {
  return JSON.stringify([source, target].sort());
}

export function entityAgreement(records, { requiredPairs = [] } = {}) {
  const byId = new Map(records.map(record => [record['@id'], record]));
  const report = {
    counts: { declared_links: 0, resolved_pairs: 0, compared_pairs: 0, compared_fields: 0, unknown_fields: 0, unresolved_targets: 0, required_pairs: requiredPairs.length },
    pairs: [], unresolved_targets: [], conflicts: [], requirement_errors: [],
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
      const pair = { source: record['@id'], target, compared_fields: [], unknown_fields: [] };
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
      pairs.set(key, pair);
      report.pairs.push(pair);
    }
  }
  for (const required of requiredPairs) {
    if (!required || typeof required.source !== 'string' || typeof required.target !== 'string' || required.source === required.target ||
        !Array.isArray(required.fields) || !required.fields.length || required.fields.some(field => !ENTITY_FIELDS.includes(field))) {
      throw new Error('OF-ENTITY-REQUIRED-CONFIG: each pair needs distinct source/target IDs and nonempty supported fields');
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
    const missing = required.fields.filter(field => !comparable.has(field));
    if (missing.length) {
      report.requirement_errors.push(`OF-ENTITY-REQUIRED-FIELD: ${label} lacks comparable assertions for ${missing.join(', ')}`);
    }
  }
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

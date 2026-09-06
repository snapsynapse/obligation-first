#!/usr/bin/env node
// Check reviewed, owner-local acceptance fixtures against the actual OF export.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { evaluateQualifiedTime } from './lib/qualified-time.mjs';

export function checkAdopterQualifiedTime(fixture, record, { requirePendingMapping = false } = {}) {
  const errors = [];
  if (!fixture || !record || typeof record !== 'object' || Array.isArray(record) || fixture.version !== 1 || !Array.isArray(fixture.cases) || !fixture.cases.length ||
      !fixture.record_expectations || !Array.isArray(fixture.date_bindings) || !fixture.date_bindings.length) {
    return ['F14-ADOPTER-SHAPE: nonempty cases, bindings, expectations and version 1 required'];
  }
  if (requirePendingMapping && !fixture.pending_mapping) {
    errors.push('F14-NATIVE-MAPPING: required native two-date mapping is missing');
  }
  for (const key of ['@id', 'enacted', 'effective', 'operative_status']) {
    if (!Object.hasOwn(fixture.record_expectations, key)) errors.push(`F14-ADOPTER-SHAPE: missing expected ${key}`);
  }
  for (const [field, expected] of Object.entries(fixture.record_expectations)) {
    try { assert.deepEqual(record[field], expected); }
    catch { errors.push(`F14-RECORD-DRIFT: ${field}`); }
  }
  const cases = new Map();
  for (const item of fixture.cases) {
    if (!item || typeof item !== 'object') {
      errors.push('F14-ADOPTER-SHAPE: each case must be an object');
      continue;
    }
    if (cases.has(item.id)) errors.push(`F14-ADOPTER-SHAPE: duplicate case ${item.id}`);
    cases.set(item.id, item);
    if (!item.assertion) errors.push(`F14-ADOPTER-SHAPE: ${item.id} needs an assertion`);
    errors.push(...evaluateQualifiedTime(item).errors.map(e => `${e} (${item.id})`));
  }
  for (const id of ['general-commencement', 'upon-passage-exceptions', 'consequential-decision-cutoff', 'predecessor-operative-history']) {
    if (!cases.has(id)) errors.push(`F14-COVERAGE: missing ${id}`);
  }
  for (const [id, field] of [['general-commencement', 'effective'], ['upon-passage-exceptions', 'enacted'], ['consequential-decision-cutoff', 'effective']]) {
    if (!fixture.date_bindings.some(binding => binding?.case === id && binding.field === field)) {
      errors.push(`F14-COVERAGE: missing ${id} binding to ${field}`);
    }
  }
  for (const binding of fixture.date_bindings) {
    if (!binding || typeof binding !== 'object') {
      errors.push('F14-ADOPTER-SHAPE: each binding must be an object');
      continue;
    }
    const item = cases.get(binding.case);
    if (!item || !Object.hasOwn(record, binding.field) || item.expected?.date !== record[binding.field]) {
      errors.push(`F14-BINDING-DRIFT: ${binding.case} != record.${binding.field}`);
    }
  }
  // This is the native EveryAILaw two-date mapping, exercised synthetically.
  // An adopted-awaiting-publication stage never establishes commencement.
  if (fixture.pending_mapping) {
    const { pending_mapping: native } = fixture;
    const item = cases.get(native.case);
    if (!item || native.amendment_status?.stage !== 'adopted-awaiting-publication' ||
        item.condition?.status !== 'unknown' ||
        item.expected?.date !== native.provision?.effective ||
        item.fallback?.date !== native.provision?.effective_if_unamended) {
      errors.push('F14-NATIVE-MAPPING: preserve both provision dates and unresolved commencement');
    }
  }
  return errors;
}

export async function checkAdopterRoot(root, options) {
  let fixture;
  try { fixture = JSON.parse(await readFile(path.join(root, 'tests/fixtures/of-qualified-time.json'), 'utf8')); }
  catch { throw new Error('F14-ADOPTER-READ: cannot read a valid owner fixture'); }
  if (!fixture || typeof fixture.record !== 'string' || !fixture.record || path.isAbsolute(fixture.record)) {
    throw new Error('F14-ADOPTER-SHAPE: record must be a repository-relative file');
  }
  const recordPath = path.resolve(root, fixture.record);
  if (!recordPath.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('F14-ADOPTER-SHAPE: record must be inside its owner');
  let record;
  try { record = JSON.parse(await readFile(recordPath, 'utf8')); }
  catch { throw new Error('F14-ADOPTER-READ: cannot read a valid exported record'); }
  const errors = checkAdopterQualifiedTime(fixture, record, options);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Qualified-time adopter fixtures passed: ${path.basename(root)} (${fixture.cases.length} cases).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const requirePendingMapping = args[0] === '--require-pending-mapping';
    if (requirePendingMapping) args.shift();
    if (args.length !== 1 || args[0].startsWith('--')) throw new Error('F14-USAGE: expected [--require-pending-mapping] adopter-repository');
    await checkAdopterRoot(path.resolve(args[0]), { requirePendingMapping });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runAdopterAdmission, validateAdmissionReport } from './lib/adopter-admission.mjs';

// These synthetic reports exercise the federation boundary, not the owners'
// legal review rules. An all-legacy pass must remain visibly unreviewed.
const legacy = {
  status: 'passed', total_records: 3, legacy_unreviewed_records: 3,
  records_with_reviewed_changes: 0, changed_units_reviewed: 0, errors: [],
  limits: 'Declared traceability only; legacy records have not been reviewed.',
};
assert.deepEqual(validateAdmissionReport(legacy), []);
assert.deepEqual(validateAdmissionReport({ ...legacy, legacy_unreviewed_records: 1,
  records_with_reviewed_changes: 2, changed_units_reviewed: 4 }), []);
const badReports = [null, [], {}, { ...legacy, status: 'failed' },
  { ...legacy, errors: ['stale receipt'] }, { ...legacy, errors: null },
  { ...legacy, total_records: 4 }, { ...legacy, total_records: 0, legacy_unreviewed_records: 0 },
  { ...legacy, legacy_unreviewed_records: -1 }, { ...legacy, total_records: '3' },
  { ...legacy, limits: '' }, { ...legacy, changed_units_reviewed: 1 },
  { ...legacy, legacy_unreviewed_records: 1, records_with_reviewed_changes: 2, changed_units_reviewed: 1 },
  { ...legacy, total_records: Number.MAX_SAFE_INTEGER + 1 },
];
for (const report of badReports) assert.ok(validateAdmissionReport(report).length, JSON.stringify(report));

const root = mkdtempSync(path.join(os.tmpdir(), 'of-admission-'));
try {
  const script = path.join(root, 'gate.cjs');
  const run = (source) => {
    writeFileSync(script, source);
    return runAdopterAdmission({ root, command: process.execPath, args: [script] });
  };
  const output = `console.log(${JSON.stringify(JSON.stringify(legacy))});`;
  const accepted = run(output);
  assert.equal(accepted.passed, true);
  assert.equal(accepted.report.legacy_unreviewed_records, 3);
  assert.equal(accepted.report.records_with_reviewed_changes, 0);
  assert.equal(run(`${output} process.exitCode = 1;`).passed, false, 'nonzero gate exit accepted');
  assert.equal(run('console.log("green")').passed, false, 'non-JSON gate output accepted');
  assert.equal(run(`console.log('log before report'); ${output}`).passed, false, 'ambiguous output accepted');
  assert.equal(run('process.exit(0)').passed, false, 'empty gate output accepted');
  assert.equal(runAdopterAdmission({ root, command: path.join(root, 'missing') }).passed, false, 'missing gate accepted');
} finally { rmSync(root, { recursive: true, force: true }); }
console.log('Adopter admission boundary regressions passed (14 invalid reports and 6 process cases).');

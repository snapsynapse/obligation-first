import { spawnSync } from 'node:child_process';

// This is an operational boundary. Owners retain their source and review rules;
// federation verifies execution and honest accounting, not legal correctness.
export function validateAdmissionReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) return ['Admission report must be a JSON object'];
  const errors = [];
  if (report.status !== 'passed') errors.push('Owner admission status is not passed');
  if (!Array.isArray(report.errors) || report.errors.length) errors.push('Owner admission errors must be an empty array');
  if (typeof report.limits !== 'string' || !report.limits.trim()) errors.push('Owner admission limits are missing');
  const counts = ['total_records', 'legacy_unreviewed_records', 'records_with_reviewed_changes', 'changed_units_reviewed'];
  if (counts.some(key => !Number.isSafeInteger(report[key]) || report[key] < 0)) {
    errors.push('Admission counts must be nonnegative safe integers');
    return errors;
  }
  if (!report.total_records) errors.push('An established adopter corpus cannot report zero protected records');
  if (report.legacy_unreviewed_records + report.records_with_reviewed_changes !== report.total_records) {
    errors.push('Legacy and reviewed-change counts do not account for all protected records');
  }
  if (report.changed_units_reviewed < report.records_with_reviewed_changes ||
      (!report.records_with_reviewed_changes && report.changed_units_reviewed)) {
    errors.push('Reviewed-unit count is inconsistent with records containing reviewed changes');
  }
  return errors;
}

export function runAdopterAdmission({ root, command = process.platform === 'win32' ? 'npm.cmd' : 'npm',
  args = ['run', '--silent', 'check:admission'] }) {
  const result = spawnSync(command, args, {
    cwd: root, encoding: 'utf8', timeout: 120_000, maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const errors = [];
  if (result.error) errors.push(`Owner gate could not complete: ${result.error.message}`);
  if (result.status !== 0) errors.push(`Owner gate exited ${result.status ?? result.signal ?? 'without status'}`);
  let report = null;
  try { report = JSON.parse(result.stdout || ''); }
  catch { errors.push('Owner gate did not emit one JSON report'); }
  if (report !== null) errors.push(...validateAdmissionReport(report));
  else if (!errors.length) errors.push('Owner gate emitted a null report');
  return { passed: errors.length === 0, report, errors, stderr: result.stderr || '' };
}

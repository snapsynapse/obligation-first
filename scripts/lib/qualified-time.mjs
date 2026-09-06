// F14 offline fixture evaluator. This is not an OF record-schema extension.
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(new URL('../../reference/contracts/qualified-time-fixture-v1.schema.json', import.meta.url))));

// Bounds are comparison-only; a partial input is never emitted as an exact day.
export function dateBounds(value) {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}(-\d{2})?(-\d{2})?$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || (month !== undefined && (month < 1 || month > 12))) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day !== undefined && (day < 1 || day > days[month - 1])) return null;
  if (day !== undefined) return [value, value];
  if (month !== undefined) return [`${value}-01`, `${value}-${days[month - 1]}`];
  return [`${value}-01-01`, `${value}-12-31`];
}

export function evaluateQualifiedTime(fixture) {
  if (!validate(fixture)) return {
    errors: validate.errors.map(e => `F14-SHAPE: ${e.instancePath || '/'} ${e.message}`),
    result: null,
  };
  const errors = [];
  for (const [field, date] of [['as_of', fixture.as_of], ['condition.observed_on', fixture.condition.observed_on]]) {
    if (date !== null && !dateBounds(date)) errors.push(`F14-DATE: ${field} has invalid calendar date`);
  }
  for (const branch of ['expected', 'fallback']) {
    const date = fixture[branch].date;
    if (date !== null && !dateBounds(date)) errors.push(`F14-DATE: ${branch} has invalid calendar date`);
  }
  if (errors.length) return { errors, result: null };
  const { condition, as_of: asOf } = fixture;
  let branch = condition.status;
  const reasons = [];
  if (asOf === null || condition.observed_on === null || condition.source === null) {
    branch = 'unknown';
    reasons.push('F14-EVIDENCE-MISSING');
  } else if (condition.observed_on > asOf) {
    branch = 'unknown';
    reasons.push('F14-EVIDENCE-AFTER-AS-OF');
  }
  if (branch === 'satisfied') branch = 'expected';
  if (branch === 'unsatisfied') branch = 'fallback';
  let date = null;
  let state = branch === 'conflicted' ? 'conflicted' : 'unknown';
  if (branch === 'expected' || branch === 'fallback') {
    const selected = fixture[branch];
    if (selected.source === null) reasons.push('F14-DATE-EVIDENCE-MISSING');
    else {
      date = selected.date;
      const bounds = dateBounds(date);
      if (bounds) state = asOf < bounds[0] ? 'before' : asOf >= bounds[1] ? 'on-or-after' : 'unknown';
      else reasons.push('F14-DATE-UNKNOWN');
    }
  }
  const result = { branch, date, state };
  if (fixture.assertion) {
    for (const key of ['branch', 'date', 'state']) {
      if (fixture.assertion[key] !== result[key]) errors.push(`F14-ASSERTION-${key.toUpperCase()}: asserted ${JSON.stringify(fixture.assertion[key])}, supported ${JSON.stringify(result[key])}`);
    }
  }
  return { errors, result, reasons };
}

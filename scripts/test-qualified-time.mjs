#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { evaluateQualifiedTime } from './lib/qualified-time.mjs';
import { checkAdopterQualifiedTime, checkAdopterRoot } from './check-qualified-time-adopter.mjs';

const base = JSON.parse(readFileSync(new URL('../reference/fixtures/qualified-time-v1/pending-amendment.json', import.meta.url)));
let checks = 0;
function check(name, change, expected, diagnostic) {
  const fixture = structuredClone(base);
  delete fixture.assertion;
  change(fixture);
  const output = evaluateQualifiedTime(fixture);
  if (diagnostic) assert(output.errors.some(e => e.startsWith(diagnostic)), `${name}: ${JSON.stringify(output)}`);
  else {
    assert.deepEqual(output.errors, [], name);
    assert.deepEqual(output.result, expected, name);
  }
  checks++;
}
const unknown = { branch: 'unknown', date: null, state: 'unknown' };
check('unresolved commencement does not select planning date', () => {}, unknown);
check('confirmed commencement selects amended date, preserving month precision', f => { f.condition.status = 'satisfied'; },
  { branch: 'expected', date: '2027-01', state: 'before' });
check('not commenced selects fallback at this as-of, not a prediction of permanent failure', f => { f.condition.status = 'unsatisfied'; },
  { branch: 'fallback', date: '2026-06-30', state: 'before' });
check('exact boundary includes the date itself', f => { f.condition.status = 'unsatisfied'; f.as_of = '2026-06-30'; },
  { branch: 'fallback', date: '2026-06-30', state: 'on-or-after' });
check('month overlap has no invented day', f => { f.condition.status = 'satisfied'; f.as_of = '2027-01-15'; },
  { branch: 'expected', date: '2027-01', state: 'unknown' });
check('after month boundary is known without manufacturing precision', f => { f.condition.status = 'satisfied'; f.as_of = '2027-02-01'; },
  { branch: 'expected', date: '2027-01', state: 'on-or-after' });
check('year overlap is unknown', f => { f.condition.status = 'satisfied'; f.expected.date = '2027'; f.as_of = '2027-06-01'; },
  { branch: 'expected', date: '2027', state: 'unknown' });
check('missing selected date is unknown, never the other branch date', f => { f.condition.status = 'satisfied'; f.expected.date = null; },
  { branch: 'expected', date: null, state: 'unknown' });
check('missing date evidence cannot support a date', f => { f.condition.status = 'satisfied'; f.expected.source = null; },
  { branch: 'expected', date: null, state: 'unknown' });
for (const key of ['as_of', 'observed_on', 'source']) {
  check(`missing ${key} cannot establish condition`, f => {
    f.condition.status = 'satisfied';
    if (key === 'as_of') f.as_of = null; else f.condition[key] = null;
  }, unknown);
}
check('later evidence cannot prove earlier state', f => { f.condition.status = 'satisfied'; f.condition.observed_on = '2026-06-02'; }, unknown);
check('conflicting evidence is distinct from missing evidence', f => { f.condition.status = 'conflicted'; },
  { branch: 'conflicted', date: null, state: 'conflicted' });
check('equal branch dates do not resolve an unknown condition', f => { f.expected.date = f.fallback.date; }, unknown);
for (const value of ['2027-02-29', '2026-04-31', '2026-00', '2026-13', '0000']) {
  check(`invalid date ${value}`, f => { f.expected.date = value; }, null, 'F14-DATE:');
}
check('valid leap day', f => { f.condition.status = 'satisfied'; f.expected.date = '2028-02-29'; },
  { branch: 'expected', date: '2028-02-29', state: 'before' });
check('Gregorian century exception', f => { f.expected.date = '2100-02-29'; }, null, 'F14-DATE:');
check('Gregorian 400-year exception', f => { f.condition.status = 'satisfied'; f.expected.date = '2400-02-29'; },
  { branch: 'expected', date: '2400-02-29', state: 'before' });
check('year zero as-of is invalid', f => { f.as_of = '0000-01-01'; }, null, 'F14-DATE:');
check('year zero observation is invalid', f => { f.condition.observed_on = '0000-01-01'; }, null, 'F14-DATE:');
check('evidence on the as-of date is usable', f => { f.condition.status = 'satisfied'; f.condition.observed_on = f.as_of; },
  { branch: 'expected', date: '2027-01', state: 'before' });
check('fallback inside a partial month stays unknown', f => { f.condition.status = 'unsatisfied'; f.fallback.date = '2026-06'; },
  { branch: 'fallback', date: '2026-06', state: 'unknown' });
check('missing fallback source does not borrow expected evidence', f => { f.condition.status = 'unsatisfied'; f.fallback.source = null; },
  { branch: 'fallback', date: null, state: 'unknown' });
check('missing branch structure is an error, not unknown evidence', f => { delete f.fallback; }, null, 'F14-SHAPE:');
check('misspelled condition cannot silently choose fallback', f => { f.condition.status = 'satisified'; }, null, 'F14-SHAPE:');
check('unqualified operative assertion is outside this fixture contract', f => { f.operative_status = 'operative'; }, null, 'F14-SHAPE:');
check('future as-of is allowed when explicit', f => { f.condition.status = 'satisfied'; f.as_of = '2028-01-01'; },
  { branch: 'expected', date: '2027-01', state: 'on-or-after' });
check('wrong branch assertion', f => { f.assertion = { branch: 'expected', date: null, state: 'unknown' }; }, null, 'F14-ASSERTION-BRANCH:');
check('invented day assertion', f => {
  f.condition.status = 'satisfied'; f.assertion = { branch: 'expected', date: '2027-01-01', state: 'before' };
}, null, 'F14-ASSERTION-DATE:');
check('premature commencement assertion', f => {
  f.condition.status = 'satisfied'; f.assertion = { branch: 'expected', date: '2027-01', state: 'on-or-after' };
}, null, 'F14-ASSERTION-STATE:');
const frozen = JSON.stringify(base);
assert.deepEqual(evaluateQualifiedTime(base).errors, []);
assert.equal(JSON.stringify(base), frozen, 'evaluation must not mutate fixture');

// Synthetic export and owner sidecar exercise the cross-boundary checker without
// redistributing adopter data or depending on sibling checkouts in npm test.
const selected = id => {
  const item = structuredClone(base);
  item.id = id;
  item.condition.status = 'satisfied';
  item.assertion = { branch: 'expected', date: '2027-01', state: 'before' };
  return item;
};
const history = structuredClone(base);
history.id = 'predecessor-operative-history';
const exceptions = selected('upon-passage-exceptions');
exceptions.expected.date = '2026-05-20';
exceptions.assertion = { branch: 'expected', date: '2026-05-20', state: 'on-or-after' };
const owner = {
  version: 1,
  record_expectations: { '@id': 'https://example.org/instrument/synthetic-duty', enacted: '2026-05-20', effective: '2027-01', operative_status: 'unknown' },
  cases: [selected('general-commencement'), exceptions, selected('consequential-decision-cutoff'), history, structuredClone(base)],
  date_bindings: [{ case: 'general-commencement', field: 'effective' }, { case: 'upon-passage-exceptions', field: 'enacted' }, { case: 'consequential-decision-cutoff', field: 'effective' }],
  pending_mapping: { case: base.id, amendment_status: { stage: 'adopted-awaiting-publication' }, provision: { effective: '2027-01', effective_if_unamended: '2026-06-30' } },
};
const record = structuredClone(owner.record_expectations);
assert.deepEqual(checkAdopterQualifiedTime(owner, record), []);
function ownerFault(name, mutate, prefix) {
  const fixture = structuredClone(owner), exported = structuredClone(record);
  mutate(fixture, exported);
  assert(checkAdopterQualifiedTime(fixture, exported).some(e => e.startsWith(prefix)), name);
  checks++;
}
ownerFault('same-shape record retarget', (_, r) => { r['@id'] = 'https://example.org/instrument/other'; }, 'F14-RECORD-DRIFT:');
ownerFault('scalar effective date silently moved to enactment', (_, r) => { r.effective = r.enacted; }, 'F14-BINDING-DRIFT:');
ownerFault('rewritten case and assertion still disagree with export', f => { f.cases[0].expected.date = f.cases[0].assertion.date = '2028-01'; }, 'F14-BINDING-DRIFT:');
ownerFault('missing case and binding cannot erase coverage', f => { f.cases.shift(); f.date_bindings[0].case = 'upon-passage-exceptions'; }, 'F14-COVERAGE:');
ownerFault('empty cases cannot pass', f => { f.cases = []; }, 'F14-ADOPTER-SHAPE:');
ownerFault('missing exception binding cannot erase date boundary', f => { f.date_bindings.splice(1, 1); }, 'F14-COVERAGE:');
ownerFault('general date cannot overwrite an exception', f => {
  f.cases[1].expected.date = f.cases[1].assertion.date = '2027-01';
  f.cases[1].assertion.state = 'before';
}, 'F14-BINDING-DRIFT:');
ownerFault('duplicate case cannot mask original', f => { f.cases.push(f.cases[0]); }, 'F14-ADOPTER-SHAPE:');
ownerFault('missing assertion cannot skip semantic verification', f => { delete f.cases[0].assertion; }, 'F14-ADOPTER-SHAPE:');
ownerFault('lost native fallback', f => { delete f.pending_mapping.provision.effective_if_unamended; }, 'F14-NATIVE-MAPPING:');
ownerFault('native adoption is not commencement', f => {
  const item = f.cases.find(c => c.id === base.id);
  item.condition.status = 'satisfied'; item.assertion = { branch: 'expected', date: '2027-01', state: 'before' };
}, 'F14-NATIVE-MAPPING:');
const withoutNative = structuredClone(owner);
delete withoutNative.pending_mapping;
assert(checkAdopterQualifiedTime(withoutNative, record, { requirePendingMapping: true }).some(e => e.startsWith('F14-NATIVE-MAPPING:')));
checks++;
const temporary = mkdtempSync(path.join(tmpdir(), 'of-f14-io-'));
try {
  mkdirSync(path.join(temporary, 'tests/fixtures'), { recursive: true });
  const fixturePath = path.join(temporary, 'tests/fixtures/of-qualified-time.json');
  for (const [contents, diagnostic] of [
    ['{', 'F14-ADOPTER-READ'], ['null', 'F14-ADOPTER-SHAPE'], ['{}', 'F14-ADOPTER-SHAPE'],
    [JSON.stringify({ record: '../outside.json' }), 'F14-ADOPTER-SHAPE'],
    [JSON.stringify({ record: '/outside.json' }), 'F14-ADOPTER-SHAPE'],
    [JSON.stringify({ record: 'missing.json' }), 'F14-ADOPTER-READ'],
  ]) {
    writeFileSync(fixturePath, contents);
    await assert.rejects(checkAdopterRoot(temporary), error => error.message.startsWith(diagnostic));
    checks++;
  }
  rmSync(fixturePath);
  await assert.rejects(checkAdopterRoot(temporary), /F14-ADOPTER-READ/);
  checks++;
} finally { rmSync(temporary, { recursive: true, force: true }); }
const script = `import { evaluateQualifiedTime } from ${JSON.stringify(new URL('./lib/qualified-time.mjs', import.meta.url).href)};
console.log(JSON.stringify(evaluateQualifiedTime(${JSON.stringify(base)})));`;
for (const TZ of ['UTC', 'America/Denver', 'Pacific/Kiritimati']) {
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', env: { ...process.env, TZ } });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), evaluateQualifiedTime(base), `as-of result changed with TZ=${TZ}`);
  checks++;
}
console.log(`Qualified-time synthetic checks passed (${checks + 3}).`);

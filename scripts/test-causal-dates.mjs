#!/usr/bin/env node
import assert from 'node:assert/strict';
import { validateRecordGraphDetailed, GRAPH_DIAGNOSTIC_CODES } from './lib/adopter-kit.mjs';
import { CAUSAL_DIAGNOSTIC_CODES } from './lib/causal-dates.mjs';

for (const code of Object.values(CAUSAL_DIAGNOSTIC_CODES)) assert.ok(Object.values(GRAPH_DIAGNOSTIC_CODES).includes(code), `Unexported graph diagnostic ${code}`);

const id = name => `https://example.com/${name}`;
const entries = records => records.map(record => ({ record, rel: record['@id'], file: record['@id'] }));
const proceeding = { '@id': id('p'), '@type': 'of:Proceeding', filed_date: '2020-02-01', hasDetermination: [id('d')] };
const decision = { '@id': id('d'), '@type': 'of:Determination', issued_date: '2020-02-02', disposition: 'confirmed' };
const vacating = { '@id': id('v'), '@type': 'of:Determination', issued_date: '2020-03-01', vacates: [id('d')], disposition: 'confirmed' };
const causal = records => validateRecordGraphDetailed(entries(records)).filter(item => item.code.startsWith('OF-TIME-'));
assert.deepEqual(causal([proceeding, decision, vacating]), []);
assert.ok(causal([proceeding, { ...decision, issued_date: '2020-01-31' }]).some(item => item.code === 'OF-TIME-DECISION-BEFORE-FILING'));
assert.ok(causal([decision, { ...vacating, issued_date: '2020-01-01' }]).some(item => item.code === 'OF-TIME-VACATES-BEFORE-DECISION'));
assert.ok(causal([{ ...decision, verified: '9999-01-01' }]).some(item => item.code === 'OF-TIME-FUTURE-EVIDENCE'));
assert.ok(causal([{ ...decision, retrieved: '9999-01-01' }]).some(item => item.code === 'OF-TIME-FUTURE-EVIDENCE'));
assert.deepEqual(causal([proceeding, { ...decision, issued_date: '2020-02-01' }]), [], 'same-day events have no inferred clock order');
for (const unknown of [undefined, null, '2020', '2020-01', 'unknown', '2020-02-30']) {
  assert.deepEqual(causal([proceeding, { ...decision, issued_date: unknown }]), [], 'missing/partial/invalid dates cannot imply chronology; schema handles invalid dates');
}
assert.deepEqual(causal([vacating]), [], 'unresolved references do not invent dates; graph reference validation handles them');
// Commencement is not universally causal: a later amendment can be retrospective.
assert.deepEqual(causal([{ '@id': id('i'), '@type': 'of:Instrument', enacted: '2020-02-01', effective: '2020-01-01' }]), []);
// Sunset mirror: the record's own as-of after its own exact sunset day contradicts an operative claim.
const sunsetting = { '@id': id('s'), '@type': 'of:Instrument', operative_status: 'operative', sunset: '2026-12-31', computed_as_of: '2026-06-01' };
assert.deepEqual(causal([sunsetting]), []);
assert.ok(causal([{ ...sunsetting, computed_as_of: '2027-01-01' }]).some(item => item.code === 'OF-TIME-SUNSET-OPERATIVE'));
assert.deepEqual(causal([{ ...sunsetting, computed_as_of: '2026-12-31' }]), [], 'same-day sunset has no clock order');
for (const variant of [{ sunset: '2026' }, { sunset: '2026-12' }, { computed_as_of: '2027' }, { sunset: undefined }, { computed_as_of: undefined }, { sunset: '2026-13-01' }]) {
  assert.deepEqual(causal([{ ...sunsetting, computed_as_of: '2027-01-01', ...variant }]), [], 'partial/missing/invalid dates cannot imply a lapsed sunset');
}
for (const status of ['future', 'inactive', 'unknown', undefined]) {
  assert.deepEqual(causal([{ ...sunsetting, computed_as_of: '2027-01-01', operative_status: status }]), [], 'only an operative claim contradicts a passed sunset');
}
assert.deepEqual(causal([{ ...sunsetting, sunset: '2026-01-01', computed_as_of: undefined, verified: '2026-06-01', retrieved: '2026-06-01' }]), [], 'verified/retrieved are not substituted for the record\'s own computed_as_of');
console.log('Causal date regressions passed (filing/decision, vacating/decision, future evidence, lapsed sunset; precision and retrospective limits retained).');

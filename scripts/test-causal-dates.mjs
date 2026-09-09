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
console.log('Causal date regressions passed (filing/decision, vacating/decision, future evidence; precision and retrospective limits retained).');

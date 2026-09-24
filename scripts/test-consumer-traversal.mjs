#!/usr/bin/env node
import assert from 'node:assert/strict';
import { answerContractErrors, traverseConsumerCase } from './lib/consumer-traversal.mjs';
const id = value => `https://example.com/${value}`;
const records = [
  { '@id': id('decision'), anchors: [id('category')], projection_basis: 'curated-legal-graph', admission_status: 'legacy-unreviewed', source_review_unresolved: ['Unresolved document version'] },
  { '@id': id('category') }, { '@id': id('duty'), isCategorizedBy: [id('category')] },
  { '@id': id('pub-term'), anchors: [id('stat-term')], creates: [id('pub-duty')], lifecycle_status: 'draft', operative_status: 'future' },
  { '@id': id('pub-duty'), lifecycle_status: 'draft', operative_status: 'future' },
  { '@id': id('stat-term'), parent_instrument: id('statute'), creates: [id('stat-duty')], operative_status: 'operative' },
  { '@id': id('statute') }, { '@id': id('stat-duty') }, { '@id': id('old'), replaced_by: [id('category')] },
];
const cases = [
  { id: 'decision-category-duties', start: id('decision'), steps: [
    { direction: 'forward', predicate: 'anchors', expected: [id('category')] },
    { direction: 'inverse', predicate: 'isCategorizedBy', expected: [id('duty')] }],
    expected_boundaries: { [id('decision')]: { projection_basis: 'curated-legal-graph', admission_status: 'legacy-unreviewed', source_review_unresolved: ['Unresolved document version'] }, [id('duty')]: { source: null } } },
  { id: 'pub-term-statute', start: id('pub-term'), steps: [
    { direction: 'forward', predicate: 'anchors', expected: [id('stat-term')] },
    { direction: 'forward', predicate: 'parent_instrument', expected: [id('statute')] },
    { from: 1, direction: 'forward', predicate: 'creates', expected: [id('stat-duty')] }],
    expected_boundaries: { [id('pub-term')]: { lifecycle_status: 'draft', operative_status: 'future' } } },
  { id: 'tombstone-replacement', start: id('old'), steps: [{ direction: 'forward', predicate: 'replaced_by', expected: [id('category')] }] },
];
for (const fixture of cases) assert.equal(traverseConsumerCase(records, fixture).status, 'passed');
for (const fixture of cases) {
  const changed = structuredClone(records);
  changed.find(record => record['@id'] === fixture.start)[fixture.steps[0].predicate] = [id('wrong')];
  assert.equal(traverseConsumerCase(changed, fixture).status, 'failed');
}
for (const field of ['projection_basis', 'admission_status', 'source_review_unresolved']) {
  const changed = structuredClone(records); delete changed[0][field];
  assert.equal(traverseConsumerCase(changed, cases[0]).status, 'failed');
}
const missing = traverseConsumerCase(records.filter(record => record['@id'] !== id('category')), cases[2]);
assert.equal(missing.status, 'failed', 'unresolved replacement must not masquerade as a successful empty result');
const altered = structuredClone(records); altered[3].operative_status = 'operative';
assert.equal(traverseConsumerCase(altered, cases[1]).status, 'failed', 'statutory target cannot confer operative force on a draft');
const inferred = structuredClone(records); inferred[0].projection_basis = 'legacy-filing-status-inference';
assert.equal(traverseConsumerCase(inferred, cases[0]).boundaries[id('decision')].projection_basis, 'legacy-filing-status-inference');
// EV02 answer contract: one bounded answer per journey, frozen, with negative
// controls that fail where meaning would be strengthened.
const typed = structuredClone(records);
const set = (key, fields) => Object.assign(typed.find(record => record['@id'] === id(key)), fields);
set('category', { '@type': 'of:ObligationCategory' });
set('duty', { '@type': 'of:Obligation', duty_holder_roles: [id('role/provider')], jurisdiction: { territorial_scope: ['us-co'] }, admission_status: 'source-consistency-reviewed-changes' });
set('pub-term', { '@type': 'of:Term', jurisdiction: { territorial_scope: ['us-ut'] }, admission_status: 'source-consistency-reviewed-changes', 'pub:source_review_unresolved': ['Authority sign-off pending'], source: id('draft-record'), source_locator: 'Draft section 1' });
set('stat-term', { '@type': 'of:Term' });
set('stat-duty', { '@type': 'of:Obligation', operative_status: 'operative', admission_status: 'source-consistency-reviewed-changes', source: id('enrolled-statute'), source_locator: 'Section 5' });
set('pub-duty', { '@type': 'of:Requirement', jurisdiction: { territorial_scope: ['us-ut'] }, admission_status: 'source-consistency-reviewed-changes' });
const answerCase = (base, question, layers) => {
  const fixture = { ...structuredClone(base), answer: { question, duty_layers: layers } };
  fixture.answer.expected = JSON.parse(JSON.stringify(traverseConsumerCase(typed, { ...fixture, answer: { ...fixture.answer, expected: null } }).answer));
  return fixture;
};
const categoryAnswer = answerCase(cases[0], 'Which duties does the decision relate to?', [2]);
const draftAnswer = answerCase(cases[1], 'What statutory duty does the draft rest on?', [3]);
// The draft's own proposed duty joins the answer only as a draft.
const ownDutyCase = { ...structuredClone(cases[1]), id: 'pub-term-statute-and-own-duty', steps: [...structuredClone(cases[1].steps), { from: 0, direction: 'forward', predicate: 'creates', expected: [id('pub-duty')] }] };
const ownDutyAnswer = answerCase(ownDutyCase, 'What does the draft rest on and what does it propose?', [3, 4]);
for (const fixture of [categoryAnswer, draftAnswer, ownDutyAnswer]) {
  const result = traverseConsumerCase(typed, fixture);
  assert.equal(result.status, 'passed', result.errors.join('; '));
  assert.deepEqual(JSON.parse(JSON.stringify(result.answer)), fixture.answer.expected, 'answer must survive consumer serialization');
  assert.deepEqual(answerContractErrors(fixture.answer.expected), []);
}
assert.equal(categoryAnswer.answer.expected.relation.direct_duty_relations, 0, 'zero direct relations is an allowed coverage result');
assert.deepEqual(categoryAnswer.answer.expected.relation.kinds, ['category-association']);
assert.equal(draftAnswer.answer.expected.subject.binding, 'draft-not-in-force');
const stat = draftAnswer.answer.expected.duties[0];
assert.equal(stat.deontic, 'unclassified', 'unknown deontic operator must not default to Requirement');
assert.equal(stat.territorial_scope, 'unknown', 'missing scope must stay unknown');
assert.equal(stat.duty_holders, 'unknown', 'missing actor must stay unknown');
const own = ownDutyAnswer.answer.expected.duties.find(duty => duty.id === id('pub-duty'));
assert.deepEqual([own.deontic, own.lifecycle_status, own.operative_status], ['of:Requirement', 'draft', 'future'], 'draft-created duty keeps the draft state');
assert.equal(own.duty_holder_roles, 'unknown', 'no role is borrowed from the statutory duty');
assert.deepEqual([draftAnswer.answer.expected.subject.source, draftAnswer.answer.expected.subject.source_locator, draftAnswer.answer.expected.subject.source_version], [id('draft-record'), 'Draft section 1', 'unknown'], 'subject provenance survives; a missing version stays unknown');
assert.deepEqual([stat.source, stat.source_locator, stat.source_version], [id('enrolled-statute'), 'Section 5', 'unknown'], 'duty provenance survives; a missing version stays unknown');
const fails = (fixture, mutate, needle, message) => {
  const recordsCopy = structuredClone(typed), fixtureCopy = structuredClone(fixture);
  mutate(recordsCopy, fixtureCopy);
  const result = traverseConsumerCase(recordsCopy, fixtureCopy);
  assert.equal(result.status, 'failed', message);
  assert(result.errors.some(error => error.includes(needle)), `${message}: ${result.errors.join('; ')}`);
};
const rec = (list, key) => list.find(record => record['@id'] === id(key));
fails(categoryAnswer, (_, f) => { f.answer.expected.relation.applicability = 'applied'; }, 'strengthens meaning', 'category promoted to statutory application');
fails(categoryAnswer, (_, f) => { f.answer.expected.relation.direct_duty_relations = 1; }, 'direct duty relation', 'category counted as a direct duty relation');
fails(draftAnswer, (_, f) => { f.answer.expected.subject.binding = 'not-evaluated'; }, 'Draft subject promoted', 'draft promoted to binding duty');
fails(draftAnswer, list => { rec(list, 'pub-term').lifecycle_status = 'in-force'; }, 'differs from the reviewed expectation', 'projection drops draft state');
fails(draftAnswer, (_, f) => { f.answer.expected.duties[0].territorial_scope = 'unrestricted'; }, 'unrestricted', 'missing scope changed to unrestricted');
fails(draftAnswer, list => { rec(list, 'stat-duty').admission_status = 'source-reviewed'; }, 'Whole-record review', 'reviewed-change receipt promoted to fully reviewed');
fails(draftAnswer, list => { delete rec(list, 'pub-term')['pub:source_review_unresolved']; }, 'differs from the reviewed expectation', 'unresolved evidence removed');
fails(draftAnswer, list => { rec(list, 'pub-term')['pub:source_review_unresolved'] = ['Authority sign-off complete']; }, 'differs from the reviewed expectation', 'unresolved evidence rewritten');
fails(draftAnswer, list => { rec(list, 'stat-duty')['@type'] = 'of:Requirement'; }, 'differs from the reviewed expectation', 'unknown deontic operator defaulted to Requirement');
fails(categoryAnswer, list => { rec(list, 'duty').duty_holders = [id('party/acme')]; }, 'differs from the reviewed expectation', 'actor invented for an unknown duty holder');
fails(ownDutyAnswer, list => { rec(list, 'pub-duty').lifecycle_status = 'in-force'; }, 'differs from the reviewed expectation', 'draft-created duty promoted to in force');
fails(ownDutyAnswer, list => { rec(list, 'pub-duty').duty_holder_roles = [id('role/provider')]; }, 'differs from the reviewed expectation', 'statutory role copied onto the draft-created duty');
fails(ownDutyAnswer, list => { rec(list, 'pub-term').creates = []; }, 'expected IRI set differs', 'draft-created duty silently dropped from the journey');
fails(draftAnswer, list => { delete rec(list, 'stat-duty').source; }, 'differs from the reviewed expectation', 'duty source dropped from the answer');
fails(draftAnswer, list => { rec(list, 'stat-duty').source_version = '2025 enrolled copy'; }, 'differs from the reviewed expectation', 'source version invented for an unversioned duty');
fails(draftAnswer, list => { rec(list, 'pub-term').source_locator = 'Section 5'; }, 'differs from the reviewed expectation', 'draft locator replaced by the statutory locator');
assert.throws(() => traverseConsumerCase(typed, { ...categoryAnswer, answer: { ...categoryAnswer.answer, question: ' ' } }), /finite question/);
assert.throws(() => traverseConsumerCase(typed, { ...categoryAnswer, answer: { ...categoryAnswer.answer, duty_layers: [9] } }), /traversed layers/);
console.log('Consumer traversal regressions passed (three journeys; retargeting, missing/conflicted/inferred evidence and draft boundaries; EV02 answer contract with 16 meaning-strengthening controls, including a draft-created duty and source provenance).');

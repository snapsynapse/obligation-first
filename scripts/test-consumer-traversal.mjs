#!/usr/bin/env node
import assert from 'node:assert/strict';
import { traverseConsumerCase } from './lib/consumer-traversal.mjs';
const id = value => `https://example.com/${value}`;
const records = [
  { '@id': id('decision'), anchors: [id('category')], projection_basis: 'curated-legal-graph', admission_status: 'legacy-unreviewed', source_review_unresolved: ['Unresolved document version'] },
  { '@id': id('category') }, { '@id': id('duty'), isCategorizedBy: [id('category')] },
  { '@id': id('pub-term'), anchors: [id('stat-term')], lifecycle_status: 'draft', operative_status: 'future' },
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
console.log('Consumer traversal regressions passed (three journeys; retargeting, missing/conflicted/inferred evidence and draft boundaries).');

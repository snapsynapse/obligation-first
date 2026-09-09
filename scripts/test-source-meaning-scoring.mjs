import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { scoreSourceMeaning } from './score-source-meaning.mjs';
const hash = text => createHash('sha256').update(text).digest('hex');
const dataset = { schema_version: 1, sources: { synthetic: { excerpt: 'Synthetic text.', excerpt_sha256: hash('Synthetic text.') } }, cases: Array.from({ length: 6 }, (_, i) => ({ id: String(i), source_id: 'synthetic' })) };
const datasetBytes = Buffer.from(JSON.stringify(dataset));
const expected = ['supported', 'supported', 'contradicted', 'insufficient_evidence', 'insufficient_evidence', 'contradicted'];
const predicted = ['contradicted', 'insufficient_evidence', 'supported', 'insufficient_evidence', 'contradicted', 'contradicted'];
const labels = { dataset_sha256: hash(datasetBytes), label_authority: 'Synthetic test labels.', cases: expected.map((label, i) => ({ id: String(i), expected: label, class: 'test', adjudication: i === 5 ? 'disputed' : 'coordinator-provisional-source-review' })) };
const predictions = { dataset_sha256: hash(datasetBytes), evaluator: 'synthetic scorer unit fixture, not an evaluator run', cases: predicted.map((label, i) => ({ id: String(i), label, reason: 'Synthetic scoring control.' })) };
const result = scoreSourceMeaning({ dataset, datasetBytes, labels, predictions });
assert.equal(result.scored_cases, 5); assert.equal(result.exact_matches, 1);
assert.equal(result.false_accepts, 1); assert.equal(result.false_rejects, 1);
assert.equal(result.abstentions, 2); assert.equal(result.warranted_abstentions, 1);
assert.equal(result.unwarranted_abstentions, 1); assert.equal(result.incorrect_rejections_of_insufficient_evidence, 1);
assert.deepEqual(result.disputed_cases, ['5']);
for (const mutate of [
  p => { p.dataset_sha256 = '0'.repeat(64); },
  p => { p.cases.pop(); },
  p => { p.cases[0].id = '1'; },
  p => { p.cases[0].label = 'maybe'; },
  p => { p.cases[0].reason = ''; },
]) {
  const bad = structuredClone(predictions); mutate(bad);
  assert.throws(() => scoreSourceMeaning({ dataset, datasetBytes, labels, predictions: bad }));
}
console.log('Source-meaning scorer tests passed; synthetic control outputs are not an evaluation result.');

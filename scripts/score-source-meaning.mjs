#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const LABELS = ['supported', 'contradicted', 'insufficient_evidence'];
export function scoreSourceMeaning({ dataset, datasetBytes, labels, predictions }) {
  assert.equal(dataset.schema_version, 1, 'Unsupported dataset schema');
  const datasetHash = sha256(datasetBytes);
  assert.equal(labels.dataset_sha256, datasetHash, 'Labels are stale for the dataset');
  assert.equal(predictions.dataset_sha256, datasetHash, 'Predictions are stale for the dataset');
  assert.ok(typeof predictions.evaluator === 'string' && predictions.evaluator.trim(), 'Evaluator identity missing');
  assert.ok(Array.isArray(predictions.cases), 'Predictions missing');
  const ids = dataset.cases.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length, 'Dataset IDs must be unique');
  const checkIds = (items, name) => {
    assert.equal(new Set(items.map(item => item.id)).size, items.length, `${name} IDs must be unique`);
    assert.deepEqual(items.map(item => item.id).sort(), [...ids].sort(), `${name} must account for every case exactly once`);
  };
  checkIds(labels.cases, 'Labels'); checkIds(predictions.cases, 'Predictions');
  for (const source of Object.values(dataset.sources)) assert.equal(sha256(source.excerpt), source.excerpt_sha256, 'Source excerpt digest mismatch');
  const truth = new Map(labels.cases.map(item => [item.id, item]));
  const guessed = new Map(predictions.cases.map(item => [item.id, item]));
  const matrix = Object.fromEntries(LABELS.map(a => [a, Object.fromEntries(LABELS.map(b => [b, 0]))]));
  let scored = 0, exact = 0, falseAccepts = 0, falseRejects = 0, abstentions = 0, warranted = 0;
  const disputed = [], results = [], classes = {};
  for (const item of dataset.cases) {
    assert.ok(Object.hasOwn(dataset.sources, item.source_id), 'Case refers to missing source');
    const expected = truth.get(item.id), answer = guessed.get(item.id);
    assert.ok(LABELS.includes(expected.expected) && LABELS.includes(answer.label), 'Unknown label');
    assert.ok(typeof answer.reason === 'string' && answer.reason.trim(), 'Prediction reason missing');
    if (expected.adjudication === 'disputed') { disputed.push(item.id); continue; }
    assert.ok(['coordinator-provisional-source-review', 'independently-reviewed'].includes(expected.adjudication), 'Unknown label authority');
    scored++; matrix[expected.expected][answer.label]++;
    const match = expected.expected === answer.label;
    if (match) exact++;
    if (answer.label === 'supported' && expected.expected !== 'supported') falseAccepts++;
    if (answer.label === 'contradicted' && expected.expected === 'supported') falseRejects++;
    if (answer.label === 'insufficient_evidence') { abstentions++; if (expected.expected === answer.label) warranted++; }
    const bucket = classes[expected.class] ||= { cases: 0, exact: 0 };
    bucket.cases++; if (match) bucket.exact++;
    results.push({ id: item.id, expected: expected.expected, predicted: answer.label, match });
  }
  return {
    schema_version: 1, dataset_sha256: datasetHash, evaluator: predictions.evaluator,
    label_authority: labels.label_authority, cases: ids.length, scored_cases: scored,
    disputed_cases: disputed, exact_matches: exact,
    false_accepts: falseAccepts, false_rejects: falseRejects,
    abstentions, warranted_abstentions: warranted, unwarranted_abstentions: abstentions - warranted,
    incorrect_rejections_of_insufficient_evidence: matrix.insufficient_evidence.contradicted,
    confusion_matrix: matrix, by_error_class: classes, results,
    limits: 'Bounded selected-case evaluation with stated label authority. No corpus accuracy, legal approval, production evaluator acceptance, or general model benchmark is established. Synthetic cases remain distinct from official-source cases.'
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [datasetPath, labelsPath, predictionsPath, ...extra] = process.argv.slice(2);
  if (!predictionsPath || extra.length) throw Error('Usage: score-source-meaning.mjs CASES.json LABELS.json PREDICTIONS.json');
  const datasetBytes = await readFile(datasetPath);
  const labels = JSON.parse(await readFile(labelsPath, 'utf8'));
  const predictions = JSON.parse(await readFile(predictionsPath, 'utf8'));
  console.log(JSON.stringify(scoreSourceMeaning({ dataset: JSON.parse(datasetBytes), datasetBytes, labels, predictions }), null, 2));
}

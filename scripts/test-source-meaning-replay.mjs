#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { scoreSourceMeaning } from './score-source-meaning.mjs';

const fixture = new URL('../reference/fixtures/source-meaning-v1/', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const readBytes = name => readFile(new URL(name, fixture));
const readJson = async name => JSON.parse(await readFile(new URL(name, fixture), 'utf8'));

export async function verifyFrozenSourceMeaningReplay() {
  const [datasetBytes, initialLabelBytes, finalLabelBytes, predictionBytes, initialScoreBytes, finalScoreBytes, adjudication] = await Promise.all([
    readBytes('cases.json'), readBytes('labels-initial-2026-09-09.json'), readBytes('labels.json'),
    readBytes('predictions-sol-2026-09-09.json'), readBytes('score-initial-sol-2026-09-09.json'), readBytes('score-sol-2026-09-09.json'),
    readJson('adjudication-2026-09-09.json'),
  ]);
  const dataset = JSON.parse(datasetBytes), initialLabels = JSON.parse(initialLabelBytes);
  const finalLabels = JSON.parse(finalLabelBytes), predictions = JSON.parse(predictionBytes);
  const initialScore = JSON.parse(initialScoreBytes), finalScore = JSON.parse(finalScoreBytes);
  assert.equal(adjudication.dataset_sha256, sha256(datasetBytes), 'Adjudication dataset hash does not bind frozen cases');
  assert.equal(adjudication.initial_labels_sha256, sha256(initialLabelBytes), 'Adjudication initial-label hash drifted');
  assert.equal(adjudication.blind_predictions_sha256, sha256(predictionBytes), 'Adjudication prediction hash drifted');
  assert.equal(adjudication.final_labels_sha256, sha256(finalLabelBytes), 'Adjudication final-label hash drifted');
  const replay = (labels, retainedBytes, retained) => {
    const result = scoreSourceMeaning({ dataset, datasetBytes, labels, predictions });
    assert.deepEqual(result, retained, 'Frozen replay result differs from retained score');
    assert.equal(`${JSON.stringify(result, null, 2)}\n`, retainedBytes.toString(), 'Frozen replay serialization differs from retained score');
    return result;
  };
  const initial = replay(initialLabels, initialScoreBytes, initialScore);
  const final = replay(finalLabels, finalScoreBytes, finalScore);
  assert.equal(initial.exact_matches, 19, 'Initial blind score changed');
  assert.equal(final.exact_matches, 20, 'Final adjudicated score changed');
  assert.deepEqual(initial.disputed_cases, []); assert.deepEqual(final.disputed_cases, []);
  const initialById = new Map(initialLabels.cases.map(item => [item.id, item]));
  const finalById = new Map(finalLabels.cases.map(item => [item.id, item]));
  const predictionById = new Map(predictions.cases.map(item => [item.id, item]));
  assert.deepEqual(adjudication.disagreements.map(item => item.id), ['SM-009', 'SM-010', 'SM-019']);
  for (const item of adjudication.disagreements) {
    assert.equal(initialById.get(item.id)?.expected, item.initial_label, `Initial disagreement label drifted for ${item.id}`);
    assert.equal(predictionById.get(item.id)?.label, item.initial_prediction, `Blind prediction drifted for ${item.id}`);
    assert.equal(finalById.get(item.id)?.expected, item.adjudicated_label, `Adjudicated label drifted for ${item.id}`);
  }
  return { dataset, datasetBytes, initialLabels, finalLabels, predictions, initialScore, finalScore, replay };
}

const frozen = await verifyFrozenSourceMeaningReplay();
assert.throws(() => {
  const changedDataset = structuredClone(frozen.dataset);
  changedDataset.sources[Object.keys(changedDataset.sources)[0]].excerpt += ' altered';
  scoreSourceMeaning({ dataset: changedDataset, datasetBytes: frozen.datasetBytes, labels: frozen.finalLabels, predictions: frozen.predictions });
}, /Source excerpt digest mismatch/);
assert.throws(() => {
  const staleLabels = structuredClone(frozen.finalLabels); staleLabels.dataset_sha256 = '0'.repeat(64);
  scoreSourceMeaning({ dataset: frozen.dataset, datasetBytes: frozen.datasetBytes, labels: staleLabels, predictions: frozen.predictions });
}, /Labels are stale/);
assert.throws(() => {
  const duplicatePredictions = structuredClone(frozen.predictions); duplicatePredictions.cases[0].id = duplicatePredictions.cases[1].id;
  scoreSourceMeaning({ dataset: frozen.dataset, datasetBytes: frozen.datasetBytes, labels: frozen.finalLabels, predictions: duplicatePredictions });
}, /Predictions IDs must be unique/);
assert.throws(() => {
  const disputedLabels = structuredClone(frozen.finalLabels);
  disputedLabels.cases.find(item => item.id === 'SM-009').adjudication = 'disputed';
  frozen.replay(disputedLabels, Buffer.from(JSON.stringify(frozen.finalScore, null, 2) + '\n'), frozen.finalScore);
}, /Frozen replay result differs/);
console.log('Frozen source-meaning initial/final replay integrity checks passed.');

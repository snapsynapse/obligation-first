// Offline candidate proof. Does not adopt a fixture or write any owner records.
import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadRecordDir } from '../../../scripts/lib/adopter-kit.mjs';
import { traverseConsumerCase } from '../../../scripts/lib/consumer-traversal.mjs';

const [eal, pub, ail] = process.argv.slice(2);
assert(eal && pub && ail && process.argv.length === 5, 'Expected EAL, PubLedge and AIL record directories');
const historicalBytes = await readFile(new URL('../../fixtures/consumer-traversals-2026-09-24.json', import.meta.url));
const historical = JSON.parse(historicalBytes);
const candidate = JSON.parse(await readFile(new URL('./candidate.json', import.meta.url), 'utf8'));
const inventories = JSON.parse(await readFile(new URL('./input-inventories.json', import.meta.url), 'utf8'));
const primaryTuple = {
  'every-ai-law': '6dd7badebed140f5d4505c75c6063dcf98d08ad2',
  publedge: '72196297a99667110b5ae4584c73bf2f60951c2f',
  'ai-incident-law': '0a79a1ff29718ef118bf020f9d8ee0d68fce5d7a',
};
const pubAlternate = 'f1f5eab2727d8032155ab6a4b0f5ba8328692e36';
assert.deepEqual(candidate.answer_tuple, primaryTuple);
assert.equal(candidate.prior_fixture.path, 'reference/fixtures/consumer-traversals-2026-09-24.json');
assert.equal(candidate.prior_fixture.reviewed_on, historical.reviewed_on);
assert.equal(candidate.version, historical.version);
assert.equal(candidate.scope, historical.scope);
const inputRevisions = {};
for (const [repo, directory] of [['every-ai-law', eal], ['publedge', pub], ['ai-incident-law', ail]]) {
  const entries = [];
  for (const name of (await readdir(directory)).sort()) {
    const file = path.join(directory, name);
    assert(name.endsWith('.json') && (await lstat(file)).isFile(), 'Only regular JSON files permitted');
    entries.push([name, createHash('sha256').update(await readFile(file)).digest('hex')]);
  }
  const digest = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  const match = inventories.owners.find(owner => owner.repo === repo && owner.file_count === entries.length && owner.inventory_sha256 === digest);
  assert(match, `${repo} input bytes do not match a pinned Git inventory`);
  assert(match.revision === primaryTuple[repo] || (repo === 'publedge' && match.revision === pubAlternate), 'Input revision is outside the reviewed tuple');
  inputRevisions[repo] = match.revision;
}
assert.equal(candidate.status, 'proposal-not-adopted');
assert.equal(candidate.reviewed_on, null);
assert.equal(createHash('sha256').update(historicalBytes).digest('hex'), candidate.prior_fixture.sha256);

const selected = new Map([
  ['mata-category-related-duties', ['https://everyailaw.com/obligation/utah-sb149-chatbot-safety-policy-human-oversight.json']],
  ['draft-publedge-term-statutory-records', [
    'https://everyailaw.com/instrument/utah-sb149.json',
    'https://everyailaw.com/obligation/utah-sb149-chatbot-disclosure-transparency.json',
    'https://everyailaw.com/term/utah-sb149-chatbot-disclosure.json',
  ]],
]);
const oldValue = { count: 5, sha256: 'e512520664a8e0b2fda64efc96588766faeb5ad9e9f13cb810b1b1b9cc07a0ce' };
const newValue = { count: 7, sha256: '47ad5c7f7b3b7574cfd109e343d8d65c22e65624746d0b73b9e2410eb6d7c60f' };
const restored = structuredClone(candidate.cases);
for (const item of restored) for (const id of selected.get(item.id) || []) {
  assert.deepEqual(item.answer.expected.unresolved[id], newValue);
  item.answer.expected.unresolved[id] = oldValue;
}
assert.deepEqual(restored, historical.cases, 'No other journey/answer changes permitted');
const records = (await Promise.all([eal, pub, ail].map(root => loadRecordDir(root, { root })))).flat().map(entry => entry.record);
const priorResults = historical.cases.map(item => traverseConsumerCase(records, item));
assert.deepEqual(priorResults.filter(r => r.status !== 'passed').map(r => r.id), [...selected.keys()]);
for (const result of priorResults.filter(r => r.status !== 'passed')) {
  assert.deepEqual(result.errors, ['Consumer answer differs from the reviewed expectation']);
}
const results = candidate.cases.map(item => traverseConsumerCase(records, item));
assert(results.every(r => r.status === 'passed'), JSON.stringify(results.map(r => ({ id: r.id, errors: r.errors }))));
let mutationChecks = 0;
for (const [caseId, ids] of selected) for (const id of ids) {
  for (const mutation of ['remove', 'rewrite']) {
    const changed = structuredClone(records);
    const record = changed.find(r => r['@id'] === id);
    assert(record && Array.isArray(record.source_review_unresolved));
    assert.equal(record.source_review_unresolved.length, 7);
    if (mutation === 'remove') record.source_review_unresolved.pop();
    else record.source_review_unresolved[6] += ' altered';
    const result = traverseConsumerCase(changed, candidate.cases.find(c => c.id === caseId));
    assert.equal(result.status, 'failed', `${id} ${mutation} must remain detectable`);
    assert(result.errors.includes('Consumer answer differs from the reviewed expectation'));
    mutationChecks++;
  }
}
console.log(JSON.stringify({ status: 'candidate-proof-passed-not-adopted', input_revisions: inputRevisions, historical_mismatches: 2, candidate_journeys_passed: results.length, uncertainty_mutations_rejected: mutationChecks, other_case_fields_unchanged: true, human_review: 'not-asserted', source_acceptance: 'not-asserted' }, null, 2));

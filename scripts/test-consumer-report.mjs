#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, link } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { answerDifferences, sha256 } from './lib/consumer-report.mjs';
import { traverseConsumerCase } from './lib/consumer-traversal.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'of-consumer-report-'));
let checks = 0;
const id = name => `https://example.com/${name}`;
const secret = 'DO_NOT_PUBLISH_SOURCE_TEXT_987654321';
const records = [
  { '@id': id('subject'), '@type': 'of:Determination', anchors: [id('category')], source_review_unresolved: ['Original uncertainty'] },
  { '@id': id('category'), '@type': 'of:ObligationCategory' },
  { '@id': id('duty'), '@type': 'of:Obligation', isCategorizedBy: [id('category')], source_locator: 'Section 1', source_review_unresolved: ['Original uncertainty'] },
];
const item = { id: 'bounded-case', start: id('subject'), steps: [
  { direction: 'forward', predicate: 'anchors', expected: [id('category')] },
  { direction: 'inverse', predicate: 'isCategorizedBy', expected: [id('duty')] },
], answer: { question: 'What duties are related?', duty_layers: [2], expected: null } };
item.answer.expected = traverseConsumerCase(records, item).answer;
const fixture = { version: 1, cases: [item] };
const fixturePath = path.join(temp, 'fixture.json'), directory = path.join(temp, 'records'), output = path.join(temp, 'report.json');
const run = (extra, metadata = {}) => spawnSync(process.execPath, [path.join(root, 'scripts/check-consumer-traversals.mjs'), ...extra], { encoding: 'utf8', env: { PATH: process.env.PATH, ...metadata }, maxBuffer: 4 * 1024 * 1024 });
const invoke = () => run([fixturePath, directory, '--report', output]);
const getReport = async () => JSON.parse(await readFile(output, 'utf8'));
const saveFixture = async value => writeFile(fixturePath, JSON.stringify(value));
async function saveRecords(value) { await rm(directory, { recursive: true, force: true }); await mkdir(directory); for (const [i, record] of value.entries()) await writeFile(path.join(directory, `${i}.json`), JSON.stringify(record)); }
try {
  await saveFixture(fixture); await saveRecords(records);
  let result = invoke(), report = await getReport();
  assert.equal(result.status, 0); assert.equal(report.status, 'passed'); assert.equal(report.complete, true);
  assert.equal(report.fixture.sha256, sha256(await readFile(fixturePath))); assert.equal(report.inputs[0].record_count, 3);
  assert.equal(report.inputs[0].records[2].sha256, sha256(await readFile(path.join(directory, '2.json'))));
  assert.deepEqual(report.cases[0].differences, []); checks++;
  assert.equal(report.invocation, null);
  const invocation = '12345678-1234-4234-8234-123456789abc';
  result = run([fixturePath, directory, '--report', output], { OF_CONSUMER_REPORT_INVOCATION: invocation });
  assert.equal(result.status, 0); assert.equal((await getReport()).invocation, invocation); checks++;
  result = run([fixturePath, directory, '--report', output], { OF_CONSUMER_REPORT_INVOCATION: secret });
  assert.equal(result.status, 1); report = await getReport(); assert.equal(report.status, 'error'); assert.equal(report.complete, false); assert.equal(report.invocation, null);
  assert(!JSON.stringify(report).includes(secret)); assert(!result.stderr.includes(secret)); checks++;
  assert.equal(invoke().status, 0);
  const initialBytes = await readFile(output, 'utf8');
  assert.equal(invoke().status, 0); assert.equal(await readFile(output, 'utf8'), initialBytes, 'repeat is byte deterministic'); checks++;
  const zeroRecords = structuredClone(records); zeroRecords[2].source_version = -0;
  const zeroFixture = structuredClone(fixture); zeroFixture.cases[0].answer.expected = traverseConsumerCase(zeroRecords, item).answer;
  await saveFixture(zeroFixture); await saveRecords(zeroRecords); assert.equal(invoke().status, 0);
  assert.deepEqual((await getReport()).cases[0].differences, [], 'diff uses the exact JSON-normalized comparison domain'); checks++;
  await saveFixture(fixture);
  const changed = structuredClone(records); changed[2].source_review_unresolved.push(secret);
  await saveRecords(changed); result = invoke(); report = await getReport();
  assert.equal(result.status, 1); assert.equal(report.status, 'failed'); assert.equal(report.complete, true);
  assert.equal(report.cases[0].differences.length, 2);
  assert(report.cases[0].differences.every(d => d.category === 'uncertainty' && d.owner_record_id === id('duty')));
  assert.equal(report.cases[0].differences[0].path, '/unresolved/https:~1~1example.com~1duty/count');
  assert.equal(report.cases[0].differences[0].expected, 1); assert.equal(report.cases[0].differences[0].actual, 2);
  assert(!JSON.stringify(report).includes(secret)); assert(!result.stdout.includes(secret)); checks++;
  changed[2].source_locator = secret; await saveRecords(changed); result = invoke(); report = await getReport();
  const sourceDiff = report.cases[0].differences.find(d => d.category === 'source-provenance');
  assert.equal(sourceDiff.actual.sha256, sha256(secret)); assert(!JSON.stringify(report).includes(secret)); checks++;
  changed[2].source_locator = 'a'.repeat(64); await saveRecords(changed); assert.equal(invoke().status, 1); report = await getReport();
  const hexLocator = report.cases[0].differences.find(d => d.category === 'source-provenance');
  assert.deepEqual(hexLocator.actual, { kind: 'string', length: 64, sha256: sha256('a'.repeat(64)) });
  assert(!JSON.stringify(report).includes('a'.repeat(64))); checks++;
  for (const action of ['remove', 'rewrite']) {
    const next = structuredClone(records);
    if (action === 'remove') next[2].source_review_unresolved = [];
    else next[2].source_review_unresolved[0] = secret;
    await saveRecords(next); assert.equal(invoke().status, 1); assert.equal((await getReport()).status, 'failed'); checks++;
  }
  const promoted = structuredClone(fixture); promoted.cases[0].answer.expected.relation.applicability = 'applies';
  await saveRecords(records); await saveFixture(promoted); assert.equal(invoke().status, 1);
  assert((await getReport()).cases[0].errors.includes('expected-answer-strengthens-meaning')); checks++;
  await saveFixture(fixture);
  // Every invalid input replaces an existing success with explicit incomplete evidence.
  for (const kind of ['missing-directory', 'malformed-json', 'invalid-invocation', 'duplicate-id', 'invalid-fixture', 'empty-directory']) {
    await saveFixture(fixture); await saveRecords(records); assert.equal(invoke().status, 0);
    if (kind === 'missing-directory') await rm(directory, { recursive: true });
    if (kind === 'malformed-json') await writeFile(path.join(directory, '2.json'), `{"${secret}`);
    if (kind === 'duplicate-id') await saveRecords([...records, records[0]]);
    if (kind === 'invalid-fixture') await writeFile(fixturePath, `{"${secret}`);
    if (kind === 'empty-directory') { await rm(directory, { recursive: true }); await mkdir(directory); }
    result = kind === 'invalid-invocation' ? run([fixturePath, directory, '--unknown', '--report', output]) : invoke();
    report = await getReport(); assert.equal(result.status, 1, kind); assert.equal(report.status, 'error', kind); assert.equal(report.complete, false, kind);
    assert(!JSON.stringify(report).includes(secret)); assert(!result.stderr.includes(secret)); checks++;
  }
  await saveFixture(fixture); await saveRecords(records);
  const fixtureBefore = await readFile(fixturePath, 'utf8');
  assert.equal(run([fixturePath, directory, '--report', fixturePath]).status, 1);
  assert.equal(await readFile(fixturePath, 'utf8'), fixtureBefore); checks++;
  assert.equal(run([fixturePath, directory, '--report', path.join(directory, '0.json')]).status, 1);
  assert.deepEqual(JSON.parse(await readFile(path.join(directory, '0.json'), 'utf8')), records[0]); checks++;
  for (const method of [symlink, link]) {
    await rm(output, { force: true }); await method(fixturePath, output);
    assert.equal(invoke().status, 1); assert.equal(await readFile(fixturePath, 'utf8'), fixtureBefore); await rm(output); checks++;
  }
  // Reports preserve null/missing/type and both owners on shifted duty arrays.
  for (const [before, after] of [[undefined, null], [undefined, {}], [undefined, []], [null, {}], [1, '1'], [[], {}]]) {
    const diff = answerDifferences({ subject: { id: id('subject'), source: before } }, { subject: { id: id('subject'), source: after } });
    assert.equal(diff.length, 1); assert.notDeepEqual(diff[0].expected, diff[0].actual); checks++;
  }
  const shifted = answerDifferences({ duties: [{ id: id('a'), effective: '2020-01-01' }] }, { duties: [{ id: id('b'), effective: '2021-01-01' }] });
  assert(shifted.every(d => d.owner_record_id === id('b') && d.expected_record_id === id('a'))); checks++;
  const weird = answerDifferences({ unresolved: { [id('a~b')]: { count: 1, sha256: 'a'.repeat(64) } } }, { unresolved: { [id('a~b')]: { count: 2, sha256: 'b'.repeat(64) } } });
  assert(weird[0].path.includes('a~0b')); checks++;
  const opaque = answerDifferences({ subject: { id: id('subject'), [secret]: secret } }, { subject: { id: id('subject') } });
  assert.equal(opaque[0].path, '/subject'); assert(!JSON.stringify(opaque).includes(secret)); checks++;
  assert.throws(() => answerDifferences({ duties: [1, 2] }, { duties: [3, 4] }, { maxDifferences: 1 })); checks++;
  // The real observed shape: four uncertainty entries, eight scalars, no others.
  const before = { unresolved: {} }, after = { unresolved: {} };
  for (const name of ['instrument', 'term', 'duty', 'safety']) { before.unresolved[id(name)] = { count: 5, sha256: 'a'.repeat(64) }; after.unresolved[id(name)] = { count: 7, sha256: 'b'.repeat(64) }; }
  assert.equal(answerDifferences(before, after).length, 8); checks++;
  assert.equal(run([fixturePath, directory]).status, 0, 'legacy positional invocation'); checks++;
  const federation = await readFile(path.join(root, 'scripts/verify-federation.mjs'), 'utf8');
  const forwarded = 'process.env.OF_CONSUMER_REPORT ? ["--report", process.env.OF_CONSUMER_REPORT] : []';
  assert.equal(federation.split(forwarded).length - 1, 1, 'only the consumer command accepts the report argument');
  assert(federation.indexOf(forwarded) > federation.indexOf('run("Replay the three bounded consumer graph journeys"')); checks++;
  console.log(`Consumer report regressions passed (${checks} controls; deterministic inputs, safe field differences, stale-success rejection, output aliases and uncertainty preservation).`);
} finally { await rm(temp, { recursive: true, force: true }); }

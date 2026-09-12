#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRecordDir, validateRecordGraph } from './lib/adopter-kit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const historicalDir = path.join(root, 'examples/colorado-sb24-205/records');
const publishedHistoricalDir = path.join(root, 'docs/v1/examples/colorado-sb24-205/records');
const companionDir = path.join(root, 'examples/colorado-evolution/records');
const publishedCompanionDir = path.join(root, 'docs/v1/examples/colorado-evolution/records');

// This fixture is deliberately independent of Git so a clean source archive
// proves the retained historical record bytes without repository metadata.
const HISTORICAL_RECORD_SHA256 = Object.freeze({
  'allegation-co-sb24-205-enforcement-challenge.json': '866898ae6a1c190d3f85f0e313db7d32cee1adf7a6659e60d3fd06ccf892d593',
  'authority-co-attorney-general.json': '15cd2958316f53401d8c7681ebd1b92986085cde78d2f3dc33091dedac510d18',
  'authority-co-general-assembly.json': 'd8fa2a40081c47a5892aee77b6b98a32613a8a426485dd2525ac3aff09395ff5',
  'authority-us-co-ai-policy-work-group.json': '2d179a76d10c93b39f733007c6f40a8ba2d9522efdbc98acd9b3a01b138ff1e8',
  'authority-us-co-federal-district-court.json': 'e6045da16011895a898783d287475dc4db6c60a5c52598c0c41f272d5fb88368',
  'determination-co-ag-non-enforcement-statement.json': 'b423b13e5eecbfea99daf2f68305b495b67eacda9421191869100d2b2809ff3b',
  'determination-co-sb24-205-stay-order.json': '764e5989da1603689293f5ed6747f2a7b265cadc1570dc785c27f323975f918d',
  'instrument-co-sb24-205.json': 'c3c4205ce3ce6bd56c10fd8245428222431712ce010c45bd808a1ae192a93eae',
  'instrument-co-sb26-189.json': 'e006797fd3f7667921064b816d8816007efb86cb63273eb5b442b67c6373b9e6',
  'obligation-reasonable-care.json': '96d92a430e1b5f12d11dd1150901688bc320f726808bc1c8a31e6c2e1619ef58',
  'obligation-violation-reparation.json': '123c63ed5724cf5fd1cb441eda27b680133b4257a44023fba6ee73e217799b30',
  'proceeding-co-sb24-205-federal-litigation.json': '8752a611ed81fa3804207c6a9d0fc358009e689ec39d9013f7c77bae64109fd3',
  'term-co-sb24-205-1703-duty-of-care.json': '82295c26debea1591a33119e2d14b2840e7d271b28fdd74483c721a4c04a55c3',
});

for (const name of Object.keys(HISTORICAL_RECORD_SHA256)) {
  const [source, published] = await Promise.all([
    readFile(path.join(historicalDir, name)),
    readFile(path.join(publishedHistoricalDir, name)),
  ]);
  assert.equal(sha256(source), HISTORICAL_RECORD_SHA256[name], `historical source record changed: ${name}`);
  assert.equal(sha256(published), HISTORICAL_RECORD_SHA256[name], `historical served record changed: ${name}`);
  assert.deepEqual(published, source, `historical source and served bytes differ: ${name}`);
}
assert.deepEqual((await readdir(historicalDir)).filter(name => name.endsWith('.json')).sort(), Object.keys(HISTORICAL_RECORD_SHA256).sort(), 'historical record inventory changed');

assert.deepEqual((await readdir(publishedHistoricalDir)).filter(name => name.endsWith('.json')).sort(), Object.keys(HISTORICAL_RECORD_SHA256).sort(), 'historical served record inventory changed');

const companionEntries = await loadRecordDir(companionDir, { root });
assert.equal(companionEntries.length, 2, 'Colorado companion must remain a two-record teaching set');
assert.deepEqual(validateRecordGraph(companionEntries), [], 'Colorado companion graph must remain internally coherent');
for (const entry of companionEntries) {
  const source = await readFile(entry.file);
  const published = await readFile(path.join(publishedCompanionDir, path.basename(entry.file)));
  assert.deepEqual(published, source, `companion source and served bytes differ: ${path.basename(entry.file)}`);
  assert.equal(entry.record.computed_as_of, '2026-09-05', 'companion must retain its fixed evidence boundary');
  assert.equal(entry.record.operative_status, 'unknown');
  assert.equal(entry.record.enforcement_status, 'unknown');
  assert.ok(!Object.hasOwn(entry.record, 'verified') && !Object.hasOwn(entry.record, 'retrieved'), 'companion must not imply a refreshed review');
  assert.ok(!Object.hasOwn(entry.record, 'sameAs'), 'companion correspondence must not claim property-merge identity');
}
const byId = new Map(companionEntries.map(entry => [entry.record['@id'], entry.record]));
const predecessorId = 'https://obligationfirst.org/v1/examples/colorado-evolution/instrument/predecessor';
const successorId = 'https://obligationfirst.org/v1/examples/colorado-evolution/instrument/successor';
const predecessor = byId.get(predecessorId), successor = byId.get(successorId);
assert.ok(!Object.hasOwn(predecessor, 'lifecycle_status'), 'successor relation must not decide the predecessor lifecycle label');
assert.deepEqual(predecessor.describesSameEntityAs, ['https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/sb24-205']);
assert.equal(successor.lifecycle_status, 'enacted');
assert.equal(successor.enacted, '2026-05-14');
assert.ok(!Object.hasOwn(successor, 'effective'), 'section-specific dates must not become a whole-instrument scalar');
assert.deepEqual(successor.supersedes, [predecessorId]);
assert.deepEqual(successor.describesSameEntityAs, [
  'https://everyailaw.com/instrument/colorado-sb26-189.json',
  'https://publedge.org/instrument/us-co-legislature-statute-2026-sb26-189.json',
]);
const homepage = await readFile(path.join(root, 'docs/index.html'), 'utf8');
const snippets = [...homepage.matchAll(/<pre data-of-example="colorado-evolution">([\s\S]*?)<\/pre>/g)];
assert.equal(snippets.length, 1, 'homepage must expose one current companion excerpt');
assert.deepEqual(JSON.parse(snippets[0][1]), Object.fromEntries(['@context', '@type', '@id', 'title', 'operative_status', 'enforcement_status', 'computed_as_of', 'describesSameEntityAs'].map(key => [key, predecessor[key]])), 'homepage excerpt must match the companion');
console.log('Colorado evolution companion and preserved historical record bytes passed.');

#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { loadRecordDir } from './lib/adopter-kit.mjs';
import { traverseConsumerCase } from './lib/consumer-traversal.mjs';

if (process.argv.length < 4) {
  console.error('Usage: node scripts/check-consumer-traversals.mjs FIXTURE RECORDS_DIR...');
  process.exit(1);
}
const fixture = JSON.parse(await readFile(process.argv[2], 'utf8'));
if (fixture.version !== 1 || !Array.isArray(fixture.cases) || !fixture.cases.length) throw new Error('Invalid traversal fixture');
const records = (await Promise.all(process.argv.slice(3).map(root => loadRecordDir(root, { root })))).flat().map(entry => entry.record);
const results = fixture.cases.map(item => traverseConsumerCase(records, item));
for (const result of results) {
  console.log(`${result.status}: ${result.id}; layer sizes ${result.layers.map(layer => layer.length).join(' -> ')}`);
  for (const error of result.errors) console.error(error);
}
console.log('Declared graph journeys only; category matches are not applicability and statutory anchors do not promote draft terms.');
if (results.some(result => result.status !== 'passed')) process.exitCode = 1;

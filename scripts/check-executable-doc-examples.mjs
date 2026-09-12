#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadSchemas, validateRecordShapes } from './lib/adopter-kit.mjs';
import { validateJsonLdRecords } from './lib/jsonld-contract.mjs';

export const DOCUMENT_EXAMPLE_INVENTORY = Object.freeze([
  Object.freeze({
    id: 'legalruleml-term',
    rel: 'reference/crosswalks/legalruleml.md',
    kind: 'example',
    classification: 'synthetic-current',
    schema: 'term.schema.json',
    jsonld: 'roundtrip',
  }),
  Object.freeze({
    id: 'legalruleml-original-questions',
    rel: 'reference/crosswalks/legalruleml.md',
    kind: 'snippet',
    classification: 'historical',
  }),
]);

function markerAttributes(raw) {
  return Object.fromEntries([...raw.matchAll(/([a-z_]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
}

function markedBlocks(text, kind) {
  const expression = new RegExp(`<!-- executable-${kind}:start\\s+([^>]+)-->([\\s\\S]*?)<!-- executable-${kind}:end\\s+id="([^"]+)"\\s*-->`, 'g');
  return [...text.matchAll(expression)].map(([, attributes, body, endId]) => ({ attributes: markerAttributes(attributes), body, endId }));
}

function fencedJson(body) {
  const match = body.trim().match(/^```json\s*\n([\s\S]*?)\n```$/);
  return match?.[1];
}

export async function executableDocExampleFailures(files, { contextDocument, schemas }) {
  const failures = [];
  for (const item of DOCUMENT_EXAMPLE_INVENTORY) {
    const text = files[item.rel];
    if (typeof text !== 'string') {
      failures.push(`OF-DOC-INVENTORY: missing ${item.rel}`);
      continue;
    }
    const blocks = markedBlocks(text, item.kind).filter(block => block.attributes.id === item.id);
    if (blocks.length !== 1 || blocks[0].endId !== item.id) {
      failures.push(`OF-DOC-INVENTORY: ${item.rel} must contain one ${item.kind} marker for ${item.id}`);
      continue;
    }
    const block = blocks[0];
    if (block.attributes.classification !== item.classification ||
        (item.schema && block.attributes.schema !== item.schema) ||
        (item.jsonld && block.attributes.jsonld !== item.jsonld)) {
      failures.push(`OF-DOC-CLASSIFICATION: ${item.rel} marker metadata differs for ${item.id}`);
      continue;
    }
    if (item.classification === 'historical') continue;
    const source = fencedJson(block.body);
    if (!source) {
      failures.push(`OF-DOC-EXAMPLE: ${item.rel} ${item.id} must contain one JSON code block`);
      continue;
    }
    let record;
    try { record = JSON.parse(source); }
    catch { failures.push(`OF-DOC-EXAMPLE: ${item.rel} ${item.id} contains malformed JSON`); continue; }
    const entry = { rel: `${item.rel}#${item.id}`, record };
    const shapeFailures = validateRecordShapes([entry], schemas);
    for (const failure of shapeFailures) failures.push(`OF-DOC-SCHEMA: ${entry.rel}: ${failure.message}`);
    if (item.jsonld === 'roundtrip') {
      for (const failure of await validateJsonLdRecords([entry], { contextDocument })) {
        failures.push(`OF-DOC-JSONLD: ${failure.code}: ${failure.message}`);
      }
    }
  }
  for (const rel of new Set(DOCUMENT_EXAMPLE_INVENTORY.filter(item => item.schema).map(item => item.rel))) {
    const expected = DOCUMENT_EXAMPLE_INVENTORY.filter(item => item.rel === rel && item.schema).length;
    const actual = [...files[rel].matchAll(/^```json\s*$/gm)].length;
    if (actual !== expected) failures.push(`OF-DOC-INVENTORY: ${rel} has ${actual} JSON code blocks but ${expected} current executable examples`);
  }
  return failures;
}

export async function validateExecutableDocExamples(failures, root = fileURLToPath(new URL('../', import.meta.url))) {
  const rels = [...new Set(DOCUMENT_EXAMPLE_INVENTORY.map(item => item.rel))];
  const files = Object.fromEntries(await Promise.all(rels.map(async rel => [rel, await readFile(path.join(root, rel), 'utf8')])));
  const [contextDocument, schemas] = await Promise.all([
    readFile(path.join(root, 'schema/context.jsonld'), 'utf8').then(JSON.parse),
    loadSchemas(path.join(root, 'schema')),
  ]);
  failures.push(...await executableDocExampleFailures(files, { contextDocument, schemas }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const failures = [];
  await validateExecutableDocExamples(failures);
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
  else console.log('Executable documentation examples passed current-schema and JSON-LD checks.');
}

#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DOCUMENT_EXAMPLE_INVENTORY, executableDocExampleFailures } from './check-executable-doc-examples.mjs';
import { loadSchemas } from './lib/adopter-kit.mjs';

const root = new URL('../', import.meta.url);
const rels = [...new Set(DOCUMENT_EXAMPLE_INVENTORY.map(item => item.rel))];
const files = Object.fromEntries(await Promise.all(rels.map(async rel => [rel, await readFile(new URL(rel, root), 'utf8')])));
const [contextDocument, schemas] = await Promise.all([
  readFile(new URL('schema/context.jsonld', root), 'utf8').then(JSON.parse),
  loadSchemas(new URL('schema/', root).pathname),
]);
assert.deepEqual(await executableDocExampleFailures(files, { contextDocument, schemas }), []);
let mutations = 0;
async function fault(name, mutate, diagnostic) {
  const copy = structuredClone(files);
  mutate(copy);
  assert((await executableDocExampleFailures(copy, { contextDocument, schemas })).some(message => message.startsWith(diagnostic)), name);
  mutations++;
}
await fault('unmarked current JSON is rejected', f => { f['reference/crosswalks/legalruleml.md'] = f['reference/crosswalks/legalruleml.md'].replace('executable-example:start', 'example:start'); }, 'OF-DOC-INVENTORY:');
await fault('a current example cannot be relabelled historical', f => { f['reference/crosswalks/legalruleml.md'] = f['reference/crosswalks/legalruleml.md'].replace('classification="synthetic-current"', 'classification="historical"'); }, 'OF-DOC-CLASSIFICATION:');
await fault('Term example requires parent Instrument', f => { f['reference/crosswalks/legalruleml.md'] = f['reference/crosswalks/legalruleml.md'].replace('  "parent_instrument": "https://example.com/instrument/i1",\n', ''); }, 'OF-DOC-SCHEMA:');
await fault('remote JSON-LD contexts are rejected', f => { f['reference/crosswalks/legalruleml.md'] = f['reference/crosswalks/legalruleml.md'].replace('"https://obligationfirst.org/v1/context.jsonld",', '"https://obligationfirst.org/v1/context.jsonld",\n    "https://example.com/unreviewed-context",'); }, 'OF-DOC-JSONLD: OF-JSONLD-REMOTE-CONTEXT:');
await fault('historical snippets retain their explicit boundary', f => { f['reference/crosswalks/legalruleml.md'] = f['reference/crosswalks/legalruleml.md'].replace('executable-snippet:end id="legalruleml-original-questions"', 'executable-snippet:end id="removed"'); }, 'OF-DOC-INVENTORY:');
console.log(`Executable documentation example checks passed (baseline plus ${mutations} drift mutations).`);

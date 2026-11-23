#!/usr/bin/env node
// Offline structural and OF binding checks, not a RUML parser or evaluator.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { loadRecordDir, loadSchemas, validateRecordShapes, validateRecordGraph } from './lib/adopter-kit.mjs';
import { validateJsonLdRecords } from './lib/jsonld-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstreamHashes = {
  'upstream/ruml.schema.json': '27678378185886554d8c8eb601877ffaf532919656410f9d5ffb68d91acc893b',
  'upstream/ruml-result.schema.json': '1f0d9038a99e1f0b88b36c99f67a630dc1b2900bca01931f1b4d78aa9b25a14c',
  'upstream/LICENSE-APACHE': '074e6e32c86a4c0ef8b3ed25b721ca23aca83df277cd88106ef7177c354615ff',
};
const fixtureFiles = [
  'acknowledgement.ruml', 'cases.json',
  'complete.ruml-result', 'ineligible.ruml-result', 'missing-eligibility.ruml-result',
  'records/instrument.json', 'records/term.json', 'records/obligation.json', 'records/party.json',
  ...Object.keys(upstreamHashes),
].sort();
export async function checkRumlExample(fixtureRoot = path.join(root, 'reference/fixtures/ruml-v1')) {
  const json = async rel => JSON.parse(await readFile(path.join(fixtureRoot, rel), 'utf8'));
  const binding = await json('binding.json');
  const rule = await json('acknowledgement.ruml');
  const cases = await json('cases.json');
  assert.equal(binding.upstream.commit, 'd2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4');
  assert.equal(binding.upstream.repository, 'https://github.com/Law-as-Code-Institute/ruml');
  assert.equal(binding.upstream.specification, '1.0.0');
  assert.equal(binding.upstream.format_version, rule.$specVersion);
  assert.equal(binding.local_rulemap, 'acknowledgement.ruml', 'Unexpected local rulemap');
  assert.equal(binding.scope, 'trigger-conditions-only');
  assert.equal(binding.execution, 'not-run; result files are author-written expectations');
  assert.equal(binding.mode, 'complete');
  assert.equal(cases.mode, binding.mode);
  assert.deepEqual(Object.keys(binding.sha256_file_bytes).sort(), fixtureFiles, 'Fixture hash inventory changed');
  for (const [rel, expected] of Object.entries(binding.sha256_file_bytes)) {
    assert.equal(createHash('sha256').update(await readFile(path.join(fixtureRoot, rel))).digest('hex'), expected, `Fixture byte drift: ${rel}`);
    if (Object.hasOwn(upstreamHashes, rel)) assert.equal(expected, upstreamHashes[rel], `Pinned upstream byte drift: ${rel}`);
  }
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  const validateRule = ajv.compile(await json('upstream/ruml.schema.json'));
  const validateResult = ajv.compile(await json('upstream/ruml-result.schema.json'));
  assert.ok(validateRule(rule), JSON.stringify(validateRule.errors));
  assert.equal(rule.metadata.status, 'draft');
  assert.equal(rule.metadata.version, '1.0.0');
  assert.equal(rule.rulemap.nodes['1'].id, binding.node_id);
  assert.equal(binding.node_path, '1');
  assert.deepEqual(rule.rulemap.nodes['1'].children, ['2', '3']);
  assert.equal(rule.rulemap.nodes['1'].operator, 'AND');
  assert.deepEqual(Object.keys(rule.rulemap.nodes).sort(), ['1', '2', '3']);
  assert.equal(new Set(Object.values(rule.rulemap.nodes).map(n => n.id)).size, 3, 'Duplicate synthetic node UUID');
  assert.deepEqual(rule.rulemap.nodes['1'].capabilities, [{
    id: 'ruml:text-reference', payload: { refs: [{ id: 'text_policy', type: 'represents' }] },
  }], 'Unresolved or changed synthetic source anchor');
  assert.deepEqual(rule.capabilities.map(c => c.id).sort(), ['ruml:datapoints', 'ruml:query', 'ruml:text-reference']);
  assert.ok(rule.capabilities.every(c => c.required === true), 'Synthetic capabilities must be required');
  const data = rule.capabilities.find(c => c.id === 'ruml:datapoints').payload.data;
  assert.deepEqual(Object.keys(data).sort(), ['dp_eligible', 'dp_evidence_complete']);
  for (const [lexId, dp] of [['2', 'dp_eligible'], ['3', 'dp_evidence_complete']]) {
    assert.equal(rule.rulemap.nodes[lexId].capabilities[0].payload.expression, `$exists(${dp}) ? ${dp} : ()`);
  }
  const entries = await loadRecordDir(path.join(fixtureRoot, 'records'), { root });
  const schemas = await loadSchemas(path.join(root, 'schema'));
  assert.deepEqual(validateRecordShapes(entries, schemas), []);
  assert.deepEqual(validateRecordGraph(entries), []);
  const contextDocument = JSON.parse(await readFile(path.join(root, 'schema/context.jsonld'), 'utf8'));
  assert.deepEqual(await validateJsonLdRecords(entries, { contextDocument }), []);
  assert.equal(entries.length, 4);
  const byId = new Map(entries.map(entry => [entry.record['@id'], entry.record]));
  const obligation = byId.get(binding.obligation);
  const term = byId.get(binding.term);
  assert.ok(obligation && term);
  assert.equal(obligation.created_by, term['@id']);
  assert.equal(obligation.executableEncoding.kind, 'other');
  assert.equal(obligation.executableEncoding.uri, binding.encoding_uri);
  assert.equal(obligation.executableEncoding.version, rule.metadata.version);
  assert.ok(byId.has(obligation.duty_holders[0]));
  const text = rule.capabilities.find(c => c.id === 'ruml:text-reference').payload.data.text_policy;
  assert.equal(text.text, term.text);
  assert.equal(text.uri, term.source);
  for (const record of [term, obligation, byId.get(term.parent_instrument)]) {
    assert.equal(record.lifecycle_status, 'draft');
    assert.equal(record.operative_status, 'inactive');
    assert.equal(record.enforcement_status, 'unknown');
  }
  const expectations = {
    complete: { '1': 'true', '1.1': 'true', '1.2': 'true' },
    ineligible: { '1': 'false', '1.1': 'false', '1.2': 'true' },
    'missing-eligibility': { '1': 'undefined', '1.1': 'undefined', '1.2': 'true' },
  };
  const inputs = {
    complete: { dp_eligible: true, dp_evidence_complete: true },
    ineligible: { dp_eligible: false, dp_evidence_complete: true },
    'missing-eligibility': { dp_evidence_complete: true },
  };
  assert.deepEqual(cases.cases.map(c => c.id).sort(), Object.keys(expectations).sort());
  for (const c of cases.cases) {
    assert.deepEqual(c.inputs, inputs[c.id], `Case inputs changed: ${c.id}`);
    assert.deepEqual(c.expected, expectations[c.id]);
    if (c.id === 'missing-eligibility') assert.ok(!Object.hasOwn(c.inputs, 'dp_eligible'));
    const result = await json(`${c.id}.ruml-result`);
    assert.ok(validateResult(result), JSON.stringify(validateResult.errors));
    assert.equal(result.rumlReference.id, rule.metadata.id);
    assert.equal(result.evaluation.mode, cases.mode);
    assert.equal(result.evaluation.caseId, c.id);
    assert.deepEqual(Object.fromEntries(Object.entries(result.evaluation.results).map(([p, r]) => [p, r.status])), c.expected);
    for (const [p, lexId] of [['1', '1'], ['1.1', '2'], ['1.2', '3']]) assert.equal(result.evaluation.results[p].lexId, lexId);
  }
  return { records: entries.length, cases: cases.cases.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkRumlExample();
  console.log(`RUML fixture checks passed: ${result.records} OF records, 1 rulemap, ${result.cases} expected results; schema, graph, JSON-LD, hashes and bindings checked. No runtime evaluation or full RUML conformance claimed.`);
}

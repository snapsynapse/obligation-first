import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadSchemas, validateRecordShapes, validateRecordGraph } from './lib/adopter-kit.mjs';
import { buildAdopterFingerprint, fingerprintDifferences } from './lib/adopter-fingerprint.mjs';
import { SCOPE_PATHS, classifyScope, validateScopeInventory, compareScopeInventories, checkScopeBaseline } from './lib/scope-contract.mjs';

const fixture = new URL('../reference/fixtures/scope-contract-v1/', import.meta.url);
const read = async name => JSON.parse(await readFile(new URL(name, fixture), 'utf8'));
const [records, profile, inventory, baseline] = await Promise.all(['records.json', 'profile.json', 'inventory.json', 'baseline.json'].map(read));
const schemas = await loadSchemas(new URL('../schema/', import.meta.url).pathname);
const entries = values => values.map((record, i) => ({ record, file: `${i}.json`, rel: `${i}.json` }));
const check = (r = records, p = profile, i = inventory, b = baseline) => checkScopeBaseline(r, p, i, b);
let mutations = 0;
function fault(label, mutate, code, { shapeValid = true } = {}) {
  const candidate = structuredClone(records);
  mutate(candidate);
  if (shapeValid) assert.deepEqual(validateRecordShapes(entries(candidate), schemas), [], `${label}: mutation must remain schema-valid`);
  const result = check(candidate);
  assert.ok(result.errors.some(error => error.code === code), `${label}: expected ${code}, got ${JSON.stringify(result.errors)}`);
  mutations++;
}
assert.deepEqual(validateRecordShapes(entries(records), schemas), []);
assert.deepEqual(validateRecordGraph(entries(records)), []);
assert.deepEqual(check().errors, []);
assert.deepEqual(records[0].organization, { '@type': 'gist:Organization', name: 'International Organization for Standardization' });
assert.ok(!Object.hasOwn(records[0], 'authority_basis'));
assert.ok(!Object.hasOwn(records[0].jurisdiction, 'territorial_scope'));
assert.equal(records[4].issuedBy, 'https://example.com/iso');
assert.equal(records[4].administeredBy, 'https://example.com/administrator');
assert.ok(!Object.hasOwn(records[4], 'enforcedBy') && !Object.hasOwn(records[4], 'regulatedBy'));
assert.equal(classifyScope(inventory, 'territorial', 'zz-uncovered').coverage, 'uncovered');
assert.equal(classifyScope(inventory, 'territorial', 'ca').coverage, 'unknown');
assert.equal(classifyScope(inventory, 'territorial', 'imaginary-country').recognition, 'unknown');
assert.equal(classifyScope(inventory, 'territorial', 'ca-bc').parent, 'ca');
assert.equal(classifyScope(inventory, 'institutional', 'International Organization for Standardization').recognition, 'recognized');
assert.equal(classifyScope(inventory, 'territorial', 'International Organization for Standardization').recognition, 'unknown');
assert.ok(!check().claims.some(([id]) => id === 'https://example.com/administrator'), 'missing scope must not fabricate a territorial claim');

fault('ISO replaced by recognized OECD', r => { r[0].jurisdiction.institutional_scope = r[1].jurisdiction.institutional_scope; }, 'OF-SCOPE-DRIFT');
fault('finer subnational scope flattened', r => { r[5].territorial_scope = ['ca']; }, 'OF-SCOPE-DRIFT');
fault('recognized scope removed', r => { delete r[0].jurisdiction; }, 'OF-SCOPE-DRIFT');
fault('new fabricated territorial code', r => { r[5].territorial_scope = ['imaginary-country']; }, 'OF-SCOPE-UNKNOWN');
fault('institution moved into geography', r => { r[0].jurisdiction = { '@type': 'of:Jurisdiction', territorial_scope: r[0].jurisdiction.institutional_scope }; }, 'OF-SCOPE-KIND');
fault('case changes are not aliases', r => { r[5].territorial_scope = ['CA-BC']; }, 'OF-SCOPE-UNKNOWN');
fault('whitespace is not an alias', r => { r[5].territorial_scope = [' ca-bc']; }, 'OF-SCOPE-UNKNOWN');
fault('legacy scope substituted', r => { r[8].jurisdiction.ref = 'ca-bc'; }, 'OF-SCOPE-DRIFT');
fault('standalone institutional scope substituted', r => { r[10].institutional_scope = ['Organisation for Economic Co-operation and Development']; }, 'OF-SCOPE-DRIFT');
fault('inline territorial scope substituted', r => { r[9].jurisdiction.territorial_scope = ['ca']; }, 'OF-SCOPE-DRIFT');
fault('reference silently redirected to another type', r => { r[6].jurisdiction = 'https://example.com/iso'; }, 'OF-SCOPE-KIND');
fault('reference becomes unresolved', r => { r[6].jurisdiction = 'https://example.com/missing'; }, 'OF-SCOPE-UNRESOLVED');
fault('empty scope', r => { r[5].territorial_scope = []; }, 'OF-SCOPE-SHAPE', { shapeValid: false });
fault('duplicate scope', r => { r[5].territorial_scope = ['ca-bc', 'ca-bc']; }, 'OF-SCOPE-SHAPE', { shapeValid: false });
fault('null jurisdiction', r => { r[0].jurisdiction = null; }, 'OF-SCOPE-SHAPE', { shapeValid: false });
const reordered = structuredClone(records).reverse();
reordered.find(r => r['@id'].endsWith('/territories')).territorial_scope.reverse();
reordered.find(r => r['@id'].endsWith('/bc')).territorial_scope = 'ca-bc';
assert.deepEqual(check(reordered).errors, [], 'record order and set/scalar presentation carry no semantics');
const alteredProfile = structuredClone(profile);
alteredProfile.jurisdiction.ref = 'ca-bc';
assert.ok(check(records, alteredProfile).errors.some(e => e.code === 'OF-SCOPE-DRIFT'));
for (const alter of [
  i => { i.contract_version = 2; },
  i => { i.entries.push(i.entries[0]); },
  i => { i.entries[0].parent = 'missing'; },
  i => { i.entries[0].parent = 'ca-bc'; },
  i => { i.entries[3].parent = 'ca'; },
  i => { i.coverage[0].id = 'not-in-inventory'; },
  i => { i.coverage.push(i.coverage[0]); },
  i => { delete i.entries[0].source; },
]) {
  const candidate = structuredClone(inventory); alter(candidate);
  assert.ok(validateScopeInventory(candidate).some(e => e.code === 'OF-SCOPE-CONTRACT'));
  mutations++;
}
const differentOwner = { ...inventory, owner: 'https://example.com/other/' };
assert.ok(check(records, profile, differentOwner).errors.some(e => e.code === 'OF-SCOPE-OWNER'));
const removedInventory = structuredClone(inventory);
removedInventory.entries = removedInventory.entries.filter(e => e.id !== 'ca-bc');
assert.ok(check(records, profile, removedInventory).errors.some(e => e.code === 'OF-SCOPE-UNKNOWN'));
const changedCoverage = structuredClone(inventory);
changedCoverage.coverage[0].status = 'modeled';
assert.ok(check(records, profile, changedCoverage).errors.some(e => e.code === 'OF-SCOPE-BASELINE'), 'coverage drift needs review too');
assert.ok(check([], profile).errors.some(e => e.code === 'OF-SCOPE-RECORDS'));
assert.ok(check([...records, records[0]]).errors.some(e => e.code === 'OF-SCOPE-RECORDS'));
assert.ok(check(records, profile, inventory, { ...baseline, claims: [] }).errors.some(e => e.code === 'OF-SCOPE-DRIFT'), 'empty oracle must fail');
assert.ok(check(records, profile, inventory, { ...baseline, baseline_version: 99 }).errors.some(e => e.code === 'OF-SCOPE-BASELINE'));
const secondOwner = structuredClone(inventory);
secondOwner.owner = 'https://example.com/second-adopter/';
secondOwner.coverage[0].status = 'modeled';
assert.deepEqual(compareScopeInventories([inventory, secondOwner]), [], 'coverage may differ between owners');
secondOwner.entries.push({ id: 'us', kind: 'territorial', source: 'Synthetic parent fixture', extension: false });
secondOwner.entries.find(entry => entry.id === 'ca-bc').parent = 'us';
assert.ok(compareScopeInventories([inventory, secondOwner]).some(e => e.code === 'OF-SCOPE-CONFLICT'), 'cross-owner parent conflict must fail');
secondOwner.entries.find(entry => entry.id === 'ca-bc').parent = 'ca';
secondOwner.entries.find(entry => entry.id === 'International Organization for Standardization').kind = 'territorial';
assert.ok(compareScopeInventories([inventory, secondOwner]).some(e => e.code === 'OF-SCOPE-CONFLICT'), 'cross-owner kind conflict must fail');

// Discover scope paths from schemas independently. The implementation cannot
// shrink its expected inventory by deleting its own field list.
const documents = await Promise.all((await readdir(new URL('../schema/', import.meta.url)))
  .filter(name => name.endsWith('.schema.json'))
  .map(async name => JSON.parse(await readFile(new URL(`../schema/${name}`, import.meta.url), 'utf8'))));
function discoverPaths(docs) {
  const found = new Set();
  function walk(value, prefix = '') {
    if (!value || typeof value !== 'object') return;
    for (const [field, shape] of Object.entries(value.properties || {})) {
      if (field === 'jurisdiction') found.add('jurisdiction');
      if (field.endsWith('_scope') || (prefix === 'jurisdiction/' && field === 'ref')) found.add(`${prefix}${field}`);
      walk(shape, `${prefix}${field}/`);
    }
    for (const keyword of ['anyOf', 'oneOf', 'allOf']) for (const child of value[keyword] || []) walk(child, prefix);
  }
  for (const doc of docs) {
    walk(doc);
    if (doc.$defs?.jurisdiction) walk(doc.$defs.jurisdiction, 'jurisdiction/');
  }
  return [...found].sort();
}
assert.deepEqual([...SCOPE_PATHS].sort(), discoverPaths(documents));
assert.notDeepEqual(SCOPE_PATHS.filter(p => p !== 'jurisdiction/ref').sort(), discoverPaths(documents));
assert.notDeepEqual([...SCOPE_PATHS].sort(), discoverPaths([...documents, { properties: { treaty_scope: { type: 'string' } } }]));

const temporary = await mkdtemp(path.join(tmpdir(), 'of-scope-eval-'));
try {
  const directory = path.join(temporary, 'records');
  await mkdir(directory);
  const profilePath = path.join(temporary, 'profile.json');
  const inventoryPath = path.join(temporary, 'inventory.json');
  const baselinePath = path.join(temporary, 'baseline.json');
  await writeFile(profilePath, JSON.stringify(profile));
  await writeFile(inventoryPath, JSON.stringify(inventory));
  await writeFile(baselinePath, JSON.stringify(baseline));
  async function writeRecords(values) {
    for (const [index, record] of values.entries()) await writeFile(path.join(directory, `${index}.json`), JSON.stringify(record));
  }
  await writeRecords(records);
  const original = await buildAdopterFingerprint({ recordsDir: directory, profilePath });
  // Existing fingerprint still has a bounded scope. Demonstrate the blind spot
  // and require the new companion check to reject the exact same mutation.
  const changed = structuredClone(records);
  changed[0].jurisdiction.institutional_scope = changed[1].jurisdiction.institutional_scope;
  await writeRecords(changed);
  assert.deepEqual(fingerprintDifferences(original, await buildAdopterFingerprint({ recordsDir: directory, profilePath })), []);
  const args = [new URL('./check-scope-contract.mjs', import.meta.url).pathname,
    '--records', directory, '--profile', profilePath, '--inventory', inventoryPath, '--baseline', baselinePath];
  let run = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(run.status, 1); assert.match(run.stderr, /OF-SCOPE-DRIFT/);
  await writeRecords(records);
  run = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  run = spawnSync(process.execPath, [...args, '--write'], { encoding: 'utf8' });
  assert.equal(run.status, 2); assert.match(run.stderr, /EEXIST/, 'writer cannot overwrite reviewed baseline');
  assert.deepEqual(JSON.parse(await readFile(baselinePath, 'utf8')), baseline);
  // Existing edge evals must preserve ISO issuance independently from the other
  // institutional roles. This synthetic standard claims no enforcement basis.
  for (const relation of ['administeredBy', 'regulatedBy', 'enforcedBy']) {
    const swapped = structuredClone(records);
    swapped[4][relation] = swapped[4].issuedBy;
    delete swapped[4].issuedBy;
    assert.deepEqual(validateRecordShapes(entries(swapped), schemas), []);
    await writeRecords(swapped);
    assert.ok(fingerprintDifferences(original, await buildAdopterFingerprint({ recordsDir: directory, profilePath })).length);
    mutations++;
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
console.log(`Scope contract evals passed: ${mutations} seeded mutations; schema-derived path coverage, legacy compatibility, CLI failure and writer protection verified.`);

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { outputs, root, vocabulary } from './build-vocabulary.mjs';
const expected = await outputs();
for (const [rel, value] of Object.entries(expected)) assert.equal(await readFile(path.join(root, rel), 'utf8'), value, `F13 stale generated target: ${rel}`);
const { terms } = JSON.parse(expected['docs/v1/vocabulary/terms.json']);
assert(terms.some(t => t.term === 'Instrument'));
assert(terms.some(t => t.aliases.includes('parent_instrument') && t.term === 'parentInstrument'));
assert.equal(new Set(terms.map(t => t.iri)).size, terms.length);
const rules = expected['reference/w3id/of/.htaccess'].split('\n').filter(l => l.startsWith('RewriteRule')).map(l => { const [, pattern, target, flags] = l.split(' '); return { re: new RegExp(pattern), target, flags }; });
for (const term of terms) {
  assert(expected['docs/v1/vocabulary/index.html'].includes(`id="${term.term}"`));
  const hits = rules.filter(r => r.re.test(`v1/${term.term}`));
  assert.equal(hits.length, 1);
  assert.equal(hits[0].target, term.target);
  assert(hits[0].flags.includes('303'));
}
for (const bad of ['v1/UnknownTerm', 'v1/instrument', 'v1/InstrumentExtra', 'v1/schema/unknown.schema.json', 'v1/../Instrument', 'v2/Instrument']) assert.equal(rules.filter(r => r.re.test(bad)).length, 0, bad);
assert.throws(() => vocabulary({ '@context': { danger: { '@id': 'of:../escape' } } }));
console.log(`F13 target/rule inventory passed: ${terms.length} terms, unknown paths rejected.`);

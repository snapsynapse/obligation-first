import assert from 'node:assert/strict';
import { compareTermBoundaries, compareDatePrecision } from './lib/term-boundaries.mjs';
import { traverseConsumerCase } from './lib/consumer-traversal.mjs';
const parent = { '@type': 'of:Instrument', '@id': 'https://example.com/parent', effective: '2026-07-01' };
const source = { '@type': 'of:Term', '@id': 'https://example.com/source', parent_instrument: parent['@id'], jurisdiction: { territorial_scope: ['us-ut', 'us-co'] }, effective: '2026-01', lifecycle_status: 'draft', operative_status: 'unknown', source: 'https://example.com/source-text', source_locator: 'Clause 2', anchors: ['https://example.com/target'] };
const target = { ...source, '@id': 'https://example.com/target', anchors: [], effective: '2025-12-31', jurisdiction: { territorial_scope: ['us-ut'] } };
const input = { source, target, sourceParent: parent, targetParent: parent, asOf: '2026-01-15' };
const result = compareTermBoundaries(input);
assert.equal(result.territory_result, 'unknown');
assert.deepEqual(result.common_declared_codes, ['us-ut']);
assert.equal(result.intersection_after_declared_exceptions, null);
assert.equal(result.source.effective, '2026-01');
assert.equal(result.source.effective_vs_parent, 'before');
assert.equal(result.source.effective_vs_as_of, 'overlapping-precision');
assert.equal(result.source.lifecycle_status, 'draft');
assert.equal(result.legal_applicability, 'unknown');
assert.equal(compareTermBoundaries({ ...input, sourceExceptions: [], targetExceptions: [] }).territory_result, 'declared-overlap');
assert.equal(compareTermBoundaries({ ...input, sourceExceptions: ['us-ut'], targetExceptions: [] }).territory_result, 'no-declared-common-code');
assert.equal(compareTermBoundaries({ ...input, sourceExceptions: [], targetExceptions: ['us-ut'] }).territory_result, 'no-declared-common-code');
assert.equal(compareTermBoundaries({ ...input, source: { ...source, jurisdiction: { territorial_scope: ['us'] } }, sourceExceptions: [], targetExceptions: [] }).territory_result, 'no-declared-common-code', 'No implicit country expansion');
assert.equal(compareTermBoundaries({ ...input, sourceParent: { ...parent, '@id': 'https://example.com/unrelated' } }).source.effective_vs_parent, 'unknown');
for (const [a, b, expected] of [['2026', '2026-06', 'overlapping-precision'], ['2026-02', '2026-03', 'before'], ['2026-04', '2026-03', 'after'], ['2026-01-01', '2026-01-01', 'same-day'], ['2026-02-30', '2026-03-01', 'unknown'], [null, '2026-03-01', 'unknown']]) assert.equal(compareDatePrecision(a, b), expected);
const fixture = { id: 'synthetic-term-boundary', start: source['@id'], steps: [{ predicate: 'anchors', direction: 'forward', expected: [target['@id']] }], term_comparisons: [{ source: source['@id'], target: target['@id'], as_of: input.asOf, expected: result }] };
assert.equal(traverseConsumerCase([source, target, parent], fixture).status, 'passed');
const exclusionFixture = structuredClone(fixture);
Object.assign(exclusionFixture.term_comparisons[0], { source_exceptions: ['us-ut'], target_exceptions: [], expected: compareTermBoundaries({ ...input, sourceExceptions: ['us-ut'], targetExceptions: [] }) });
assert.equal(traverseConsumerCase([source, target, parent], exclusionFixture).status, 'passed');
exclusionFixture.term_comparisons[0].source_exceptions = [];
assert.equal(traverseConsumerCase([source, target, parent], exclusionFixture).status, 'failed', 'Integrated exception drift must fail the expected comparison');
for (const mutate of [
  r => { delete r.source_locator; },
  r => { r.source_locator = 'Unrelated clause'; },
  r => { r.source = 'https://example.com/wrong-source'; },
  r => { r.jurisdiction.territorial_scope = ['us-ca']; },
  r => { r.effective = '2026-08-01'; },
  r => { r.lifecycle_status = 'enacted'; },
  r => { r.operative_status = 'operative'; },
]) {
  const changed = structuredClone(source); mutate(changed);
  assert.equal(traverseConsumerCase([changed, target, parent], fixture).status, 'failed');
}
console.log('Term boundary tests passed: declared intersections/exclusions, locator drift, partial dates, parent identity and draft state; applicability stays unknown.');

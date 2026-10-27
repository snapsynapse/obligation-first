import assert from 'node:assert/strict';
import { entityAgreement } from './check-entity-agreement.mjs';
import { validateRecordGraphDetailed } from './lib/adopter-kit.mjs';

const id = name => `https://example.com/${name}`;
const instrument = (name, fields = {}) => ({ '@id': id(name), '@type': 'of:Instrument', ...fields });
const priorA = instrument('a/prior', { lifecycle_status: 'superseded', operative_status: 'unknown', enforcement_status: 'unknown', describesSameEntityAs: [id('b/prior')] });
const priorB = instrument('b/prior', { lifecycle_status: 'superseded', operative_status: 'unknown', enforcement_status: 'unknown' });
const nextA = instrument('a/next', { lifecycle_status: 'enacted', supersedes: [priorA['@id']], describesSameEntityAs: [id('b/next')] });
const nextB = instrument('b/next', { lifecycle_status: 'enacted', supersedes: [priorB['@id']] });
const base = [priorA, priorB, nextA, nextB];
const pair = report => report.pairs.find(item => [item.source, item.target].includes(nextA['@id']));
const relation = (report, field = 'supersedes') => pair(report).compared_relations.find(item => item.field === field);
const graph = records => validateRecordGraphDetailed(records.map(record => ({ record, rel: record['@id'] })));

const matching = entityAgreement(base);
assert.equal(relation(matching).equal, true, 'owner-specific target IRIs compare through declared correspondence');
assert.deepEqual(matching.conflicts, []);
assert.deepEqual(matching.warnings, []);
assert.deepEqual(graph(base), []);

const other = instrument('other');
const retargeted = entityAgreement([priorA, priorB, nextA, { ...nextB, supersedes: [other['@id']] }, other]);
assert.match(retargeted.conflicts.join('\n'), /OF-ENTITY-RELATION-CONFLICT/, 'same scalar states cannot hide a different predecessor');
assert.equal(relation(retargeted).equal, false);
for (const field of ['supersedes', 'wouldSupersede', 'repeals', 'amends']) {
  const a = { ...nextA, supersedes: undefined, [field]: [priorA['@id'], other['@id']] };
  const b = { ...nextB, supersedes: undefined, [field]: [other['@id'], priorB['@id']] };
  assert.equal(relation(entityAgreement([priorA, priorB, a, b, other]), field).equal, true, `${field} is a set, independent of order`);
  const mismatch = entityAgreement([priorA, priorB, a, { ...b, [field]: [priorB['@id']] }, other]);
  assert.equal(relation(mismatch, field).equal, false, `${field} cannot lose a target`);
}

// An absent relation is unknown, never an assertion that no relation exists.
const requiredPairs = [{ source: nextA['@id'], target: nextB['@id'], fields: [], relations: ['supersedes'] }];
for (const value of [undefined, null, []]) {
  const report = entityAgreement([priorA, priorB, nextA, { ...nextB, supersedes: value }], { requiredPairs });
  assert.equal(pair(report).unknown_relations.find(item => item.field === 'supersedes').reason, 'missing-assertion');
  assert.match(report.requirement_errors.join('\n'), /OF-ENTITY-REQUIRED-RELATION/);
  assert.deepEqual(report.conflicts, []);
}
assert.deepEqual(entityAgreement(base, { requiredPairs }).requirement_errors, []);
assert.match(entityAgreement([priorA, priorB, nextA, { ...nextB, supersedes: undefined, repeals: nextB.supersedes }]).conflicts.join('\n'), /OF-ENTITY-RELATION-KIND/);
const unresolved = entityAgreement([nextA, nextB], { requiredPairs });
assert.equal(pair(unresolved).unknown_relations.find(item => item.field === 'supersedes').reason, 'unresolved-target');
assert.match(unresolved.requirement_errors.join('\n'), /OF-ENTITY-REQUIRED-RELATION/);
const wrongType = entityAgreement([{ ...priorA, '@type': 'of:Term' }, priorB, nextA, nextB]);
assert.equal(pair(wrongType).unknown_relations.find(item => item.field === 'supersedes').reason, 'unresolved-target');
for (const value of [42, {}, [''], [null]]) {
  assert.match(entityAgreement([priorA, priorB, nextA, { ...nextB, supersedes: value }]).conflicts.join('\n'), /OF-ENTITY-RELATION-SHAPE/);
}
// Only explicit correspondence participates; sameAs, names and similar IRIs do not.
const noCorrespondence = entityAgreement([{ ...priorA, describesSameEntityAs: undefined, sameAs: [priorB['@id']] }, priorB, nextA, nextB]);
assert.equal(relation(noCorrespondence).equal, false);
const viaThird = instrument('third/prior', { describesSameEntityAs: [priorA['@id'], priorB['@id']] });
assert.equal(relation(entityAgreement([{ ...priorA, describesSameEntityAs: undefined }, priorB, nextA, nextB, viaThird])).equal, true);
assert.equal(relation(entityAgreement([...base].reverse())).equal, true, 'record order cannot change relationship agreement');
assert.equal(relation(entityAgreement([{ ...nextB, describesSameEntityAs: [nextA['@id']] }, nextA, priorB, priorA])).equal, true, 'reciprocal declaration direction cannot change agreement');

// Pure repeal and whole replacement differ without deciding operation or enforcement.
const repealer = instrument('repealer', { lifecycle_status: 'enacted', repeals: [id('repealed')] });
const repealed = instrument('repealed', { lifecycle_status: 'repealed', operative_status: 'unknown', enforcement_status: 'unknown' });
assert.deepEqual(entityAgreement([repealer, repealed]).warnings, []);
assert.deepEqual(graph([repealer, repealed]), []);
const input = structuredClone([nextA, { ...priorA, lifecycle_status: 'repealed' }]);
const snapshot = structuredClone(input);
assert.match(entityAgreement(input).warnings.join('\n'), /OF-LIFECYCLE-REVIEW/);
assert.deepEqual(input, snapshot, 'review diagnostics never rewrite source assertions');
assert.match(entityAgreement([{ ...repealer, repeals: [priorA['@id']] }, priorA]).warnings.join('\n'), /OF-LIFECYCLE-REVIEW/);
assert.deepEqual(entityAgreement([nextA, { ...priorA, lifecycle_status: 'unknown' }]).warnings, [], 'unknown predecessor lifecycle stays unknown');
assert.match(entityAgreement([{ ...nextA, supersedes: [nextA['@id']] }]).conflicts.join('\n'), /OF-RELATION-SELF/);
assert.match(entityAgreement([{ ...nextA, repeals: nextA.supersedes }, priorA]).conflicts.join('\n'), /OF-RELATION-KIND-CONFLICT/);

// The relation changes at enactment; it does not assert that child duties operate.
const proposed = { ...nextA, lifecycle_status: 'proposed', supersedes: undefined, wouldSupersede: nextA.supersedes };
assert.deepEqual(graph([proposed, priorA]), []);
assert.deepEqual(entityAgreement([proposed, priorA]).conflicts, []);
assert.match(entityAgreement([{ ...proposed, wouldSupersede: undefined, supersedes: nextA.supersedes }, priorA]).conflicts.join('\n'), /OF-RELATION-STAGE/);
assert.deepEqual(entityAgreement([nextA, priorA]).conflicts, []);
for (const lifecycle_status of ['proposed', 'enacted']) {
  const amendment = instrument('partial-amendment', { lifecycle_status, operative_status: 'unknown', amends: [priorA['@id']] });
  assert.deepEqual(graph([amendment, priorA]), [], 'existing amends plus separate lifecycle is structurally expressible');
  assert.deepEqual(entityAgreement([amendment, priorA]).warnings, [], 'partial amendment does not demand whole-instrument retirement');
}
assert.deepEqual([priorA.operative_status, priorA.enforcement_status], ['unknown', 'unknown']);
const retainedProposal = { ...nextA, wouldSupersede: nextA.supersedes };
assert.ok(graph([retainedProposal, priorA]).some(item => item.code === 'OF-GRAPH-WOULD-SUPERSEDE-LIFECYCLE'), 'existing graph policy requires historical proposal assertions outside the current enacted record');
const reversed = [{ ...nextA, supersedes: undefined }, { ...priorA, supersedes: [nextA['@id']] }];
assert.match(entityAgreement(reversed).warnings.join('\n'), /OF-LIFECYCLE-REVIEW/, 'a reversed relation does not make the enacted successor a retired predecessor');
for (const relations of [['bogus'], 'supersedes', ['supersedes', 'supersedes']]) {
  assert.throws(() => entityAgreement(base, { requiredPairs: [{ ...requiredPairs[0], relations }] }), /OF-ENTITY-REQUIRED-CONFIG/);
}
console.log('Lifecycle relationship regressions passed (target correspondence, pure repeal, proposed/enacted transition, required coverage and uncertainty).');

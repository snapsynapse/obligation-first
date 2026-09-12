import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// This adapter is deliberately a single, source-derived migration. It is not a
// general escape hatch for generated relationships: the EAL provision index and
// the owning instrument are the two admitted inputs, and every output edge is
// fixed by the reviewed Malta withdrawal.
export const EVERY_AI_LAW_MALTA_ASSESSMENT_WITHDRAWAL = 'every-ai-law-malta-assessment-withdrawal-v1';
const INDEX_PATH = 'data/provisions/index.yml';
const INDEX_POINTER = '/records/data~1provisions~1index.yml';
const INSTRUMENT_PATH = 'data/instruments/mt-ai-regulations.md';
const INSTRUMENT_POINTER = '/records/data~1instruments~1mt-ai-regulations.md';
const INDEX_UNIT = 'entry:mt-ai-regulations-risk-assessment';
const NATIVE_UNITS = Object.freeze({
  obligation: 'section:AI System Classification and Market Surveillance/property:Obligation',
  roles: 'section:AI System Classification and Market Surveillance/property:Roles',
});
const TERM_ID = 'https://everyailaw.com/term/mt-ai-regulations-risk-assessment.json';
const OBLIGATION_ID = 'https://everyailaw.com/obligation/mt-ai-regulations-risk-assessment.json';
const CATEGORY_ID = 'https://everyailaw.com/obligation-category/risk-assessment.json';
const PROVIDER_ROLE = 'https://everyailaw.com/ont/role/provider';
const INSTRUMENT_ID = 'https://everyailaw.com/instrument/mt-ai-regulations.json';
const OLD_INDEX_ROW = Object.freeze({
  id: 'mt-ai-regulations-risk-assessment',
  regulation: 'mt-ai-regulations',
  authority: 'mt-mdia',
  source_file: INSTRUMENT_PATH,
  source_heading: 'AI System Classification and Market Surveillance',
  obligations: ['risk-assessment'],
});
const NEW_INDEX_ROW = Object.freeze({ ...OLD_INDEX_ROW, obligations: [] });

const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
export const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const equal = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const asArray = value => value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];

const expectedChanges = new Map([
  ['creates', { subject: TERM_ID, oldTargets: [OBLIGATION_ID] }],
  ['created_by', { subject: OBLIGATION_ID, oldTargets: [TERM_ID] }],
  ['isCategorizedBy', { subject: OBLIGATION_ID, oldTargets: [CATEGORY_ID] }],
  ['duty_holder_roles', { subject: OBLIGATION_ID, oldTargets: [PROVIDER_ROLE] }],
]);

function requireAcceptedAdmission(admitted, reviewedAt, label) {
  assert.ok(admitted && typeof admitted === 'object', `${label} admission missing`);
  assert.ok(['source-consistency-reviewed', 'source-consistency-reviewed-changes'].includes(admitted.review?.decision), `${label} admission is not accepted`);
  assert.ok(['agent', 'human'].includes(admitted.review?.actor_type) && typeof admitted.review?.actor === 'string' && admitted.review.actor.trim(), `${label} admission reviewer missing`);
  assert.ok(typeof admitted.review.reviewed_at === 'string' && Date.parse(admitted.review.reviewed_at) <= Date.parse(reviewedAt), `${label} admission is after migration review`);
  assert.ok(admitted.units && typeof admitted.units === 'object', `${label} admission units missing`);
}

function requireEvidence(admitted, unit, label) {
  assert.ok(Array.isArray(admitted.units[unit]?.evidence) && admitted.units[unit].evidence.length > 0, `${label} unit lacks evidence: ${unit}`);
}

function requireRemovedUnit(admitted, unit, beforeValue, label) {
  const record = admitted.units[unit];
  assert.ok(record, `${label} removed unit missing: ${unit}`);
  assert.equal(record.before_sha256, digest(beforeValue), `${label} before hash mismatch: ${unit}`);
  assert.equal(record.after_sha256, null, `${label} removed unit must have null after hash: ${unit}`);
  assert.ok(Object.hasOwn(record, 'candidate_content') && record.candidate_content === null, `${label} removed unit candidate must be null: ${unit}`);
  requireEvidence(admitted, unit, label);
}

function requireIndexUnit(admitted, label) {
  const record = admitted.units[INDEX_UNIT];
  assert.ok(record, `${label} index unit missing`);
  assert.equal(record.before_sha256, digest(OLD_INDEX_ROW), `${label} index before hash mismatch`);
  assert.equal(record.after_sha256, digest(NEW_INDEX_ROW), `${label} index after hash mismatch`);
  assert.ok(Object.hasOwn(record, 'candidate_content') && equal(record.candidate_content, NEW_INDEX_ROW), `${label} index candidate mismatch`);
  requireEvidence(admitted, INDEX_UNIT, label);
}

function findRecord(records, id, label) {
  const matches = records.filter(record => record['@id'] === id);
  assert.equal(matches.length, 1, `${label} must resolve exactly once`);
  return matches[0];
}

function requireCurrentProjection(records) {
  const term = findRecord(records, TERM_ID, 'Malta Term');
  assert.equal(term['@type'], 'of:Term', 'Malta Term must remain active');
  assert.equal(term['eal:source_file'], INSTRUMENT_PATH, 'Malta Term source_file drifted');
  assert.equal(term.parent_instrument, INSTRUMENT_ID, 'Malta Term parent drifted');
  assert.deepEqual(term.creates || [], [], 'Malta Term must have no categorized obligation');

  const retired = findRecord(records, OBLIGATION_ID, 'Malta retired obligation');
  assert.equal(retired['@type'], 'of:Tombstone', 'Former Malta obligation must be a Tombstone');
  assert.equal(retired.deprecated, true, 'Former Malta obligation must be deprecated');
  assert.equal(retired.former_type, 'of:Obligation', 'Former Malta obligation type drifted');
  assert.equal(retired['eal:source_file'], INSTRUMENT_PATH, 'Tombstone native owner drifted');
  assert.equal(Object.hasOwn(retired, 'replaced_by'), false, 'Malta Tombstone must not invent a successor');
  for (const field of ['creates', 'created_by', 'isCategorizedBy', 'duty_holder_roles']) {
    assert.equal(Object.hasOwn(retired, field), false, `Malta Tombstone must not carry live ${field}`);
  }
  assert.equal(records.filter(record => record['@id'] === OBLIGATION_ID && record['@type'] !== 'of:Tombstone').length, 0, 'Retired Malta obligation remains active');
}

function requireChangeSet(changes) {
  assert.equal(changes.length, expectedChanges.size, 'Malta adapter must cover exactly four relationship changes');
  const seen = new Set();
  for (const change of changes) {
    assert.equal(change.kind, 'top', 'Malta adapter only covers top-level edges');
    const expected = expectedChanges.get(change.predicate);
    assert.ok(expected, `Malta adapter rejects predicate ${change.predicate}`);
    assert.equal(change.subject, expected.subject, `Malta adapter subject mismatch for ${change.predicate}`);
    assert.deepEqual(change.old_targets, expected.oldTargets, `Malta adapter old targets mismatch for ${change.predicate}`);
    assert.deepEqual(change.new_targets, [], `Malta adapter new targets must be empty for ${change.predicate}`);
    assert.ok(!seen.has(change.predicate), `Malta adapter duplicate predicate ${change.predicate}`);
    seen.add(change.predicate);
  }
  assert.deepEqual([...seen].sort(), [...expectedChanges.keys()].sort(), 'Malta adapter predicate set incomplete');
}

export async function validateEveryAiLawMaltaAssessmentWithdrawal({ changes, records, entries, readAdmission }) {
  const adapted = entries.filter(entry => entry.source_admission?.adapter?.name === EVERY_AI_LAW_MALTA_ASSESSMENT_WITHDRAWAL);
  assert.equal(adapted.length, 4, 'Malta adapter must be declared on exactly four receipts');
  assert.equal(entries.length, adapted.length, 'Unknown or missing adapter declaration in Malta retirement group');
  requireChangeSet(changes);
  requireCurrentProjection(records);

  for (const entry of adapted) {
    const ref = entry.source_admission;
    const adapter = ref.adapter;
    assert.equal(adapter.name, EVERY_AI_LAW_MALTA_ASSESSMENT_WITHDRAWAL, 'Unknown derived migration adapter');
    assert.equal(ref.relationship_unit, `adapter:${EVERY_AI_LAW_MALTA_ASSESSMENT_WITHDRAWAL}`, 'Malta adapter relationship unit drifted');
    assert.equal(ref.path, 'data/admission/receipts.json', 'Malta adapter primary receipt path drifted');
    assert.equal(ref.pointer, INSTRUMENT_POINTER, 'Malta adapter primary receipt pointer drifted');
    assert.ok(Array.isArray(ref.reviewed_units) && ref.reviewed_units.includes(NATIVE_UNITS.obligation) && ref.reviewed_units.includes(NATIVE_UNITS.roles), 'Malta adapter native reviewed units must include Obligation and Roles');
    const native = await readAdmission(ref);
    assert.equal(ref.sha256, digest(native), 'Malta instrument admission digest is stale');
    requireAcceptedAdmission(native, entry.review.reviewed_at, 'Malta instrument');
    requireRemovedUnit(native, NATIVE_UNITS.obligation, 'risk-assessment', 'Malta instrument');
    requireRemovedUnit(native, NATIVE_UNITS.roles, 'provider', 'Malta instrument');

    const indexRef = adapter.index_admission;
    assert.ok(indexRef && typeof indexRef === 'object', 'Malta adapter index admission missing');
    assert.equal(indexRef.path, 'data/admission/receipts.json', 'Malta adapter index receipt path drifted');
    assert.equal(indexRef.pointer, INDEX_POINTER, 'Malta adapter index receipt pointer drifted');
    assert.ok(Array.isArray(indexRef.reviewed_units) && indexRef.reviewed_units.includes(INDEX_UNIT), 'Malta adapter index reviewed unit missing');
    const index = await readAdmission(indexRef);
    assert.equal(indexRef.sha256, digest(index), 'Malta index admission digest is stale');
    requireAcceptedAdmission(index, entry.review.reviewed_at, 'Malta index');
    requireIndexUnit(index, 'Malta index');

    assert.deepEqual(adapter.native_identity, {
      regulation: 'mt-ai-regulations',
      source_file: INSTRUMENT_PATH,
      source_heading: OLD_INDEX_ROW.source_heading,
    }, 'Malta adapter native identity drifted');
    assert.equal(adapter.category_id, 'risk-assessment', 'Malta adapter category drifted');
    assert.deepEqual(adapter.index_before, OLD_INDEX_ROW, 'Malta adapter index before value drifted');
    assert.deepEqual(adapter.index_after, NEW_INDEX_ROW, 'Malta adapter index after value drifted');
    assert.equal(adapter.native_obligation_before, 'risk-assessment', 'Malta adapter native Obligation before value drifted');
    assert.equal(adapter.native_roles_before, 'provider', 'Malta adapter native Roles before value drifted');
    assert.equal(adapter.native_after, null, 'Malta adapter native after value must be null');
  }
  return true;
}

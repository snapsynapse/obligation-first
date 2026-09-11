import assert from 'node:assert/strict';
import { digest } from './eal-category-retirement.mjs';

// This adapter covers one generated edge whose source is an authority role.
// It is intentionally fixed to EAL's Italy correction; it is not a generic
// exemption for generated authority relationships.
export const EVERY_AI_LAW_ITALY_AGID_ENFORCER_WITHDRAWAL = 'every-ai-law-italy-agid-enforcer-withdrawal-v1';
const INSTRUMENT_PATH = 'data/instruments/it-ai-law.md';
const INSTRUMENT_POINTER = '/records/data~1instruments~1it-ai-law.md';
const AUTHORITY_PATH = 'data/authorities/it-agid.md';
const AUTHORITY_POINTER = '/records/data~1authorities~1it-agid.md';
const NOTES_UNIT = 'metadata:of_notes';
const ROLES_UNIT = 'metadata:roles';
const INSTRUMENT_ID = 'https://everyailaw.com/instrument/it-ai-law.json';
const AUTHORITY_ID = 'https://everyailaw.com/authority/it-agid.json';

function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

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

function requireMetadataUnit(admitted, unit, label) {
  const record = admitted.units[unit];
  assert.ok(record, `${label} unit missing: ${unit}`);
  assert.ok(typeof record.before_sha256 === 'string' || record.before_sha256 === null, `${label} before hash missing: ${unit}`);
  assert.ok(typeof record.after_sha256 === 'string' || record.after_sha256 === null, `${label} after hash missing: ${unit}`);
  assert.ok(Object.hasOwn(record, 'candidate_content'), `${label} candidate content missing: ${unit}`);
  requireEvidence(admitted, unit, label);
  return record;
}

function findRecord(records, id) {
  const matches = records.filter(record => record['@id'] === id);
  assert.equal(matches.length, 1, `Italy adapter requires exactly one projected record: ${id}`);
  return matches[0];
}

function requireChange(changes) {
  assert.equal(changes.length, 1, 'Italy authority adapter must cover exactly one relationship change');
  const [change] = changes;
  assert.equal(change.kind, 'top', 'Italy authority adapter only covers top-level edges');
  assert.equal(change.subject, INSTRUMENT_ID, 'Italy authority adapter instrument subject drifted');
  assert.equal(change.predicate, 'enforcedBy', 'Italy authority adapter predicate drifted');
  assert.deepEqual(change.old_targets, [AUTHORITY_ID], 'Italy authority adapter old target drifted');
  assert.deepEqual(change.new_targets, [], 'Italy authority adapter must remove, not retarget, enforcedBy');
}

export async function validateEveryAiLawItalyAgidEnforcerWithdrawal({ changes, records, entries, readAdmission }) {
  assert.equal(entries.length, 1, 'Italy adapter must be declared on exactly one receipt');
  requireChange(changes);
  const instrument = findRecord(records, INSTRUMENT_ID);
  assert.equal(instrument['@type'], 'of:Instrument', 'Italy instrument must remain active');
  assert.equal(instrument['eal:id'], 'it-ai-law', 'Italy instrument native identity drifted');
  assert.equal(instrument['eal:source_review_record'], INSTRUMENT_PATH, 'Italy instrument source review owner drifted');
  assert.deepEqual(instrument.administeredBy, [AUTHORITY_ID], 'Italy instrument must retain the regulator projection for it-agid');
  assert.equal(Object.hasOwn(instrument, 'enforcedBy'), false, 'Italy instrument retains the withdrawn enforcedBy edge');
  const authority = findRecord(records, AUTHORITY_ID);
  assert.equal(authority['@type'], 'of:Authority', 'Italy authority projection must remain active');
  assert.equal(authority['eal:id'], 'it-agid', 'Italy authority native identity drifted');
  assert.equal(authority['eal:source_review_record'], AUTHORITY_PATH, 'Italy authority source review owner drifted');
  assert.deepEqual(authority.roles, ['regulator'], 'Italy authority role projection must retain regulator only');

  const entry = entries[0];
  const ref = entry.source_admission;
  const adapter = ref?.adapter;
  assert.equal(adapter?.name, EVERY_AI_LAW_ITALY_AGID_ENFORCER_WITHDRAWAL, 'Unknown Italy derived migration adapter');
  assert.equal(ref.relationship_unit, `adapter:${EVERY_AI_LAW_ITALY_AGID_ENFORCER_WITHDRAWAL}`, 'Italy adapter relationship unit drifted');
  assert.equal(ref.path, 'data/admission/receipts.json', 'Italy adapter primary receipt path drifted');
  assert.equal(ref.pointer, INSTRUMENT_POINTER, 'Italy adapter primary receipt pointer drifted');
  assert.deepEqual(ref.reviewed_units, [NOTES_UNIT], 'Italy adapter must bind only metadata:of_notes on the primary instrument receipt');
  const admittedInstrument = await readAdmission(ref);
  assert.equal(ref.sha256, digest(admittedInstrument), 'Italy instrument admission digest is stale');
  requireAcceptedAdmission(admittedInstrument, entry.review.reviewed_at, 'Italy instrument');
  const notes = requireMetadataUnit(admittedInstrument, NOTES_UNIT, 'Italy instrument');
  assert.equal(notes.after_sha256, digest(notes.candidate_content), 'Italy instrument notes candidate is not hash-bound');

  assert.deepEqual(adapter.native_identity, {
    instrument_id: 'it-ai-law',
    authority_id: 'it-agid',
    source_file: INSTRUMENT_PATH,
  }, 'Italy adapter native identity drifted');
  assert.deepEqual(adapter.enforced_by_before, [AUTHORITY_ID], 'Italy adapter enforcedBy before value drifted');
  assert.deepEqual(adapter.enforced_by_after, [], 'Italy adapter enforcedBy after value must be empty');
  assert.equal(adapter.native_authority, 'it-agid', 'Italy adapter native authority drifted');

  const authorityRef = adapter.authority_admission;
  assert.ok(authorityRef && typeof authorityRef === 'object', 'Italy adapter authority admission missing');
  assert.equal(authorityRef.path, 'data/admission/receipts.json', 'Italy authority receipt path drifted');
  assert.equal(authorityRef.pointer, AUTHORITY_POINTER, 'Italy authority receipt pointer drifted');
  assert.deepEqual(authorityRef.reviewed_units, [ROLES_UNIT], 'Italy adapter must bind only metadata:roles on the authority receipt');
  const admittedAuthority = await readAdmission(authorityRef);
  assert.equal(authorityRef.sha256, digest(admittedAuthority), 'Italy authority admission digest is stale');
  requireAcceptedAdmission(admittedAuthority, entry.review.reviewed_at, 'Italy authority');
  const roles = requireMetadataUnit(admittedAuthority, ROLES_UNIT, 'Italy authority');
  const beforeRoles = ['enforcer', 'regulator'];
  const afterRoles = ['regulator'];
  assert.equal(roles.before_sha256, digest(beforeRoles), 'Italy authority roles before hash drifted');
  assert.equal(roles.after_sha256, digest(afterRoles), 'Italy authority roles after hash drifted');
  assert.ok(equal(roles.candidate_content, afterRoles), 'Italy authority roles candidate drifted');
  assert.deepEqual(adapter.authority_roles_before, beforeRoles, 'Italy adapter authority roles before drifted');
  assert.deepEqual(adapter.authority_roles_after, afterRoles, 'Italy adapter authority roles after drifted');
  return true;
}

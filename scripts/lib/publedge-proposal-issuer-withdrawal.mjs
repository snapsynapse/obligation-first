import assert from 'node:assert/strict';
import { digest } from './eal-category-retirement.mjs';

// One fixed correction of an unissued proposal, not a general exception for
// PubLedge edge removal or authority reassignment. Owner admission runs too.
export const PUBLEDGE_PROPOSAL_ISSUER_WITHDRAWAL = 'publedge-jia-proposal-issuer-withdrawal-v1';
export const PUBLEDGE_PROPOSAL_SOURCE = 'data/examples/instruments/us-ut-oaip-jia-2026-001.md';
const ID = 'us-ut-oaip-jia-2026-001';
const SUBJECT = `https://publedge.org/instrument/${ID}.json`;
const AUTHORITY = 'https://publedge.org/authority/utah-oaip.json';
const OAIP = 'Utah Office of Artificial Intelligence Policy (OAIP)';
const BEFORE = { '@type': 'https://w3id.org/semanticarts/ns/ontology/gist/SubCountryGovernment', name: OAIP, ref: 'https://commerce.utah.gov/ai/' };
const UNIT = 'metadata:issued_by';
const UNITS = ['metadata:author_or_proponent', 'metadata:intended_authority', 'metadata:intended_authority_url', UNIT, 'metadata:official_url', 'metadata:title'].sort();

export async function validatePubledgeProposalIssuerWithdrawal({ changes, records, entries, readAdmission }) {
  assert.equal(changes.length, 1, 'PubLedge adapter covers one issuer-edge removal');
  assert.equal(entries.length, 1, 'PubLedge adapter requires one migration receipt');
  assert.deepEqual(changes[0], { kind: 'top', subject: SUBJECT, predicate: 'issuedBy', old_targets: [AUTHORITY], new_targets: [] }, 'PubLedge issuer transition drifted');
  const projected = records.filter(record => record['@id'] === SUBJECT);
  assert.equal(projected.length, 1, 'PubLedge proposal must remain uniquely resolvable');
  const record = projected[0];
  assert.equal(record['@type'], 'of:Instrument');
  assert.equal(record['pub:id'], ID);
  assert.equal(record['pub:status'], 'proposed');
  assert.equal(record['pub:editorial_status'], 'draft');
  assert.equal(record.lifecycle_status, 'proposed');
  assert.equal(record.verified, '2026-09-23', 'This provenance repair cannot renew verification');
  for (const field of ['issuedBy', 'embodies_determination', 'enacted', 'effective']) assert.equal(Object.hasOwn(record, field), false, `Unissued proposal carries ${field}`);
  const ref = entries[0].source_admission;
  assert.deepEqual(ref.adapter, { name: PUBLEDGE_PROPOSAL_ISSUER_WITHDRAWAL }, 'PubLedge adapter declaration drifted');
  assert.equal(ref.pointer, `/records/${PUBLEDGE_PROPOSAL_SOURCE.replaceAll('/', '~1')}`);
  assert.equal(ref.relationship_unit, `adapter:${PUBLEDGE_PROPOSAL_ISSUER_WITHDRAWAL}`);
  assert.deepEqual(ref.reviewed_units, UNITS);
  const admitted = await readAdmission(ref);
  assert.deepEqual(Object.keys(admitted.units).sort(), UNITS, 'Only the reviewed proposal provenance units may change');
  assert.equal(admitted.review.actor_type, 'agent');
  assert.equal(admitted.review.human_approved, undefined);
  assert.equal(admitted.supersedes?.receipt?.review?.packet_sha256, '27b15547fb411ec37543f7deac2039683b39c228e9d71b8d5976e645c811d329', 'Original human receipt must remain in the successor lineage');
  const unit = admitted.units[UNIT];
  assert.equal(unit.before_sha256, digest(BEFORE), 'Issuer removal must bind the original intended-authority object');
  assert.equal(unit.after_sha256, digest(null));
  assert.equal(unit.candidate_content, null);
  for (const [key, value] of Object.entries({ 'metadata:author_or_proponent': 'PubLedge', 'metadata:intended_authority': OAIP, 'metadata:intended_authority_url': 'https://commerce.utah.gov/ai/', 'metadata:official_url': null })) {
    assert.equal(admitted.units[key].candidate_content, value, `${key} provenance drifted`);
    assert.equal(admitted.units[key].after_sha256, digest(value), `${key} candidate is not hash-bound`);
  }
  assert.equal(admitted.units['metadata:official_url'].before_sha256, digest('https://commerce.utah.gov/ai/'));
  assert.match(admitted.units['metadata:title'].candidate_content, /^PubLedge proposed template \(unissued\): /);
  assert.equal(admitted.units['metadata:title'].after_sha256, digest(admitted.units['metadata:title'].candidate_content));
  const inputs = (record['pub:evidence_inputs'] || []).filter(input => input.kind === 'instrument' && input.native_path === PUBLEDGE_PROPOSAL_SOURCE && input.canonical_unit === null);
  assert.equal(inputs.length, 1, 'Proposal must bind exactly one native instrument input');
  assert.equal(inputs[0].canonical_sha256, admitted.record_sha256, 'Projection source digest differs from admitted native record');
  assert.equal(inputs[0].review_packet_sha256, admitted.review.packet_sha256, 'Projection review packet is stale');
  assert.equal(inputs[0].admission_status, 'reviewed-changes');
  return true;
}

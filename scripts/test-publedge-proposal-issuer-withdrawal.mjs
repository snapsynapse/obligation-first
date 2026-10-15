import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { digest, validateMigrationReceipts } from './lib/relationship-migrations.mjs';
import { PUBLEDGE_PROPOSAL_ISSUER_WITHDRAWAL as NAME, PUBLEDGE_PROPOSAL_SOURCE as FILE } from './lib/publedge-proposal-issuer-withdrawal.mjs';

const root = await mkdtemp(path.join(tmpdir(), 'of-publedge-issuer-test-'));
const ID = 'us-ut-oaip-jia-2026-001';
const OAIP = 'Utah Office of Artificial Intelligence Policy (OAIP)';
const now = new Date().toISOString();
function fixture() {
  const unit = value => ({ before_sha256: null, after_sha256: digest(value), candidate_content: value, evidence: ['draft'] });
  const source = {
    record_sha256: 'b'.repeat(64), review: { actor_type: 'agent', decision: 'source-consistency-reviewed', reviewed_at: now, packet_sha256: 'a'.repeat(64) },
    supersedes: { receipt: { review: { packet_sha256: '27b15547fb411ec37543f7deac2039683b39c228e9d71b8d5976e645c811d329' } } },
    units: {
      'metadata:issued_by': { ...unit(null), before_sha256: digest({ '@type': 'https://w3id.org/semanticarts/ns/ontology/gist/SubCountryGovernment', name: OAIP, ref: 'https://commerce.utah.gov/ai/' }) },
      'metadata:author_or_proponent': unit('PubLedge'),
      'metadata:intended_authority': unit(OAIP),
      'metadata:intended_authority_url': unit('https://commerce.utah.gov/ai/'),
      'metadata:official_url': { ...unit(null), before_sha256: digest('https://commerce.utah.gov/ai/') },
      'metadata:title': unit('PubLedge proposed template (unissued): Utah Mental Health Chatbot Disclosure'),
    },
  };
  const change = { kind: 'top', subject: `https://publedge.org/instrument/${ID}.json`, predicate: 'issuedBy', old_targets: ['https://publedge.org/authority/utah-oaip.json'], new_targets: [] };
  const ref = { path: 'data/admission/receipts.json', pointer: `/records/${FILE.replaceAll('/', '~1')}`, reviewed_units: Object.keys(source.units).sort(), relationship_unit: `adapter:${NAME}`, adapter: { name: NAME } };
  const record = { '@type': 'of:Instrument', '@id': change.subject, 'pub:id': ID, 'pub:status': 'proposed', 'pub:editorial_status': 'draft', lifecycle_status: 'proposed', verified: '2026-09-23', 'pub:evidence_inputs': [{ kind: 'instrument', native_path: FILE, canonical_unit: null, canonical_sha256: source.record_sha256, review_packet_sha256: source.review.packet_sha256, admission_status: 'reviewed-changes' }] };
  return { source, change, ref, record };
}
async function check(f) {
  await writeFile(path.join(root, 'data/admission/receipts.json'), JSON.stringify({ records: { [FILE]: f.source, other: f.source } }));
  f.ref.sha256 = digest(f.source);
  const packet = { change: f.change, reason: 'Remove a false issuer edge from an unissued PubLedge proposal.', source_admission: f.ref };
  const entry = { ...packet, review: { actor_type: 'agent', actor: 'synthetic test reviewer', decision: 'source-consistency-reviewed', reviewed_at: now, packet_sha256: digest(packet) } };
  return validateMigrationReceipts({ root, changes: [f.change], records: [f.record], receipts: { schema_version: 1, entries: [entry] } });
}
let cases = 0;
try {
  await mkdir(path.join(root, 'data/admission'), { recursive: true });
  await check(fixture()); cases++;
  for (const mutate of [
    f => { f.change.new_targets = ['https://example.com/replacement']; },
    f => { f.change.old_targets = ['https://example.com/authority']; },
    f => { f.change.predicate = 'enforcedBy'; },
    f => { f.change.kind = 'nested'; },
    f => { f.record['pub:id'] = 'another-record'; },
    f => { f.record['pub:status'] = 'enforcing'; },
    f => { f.record.lifecycle_status = 'operative'; },
    f => { f.record['pub:editorial_status'] = 'published'; },
    f => { f.record.verified = '2026-10-14'; },
    f => { f.record.issuedBy = ['https://publedge.org/authority/utah-oaip.json']; },
    f => { f.record.effective = '2026-10-14'; },
    f => { f.ref.pointer = '/records/other'; },
    f => { f.ref.reviewed_units = ['metadata:title']; },
    f => { f.source.units['metadata:issued_by'].before_sha256 = digest('unrelated'); },
    f => { f.source.units['metadata:issued_by'].candidate_content = 'https://example.com/issuer'; },
    f => { f.source.units['metadata:author_or_proponent'].candidate_content = 'OAIP'; f.source.units['metadata:author_or_proponent'].after_sha256 = digest('OAIP'); },
    f => { f.source.units['metadata:intended_authority_url'].candidate_content = 'https://example.com/'; },
    f => { f.source.units['metadata:terms'] = f.source.units['metadata:title']; f.ref.reviewed_units.push('metadata:terms'); f.ref.reviewed_units.sort(); },
    f => { f.source.supersedes.receipt.review.packet_sha256 = 'c'.repeat(64); },
    f => { f.record['pub:evidence_inputs'][0].native_path = 'data/examples/instruments/other.md'; },
    f => { f.record['pub:evidence_inputs'][0].canonical_sha256 = 'c'.repeat(64); },
    f => { f.record['pub:evidence_inputs'][0].review_packet_sha256 = 'c'.repeat(64); },
    f => { f.record['pub:evidence_inputs'].push(f.record['pub:evidence_inputs'][0]); },
  ]) {
    const bad = fixture(); mutate(bad);
    await assert.rejects(check(bad)); cases++;
  }
} finally { await rm(root, { recursive: true, force: true }); }
console.log(`PubLedge unissued-proposal issuer withdrawal passed (${cases} cases; exact removal, owner receipt, immutable predecessor and source evidence).`);

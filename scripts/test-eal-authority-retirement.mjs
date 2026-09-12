import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  EVERY_AI_LAW_ITALY_AGID_ENFORCER_WITHDRAWAL,
  validateEveryAiLawItalyAgidEnforcerWithdrawal,
} from './lib/eal-authority-retirement.mjs';
import { digest } from './lib/eal-category-retirement.mjs';
import { validateMigrationReceipts } from './lib/relationship-migrations.mjs';

const instrumentPointer = '/records/data~1instruments~1it-ai-law.md';
const authorityPointer = '/records/data~1authorities~1it-agid.md';
const instrumentPath = 'data/instruments/it-ai-law.md';
const authorityPath = 'data/authorities/it-agid.md';
const notesUnit = 'metadata:of_notes';
const rolesUnit = 'metadata:roles';
const instrumentId = 'https://everyailaw.com/instrument/it-ai-law.json';
const authorityId = 'https://everyailaw.com/authority/it-agid.json';

function unit(before, after, candidate) {
  return {
    before_sha256: before === null ? null : digest(before),
    after_sha256: after === null ? null : digest(after),
    candidate_content: candidate,
    evidence: ['evidence:1'],
  };
}

function fixture() {
  const notesBefore = 'old source boundary';
  const notesAfter = 'corrected source boundary with explicit partial graph qualification';
  const instrument = {
    review: { actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed', reviewed_at: '2026-09-10T00:00:00.000Z' },
    units: { [notesUnit]: unit(notesBefore, notesAfter, notesAfter) },
  };
  const beforeRoles = ['enforcer', 'regulator'];
  const afterRoles = ['regulator'];
  const authority = {
    review: { actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed', reviewed_at: '2026-09-10T00:00:00.000Z' },
    units: { [rolesUnit]: unit(beforeRoles, afterRoles, afterRoles) },
  };
  const change = { kind: 'top', subject: instrumentId, predicate: 'enforcedBy', old_targets: [authorityId], new_targets: [] };
  const adapter = {
    name: EVERY_AI_LAW_ITALY_AGID_ENFORCER_WITHDRAWAL,
    native_identity: { instrument_id: 'it-ai-law', authority_id: 'it-agid', source_file: instrumentPath },
    enforced_by_before: [authorityId],
    enforced_by_after: [],
    native_authority: 'it-agid',
    authority_roles_before: ['enforcer', 'regulator'],
    authority_roles_after: ['regulator'],
    authority_admission: { path: 'data/admission/receipts.json', pointer: authorityPointer, sha256: digest(authority), reviewed_units: [rolesUnit] },
  };
  const sourceAdmission = {
    path: 'data/admission/receipts.json', pointer: instrumentPointer, sha256: digest(instrument),
    reviewed_units: [notesUnit], relationship_unit: `adapter:${EVERY_AI_LAW_ITALY_AGID_ENFORCER_WITHDRAWAL}`,
    adapter,
  };
  const reason = 'Withdraw generated AgID enforcement edge after source review removes unsupported enforcer role.';
  const entry = {
    change, reason, source_admission: sourceAdmission,
    review: { actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed', reviewed_at: '2026-09-11T00:00:00.000Z', packet_sha256: digest({ change, reason, source_admission: sourceAdmission }) },
  };
  const records = [{
    '@type': 'of:Instrument', '@id': instrumentId, 'eal:id': 'it-ai-law', 'eal:source_review_record': instrumentPath,
    administeredBy: [authorityId],
  }, {
    '@type': 'of:Authority', '@id': authorityId, 'eal:id': 'it-agid', 'eal:source_review_record': authorityPath,
    roles: ['regulator'],
  }];
  return { instrument, authority, change, entry, records };
}

async function validHelper() {
  const f = fixture();
  const byPointer = new Map([[instrumentPointer, f.instrument], [authorityPointer, f.authority]]);
  await validateEveryAiLawItalyAgidEnforcerWithdrawal({
    changes: [f.change], records: f.records, entries: [f.entry],
    readAdmission: async ref => byPointer.get(ref.pointer),
  });
}

async function rejects(label, mutate) {
  const f = fixture();
  mutate(f);
  const byPointer = new Map([[instrumentPointer, f.instrument], [authorityPointer, f.authority]]);
  await assert.rejects(
    validateEveryAiLawItalyAgidEnforcerWithdrawal({
      changes: [f.change], records: f.records, entries: [f.entry],
      readAdmission: async ref => byPointer.get(ref.pointer),
    }),
    undefined,
    label,
  );
}

await validHelper();
await rejects('wrong authority pointer', f => { f.entry.source_admission.adapter.authority_admission.pointer = '/records/data~1authorities~1other.md'; });
await rejects('stale authority roles', f => { f.entry.source_admission.adapter.authority_admission.sha256 = '0'.repeat(64); });
await rejects('missing notes evidence', f => { f.instrument.units[notesUnit].evidence = []; });
await rejects('wrong authority roles', f => { f.authority.units[rolesUnit].candidate_content = ['enforcer']; });
await rejects('wrong projected regulator binding', f => { f.records[0].administeredBy = [authorityId, 'https://everyailaw.com/authority/other.json']; });
await rejects('live enforcedBy edge', f => { f.records[0].enforcedBy = [authorityId]; });

const root = await mkdtemp(path.join(os.tmpdir(), 'of-italy-adapter-'));
try {
  const f = fixture();
  // The owner reader uses data/admission/receipts.json. Create its parent
  // explicitly so this test also exercises the production dispatch path.
  await mkdir(path.join(root, 'data', 'admission'), { recursive: true });
  await writeFile(path.join(root, 'data', 'admission', 'receipts.json'), JSON.stringify({
    records: { [instrumentPath]: f.instrument, [authorityPath]: f.authority },
  }));
  await validateMigrationReceipts({ root, changes: [f.change], receipts: { schema_version: 1, entries: [f.entry] }, records: f.records });
  const unknown = structuredClone(f.entry);
  unknown.source_admission.adapter.name = 'unknown-derived-adapter-v1';
  await assert.rejects(
    validateMigrationReceipts({ root, changes: [f.change], receipts: { schema_version: 1, entries: [unknown] }, records: f.records }),
    /Unknown derived migration adapter/,
    'unknown adapters must fail closed',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('EAL Italy authority derived-retirement regressions passed.');

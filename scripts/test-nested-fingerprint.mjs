#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildAdopterFingerprint, stableFingerprintJson } from './lib/adopter-fingerprint.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'of-nested-fingerprint-'));
try {
  const recordsDir = path.join(root, 'records');
  const profilePath = path.join(root, 'profile.json');
  await mkdir(recordsDir);
  await writeFile(profilePath, JSON.stringify({ adopter: 'https://example.com/', entities: {} }));
  const record = {
    '@id': 'https://example.com/record', '@type': 'of:Determination',
    authority_basis: [{ kind: 'statutory', instrument_ref: 'https://example.com/law', source: 'https://example.com/original', source_locator: 'section 1' }],
    binding_basis: { kind: 'statutory-adoption', instrument_ref: 'https://example.com/law', source_citation: 'Original law', scope: ['narrow exception'] },
    actor_roles: [{ party: 'https://example.com/alice', role: 'respondent' }, { party: 'https://example.com/bob', role: 'applicant' }],
    remedy: { obligation: ['https://example.com/duty'], remedy_kind: 'injunction', notes: 'Except when stayed' },
  };
  const fingerprint = async value => {
    await writeFile(path.join(recordsDir, 'record.json'), JSON.stringify(value));
    return buildAdopterFingerprint({ recordsDir, profilePath });
  };
  const before = await fingerprint(record);
  const mutations = [
    r => { r.authority_basis[0].instrument_ref = 'https://example.com/wrong-law'; },
    r => { r.authority_basis[0].source = 'https://example.com/wrong-document'; },
    r => { r.authority_basis[0].source_locator = 'section 2'; },
    r => { r.binding_basis.instrument_ref = 'https://example.com/wrong-law'; },
    r => { r.binding_basis.scope = ['all cases']; },
    r => { r.binding_basis.source_citation = 'Different law'; },
    r => { r.actor_roles[0].party = 'https://example.com/bob'; r.actor_roles[1].party = 'https://example.com/alice'; },
    r => { r.actor_roles[0].role = 'court'; },
    r => { r.remedy.obligation = ['https://example.com/wrong-duty']; },
    r => { r.remedy.notes = 'Always'; },
    r => { r.authority_basis[0].source_version = 'v2'; },
    r => { delete r.binding_basis; },
    r => { r.remedy = null; },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const altered = structuredClone(record); mutate(altered);
    assert.notEqual(stableFingerprintJson(await fingerprint(altered)), stableFingerprintJson(before), `nested mutation ${index + 1} escaped fingerprint`);
  }
  assert.ok(before.nested_edges.some(edge => edge[1] === '/authority_basis/0/instrument_ref' && edge[2] === 'https://example.com/law'));
  assert.ok(before.nested_edges.some(edge => edge[1] === '/binding_basis/instrument_ref'));
  assert.ok(before.nested_edges.some(edge => edge[1] === '/actor_roles/0/party'));
  assert.ok(before.nested_edges.some(edge => edge[1] === '/remedy/obligation/0'));
  assert.deepEqual(before.nested_semantics[record['@id']].binding_basis.scope, ['narrow exception']);
  const evidenceRecord = { ...record, 'pub:source_review_state': 'unknown', 'pub:evidence_inputs': [{ kind: 'instrument', native_path: 'data/examples/instruments/example.md', native_file_sha256: 'a'.repeat(64), canonical_unit: null, canonical_sha256: 'b'.repeat(64), admission_status: 'legacy-unreviewed', review_packet_sha256: null, retained_primary_sha256: null, unresolved_review_state: 'unknown' }] };
  const evidenceBefore = await fingerprint(evidenceRecord);
  for (const [field, value] of Object.entries({ native_file_sha256: 'c'.repeat(64), canonical_sha256: 'd'.repeat(64), canonical_unit: 'entry:other', review_packet_sha256: 'e'.repeat(64), retained_primary_sha256: ['f'.repeat(64)], admission_status: 'source-consistency-reviewed-changes', unresolved_review_state: 'none-declared' })) {
    const altered = structuredClone(evidenceRecord); altered['pub:evidence_inputs'][0][field] = value;
    assert.notEqual(stableFingerprintJson(await fingerprint(altered)), stableFingerprintJson(evidenceBefore), `Owner evidence mutation ${field} escaped exact capture`);
  }
  const altered = structuredClone(evidenceRecord); altered['pub:source_review_state'] = 'none-declared';
  assert.notEqual(stableFingerprintJson(await fingerprint(altered)), stableFingerprintJson(evidenceBefore));
} finally { await rm(root, { recursive: true, force: true }); }
console.log('Fingerprint regressions passed (13 nested mutations and 8 owner-evidence mutations; exact paths, digests and unknown states retained).');

import assert from 'node:assert/strict';
import {
  digest,
  EVERY_AI_LAW_MALTA_ASSESSMENT_WITHDRAWAL,
  validateEveryAiLawMaltaAssessmentWithdrawal,
} from './lib/eal-category-retirement.mjs';

const instrumentPointer = '/records/data~1instruments~1mt-ai-regulations.md';
const indexPointer = '/records/data~1provisions~1index.yml';
const instrumentPath = 'data/instruments/mt-ai-regulations.md';
const indexPath = 'data/provisions/index.yml';
const nativeUnits = {
  obligation: 'section:AI System Classification and Market Surveillance/property:Obligation',
  roles: 'section:AI System Classification and Market Surveillance/property:Roles',
};
const indexUnit = 'entry:mt-ai-regulations-risk-assessment';
const oldIndex = {
  id: 'mt-ai-regulations-risk-assessment', regulation: 'mt-ai-regulations', authority: 'mt-mdia',
  source_file: instrumentPath, source_heading: 'AI System Classification and Market Surveillance',
  obligations: ['risk-assessment'],
};
const newIndex = { ...oldIndex, obligations: [] };
const termId = 'https://everyailaw.com/term/mt-ai-regulations-risk-assessment.json';
const obligationId = 'https://everyailaw.com/obligation/mt-ai-regulations-risk-assessment.json';
const categoryId = 'https://everyailaw.com/obligation-category/risk-assessment.json';
const providerRole = 'https://everyailaw.com/ont/role/provider';

function unit(before, after, candidate) {
  return {
    before_sha256: digest(before),
    after_sha256: after === null ? null : digest(after),
    ...(candidate !== undefined ? { candidate_content: candidate } : {}),
    evidence: ['evidence:1'],
  };
}

function makeAdmissions() {
  const instrument = {
    review: { actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed', reviewed_at: '2026-09-10T00:00:00.000Z' },
    units: {
      [nativeUnits.obligation]: unit('risk-assessment', null, null),
      [nativeUnits.roles]: unit('provider', null, null),
    },
  };
  const index = {
    review: { actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed', reviewed_at: '2026-09-10T00:00:00.000Z' },
    units: { [indexUnit]: unit(oldIndex, newIndex, newIndex) },
  };
  return { instrument, index };
}

function makeAdapter(admissions) {
  return {
    name: EVERY_AI_LAW_MALTA_ASSESSMENT_WITHDRAWAL,
    native_identity: { regulation: 'mt-ai-regulations', source_file: instrumentPath, source_heading: oldIndex.source_heading },
    category_id: 'risk-assessment',
    index_before: structuredClone(oldIndex),
    index_after: structuredClone(newIndex),
    native_obligation_before: 'risk-assessment',
    native_roles_before: 'provider',
    native_after: null,
    index_admission: {
      path: 'data/admission/receipts.json', pointer: indexPointer, sha256: digest(admissions.index), reviewed_units: [indexUnit],
    },
  };
}

function makeChanges(admissions) {
  const adapter = makeAdapter(admissions);
  const changes = [
    ['creates', termId, [obligationId]],
    ['created_by', obligationId, [termId]],
    ['isCategorizedBy', obligationId, [categoryId]],
    ['duty_holder_roles', obligationId, [providerRole]],
  ];
  return { changes: changes.map(([predicate, subject, old_targets]) => ({ kind: 'top', subject, predicate, old_targets, new_targets: [] })), adapter };
}

function makeEntries(admissions, adapter) {
  return makeChanges(admissions).changes.map(change => ({
    change,
    reason: 'Withdraw the unasserted Malta risk-assessment category projection while retaining the source Term.',
    source_admission: {
      path: 'data/admission/receipts.json', pointer: instrumentPointer, sha256: digest(admissions.instrument),
      reviewed_units: [nativeUnits.obligation, nativeUnits.roles],
      relationship_unit: `adapter:${EVERY_AI_LAW_MALTA_ASSESSMENT_WITHDRAWAL}`,
      adapter: structuredClone(adapter),
    },
    review: { actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed', reviewed_at: '2026-09-11T00:00:00.000Z' },
  }));
}

function fixture() {
  const admissions = makeAdmissions();
  const { changes, adapter } = makeChanges(admissions);
  const entries = makeEntries(admissions, adapter);
  const records = [
    { '@type': 'of:Term', '@id': termId, 'eal:source_file': instrumentPath, parent_instrument: 'https://everyailaw.com/instrument/mt-ai-regulations.json', creates: [] },
    { '@type': 'of:Tombstone', '@id': obligationId, deprecated: true, former_type: 'of:Obligation', 'eal:source_file': instrumentPath },
  ];
  const byPointer = new Map([[instrumentPointer, admissions.instrument], [indexPointer, admissions.index]]);
  const readAdmission = async ref => {
    const value = byPointer.get(ref.pointer);
    assert.ok(value, `fixture admission missing ${ref.pointer}`);
    return value;
  };
  return { admissions, changes, entries, records, readAdmission };
}

async function valid() {
  const f = fixture();
  await validateEveryAiLawMaltaAssessmentWithdrawal({ changes: f.changes, records: f.records, entries: f.entries, readAdmission: f.readAdmission });
}

async function rejects(label, mutate) {
  const f = fixture();
  mutate(f);
  await assert.rejects(
    validateEveryAiLawMaltaAssessmentWithdrawal({ changes: f.changes, records: f.records, entries: f.entries, readAdmission: f.readAdmission }),
    undefined,
    label,
  );
}

await valid();
await rejects('unrelated index receipt', f => { f.entries[0].source_admission.adapter.index_admission.pointer = '/records/data~1provisions~1other.yml'; });
await rejects('stale index hash', f => { f.entries[0].source_admission.adapter.index_admission.sha256 = '0'.repeat(64); });
await rejects('wrong native reviewed unit', f => { f.entries[0].source_admission.reviewed_units = [nativeUnits.obligation]; });
await rejects('wrong subject', f => { f.changes[0].subject = 'https://everyailaw.com/term/other.json'; });
await rejects('wrong predicate', f => { f.changes[0].predicate = 'anchors'; });
await rejects('nonempty new category', f => { f.entries[0].source_admission.adapter.index_after.obligations = ['record-keeping']; });
await rejects('live tombstone edge', f => { f.records[1].creates = []; });
await rejects('fake replacement', f => { f.records[1].replaced_by = ['https://everyailaw.com/obligation/fake.json']; });
await rejects('missing Roles evidence', f => { f.admissions.instrument.units[nativeUnits.roles].evidence = []; });
await rejects('unknown adapter', f => { f.entries[0].source_admission.adapter.name = 'unrelated-adapter-v1'; });
console.log('EAL Malta derived-retirement adapter regressions passed.');

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { digest } from './lib/eal-category-retirement.mjs';
import {
  EVERY_AI_LAW_SOURCE_ROLE_CORRECTION,
  validateEveryAiLawSourceRoleCorrection,
} from './lib/eal-source-role-correction.mjs';
import { validateMigrationReceipts } from './lib/relationship-migrations.mjs';

const BASE = 'https://everyailaw.com';
const RECEIPT_PATH = 'data/admission/receipts.json';
const role = name => `${BASE}/ont/role/${name}`;

function item({ id, regulation, heading, beforeNative, beforeTargets, afterNative, afterTargets, actor, source, locator, language, verified }) {
  const instrumentPath = `data/instruments/${regulation}.md`;
  return {
    id, regulation, heading, beforeNative, beforeTargets, afterNative, afterTargets,
    actor, source, locator, language, verified, instrumentPath,
    instrumentPointer: `/records/${instrumentPath.replaceAll('/', '~1')}`,
    rolesUnit: `section:${heading}/property:Roles`,
    termId: `${BASE}/term/${id}.json`,
    obligationId: `${BASE}/obligation/${id}.json`,
    instrumentId: `${BASE}/instrument/${regulation}.json`,
  };
}

const cases = [
  item({
    id: 'au-privacy-act-adm-data-governance', regulation: 'au-privacy-act-adm',
    heading: 'Data Minimisation for AI Systems', beforeNative: 'provider, deployer',
    beforeTargets: [role('deployer'), role('provider')], afterNative: 'controller, government',
    afterTargets: [role('controller'), role('government')], actor: 'Codex Session 6 Australia source review',
    source: 'https://legislation.gov.au/C2004A03712/2026-06-04/2026-06-04/text/original/pdf',
    locator: 'APP 3, APP 6', language: 'en', verified: '2026-05-15',
  }),
  item({
    id: 'au-privacy-act-adm-transparency', regulation: 'au-privacy-act-adm',
    heading: 'Automated Decision-Making Transparency (APP 1.7/1.8)', beforeNative: 'provider, deployer',
    beforeTargets: [role('deployer'), role('provider')], afterNative: 'controller, government',
    afterTargets: [role('controller'), role('government')], actor: 'Codex Session 6 Australia source review',
    source: 'https://legislation.gov.au/C2024A00128/asmade/2024-12-10/text/1/pdf',
    locator: 'APP 1.7, APP 1.8, APP 1.9', language: 'en', verified: '2026-06-30',
  }),
  item({
    id: 'vn-ai-law-transparency', regulation: 'vn-ai-law', heading: 'AI Content Labeling and Disclosure',
    beforeNative: 'provider', beforeTargets: [role('provider')], afterNative: 'provider, deployer',
    afterTargets: [role('deployer'), role('provider')], actor: 'codex-session6-vietnam-source-consistency',
    source: 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat134.signed.pdf',
    locator: 'Article 7, Article 11, Articles 13-14', language: 'vi', verified: '2026-07-11',
  }),
];

function sourceUnit(current) {
  return {
    before_sha256: digest(current.beforeNative),
    after_sha256: digest(current.afterNative),
    candidate_content: current.afterNative,
    evidence: ['primary:roles'],
  };
}

function makeAdmissions() {
  const admissions = new Map();
  for (const current of cases) {
    if (!admissions.has(current.regulation)) admissions.set(current.regulation, {
      review: {
        actor_type: 'agent', actor: current.actor, decision: 'source-consistency-reviewed',
        reviewed_at: '2026-09-11T20:00:00.000Z', packet_sha256: 'a'.repeat(64),
      },
      units: {},
    });
    admissions.get(current.regulation).units[current.rolesUnit] = sourceUnit(current);
  }
  return admissions;
}

function change(current) {
  return {
    kind: 'top', subject: current.obligationId, predicate: 'duty_holder_roles',
    old_targets: [...current.beforeTargets], new_targets: [...current.afterTargets],
  };
}

function declaration(current) {
  return {
    name: EVERY_AI_LAW_SOURCE_ROLE_CORRECTION,
    case_id: current.id,
    native_identity: {
      regulation: current.regulation,
      source_file: current.instrumentPath,
      source_heading: current.heading,
    },
    native_roles_before: current.beforeNative,
    native_roles_after: current.afterNative,
    term_id: current.termId,
    obligation_id: current.obligationId,
  };
}

function entry(current, admissions) {
  const relationshipChange = change(current);
  const sourceAdmission = {
    path: RECEIPT_PATH,
    pointer: current.instrumentPointer,
    sha256: digest(admissions.get(current.regulation)),
    reviewed_units: [current.rolesUnit],
    relationship_unit: `adapter:${EVERY_AI_LAW_SOURCE_ROLE_CORRECTION}`,
    adapter: declaration(current),
  };
  const reason = `Correct ${current.id} roles from the reviewed native section Roles unit.`;
  return {
    change: relationshipChange,
    reason,
    source_admission: sourceAdmission,
    review: {
      actor_type: 'agent', actor: 'fixture relationship reviewer', decision: 'source-consistency-reviewed',
      reviewed_at: '2026-09-11T21:00:00.000Z',
      packet_sha256: digest({ change: relationshipChange, reason, source_admission: sourceAdmission }),
    },
  };
}

function fixture(selected = cases) {
  const admissions = makeAdmissions();
  const entries = selected.map(current => entry(current, admissions));
  const records = cases.flatMap(current => [{
    '@type': 'of:Term', '@id': current.termId, 'eal:source_file': current.instrumentPath,
    'eal:source_heading': current.heading, parent_instrument: current.instrumentId,
    creates: [current.obligationId], source: current.source, source_locator: current.locator,
    language: current.language, verified: current.verified,
  }, {
    '@type': 'of:Obligation', '@id': current.obligationId, created_by: [current.termId],
    duty_holder_roles: [...current.afterTargets], source: current.source, source_locator: current.locator,
    language: current.language, verified: current.verified,
  }]);
  const byPointer = new Map([...admissions].map(([regulation, admission]) => [
    `/records/data~1instruments~1${regulation}.md`, admission,
  ]));
  const readAdmission = async ref => {
    const admitted = byPointer.get(ref.pointer);
    assert.ok(admitted, `fixture admission missing ${ref.pointer}`);
    return admitted;
  };
  return { admissions, entries, changes: entries.map(candidate => candidate.change), records, readAdmission };
}

async function valid(selected = cases) {
  const f = fixture(selected);
  await validateEveryAiLawSourceRoleCorrection(f);
}

async function rejects(label, mutate) {
  const f = fixture();
  mutate(f);
  await assert.rejects(validateEveryAiLawSourceRoleCorrection(f), undefined, label);
}

await valid();
for (const current of cases) await valid([current]);

await rejects('wrong source actor', f => { f.admissions.get('au-privacy-act-adm').review.actor = 'fabricated reviewer'; });
await rejects('wrong native heading', f => { f.entries[0].source_admission.adapter.native_identity.source_heading = 'Wrong heading'; });
await rejects('wrong Term source', f => { f.records.find(record => record['@id'] === cases[0].termId).source = 'https://example.com/wrong'; });
await rejects('missing accepted packet', f => { delete f.admissions.get('au-privacy-act-adm').review.packet_sha256; });
await rejects('stale source packet reference', f => { f.entries[0].source_admission.sha256 = '0'.repeat(64); });
await rejects('extra duplicate case', f => {
  f.entries.push(structuredClone(f.entries[0]));
  f.changes.push(f.entries.at(-1).change);
});
await rejects('unknown case', f => { f.entries[0].source_admission.adapter.case_id = 'unknown-role-correction'; });
await rejects('wrong prior roles', f => { f.changes[0].old_targets = [role('provider')]; });
await rejects('wrong current roles', f => { f.records.find(record => record['@id'] === cases[0].obligationId).duty_holder_roles = [role('controller')]; });
await rejects('declared native after mismatch', f => { f.entries[0].source_admission.adapter.native_roles_after = 'controller'; });
await rejects('source unit candidate mismatch', f => { f.admissions.get('au-privacy-act-adm').units[cases[0].rolesUnit].candidate_content = 'government'; });

const root = await mkdtemp(path.join(os.tmpdir(), 'of-eal-source-role-correction-'));
try {
  const f = fixture();
  await mkdir(path.join(root, 'data', 'admission'), { recursive: true });
  await writeFile(path.join(root, RECEIPT_PATH), JSON.stringify({ records: Object.fromEntries(
    [...f.admissions].map(([regulation, admission]) => [`data/instruments/${regulation}.md`, admission]),
  ) }));
  await validateMigrationReceipts({
    root,
    changes: f.changes,
    receipts: { schema_version: 1, entries: f.entries },
    records: f.records,
  });
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('EAL source-role correction adapter regressions passed.');

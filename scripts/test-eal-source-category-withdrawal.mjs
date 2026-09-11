import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { digest } from './lib/eal-category-retirement.mjs';
import {
  EVERY_AI_LAW_SOURCE_CATEGORY_WITHDRAWAL,
  validateEveryAiLawSourceCategoryWithdrawal,
} from './lib/eal-source-category-withdrawal.mjs';
import { validateMigrationReceipts } from './lib/relationship-migrations.mjs';

const BASE = 'https://everyailaw.com';
const RECEIPT_PATH = 'data/admission/receipts.json';
const INDEX_PATH = 'data/provisions/index.yml';
const INDEX_POINTER = '/records/data~1provisions~1index.yml';
const providerRole = `${BASE}/ont/role/provider`;
const deployerRole = `${BASE}/ont/role/deployer`;
const roleTargets = [deployerRole, providerRole];

function item({ id, regulation, authority, heading, category, obligationId, verified, source, sourceLocator, language }) {
  const instrumentPath = `data/instruments/${regulation}.md`;
  const indexBefore = {
    id, regulation, authority, source_file: instrumentPath, source_heading: heading, obligations: [category],
  };
  return {
    id, regulation, heading, category, instrumentPath,
    instrumentPointer: `/records/${instrumentPath.replaceAll('/', '~1')}`,
    indexUnit: `entry:${id}`,
    units: {
      obligation: `section:${heading}/property:Obligation`,
      roles: `section:${heading}/property:Roles`,
    },
    indexBefore,
    indexAfter: { ...indexBefore, obligations: [] },
    termId: `${BASE}/term/${id}.json`,
    obligationId: `${BASE}/obligation/${obligationId}.json`,
    categoryId: `${BASE}/obligation-category/${category}.json`,
    instrumentId: `${BASE}/instrument/${regulation}.json`, verified, source, sourceLocator, language,
  };
}

const cases = [
  item({
    id: 'au-privacy-act-adm-risk', regulation: 'au-privacy-act-adm', authority: 'au-oaic',
    heading: 'Privacy Impact Assessments for AI', category: 'risk-assessment',
    obligationId: 'au-privacy-act-adm-risk-risk-assessment', verified: '2026-05-15', language: 'en',
    source: 'https://oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/privacy-impact-assessments/guide-to-undertaking-privacy-impact-assessments',
    sourceLocator: 'OAIC PIA guidance; APP 1.2 relationship',
  }),
  item({
    id: 'jp-ai-promotion-act-risk', regulation: 'jp-ai-promotion-act', authority: 'jp-cas',
    heading: 'AI Risk Governance', category: 'risk-assessment',
    obligationId: 'jp-ai-promotion-act-risk-risk-assessment', verified: '2026-07-10', language: 'ja',
    source: 'https://laws.e-gov.go.jp/data/Act/507AC0000000053/624018_1/507AC0000000053_20250901_000000000000000_h1.pdf',
    sourceLocator: 'Art. 16; Art. 18',
  }),
  item({
    id: 'jp-ai-promotion-act-transparency', regulation: 'jp-ai-promotion-act', authority: 'jp-cas',
    heading: 'AI Transparency and Cooperation', category: 'transparency',
    obligationId: 'jp-ai-promotion-act-transparency', verified: '2026-07-10', language: 'ja',
    source: 'https://laws.e-gov.go.jp/data/Act/507AC0000000053/624018_1/507AC0000000053_20250901_000000000000000_h1.pdf',
    sourceLocator: 'Art. 7',
  }),
];

function unit(before, after, candidate) {
  return {
    before_sha256: digest(before),
    after_sha256: after === null ? null : digest(after),
    candidate_content: candidate,
    evidence: ['primary:1'],
  };
}

function accepted(units) {
  return {
    review: {
      actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed',
      reviewed_at: '2026-09-11T20:00:00.000Z', packet_sha256: 'a'.repeat(64),
    },
    units,
  };
}

function makeAdmissions() {
  const instruments = new Map();
  for (const current of cases) {
    if (!instruments.has(current.regulation)) instruments.set(current.regulation, accepted({}));
    const admission = instruments.get(current.regulation);
    admission.units[current.units.obligation] = unit(current.category, null, null);
    admission.units[current.units.roles] = unit('provider, deployer', null, null);
  }
  const index = accepted(Object.fromEntries(cases.map(current => [
    current.indexUnit,
    unit(current.indexBefore, current.indexAfter, current.indexAfter),
  ])));
  return { instruments, index };
}

function adapter(current, admissions) {
  return {
    name: EVERY_AI_LAW_SOURCE_CATEGORY_WITHDRAWAL,
    case_id: current.id,
    native_identity: {
      regulation: current.regulation,
      source_file: current.instrumentPath,
      source_heading: current.heading,
    },
    category_id: current.category,
    index_before: structuredClone(current.indexBefore),
    index_after: structuredClone(current.indexAfter),
    native_obligation_before: current.category,
    native_roles_before: 'provider, deployer',
    native_after: null,
    index_admission: {
      path: RECEIPT_PATH,
      pointer: INDEX_POINTER,
      sha256: digest(admissions.index),
      reviewed_units: [current.indexUnit],
    },
  };
}

function caseChanges(current) {
  return [
    { kind: 'top', subject: current.termId, predicate: 'creates', old_targets: [current.obligationId], new_targets: [] },
    { kind: 'top', subject: current.obligationId, predicate: 'created_by', old_targets: [current.termId], new_targets: [] },
    { kind: 'top', subject: current.obligationId, predicate: 'isCategorizedBy', old_targets: [current.categoryId], new_targets: [] },
    { kind: 'top', subject: current.obligationId, predicate: 'duty_holder_roles', old_targets: roleTargets, new_targets: [] },
  ];
}

function migrationEntry(change, current, admissions) {
  const sourceAdmission = {
    path: RECEIPT_PATH,
    pointer: current.instrumentPointer,
    sha256: digest(admissions.instruments.get(current.regulation)),
    reviewed_units: [current.units.obligation, current.units.roles],
    relationship_unit: `adapter:${EVERY_AI_LAW_SOURCE_CATEGORY_WITHDRAWAL}`,
    adapter: adapter(current, admissions),
  };
  const reason = `Withdraw the unsupported ${current.category} category projection while retaining the reviewed ${current.id} source Term.`;
  return {
    change,
    reason,
    source_admission: sourceAdmission,
    review: {
      actor_type: 'agent', actor: 'fixture-agent', decision: 'source-consistency-reviewed', reviewed_at: '2026-09-11T21:00:00.000Z',
      packet_sha256: digest({ change, reason, source_admission: sourceAdmission }),
    },
  };
}

function fixture(selected = cases) {
  const admissions = makeAdmissions();
  const entries = [];
  for (const current of selected) {
    for (const change of caseChanges(current)) entries.push(migrationEntry(change, current, admissions));
  }
  const changes = entries.map(entry => entry.change);
  const records = cases.flatMap(current => [{
    '@type': 'of:Term', '@id': current.termId, 'eal:source_file': current.instrumentPath,
    parent_instrument: current.instrumentId, creates: [], source: current.source,
    source_locator: current.sourceLocator, verified: current.verified, language: current.language,
  }, {
    '@type': 'of:Tombstone', '@id': current.obligationId, deprecated: true,
    former_type: 'of:Obligation', 'eal:source_file': current.instrumentPath,
    source: current.source, source_locator: current.sourceLocator,
    verified: current.verified, language: current.language,
  }]);
  const byPointer = new Map([[INDEX_POINTER, admissions.index]]);
  for (const current of cases) byPointer.set(current.instrumentPointer, admissions.instruments.get(current.regulation));
  const readAdmission = async ref => {
    const value = byPointer.get(ref.pointer);
    assert.ok(value, `fixture admission missing ${ref.pointer}`);
    return value;
  };
  return { admissions, changes, entries, records, readAdmission };
}

async function valid(selected = cases) {
  const f = fixture(selected);
  await validateEveryAiLawSourceCategoryWithdrawal(f);
}

async function rejects(label, mutate) {
  const f = fixture();
  mutate(f);
  await assert.rejects(validateEveryAiLawSourceCategoryWithdrawal(f), undefined, label);
}

await valid();
for (const current of cases) await valid([current]);

await rejects('wrong subject', f => { f.changes[0].subject = `${BASE}/term/fabricated.json`; });
await rejects('wrong role targets', f => {
  const change = f.changes.find(candidate => candidate.predicate === 'duty_holder_roles');
  change.old_targets = [providerRole];
});
await rejects('tombstone source drift', f => {
  f.records.find(record => record['@type'] === 'of:Tombstone').source = 'https://example.com/wrong-source';
});
await rejects('tombstone locator omitted', f => {
  delete f.records.find(record => record['@type'] === 'of:Tombstone').source_locator;
});
await rejects('tombstone verified date renewed', f => {
  f.records.find(record => record['@type'] === 'of:Tombstone').verified = '2026-09-11';
});
await rejects('tombstone language drift', f => {
  f.records.find(record => record['@type'] === 'of:Tombstone').language = 'fr';
});
await rejects('retained Term historical verified date drift', f => {
  f.records.find(record => record['@type'] === 'of:Term').verified = '2026-09-11';
});
await rejects('stale index admission hash', f => {
  for (const entry of f.entries.filter(candidate => candidate.source_admission.adapter.case_id === cases[0].id)) {
    entry.source_admission.adapter.index_admission.sha256 = '0'.repeat(64);
  }
});
await rejects('missing relationship change', f => {
  const removed = f.entries.shift();
  f.changes = f.changes.filter(change => change !== removed.change);
});
await rejects('nonempty replacement category', f => {
  for (const entry of f.entries.filter(candidate => candidate.source_admission.adapter.case_id === cases[0].id)) {
    entry.source_admission.adapter.index_after.obligations = ['data-governance'];
  }
});
await rejects('unknown registered case', f => {
  for (const entry of f.entries.filter(candidate => candidate.source_admission.adapter.case_id === cases[0].id)) {
    entry.source_admission.adapter.case_id = 'unknown-source-term';
  }
});

const root = await mkdtemp(path.join(os.tmpdir(), 'of-eal-source-category-withdrawal-'));
try {
  const f = fixture();
  await mkdir(path.join(root, 'data', 'admission'), { recursive: true });
  await writeFile(path.join(root, RECEIPT_PATH), JSON.stringify({
    records: {
      [INDEX_PATH]: f.admissions.index,
      ...Object.fromEntries([...f.admissions.instruments].map(([regulation, admission]) => [`data/instruments/${regulation}.md`, admission])),
    },
  }));
  await validateMigrationReceipts({
    root,
    changes: f.changes,
    receipts: { schema_version: 1, entries: f.entries },
    records: f.records,
  });
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('EAL source-category withdrawal adapter regressions passed.');

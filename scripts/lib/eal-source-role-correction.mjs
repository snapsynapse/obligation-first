import assert from 'node:assert/strict';
import { digest } from './eal-category-retirement.mjs';

// Closed adapter for three section-scoped Roles corrections in EAL's Session 6
// source review. Markdown section properties are not generic OF fields, so this
// adapter binds each exact native unit to its one generated obligation edge.
export const EVERY_AI_LAW_SOURCE_ROLE_CORRECTION = 'every-ai-law-source-role-correction-v1';
const RECEIPT_PATH = 'data/admission/receipts.json';
const BASE = 'https://everyailaw.com';
const ROLE = name => `${BASE}/ont/role/${name}`;

function definition({ id, regulation, heading, before, after, actor, source, locator, language, verified }) {
  const instrumentPath = `data/instruments/${regulation}.md`;
  return Object.freeze({
    id,
    regulation,
    heading,
    before,
    after,
    actor,
    source,
    locator,
    language,
    verified,
    instrumentPath,
    instrumentPointer: `/records/${instrumentPath.replaceAll('~', '~0').replaceAll('/', '~1')}`,
    rolesUnit: `section:${heading}/property:Roles`,
    termId: `${BASE}/term/${id}.json`,
    obligationId: `${BASE}/obligation/${id}.json`,
    instrumentId: `${BASE}/instrument/${regulation}.json`,
  });
}

const CASES = new Map([
  ['au-privacy-act-adm-data-governance', definition({
    id: 'au-privacy-act-adm-data-governance',
    regulation: 'au-privacy-act-adm',
    heading: 'Data Minimisation for AI Systems',
    before: Object.freeze({ native: 'provider, deployer', targets: Object.freeze([ROLE('deployer'), ROLE('provider')]) }),
    after: Object.freeze({ native: 'controller, government', targets: Object.freeze([ROLE('controller'), ROLE('government')]) }),
    actor: 'Codex Session 6 Australia source review',
    source: 'https://legislation.gov.au/C2004A03712/2026-06-04/2026-06-04/text/original/pdf',
    locator: 'APP 3, APP 6',
    language: 'en',
    verified: '2026-05-15',
  })],
  ['au-privacy-act-adm-transparency', definition({
    id: 'au-privacy-act-adm-transparency',
    regulation: 'au-privacy-act-adm',
    heading: 'Automated Decision-Making Transparency (APP 1.7/1.8)',
    before: Object.freeze({ native: 'provider, deployer', targets: Object.freeze([ROLE('deployer'), ROLE('provider')]) }),
    after: Object.freeze({ native: 'controller, government', targets: Object.freeze([ROLE('controller'), ROLE('government')]) }),
    actor: 'Codex Session 6 Australia source review',
    source: 'https://legislation.gov.au/C2024A00128/asmade/2024-12-10/text/1/pdf',
    locator: 'APP 1.7, APP 1.8, APP 1.9',
    language: 'en',
    verified: '2026-06-30',
  })],
  ['vn-ai-law-transparency', definition({
    id: 'vn-ai-law-transparency',
    regulation: 'vn-ai-law',
    heading: 'AI Content Labeling and Disclosure',
    before: Object.freeze({ native: 'provider', targets: Object.freeze([ROLE('provider')]) }),
    after: Object.freeze({ native: 'provider, deployer', targets: Object.freeze([ROLE('deployer'), ROLE('provider')]) }),
    actor: 'codex-session6-vietnam-source-consistency',
    source: 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat134.signed.pdf',
    locator: 'Article 7, Article 11, Articles 13-14',
    language: 'vi',
    verified: '2026-07-11',
  })],
  ['uk-osa-transparency', definition({
    id: 'uk-osa-transparency',
    regulation: 'uk-online-safety-act',
    heading: 'AI-Generated Content Duties',
    before: Object.freeze({ native: 'provider, deployer', targets: Object.freeze([ROLE('deployer'), ROLE('provider')]) }),
    after: Object.freeze({ native: 'provider', targets: Object.freeze([ROLE('provider')]) }),
    actor: 'Codex integrated source review',
    source: 'https://legislation.gov.uk/ukpga/2023/50/contents',
    locator: 'Part 3 ss. 4, 7, 9-12, 24, 26-29, 55, 57, 77; Sch. 8; s. 216A (regulation-making power)',
    language: 'en',
    verified: '2026-08-15',
  })],
]);

const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
const equal = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

function findRecord(records, id, label) {
  const matches = records.filter(record => record['@id'] === id);
  assert.equal(matches.length, 1, `${label} must resolve exactly once`);
  return matches[0];
}

function requireProjection(records, item) {
  const term = findRecord(records, item.termId, `${item.id} Term`);
  assert.equal(term['@type'], 'of:Term', `${item.id} Term type drifted`);
  assert.equal(term['eal:source_file'], item.instrumentPath, `${item.id} Term source_file drifted`);
  assert.equal(term['eal:source_heading'], item.heading, `${item.id} Term source_heading drifted`);
  assert.equal(term.parent_instrument, item.instrumentId, `${item.id} Term parent drifted`);
  assert.deepEqual(term.creates, [item.obligationId], `${item.id} Term creates drifted`);
  assert.equal(term.source, item.source, `${item.id} Term source drifted`);
  assert.equal(term.source_locator, item.locator, `${item.id} Term source locator drifted`);
  assert.equal(term.language, item.language, `${item.id} Term language drifted`);
  assert.equal(term.verified, item.verified, `${item.id} Term historical verified date drifted`);

  const obligation = findRecord(records, item.obligationId, `${item.id} Obligation`);
  assert.equal(obligation['@type'], 'of:Obligation', `${item.id} obligation type drifted`);
  assert.deepEqual(obligation.created_by, [item.termId], `${item.id} obligation creator drifted`);
  assert.deepEqual([...obligation.duty_holder_roles].sort(), [...item.after.targets], `${item.id} current obligation roles drifted`);
  assert.equal(obligation.source, item.source, `${item.id} obligation source drifted`);
  assert.equal(obligation.source_locator, item.locator, `${item.id} obligation source locator drifted`);
  assert.equal(obligation.language, item.language, `${item.id} obligation language drifted`);
  assert.equal(obligation.verified, item.verified, `${item.id} obligation historical verified date drifted`);
}

function requireAdmission(admitted, item, reviewedAt) {
  assert.ok(admitted && typeof admitted === 'object', `${item.id} source admission missing`);
  assert.ok(['source-consistency-reviewed', 'source-consistency-reviewed-changes'].includes(admitted.review?.decision), `${item.id} source admission is not accepted`);
  assert.equal(admitted.review?.actor_type, 'agent', `${item.id} source admission actor type drifted`);
  assert.equal(admitted.review?.actor, item.actor, `${item.id} source admission actor drifted`);
  assert.match(admitted.review?.packet_sha256 || '', /^[a-f0-9]{64}$/, `${item.id} accepted source packet digest missing`);
  assert.ok(Date.parse(admitted.review?.reviewed_at) <= Date.parse(reviewedAt), `${item.id} source admission is after migration review`);
  const unit = admitted.units?.[item.rolesUnit];
  assert.ok(unit, `${item.id} source Roles unit missing`);
  assert.equal(unit.before_sha256, digest(item.before.native), `${item.id} source Roles before hash mismatch`);
  assert.equal(unit.after_sha256, digest(item.after.native), `${item.id} source Roles after hash mismatch`);
  assert.ok(Object.hasOwn(unit, 'candidate_content') && unit.candidate_content === item.after.native, `${item.id} source Roles candidate mismatch`);
  assert.ok(Array.isArray(unit.evidence) && unit.evidence.length > 0, `${item.id} source Roles unit lacks evidence`);
}

function requireChange(change, item) {
  assert.deepEqual(change, {
    kind: 'top',
    subject: item.obligationId,
    predicate: 'duty_holder_roles',
    old_targets: [...item.before.targets],
    new_targets: [...item.after.targets],
  }, `${item.id} role correction does not match the closed case`);
}

async function requireCase({ item, change, entry, records, readAdmission }) {
  requireChange(change, item);
  requireProjection(records, item);
  assert.ok(equal(entry.change, change), `${item.id} receipt does not bind the current relationship change`);
  const ref = entry.source_admission;
  const adapter = ref?.adapter;
  assert.equal(adapter?.name, EVERY_AI_LAW_SOURCE_ROLE_CORRECTION, `${item.id} adapter name drifted`);
  assert.equal(adapter.case_id, item.id, `${item.id} adapter case drifted`);
  assert.equal(ref.relationship_unit, `adapter:${EVERY_AI_LAW_SOURCE_ROLE_CORRECTION}`, `${item.id} relationship unit drifted`);
  assert.equal(ref.path, RECEIPT_PATH, `${item.id} source receipt path drifted`);
  assert.equal(ref.pointer, item.instrumentPointer, `${item.id} source receipt pointer drifted`);
  assert.deepEqual(ref.reviewed_units, [item.rolesUnit], `${item.id} source reviewed unit drifted`);
  const admitted = await readAdmission(ref);
  assert.equal(ref.sha256, digest(admitted), `${item.id} source admission digest is stale`);
  requireAdmission(admitted, item, entry.review.reviewed_at);
  assert.deepEqual(adapter.native_identity, {
    regulation: item.regulation,
    source_file: item.instrumentPath,
    source_heading: item.heading,
  }, `${item.id} native identity drifted`);
  assert.equal(adapter.native_roles_before, item.before.native, `${item.id} declared native Roles before drifted`);
  assert.equal(adapter.native_roles_after, item.after.native, `${item.id} declared native Roles after drifted`);
  assert.equal(adapter.term_id, item.termId, `${item.id} declared Term drifted`);
  assert.equal(adapter.obligation_id, item.obligationId, `${item.id} declared Obligation drifted`);
}

export async function validateEveryAiLawSourceRoleCorrection({ changes, records, entries, readAdmission }) {
  assert.ok(entries.length > 0, 'Source-role correction adapter group is empty');
  assert.equal(entries.length, changes.length, 'Source-role correction adapter entries must cover every grouped change');
  const groups = new Map();
  for (const entry of entries) {
    const adapter = entry.source_admission?.adapter;
    assert.equal(adapter?.name, EVERY_AI_LAW_SOURCE_ROLE_CORRECTION, 'Unknown source-role correction adapter');
    assert.ok(CASES.has(adapter.case_id), `Unknown source-role correction case: ${adapter.case_id}`);
    assert.ok(!groups.has(adapter.case_id), `Duplicate source-role correction case: ${adapter.case_id}`);
    groups.set(adapter.case_id, entry);
  }
  assert.equal(changes.length, groups.size, 'Each present source-role correction case must contribute exactly one change');
  for (const [caseId, entry] of groups) {
    await requireCase({ item: CASES.get(caseId), change: entry.change, entry, records, readAdmission });
  }
  return true;
}

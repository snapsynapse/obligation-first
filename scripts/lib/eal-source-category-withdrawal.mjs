import assert from 'node:assert/strict';
import { digest } from './eal-category-retirement.mjs';

// Fixed adapter for three source-reviewed EAL category withdrawals. The case
// registry is closed: each declaration binds an exact native section, index
// row, historical projection and four-edge retirement. It is not a general
// bypass for derived relationship changes.
export const EVERY_AI_LAW_SOURCE_CATEGORY_WITHDRAWAL = 'every-ai-law-source-category-withdrawal-v1';
const RECEIPT_PATH = 'data/admission/receipts.json';
const INDEX_POINTER = '/records/data~1provisions~1index.yml';
const BASE = 'https://everyailaw.com';
const PROVIDER_ROLE = `${BASE}/ont/role/provider`;
const DEPLOYER_ROLE = `${BASE}/ont/role/deployer`;
const ROLE_TARGETS = Object.freeze([DEPLOYER_ROLE, PROVIDER_ROLE]);

function definition({ id, regulation, authority, heading, category, obligationId, verified }) {
  const instrumentPath = `data/instruments/${regulation}.md`;
  const indexBefore = Object.freeze({
    id,
    regulation,
    authority,
    source_file: instrumentPath,
    source_heading: heading,
    obligations: [category],
  });
  return Object.freeze({
    id,
    regulation,
    instrumentPath,
    instrumentPointer: `/records/${instrumentPath.replaceAll('~', '~0').replaceAll('/', '~1')}`,
    heading,
    category,
    indexUnit: `entry:${id}`,
    nativeUnits: Object.freeze({
      obligation: `section:${heading}/property:Obligation`,
      roles: `section:${heading}/property:Roles`,
    }),
    termId: `${BASE}/term/${id}.json`,
    obligationId: `${BASE}/obligation/${obligationId}.json`,
    categoryId: `${BASE}/obligation-category/${category}.json`,
    instrumentId: `${BASE}/instrument/${regulation}.json`,
    verified,
    indexBefore,
    indexAfter: Object.freeze({ ...indexBefore, obligations: [] }),
  });
}

const CASES = new Map([
  ['au-privacy-act-adm-risk', definition({
    id: 'au-privacy-act-adm-risk',
    regulation: 'au-privacy-act-adm',
    authority: 'au-oaic',
    heading: 'Privacy Impact Assessments for AI',
    category: 'risk-assessment',
    obligationId: 'au-privacy-act-adm-risk-risk-assessment',
    verified: '2026-05-15',
  })],
  ['jp-ai-promotion-act-risk', definition({
    id: 'jp-ai-promotion-act-risk',
    regulation: 'jp-ai-promotion-act',
    authority: 'jp-cas',
    heading: 'AI Risk Governance',
    category: 'risk-assessment',
    obligationId: 'jp-ai-promotion-act-risk-risk-assessment',
    verified: '2026-07-10',
  })],
  ['jp-ai-promotion-act-transparency', definition({
    id: 'jp-ai-promotion-act-transparency',
    regulation: 'jp-ai-promotion-act',
    authority: 'jp-cas',
    heading: 'AI Transparency and Cooperation',
    category: 'transparency',
    obligationId: 'jp-ai-promotion-act-transparency',
    verified: '2026-07-10',
  })],
]);

const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
const equal = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

function requireAcceptedAdmission(admitted, reviewedAt, label) {
  assert.ok(admitted && typeof admitted === 'object', `${label} admission missing`);
  assert.ok(['source-consistency-reviewed', 'source-consistency-reviewed-changes'].includes(admitted.review?.decision), `${label} admission is not accepted`);
  assert.ok(['agent', 'human'].includes(admitted.review?.actor_type) && typeof admitted.review?.actor === 'string' && admitted.review.actor.trim(), `${label} admission reviewer missing`);
  assert.match(admitted.review?.packet_sha256 || '', /^[a-f0-9]{64}$/, `${label} accepted packet digest missing`);
  const sourceTime = Date.parse(admitted.review?.reviewed_at);
  const migrationTime = Date.parse(reviewedAt);
  assert.ok(Number.isFinite(sourceTime) && Number.isFinite(migrationTime) && sourceTime <= migrationTime, `${label} admission is after migration review`);
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

function requireIndexUnit(admitted, item, label) {
  const record = admitted.units[item.indexUnit];
  assert.ok(record, `${label} index unit missing`);
  assert.equal(record.before_sha256, digest(item.indexBefore), `${label} index before hash mismatch`);
  assert.equal(record.after_sha256, digest(item.indexAfter), `${label} index after hash mismatch`);
  assert.ok(Object.hasOwn(record, 'candidate_content') && equal(record.candidate_content, item.indexAfter), `${label} index candidate mismatch`);
  requireEvidence(admitted, item.indexUnit, label);
}

function findRecord(records, id, label) {
  const matches = records.filter(record => record['@id'] === id);
  assert.equal(matches.length, 1, `${label} must resolve exactly once`);
  return matches[0];
}

function requireProjection(records, item) {
  const term = findRecord(records, item.termId, `${item.id} Term`);
  assert.equal(term['@type'], 'of:Term', `${item.id} Term must remain active`);
  assert.equal(term['eal:source_file'], item.instrumentPath, `${item.id} Term source_file drifted`);
  assert.equal(term.parent_instrument, item.instrumentId, `${item.id} Term parent drifted`);
  assert.deepEqual(term.creates || [], [], `${item.id} Term must have no categorized obligation`);
  for (const field of ['source', 'source_locator', 'verified', 'language']) {
    assert.ok(typeof term[field] === 'string' && term[field].trim(), `${item.id} Term ${field} missing`);
  }
  assert.equal(term.verified, item.verified, `${item.id} Term historical verified date drifted`);

  const retired = findRecord(records, item.obligationId, `${item.id} retired obligation`);
  assert.equal(retired['@type'], 'of:Tombstone', `${item.id} former obligation must be a Tombstone`);
  assert.equal(retired.deprecated, true, `${item.id} former obligation must be deprecated`);
  assert.equal(retired.former_type, 'of:Obligation', `${item.id} former obligation type drifted`);
  assert.equal(retired['eal:source_file'], item.instrumentPath, `${item.id} Tombstone native owner drifted`);
  assert.equal(Object.hasOwn(retired, 'replaced_by'), false, `${item.id} Tombstone must not invent a successor`);
  for (const field of ['creates', 'created_by', 'isCategorizedBy', 'duty_holder_roles']) {
    assert.equal(Object.hasOwn(retired, field), false, `${item.id} Tombstone must not carry live ${field}`);
  }
  for (const field of ['source', 'source_locator', 'verified', 'language']) {
    assert.equal(retired[field], term[field], `${item.id} Tombstone ${field} must preserve the reviewed source Term value`);
  }
  assert.equal(retired.verified, item.verified, `${item.id} Tombstone must preserve the historical verified date without renewal`);
  assert.equal(records.filter(record => record['@id'] === item.obligationId && record['@type'] !== 'of:Tombstone').length, 0, `${item.id} retired obligation remains active`);
}

function expectedChanges(item) {
  return new Map([
    ['creates', { subject: item.termId, oldTargets: [item.obligationId] }],
    ['created_by', { subject: item.obligationId, oldTargets: [item.termId] }],
    ['isCategorizedBy', { subject: item.obligationId, oldTargets: [item.categoryId] }],
    ['duty_holder_roles', { subject: item.obligationId, oldTargets: ROLE_TARGETS }],
  ]);
}

function requireChangeSet(changes, item) {
  const expected = expectedChanges(item);
  assert.equal(changes.length, 4, `${item.id} adapter must cover exactly four relationship changes`);
  const seen = new Set();
  for (const change of changes) {
    assert.equal(change.kind, 'top', `${item.id} adapter only covers top-level edges`);
    const relation = expected.get(change.predicate);
    assert.ok(relation, `${item.id} adapter rejects predicate ${change.predicate}`);
    assert.equal(change.subject, relation.subject, `${item.id} subject mismatch for ${change.predicate}`);
    assert.deepEqual(change.old_targets, relation.oldTargets, `${item.id} old targets mismatch for ${change.predicate}`);
    assert.deepEqual(change.new_targets, [], `${item.id} new targets must be empty for ${change.predicate}`);
    assert.ok(!seen.has(change.predicate), `${item.id} duplicate predicate ${change.predicate}`);
    seen.add(change.predicate);
  }
  assert.deepEqual([...seen].sort(), [...expected.keys()].sort(), `${item.id} predicate set incomplete`);
}

async function requireCase({ item, changes, records, entries, readAdmission }) {
  requireChangeSet(changes, item);
  requireProjection(records, item);
  assert.equal(entries.length, 4, `${item.id} adapter must be declared on exactly four receipts`);
  const declared = entries[0].source_admission.adapter;
  for (const entry of entries) {
    assert.ok(equal(entry.change, changes.find(change => equal(change, entry.change))), `${item.id} adapter entry does not bind a current relationship change`);
    assert.ok(equal(entry.source_admission.adapter, declared), `${item.id} adapter declarations must be identical across the four-change group`);
    const ref = entry.source_admission;
    const adapter = ref.adapter;
    assert.equal(adapter.name, EVERY_AI_LAW_SOURCE_CATEGORY_WITHDRAWAL, 'Unknown derived migration adapter');
    assert.equal(adapter.case_id, item.id, `${item.id} adapter case drifted`);
    assert.equal(ref.relationship_unit, `adapter:${EVERY_AI_LAW_SOURCE_CATEGORY_WITHDRAWAL}`, `${item.id} adapter relationship unit drifted`);
    assert.equal(ref.path, RECEIPT_PATH, `${item.id} primary receipt path drifted`);
    assert.equal(ref.pointer, item.instrumentPointer, `${item.id} primary receipt pointer drifted`);
    assert.deepEqual(ref.reviewed_units, [item.nativeUnits.obligation, item.nativeUnits.roles], `${item.id} native reviewed units drifted`);
    const native = await readAdmission(ref);
    assert.equal(ref.sha256, digest(native), `${item.id} instrument admission digest is stale`);
    requireAcceptedAdmission(native, entry.review.reviewed_at, `${item.id} instrument`);
    requireRemovedUnit(native, item.nativeUnits.obligation, item.category, `${item.id} instrument`);
    requireRemovedUnit(native, item.nativeUnits.roles, 'provider, deployer', `${item.id} instrument`);

    const indexRef = adapter.index_admission;
    assert.ok(indexRef && typeof indexRef === 'object', `${item.id} index admission missing`);
    assert.equal(indexRef.path, RECEIPT_PATH, `${item.id} index receipt path drifted`);
    assert.equal(indexRef.pointer, INDEX_POINTER, `${item.id} index receipt pointer drifted`);
    assert.deepEqual(indexRef.reviewed_units, [item.indexUnit], `${item.id} index reviewed unit drifted`);
    const index = await readAdmission(indexRef);
    assert.equal(indexRef.sha256, digest(index), `${item.id} index admission digest is stale`);
    requireAcceptedAdmission(index, entry.review.reviewed_at, `${item.id} index`);
    requireIndexUnit(index, item, `${item.id} index`);

    assert.deepEqual(adapter.native_identity, {
      regulation: item.regulation,
      source_file: item.instrumentPath,
      source_heading: item.heading,
    }, `${item.id} native identity drifted`);
    assert.equal(adapter.category_id, item.category, `${item.id} category drifted`);
    assert.deepEqual(adapter.index_before, item.indexBefore, `${item.id} index before value drifted`);
    assert.deepEqual(adapter.index_after, item.indexAfter, `${item.id} index after value drifted`);
    assert.equal(adapter.native_obligation_before, item.category, `${item.id} native Obligation before drifted`);
    assert.equal(adapter.native_roles_before, 'provider, deployer', `${item.id} native Roles before drifted`);
    assert.equal(adapter.native_after, null, `${item.id} native after must be null`);
  }
}

export async function validateEveryAiLawSourceCategoryWithdrawal({ changes, records, entries, readAdmission }) {
  assert.ok(entries.length > 0, 'Source-category withdrawal adapter group is empty');
  assert.equal(entries.length, changes.length, 'Source-category withdrawal adapter entries must cover every grouped change');
  const groups = new Map();
  for (const entry of entries) {
    const adapter = entry.source_admission?.adapter;
    assert.equal(adapter?.name, EVERY_AI_LAW_SOURCE_CATEGORY_WITHDRAWAL, 'Unknown source-category withdrawal adapter');
    assert.ok(CASES.has(adapter.case_id), `Unknown source-category withdrawal case: ${adapter.case_id}`);
    if (!groups.has(adapter.case_id)) groups.set(adapter.case_id, []);
    groups.get(adapter.case_id).push(entry);
  }
  assert.equal(changes.length, groups.size * 4, 'Each present source-category withdrawal case must contribute exactly four changes');
  for (const [caseId, caseEntries] of groups) {
    await requireCase({
      item: CASES.get(caseId),
      changes: caseEntries.map(entry => entry.change),
      records,
      entries: caseEntries,
      readAdmission,
    });
  }
  return true;
}

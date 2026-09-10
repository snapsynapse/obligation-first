import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runAdopterAdmission } from './adopter-admission.mjs';
import { loadRecordDir } from './adopter-kit.mjs';

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

// New edges are admitted by the owner's source gate. A migration removes or
// retargets an already recorded edge, including retirement of its subject.
// v2 did not capture nested edges; it cannot establish their historical absence.
export function relationshipChanges(before, after) {
  const groups = fingerprint => {
    const result = new Map();
    for (const [kind, edges] of [['top', fingerprint.exact_edges || []], ['nested', fingerprint.nested_edges || []]]) {
      for (const [subject, predicate, target] of edges) {
        const key = JSON.stringify([kind, subject, predicate]);
        if (!result.has(key)) result.set(key, new Set());
        result.get(key).add(target);
      }
    }
    return new Map([...result].map(([key, targets]) => [key, [...targets].sort()]));
  };
  const oldGroups = groups(before), newGroups = groups(after);
  return [...oldGroups.keys()].sort().flatMap(key => {
    const oldTargets = oldGroups.get(key), newTargets = newGroups.get(key) || [];
    if (oldTargets.every(target => newTargets.includes(target))) return [];
    const [kind, subject, predicate] = JSON.parse(key);
    return [{ kind, subject, predicate, old_targets: oldTargets, new_targets: newTargets }];
  });
}

function realTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now() && date.toISOString().slice(0, 19) === value.slice(0, 19);
}
function pointer(value, location) {
  assert.ok(typeof location === 'string' && location.startsWith('/'), 'Source admission pointer missing');
  for (const encoded of location.slice(1).split('/')) {
    assert.ok(!/~(?![01])/u.test(encoded), 'Invalid JSON pointer escape');
    const key = encoded.replace(/~1/g, '/').replace(/~0/g, '~');
    assert.ok(value && Object.hasOwn(value, key), 'Source admission pointer does not resolve');
    value = value[key];
  }
  return value;
}
async function ownedFile(root, relative) {
  assert.ok(typeof relative === 'string' && relative && !path.isAbsolute(relative), 'Evidence path must be repository relative');
  const resolved = await realpath(path.resolve(root, relative));
  const owner = await realpath(root);
  assert.ok(resolved.startsWith(`${owner}${path.sep}`), 'Evidence path escapes owner repository');
  return resolved;
}

export async function validateMigrationReceipts({ root, changes, receipts, records = [] }) {
  assert.equal(receipts?.schema_version, 1, 'Migration receipt schema missing');
  assert.ok(Array.isArray(receipts.entries), 'Migration entries missing');
  for (const change of changes) {
    const matches = receipts.entries.filter(entry => equal(entry.change, change));
    assert.equal(matches.length, 1, `Exactly one current migration receipt required: ${change.subject} ${change.predicate}`);
    const entry = matches[0];
    assert.ok(typeof entry.reason === 'string' && entry.reason.trim(), 'Migration reason missing');
    assert.ok(entry.review?.decision === 'source-consistency-reviewed', 'Migration review is not accepted');
    assert.ok(['agent', 'human'].includes(entry.review.actor_type) && typeof entry.review.actor === 'string' && entry.review.actor.trim(), 'Migration reviewer declaration missing');
    assert.ok(realTime(entry.review.reviewed_at), 'Migration review date invalid or future');
    assert.equal(entry.review.packet_sha256, digest({ change: entry.change, reason: entry.reason, source_admission: entry.source_admission }), 'Migration review packet is stale');
    const ref = entry.source_admission;
    assert.equal(ref?.path, 'data/admission/receipts.json', 'Migration must reference the owner canonical admission inventory');
    assert.ok(typeof ref.pointer === 'string' && /^\/records\/[^/]+$/.test(ref.pointer), 'Migration must reference one admitted native record');
    const subject = records.find(record => record['@id'] === change.subject);
    assert.ok(subject, 'Migration subject must remain resolvable in the current projection');
    let nativeKey;
    if (subject.ai_incident_law_record_id) nativeKey = `included/${subject.ai_incident_law_record_id}`;
    else if (subject['eal:source_file']) nativeKey = subject['eal:source_file'];
    else if (subject['@type'] === 'of:Instrument' && subject['eal:id']) nativeKey = `data/instruments/${subject['eal:id']}.md`;
    assert.ok(nativeKey, 'Migration needs a supported owner-native identity mapping');
    assert.equal(ref.pointer, `/records/${nativeKey.replace(/~/g, '~0').replace(/\//g, '~1')}`, 'Source admission receipt belongs to another projected subject');
    const source = JSON.parse(await readFile(await ownedFile(root, ref?.path), 'utf8'));
    const admitted = pointer(source, ref.pointer);
    assert.equal(ref.sha256, digest(admitted), 'Source admission receipt digest is stale');
    assert.ok(['source-consistency-reviewed', 'source-consistency-reviewed-changes'].includes(admitted.review?.decision), 'Referenced source admission review is not accepted');
    assert.ok(realTime(admitted.review.reviewed_at), 'Source admission review time invalid');
    assert.ok(Date.parse(entry.review.reviewed_at) >= Date.parse(admitted.review.reviewed_at), 'Migration review predates source admission');
    assert.ok(Array.isArray(ref.reviewed_units) && ref.reviewed_units.length && new Set(ref.reviewed_units).size === ref.reviewed_units.length, 'Migration must name source-reviewed units');
    for (const unit of ref.reviewed_units) {
      assert.ok(Object.hasOwn(admitted.units || {}, unit), 'Migration refers to an unreviewed source unit');
      assert.ok(Array.isArray(admitted.units[unit].evidence) && admitted.units[unit].evidence.length, 'Source-reviewed unit lacks evidence');
    }
    // A review of unrelated prose cannot authorize a relationship rewrite.
    // Direct native relation fields bind both values to the owner's admitted
    // unit hashes. Derived/nested mappings need a separately validated adapter;
    // an arbitrary receipt declaration is deliberately insufficient for them.
    const names = change.predicate === 'anchors' ? ['anchors', 'obligation_first_anchors'] : [change.predicate];
    const allowed = names.flatMap(name => [`field:${name}`, `metadata:${name}`]);
    assert.ok(change.kind === 'top' && allowed.includes(ref.relationship_unit), 'Migration lacks a supported native relationship-unit binding');
    assert.ok(ref.reviewed_units.includes(ref.relationship_unit), 'Relationship unit is not among source-reviewed units');
    const unit = admitted.units[ref.relationship_unit];
    const targets = value => {
      if (value == null) return [];
      const values = Array.isArray(value) ? value : [value];
      assert.ok(values.every(item => typeof item === 'string'), 'Native relation values must be explicit string targets');
      return [...new Set(values)].sort();
    };
    assert.deepEqual(targets(ref.before_value), change.old_targets, 'Source unit does not bind the old relationship targets');
    assert.deepEqual(targets(ref.after_value), change.new_targets, 'Source unit does not bind the new relationship targets');
    assert.equal(unit.before_sha256, digest(ref.before_value), 'Old relationship values do not match the admitted source unit');
    const afterHash = ref.after_value === null && unit.after_sha256 === null ? null : digest(ref.after_value);
    assert.equal(unit.after_sha256, afterHash, 'New relationship values do not match the admitted source unit');
    assert.ok(Object.hasOwn(unit, 'candidate_content') && equal(unit.candidate_content, ref.after_value), 'Relationship binding differs from admitted candidate content');
  }
  return true;
}

// Read the committed comparison independently of the editable expected file.
// CI can provide its PR/push base through the same source-admission base input.
export async function checkRelationshipMigrations({ expectedPath, actual, prior, recordsDir }) {
  const directory = path.dirname(expectedPath);
  const git = args => spawnSync('git', ['-C', directory, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const repository = git(['rev-parse', '--show-toplevel']);
  let before = prior, root = directory;
  if (repository.status === 0) {
    root = await realpath(repository.stdout.trim());
    if (process.env.CI && process.env.CI !== 'false') {
      assert.ok(/^[a-f0-9]{40}$/i.test(process.env.SOURCE_ADMISSION_BASE || ''), 'CI requires an explicit full source-admission comparison commit');
    }
    const base = process.env.SOURCE_ADMISSION_BASE || 'HEAD';
    assert.ok(base === 'HEAD' || /^[a-f0-9]{40}$/i.test(base), 'Migration comparison base must be HEAD or a full commit');
    const resolved = git(['rev-parse', '--verify', `${base}^{commit}`]);
    assert.equal(resolved.status, 0, 'Migration comparison commit unavailable');
    if (process.env.SOURCE_ADMISSION_BASE) {
      // An explicit base equal to the commit under review compares a change with itself.
      const head = git(['rev-parse', '--verify', 'HEAD^{commit}']);
      assert.ok(head.status === 0 && head.stdout.trim() !== resolved.stdout.trim(),
        'Migration comparison commit equals the owner HEAD; supply the PR base or push-before commit, not the commit under review');
    }
    const canonicalExpected = path.join(await realpath(directory), path.basename(expectedPath));
    const relative = path.relative(root, canonicalExpected).split(path.sep).join('/');
    const committed = git(['show', `${resolved.stdout.trim()}:${relative}`]);
    assert.equal(committed.status, 0, 'Committed migration baseline unavailable');
    before = JSON.parse(committed.stdout);
  }
  if (!before) return { changes: 0, boundary: 'initial fingerprint; no prior relationship claim' };
  const changes = relationshipChanges(before, actual);
  if (!changes.length) return { changes: 0 };
  const migrationPath = path.join(directory, 'of-relationship-migrations.json');
  const receipts = JSON.parse(await readFile(migrationPath, 'utf8'));
  const records = (await loadRecordDir(recordsDir, { root: recordsDir })).map(entry => entry.record);
  await validateMigrationReceipts({ root, changes, receipts, records });
  const admission = runAdopterAdmission({ root });
  assert.ok(admission.passed, `Migration source admission failed: ${admission.errors.join('; ')}`);
  return { changes: changes.length };
}

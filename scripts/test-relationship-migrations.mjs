import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildAdopterFingerprint } from './lib/adopter-fingerprint.mjs';
import { relationshipChanges, validateMigrationReceipts, digest } from './lib/relationship-migrations.mjs';

const root = await mkdtemp(path.join(tmpdir(), 'of-migration-test-'));
const now = new Date().toISOString();
const before = { exact_edges: [['https://example.com/a', 'anchors', 'https://example.com/old']] };
const after = { exact_edges: [['https://example.com/a', 'anchors', 'https://example.com/new']] };
const changes = relationshipChanges(before, after);
const source = {
  units: {
    'field:anchors': { before_sha256: digest(['https://example.com/old']), after_sha256: digest(['https://example.com/new']), candidate_content: ['https://example.com/new'], evidence: ['primary'] },
    'metadata:title': { before_sha256: digest('Old title'), after_sha256: digest('New title'), candidate_content: 'New title', evidence: ['primary'] },
  },
  review: { decision: 'source-consistency-reviewed', reviewed_at: now },
};
const reference = { path: 'data/admission/receipts.json', pointer: '/records/included~1EXAMPLE', sha256: digest(source), reviewed_units: ['field:anchors'], relationship_unit: 'field:anchors', before_value: ['https://example.com/old'], after_value: ['https://example.com/new'] };
const packet = { change: changes[0], reason: 'Correct the mapped category against the retained synthetic source.', source_admission: reference };
const receipt = { ...packet, review: { actor_type: 'agent', actor: 'synthetic test reviewer', decision: 'source-consistency-reviewed', reviewed_at: now, packet_sha256: digest(packet) } };
const receipts = { schema_version: 1, entries: [receipt] };
const records = [{ '@id': 'https://example.com/a', ai_incident_law_record_id: 'EXAMPLE' }];
let cases = 0;
try {
  await mkdir(path.join(root, 'data/admission'), { recursive: true });
  await writeFile(path.join(root, reference.path), JSON.stringify({ records: { 'included/EXAMPLE': source, 'included/OTHER': source } }));
  await validateMigrationReceipts({ root, changes, records, receipts }); cases++;
  assert.deepEqual(relationshipChanges(before, { exact_edges: [...before.exact_edges].reverse() }), []); cases++;
  assert.deepEqual(relationshipChanges(before, { exact_edges: [...before.exact_edges, ['https://example.com/b', 'anchors', 'https://example.com/new']] }), []); cases++;
  assert.deepEqual(relationshipChanges(before, { exact_edges: [...before.exact_edges, ...after.exact_edges] }), []); cases++;
  assert.deepEqual(relationshipChanges(before, { exact_edges: [] })[0].new_targets, []); cases++;
  assert.equal(relationshipChanges({ ...before, nested_edges: [['https://example.com/a', '/remedy/obligation', 'https://example.com/old']] }, { ...before, nested_edges: [['https://example.com/a', '/remedy/obligation', 'https://example.com/new']] })[0].kind, 'nested'); cases++;
  assert.deepEqual(relationshipChanges(before, { ...before, nested_edges: [['https://example.com/a', '/remedy/obligation', 'https://example.com/new']] }), []); cases++;
  for (const mutate of [
    r => { r.entries = []; },
    r => { r.entries.push(structuredClone(r.entries[0])); },
    r => { r.entries[0].change.old_targets = ['https://example.com/wrong']; },
    r => { r.entries[0].change.new_targets = ['https://example.com/wrong']; },
    r => { r.entries[0].reason = ''; },
    r => { r.entries[0].review.decision = 'pending'; },
    r => { r.entries[0].review.reviewed_at = '2026-02-30T00:00:00Z'; },
    r => { r.entries[0].review.reviewed_at = '9999-01-01T00:00:00Z'; },
    r => { r.entries[0].review.reviewed_at = '2000-01-01T00:00:00Z'; },
    r => { r.entries[0].source_admission.sha256 = '0'.repeat(64); },
    r => { r.entries[0].source_admission.pointer = '/missing'; },
    r => { r.entries[0].source_admission.reviewed_units = ['missing']; },
    r => { r.entries[0].source_admission.path = '../outside.json'; },
  ]) {
    const bad = structuredClone(receipts); mutate(bad);
    await assert.rejects(validateMigrationReceipts({ root, changes, records, receipts: bad })); cases++;
  }
  // Source evidence and selected units must validate even if the migration
  // packet is recomputed after alteration.
  for (const mutate of [
    p => { p.source_admission.sha256 = '0'.repeat(64); },
    p => { p.source_admission.pointer = '/missing'; },
    p => { p.source_admission.pointer = '/records/included~1OTHER'; },
    p => { p.source_admission.reviewed_units = ['missing']; },
    p => { p.source_admission.reviewed_units = ['metadata:title']; p.source_admission.relationship_unit = 'metadata:title'; },
    p => { p.source_admission.before_value = ['https://example.com/unrelated']; },
    p => { p.source_admission.after_value = ['https://example.com/unrelated']; },
  ]) {
    const bad = structuredClone(receipts); mutate(bad.entries[0]);
    const { change, reason, source_admission } = bad.entries[0];
    bad.entries[0].review.packet_sha256 = digest({ change, reason, source_admission });
    await assert.rejects(validateMigrationReceipts({ root, changes, records, receipts: bad })); cases++;
  }

  // A real committed baseline prevents manually rewriting expected.json from
  // bypassing admission; --write is held to the same review boundary.
  const git = args => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  const recordsDir = path.join(root, 'records'), profilePath = path.join(root, 'profile.json');
  await mkdir(recordsDir);
  const native = { ai_incident_law_record_id: 'EXAMPLE', '@id': 'https://example.com/a', '@type': 'of:Determination', anchors: ['https://example.com/old'] };
  await writeFile(path.join(recordsDir, 'a.json'), JSON.stringify(native));
  await writeFile(profilePath, JSON.stringify({ adopter: 'synthetic', entities: {} }));
  const expectedPath = path.join(root, 'expected.json');
  await writeFile(expectedPath, JSON.stringify(await buildAdopterFingerprint({ recordsDir, profilePath })));
  const report = { status: 'passed', errors: [], limits: 'Synthetic mechanical fixture only.', total_records: 1, legacy_unreviewed_records: 0, records_with_reviewed_changes: 1, changed_units_reviewed: 1 };
  await writeFile(path.join(root, 'gate.cjs'), `process.stdout.write(${JSON.stringify(JSON.stringify(report))});`);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { 'check:admission': 'node gate.cjs' } }));
  git(['init', '-q']); git(['add', 'expected.json']);
  git(['-c', 'user.name=Synthetic Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Synthetic baseline']);
  const base = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  await writeFile(path.join(recordsDir, 'a.json'), JSON.stringify({ ...native, anchors: ['https://example.com/new'] }));
  const checker = path.resolve('scripts/check-adopter-fingerprint.mjs');
  const check = (flags, env = {}) => spawnSync(process.execPath, [checker, '--records', recordsDir, '--profile', profilePath, '--expected', expectedPath, ...flags], { encoding: 'utf8', env: { ...process.env, CI: 'false', SOURCE_ADMISSION_BASE: base, ...env } });
  for (const flags of [[], ['--write']]) {
    const result = check(flags); assert.equal(result.status, 1); assert.match(result.stderr, /OF-RELATIONSHIP-MIGRATION/); cases++;
  }
  await writeFile(expectedPath, JSON.stringify(await buildAdopterFingerprint({ recordsDir, profilePath })));
  assert.equal(check([]).status, 1, 'Manual baseline refresh must not bypass migration review'); cases++;
  git(['add', 'expected.json', 'records/a.json']);
  git(['-c', 'user.name=Synthetic Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Attempt committed baseline bypass']);
  let omittedBase = check([], { CI: 'true', SOURCE_ADMISSION_BASE: '' });
  assert.equal(omittedBase.status, 1); assert.match(omittedBase.stderr, /CI requires an explicit/); cases++;
  assert.equal(check([], { CI: 'true' }).status, 1, 'CI base still detects the committed rewrite'); cases++;
  // The comparison base is an exact full committed SHA. Abbreviated SHAs,
  // symbolic refs and revision expressions fail closed in both modes; CI also
  // rejects the local HEAD default and an unset value. A well-formed SHA that
  // the owner history does not contain fails closed before any comparison.
  for (const malformed of [base.slice(0, 7), base.slice(0, 12), 'main', 'HEAD~1', 'refs/heads/main', `${base}~1`]) {
    let rejected = check([], { SOURCE_ADMISSION_BASE: malformed });
    assert.equal(rejected.status, 1, malformed); assert.match(rejected.stderr, /must be HEAD or a full commit/); cases++;
    rejected = check([], { CI: 'true', SOURCE_ADMISSION_BASE: malformed });
    assert.equal(rejected.status, 1, malformed); assert.match(rejected.stderr, /CI requires an explicit/); cases++;
  }
  for (const env of [{ CI: 'true', SOURCE_ADMISSION_BASE: 'HEAD' }, { CI: 'true', SOURCE_ADMISSION_BASE: undefined }]) {
    const rejected = check([], env); assert.equal(rejected.status, 1); assert.match(rejected.stderr, /CI requires an explicit/); cases++;
  }
  for (const env of [{ SOURCE_ADMISSION_BASE: 'deadbeef'.repeat(5) }, { CI: 'true', SOURCE_ADMISSION_BASE: 'deadbeef'.repeat(5) }]) {
    const rejected = check([], env); assert.equal(rejected.status, 1); assert.match(rejected.stderr, /comparison commit unavailable/); cases++;
  }
  // An explicit base equal to the commit under review compares the rewrite
  // with itself and would erase the review requirement; it fails closed even
  // though HEAD's SHA is well formed and present.
  const selfBase = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  for (const env of [{ SOURCE_ADMISSION_BASE: selfBase }, { CI: 'true', SOURCE_ADMISSION_BASE: selfBase }]) {
    const rejected = check([], env); assert.equal(rejected.status, 1, 'self-comparison'); assert.match(rejected.stderr, /equals the owner HEAD/); cases++;
  }
  await writeFile(path.join(root, 'of-relationship-migrations.json'), JSON.stringify(receipts));
  let result = check([]); assert.equal(result.status, 0, result.stderr); cases++;
  result = check(['--write']); assert.equal(result.status, 0, result.stderr); cases++;
  await writeFile(path.join(root, 'gate.cjs'), 'process.exit(1);');
  result = check([]); assert.equal(result.status, 1); assert.match(result.stderr, /source admission failed/); cases++;
  assert.ok((await readFile(expectedPath, 'utf8')).includes('https://example.com/new'));
} finally { await rm(root, { recursive: true, force: true }); }
console.log(`Relationship migration checks passed (${cases} cases; committed baseline, exact transition, receipt and owner admission).`);

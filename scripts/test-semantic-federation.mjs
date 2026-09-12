import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildAdopterFingerprint, RELATION_FIELDS } from './lib/adopter-fingerprint.mjs';
import { entityConflicts, entityAgreement } from './check-entity-agreement.mjs';
const dir = await mkdtemp(path.join(tmpdir(), 'of-semantic-test-'));
try {
  const recordsDir = path.join(dir, 'records');
  await mkdir(recordsDir);
  const profilePath = path.join(dir, 'profile.json');
  await writeFile(profilePath, JSON.stringify({ adopter: 'synthetic', entities: {} }));
  const record = { '@id': 'https://example.com/a', '@type': 'of:Determination', anchors: ['https://example.com/category/a'], verified: '2026-09-01' };
  const file = path.join(recordsDir, 'a.json');
  await writeFile(file, JSON.stringify(record));
  const before = await buildAdopterFingerprint({ recordsDir, profilePath });
  await writeFile(file, JSON.stringify({ ...record, anchors: ['https://example.com/category/b'] }));
  const after = await buildAdopterFingerprint({ recordsDir, profilePath });
  assert.notEqual(before.exact_edges_sha256, after.exact_edges_sha256, 'same-host retarget must change fingerprint');
  assert.equal(after.fingerprint_version, 3);
  for (const field of RELATION_FIELDS) {
    await writeFile(file, JSON.stringify({ ...record, [field]: ['https://example.com/target/a'] }));
    const original = await buildAdopterFingerprint({ recordsDir, profilePath });
    await writeFile(file, JSON.stringify({ ...record, [field]: ['https://example.com/target/b'] }));
    const retargeted = await buildAdopterFingerprint({ recordsDir, profilePath });
    assert.notEqual(original.exact_edges_sha256, retargeted.exact_edges_sha256, `${field} retarget must change fingerprint`);
  }
  for (const field of ['source', 'source_locator', 'source_citation', 'source_version', 'evidence_type', 'asserted_by_adopter', 'projection_basis', 'admission_status', 'source_review_conflicts', 'source_review_unresolved', 'pub:source_review_state', 'pub:source_review_unresolved', 'pub:evidence_inputs', 'eal:source_review_record', 'eal:source_record_sha256', 'eal:source_review_receipt_sha256', 'eal:source_review_evidence', 'canonical_source_conflicted']) {
    await writeFile(file, JSON.stringify({ ...record, [field]: 'original' }));
    const original = await buildAdopterFingerprint({ recordsDir, profilePath });
    await writeFile(file, JSON.stringify({ ...record, [field]: 'changed' }));
    const changed = await buildAdopterFingerprint({ recordsDir, profilePath });
    assert.notDeepEqual(original.provenance_claims, changed.provenance_claims, `${field} claim must be retained exactly`);
    if (field === 'canonical_source_conflicted') for (const value of ['', undefined]) {
      await writeFile(file, JSON.stringify({ ...record, [field]: value }));
      const cleared = await buildAdopterFingerprint({ recordsDir, profilePath });
      assert.notDeepEqual(original.provenance_claims, cleared.provenance_claims, 'Canonical material description cannot be cleared silently');
    }
  }
  const expected = path.join(dir, 'expected.json');
  await writeFile(expected, JSON.stringify(before));
  await writeFile(file, JSON.stringify({ ...record, verified: '2000-01-01' }));
  for (const flags of [[], ['--write']]) {
    const result = spawnSync(process.execPath, ['scripts/check-adopter-fingerprint.mjs', '--records', recordsDir, '--profile', profilePath, '--expected', expected, ...flags], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /OF-PROVENANCE-REGRESSION/);
  }
  await writeFile(file, JSON.stringify({ ...record, verified: undefined }));
  const removed = spawnSync(process.execPath, ['scripts/check-adopter-fingerprint.mjs', '--records', recordsDir, '--profile', profilePath, '--expected', expected, '--write'], { encoding: 'utf8' });
  assert.equal(removed.status, 1);
  assert.match(removed.stderr, /OF-PROVENANCE-REGRESSION/);
  const a = { '@id': 'https://example.com/a', '@type': 'of:Instrument', lifecycle_status: 'repealed', describesSameEntityAs: ['https://example.com/b'] };
  const b = { '@id': 'https://example.com/b', '@type': 'of:Instrument', lifecycle_status: 'superseded' };
  assert.match(entityConflicts([a, b])[0], /OF-ENTITY-CONFLICT/);
  assert.deepEqual(entityConflicts([a, { ...b, lifecycle_status: 'repealed' }]), []);
  assert.deepEqual(entityConflicts([a, { ...b, lifecycle_status: 'unknown' }]), [], 'unknown is not a conflicting assertion');
  assert.deepEqual(entityConflicts([a, { ...b, lifecycle_status: undefined }]), [], 'missing remains unknown');
  assert.equal(entityConflicts([{ ...a, describesSameEntityAs: undefined }, b]).length, 0, 'correspondence must not be inferred');
  const matching = { ...b, lifecycle_status: 'repealed' };
  const requiredPairs = [{ source: a['@id'], target: b['@id'], fields: ['lifecycle_status'] }];
  const coverage = entityAgreement([a, matching], { requiredPairs });
  assert.deepEqual(coverage.counts, {
    declared_links: 1, resolved_pairs: 1, compared_pairs: 1, compared_fields: 1,
    unknown_fields: 3, unresolved_targets: 0, required_pairs: 1,
  });
  assert.deepEqual(coverage.requirement_errors, []);
  assert.equal(coverage.pairs[0].compared_fields[0].equal, true);
  assert.equal(entityAgreement([a, { ...matching, describesSameEntityAs: [a['@id']] }]).counts.compared_pairs, 1, 'reciprocal declarations compare the pair only once');
  const unknownCoverage = entityAgreement([a, { ...matching, lifecycle_status: 'unknown' }], { requiredPairs });
  assert.equal(unknownCoverage.counts.compared_pairs, 0);
  assert.equal(unknownCoverage.counts.compared_fields, 0);
  assert.equal(unknownCoverage.counts.unknown_fields, 4);
  assert.deepEqual(unknownCoverage.conflicts, [], 'unknown must not be called a conflict or equality');
  assert.match(unknownCoverage.requirement_errors[0], /OF-ENTITY-REQUIRED-FIELD/);
  const uncertaintyRequirement = [{ ...requiredPairs[0], expected_unknown_fields: ['operative_status'], unknown_reason: 'The retained conditional court order does not establish current statutory operation.' }];
  const uncertainA = { ...a, operative_status: 'unknown' };
  const uncertainB = { ...matching, operative_status: 'unknown' };
  const uncertainty = entityAgreement([uncertainA, uncertainB], { requiredPairs: uncertaintyRequirement });
  assert.deepEqual(uncertainty.requirement_errors, []);
  assert.equal(uncertainty.counts.compared_fields, 1, 'Unknown operation is not an agreement comparison');
  assert.equal(uncertainty.expected_unknown_checks[0].status, 'explicit-unknown-retained');
  for (const value of [undefined, null, 'inactive', 'operative']) {
    const failed = entityAgreement([uncertainA, { ...uncertainB, operative_status: value }], { requiredPairs: uncertaintyRequirement });
    assert.match(failed.requirement_errors.join('\n'), /OF-ENTITY-EXPECTED-UNKNOWN/);
  }
  assert.match(entityAgreement([{ ...uncertainA, operative_status: 'inactive' }, { ...uncertainB, operative_status: 'inactive' }], { requiredPairs: uncertaintyRequirement }).requirement_errors.join('\n'), /OF-ENTITY-EXPECTED-UNKNOWN/, 'Matching unsupported certainty is still rejected');
  const bothUnknown = [{ ...uncertaintyRequirement[0], expected_unknown_fields: ['operative_status', 'enforcement_status'] }];
  const enforcedA = { ...uncertainA, enforcement_status: 'unknown' };
  const enforcedB = { ...uncertainB, enforcement_status: 'unknown' };
  assert.deepEqual(entityAgreement([enforcedA, enforcedB], { requiredPairs: bothUnknown }).requirement_errors, []);
  for (const value of [undefined, null, 'not-enforceable', 'constrained', 'enforceable']) {
    assert.match(entityAgreement([enforcedA, { ...enforcedB, enforcement_status: value }], { requiredPairs: bothUnknown }).requirement_errors.join('\n'), /OF-ENTITY-EXPECTED-UNKNOWN/);
  }
  for (const alteration of [{ unknown_reason: '' }, { fields: ['lifecycle_status', 'operative_status'] }, { expected_unknown_fields: ['effective'] }]) {
    assert.throws(() => entityAgreement([uncertainA, uncertainB], { requiredPairs: [{ ...uncertaintyRequirement[0], ...alteration }] }), /OF-ENTITY-REQUIRED-CONFIG/);
  }
  const external = entityAgreement([{ ...a, describesSameEntityAs: ['https://example.org/external'] }]);
  assert.equal(external.counts.unresolved_targets, 1);
  assert.equal(external.counts.compared_pairs, 0);
  assert.deepEqual(external.requirement_errors, [], 'non-required external targets are reported, not rejected');

  // Required-pair CLI gates must fail when agreement would otherwise be vacuous.
  const requiredPath = path.join(dir, 'required-pairs.json');
  await writeFile(requiredPath, JSON.stringify({ schema_version: 1, pairs: requiredPairs }));
  const otherFile = path.join(recordsDir, 'b.json');
  const checkAgreement = () => spawnSync(process.execPath, [
    'scripts/check-entity-agreement.mjs', '--required', requiredPath, recordsDir,
  ], { encoding: 'utf8' });
  await writeFile(file, JSON.stringify(a));
  await writeFile(otherFile, JSON.stringify(matching));
  assert.equal(checkAgreement().status, 0);
  for (const [mutation, code] of [
    [{ ...matching, '@id': 'https://example.com/moved' }, 'OF-ENTITY-REQUIRED-TARGET'],
    [{ ...matching, '@type': 'of:Term' }, 'OF-ENTITY-REQUIRED-PAIR'],
    [{ ...matching, lifecycle_status: 'unknown' }, 'OF-ENTITY-REQUIRED-FIELD'],
    [{ ...matching, lifecycle_status: undefined }, 'OF-ENTITY-REQUIRED-FIELD'],
  ]) {
    await writeFile(otherFile, JSON.stringify(mutation));
    const result = checkAgreement();
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(code));
  }
  await writeFile(otherFile, JSON.stringify(matching));
  await writeFile(file, JSON.stringify({ ...a, describesSameEntityAs: undefined }));
  const noDeclaration = checkAgreement();
  assert.equal(noDeclaration.status, 1);
  assert.match(noDeclaration.stderr, /OF-ENTITY-REQUIRED-PAIR/);
  await writeFile(requiredPath, JSON.stringify({ schema_version: 1, pairs: [] }));
  const emptyRequirements = checkAgreement();
  assert.equal(emptyRequirements.status, 1);
  assert.match(emptyRequirements.stderr, /OF-ENTITY-REQUIRED-CONFIG/);
  // Exercise real temporary-build comparison on a licensed synthetic source fixture.
  const fixture = path.join(dir, 'fixture');
  await mkdir(path.join(fixture, 'projection'), { recursive: true });
  await writeFile(path.join(fixture, 'source.json'), '{"effective":"2027-01-01"}');
  await writeFile(path.join(fixture, 'projection/record.json'), '{"effective":"2027-01-01"}');
  await writeFile(path.join(fixture, 'build.cjs'), "require('fs').copyFileSync('source.json', 'projection/record.json')");
  assert.equal(spawnSync('git', ['init', '-q', fixture]).status, 0);
  const fixtureGit = args => {
    const result = spawnSync('git', ['-C', fixture, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  fixtureGit(['add', 'source.json']);
  fixtureGit(['-c', 'user.name=Synthetic Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'Pin synthetic source']);
  const pinnedRevision = fixtureGit(['rev-parse', 'HEAD']);
  const originalIndex = await readFile(path.join(fixture, '.git/index'));
  const originalRefs = fixtureGit(['show-ref']);
  await writeFile(path.join(fixture, 'build.cjs'), `
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
assert.equal(cp.execFileSync('git', ['show', '${pinnedRevision}:source.json'], {encoding:'utf8'}), '{"effective":"2027-01-01"}');
assert.ok(!fs.existsSync('projection/record.json'));
cp.execFileSync('git', ['update-ref', 'refs/heads/temporary-build', '${pinnedRevision}']);
cp.execFileSync('git', ['add', 'source.json']);
fs.copyFileSync('source.json', 'projection/record.json');
`);
  const { checkProjection } = await import('./check-projection-freshness.mjs');
  await checkProjection(fixture, 'projection', 'build.cjs');
  assert.deepEqual(await readFile(path.join(fixture, '.git/index')), originalIndex);
  assert.equal(fixtureGit(['show-ref']), originalRefs);
  const linkedChecker = path.join(dir, 'linked-checker.mjs');
  await symlink(fileURLToPath(new URL('./check-projection-freshness.mjs', import.meta.url)), linkedChecker);
  for (const flags of [[], ['--preserve-symlinks-main']]) {
    const linkedResult = spawnSync(process.execPath, [...flags, linkedChecker, fixture, 'projection', 'build.cjs'], { encoding: 'utf8' });
    assert.equal(linkedResult.status, 0, linkedResult.stderr);
    assert.match(linkedResult.stdout, /Source projection fresh:/);
  }
  await writeFile(path.join(fixture, 'source.json'), '{"effective":"2027-01-02"}');
  await assert.rejects(checkProjection(fixture, 'projection', 'build.cjs'), /OF-PROJECTION-STALE/);
  await writeFile(path.join(fixture, 'source.json'), '{"effective":"2027-01-01"}');
  await writeFile(path.join(fixture, 'projection/orphan.json'), '{}');
  await assert.rejects(checkProjection(fixture, 'projection', 'build.cjs'), /OF-PROJECTION-STALE/);
  await writeFile(path.join(fixture, 'build.cjs'), '// no output');
  await assert.rejects(checkProjection(fixture, 'projection', 'build.cjs'), /OF-FRESHNESS-BUILD/);
  console.log('Semantic federation retarget, provenance, entity-conflict, required-comparison coverage, and stale-source mutations rejected.');
} finally { await rm(dir, { recursive: true, force: true }); }

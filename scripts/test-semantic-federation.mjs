import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
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
  assert.equal(after.fingerprint_version, 2);
  for (const field of RELATION_FIELDS) {
    await writeFile(file, JSON.stringify({ ...record, [field]: ['https://example.com/target/a'] }));
    const original = await buildAdopterFingerprint({ recordsDir, profilePath });
    await writeFile(file, JSON.stringify({ ...record, [field]: ['https://example.com/target/b'] }));
    const retargeted = await buildAdopterFingerprint({ recordsDir, profilePath });
    assert.notEqual(original.exact_edges_sha256, retargeted.exact_edges_sha256, `${field} retarget must change fingerprint`);
  }
  for (const field of ['source', 'source_locator', 'source_citation', 'source_version', 'evidence_type', 'asserted_by_adopter']) {
    await writeFile(file, JSON.stringify({ ...record, [field]: 'original' }));
    const original = await buildAdopterFingerprint({ recordsDir, profilePath });
    await writeFile(file, JSON.stringify({ ...record, [field]: 'changed' }));
    const changed = await buildAdopterFingerprint({ recordsDir, profilePath });
    assert.notDeepEqual(original.provenance_claims, changed.provenance_claims, `${field} claim must be retained exactly`);
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
  const { checkProjection } = await import('./check-projection-freshness.mjs');
  await checkProjection(fixture, 'projection', 'build.cjs');
  await writeFile(path.join(fixture, 'source.json'), '{"effective":"2027-01-02"}');
  await assert.rejects(checkProjection(fixture, 'projection', 'build.cjs'), /OF-PROJECTION-STALE/);
  await writeFile(path.join(fixture, 'source.json'), '{"effective":"2027-01-01"}');
  await writeFile(path.join(fixture, 'projection/orphan.json'), '{}');
  await assert.rejects(checkProjection(fixture, 'projection', 'build.cjs'), /OF-PROJECTION-STALE/);
  await writeFile(path.join(fixture, 'build.cjs'), '// no output');
  await assert.rejects(checkProjection(fixture, 'projection', 'build.cjs'), /OF-FRESHNESS-BUILD/);
  console.log('Semantic federation retarget, provenance, entity-conflict, required-comparison coverage, and stale-source mutations rejected.');
} finally { await rm(dir, { recursive: true, force: true }); }

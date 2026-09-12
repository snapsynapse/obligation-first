import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveAdmissionBase, validateAdmissionBase } from './lib/admission-base.mjs';
import { checkRelationshipMigrations } from './lib/relationship-migrations.mjs';

const temporary = mkdtempSync(path.join(os.tmpdir(), 'of-admission-base-'));
const git = (...args) => execFileSync('git', ['-C', temporary, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
try {
  git('init'); git('config', 'user.email', 'test@example.com'); git('config', 'user.name', 'Synthetic test');
  const expectedPath = path.join(temporary, 'fingerprint.json');
  const fingerprint = { exact_edges: [], nested_edges: [] };
  writeFileSync(expectedPath, JSON.stringify(fingerprint)); git('add', 'fingerprint.json');
  const commit = value => {
    writeFileSync(path.join(temporary, 'fixture'), value); git('add', 'fixture');
    git('-c', 'commit.gpgsign=false', 'commit', '-m', value); return git('rev-parse', 'HEAD');
  };
  const base = commit('before'), head = commit('after');
  for (const [eventName, event] of [
    ['pull_request', { pull_request: { base: { sha: base } } }],
    ['push', { before: base }], ['workflow_dispatch', { inputs: { comparison_base: base } }],
    ['schedule', {}], ['repository_dispatch', { client_payload: { comparison_base: head } }],
  ]) assert.equal(resolveAdmissionBase(temporary, { eventName, event }), base);
  assert.equal(resolveAdmissionBase(temporary, { eventName: 'pull_request', event: { pull_request: { base: { sha: 'f'.repeat(40) } } }, sibling: true }), base);
  for (const bad of [head, base.slice(0, 8), 'HEAD', '0'.repeat(40), 'f'.repeat(40)]) {
    assert.throws(() => validateAdmissionBase(temporary, bad));
    assert.throws(() => resolveAdmissionBase(temporary, { eventName: 'workflow_dispatch', event: { inputs: { comparison_base: bad } } }));
  }
  assert.throws(() => resolveAdmissionBase(temporary, { eventName: 'workflow_dispatch' }));
  assert.throws(() => resolveAdmissionBase(temporary, { eventName: 'push' }));
  git('checkout', '-b', 'unrelated', base); const divergent = commit('other'); git('checkout', '--detach', head);
  assert.throws(() => validateAdmissionBase(temporary, divergent));
  const originalBase = process.env.SOURCE_ADMISSION_BASE;
  try {
    process.env.SOURCE_ADMISSION_BASE = divergent;
    await assert.rejects(checkRelationshipMigrations({ expectedPath, actual: fingerprint, recordsDir: temporary }), /ancestor/);
  } finally {
    if (originalBase === undefined) delete process.env.SOURCE_ADMISSION_BASE;
    else process.env.SOURCE_ADMISSION_BASE = originalBase;
  }
  const mixed = spawnSync(process.execPath, [path.resolve('scripts/verify-federation.mjs')], {
    encoding: 'utf8', env: { ...process.env, CI: 'false', SOURCE_ADMISSION_BASE: base, OF_ADMISSION_BASES: '' },
  });
  assert.notEqual(mixed.status, 0);
  assert.match(mixed.stderr, /single-owner SOURCE_ADMISSION_BASE/);
  console.log('Admission base regressions passed: PR, push, explicit manual, scheduled owner transitions, sibling isolation, missing/self/unavailable/divergent bases.');
} finally { rmSync(temporary, { recursive: true, force: true }); }

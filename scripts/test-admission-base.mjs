import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveAdmissionBase, validateAdmissionBase } from './lib/admission-base.mjs';

const temporary = mkdtempSync(path.join(os.tmpdir(), 'of-admission-base-'));
const git = (...args) => execFileSync('git', ['-C', temporary, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
try {
  git('init'); git('config', 'user.email', 'test@example.com'); git('config', 'user.name', 'Synthetic test');
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
  console.log('Admission base regressions passed: PR, push, explicit manual, scheduled owner transitions, sibling isolation, missing/self/unavailable/divergent bases.');
} finally { rmSync(temporary, { recursive: true, force: true }); }

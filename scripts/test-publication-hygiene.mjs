import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { isHandoffPath, publicationHygiene } from './check-publication-hygiene.mjs';
for (const file of ['handoffs/next.md', 'reference/handoffs/README.md', 'HANDOFF.md', 'design/SESSION-HANDOFF-18.md', 'ops/release_handoff.txt']) assert(isHandoffPath(file), file);
for (const file of ['reference/release-preparation-v0.6.6.json', 'scripts/test-publication-hygiene.mjs', 'docs/index.html']) assert(!isHandoffPath(file), file);
const root = mkdtempSync(path.join(os.tmpdir(), 'of-publication-hygiene-'));
try {
  mkdirSync(path.join(root, 'handoffs'));
  writeFileSync(path.join(root, 'handoffs', 'next.md'), 'temporary queue');
  assert.deepEqual(publicationHygiene(root), ['handoffs/next.md'], 'source archive must reject handoffs');
  assert.throws(() => publicationHygiene(root, { staged: true }), /requires.*Git index/);
  const git = args => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
  git(['init', '--quiet']);
  writeFileSync(path.join(root, '.gitignore'), 'handoffs/\n');
  assert.deepEqual(publicationHygiene(root), [], 'ignored local queue must stay local');
  git(['add', '--force', 'handoffs/next.md']);
  assert.deepEqual(publicationHygiene(root), ['handoffs/next.md'], 'tracked ignored handoff must fail');
  rmSync(path.join(root, 'handoffs', 'next.md'));
  assert.deepEqual(publicationHygiene(root), [], 'candidate deletion removes the handoff');
  assert.deepEqual(publicationHygiene(root, { staged: true }), ['handoffs/next.md'], 'unstaged deletion must not clear actual commit index');
  git(['add', '-u', '--', 'handoffs/next.md']);
  assert.deepEqual(publicationHygiene(root, { staged: true }), []);
} finally { rmSync(root, { recursive: true, force: true }); }
console.log('Publication hygiene regressions passed (source archives, ignored queues, tracked handoffs, staged vs unstaged deletion).');

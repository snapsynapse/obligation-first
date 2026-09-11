import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

export const ADMISSION_OWNERS = ['every-ai-law', 'publedge', 'ai-incident-law'];
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export function validateAdmissionBase(root, base) {
  assert.match(base || '', /^[a-f0-9]{40}$/, 'Admission comparison requires a full lowercase commit SHA');
  assert.equal(git(root, 'rev-parse', '--verify', `${base}^{commit}`), base, 'Admission comparison commit unavailable');
  assert.notEqual(base, git(root, 'rev-parse', 'HEAD'), 'Admission comparison must not equal owner HEAD');
  git(root, 'merge-base', '--is-ancestor', base, 'HEAD');
  return base;
}

export function resolveAdmissionBase(root, { eventName, event = {}, sibling = false } = {}) {
  let base;
  if (sibling || ['schedule', 'repository_dispatch'].includes(eventName)) {
    // A moving-main observation replays that owner's latest committed transition.
    // It does not claim review of all history, or use another owner's event SHA.
    base = git(root, 'rev-parse', 'HEAD^1');
  } else if (eventName === 'pull_request') base = event.pull_request?.base?.sha;
  else if (eventName === 'push') base = event.before;
  else if (eventName === 'workflow_dispatch') base = event.inputs?.comparison_base;
  else throw new Error(`Unsupported admission comparison event: ${eventName}`);
  return validateAdmissionBase(root, base);
}

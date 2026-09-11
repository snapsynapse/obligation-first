#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ADMISSION_OWNERS, resolveAdmissionBase } from './lib/admission-base.mjs';

try {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--github-env') options.githubEnv = true;
    else if (['--root', '--federation-root', '--output'].includes(key) && args[i + 1] && !args[i + 1].startsWith('--')) options[key.slice(2)] = args[++i];
    else throw new Error(`Unknown or incomplete option: ${key}`);
  }
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const eventName = process.env.GITHUB_EVENT_NAME;
  if (options['federation-root']) {
    if (!options.output || options.githubEnv || options.root) throw new Error('Federation mode requires --output only');
    const bases = Object.fromEntries(ADMISSION_OWNERS.map(owner => [owner,
      resolveAdmissionBase(path.join(options['federation-root'], owner), { eventName, event, sibling: owner !== 'every-ai-law' })]));
    writeFileSync(options.output, JSON.stringify(bases, null, 2) + '\n');
    console.log(JSON.stringify(bases));
  } else {
    const base = resolveAdmissionBase(options.root || '.', { eventName, event });
    if (options.githubEnv) {
      if (!process.env.GITHUB_ENV) throw new Error('GITHUB_ENV unavailable');
      appendFileSync(process.env.GITHUB_ENV, `SOURCE_ADMISSION_BASE=${base}\n`);
    }
    console.log(base);
  }
} catch (error) { console.error(`OF-ADMISSION-BASE: ${error.message}`); process.exitCode = 1; }

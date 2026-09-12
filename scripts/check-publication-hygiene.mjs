#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function isHandoffPath(file) {
  const parts = file.replaceAll('\\', '/').split('/');
  if (parts.slice(0, -1).some(part => /^handoffs?$/i.test(part))) return true;
  const name = parts.at(-1);
  return /\.(?:md|txt|html|json|ya?ml)$/i.test(name) && /(?:^|[._ -])handoffs?(?:[._ -]|$)/i.test(name);
}

export function publicationHygiene(root, { staged = false } = {}) {
  const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  let isCheckout = false;
  try { isCheckout = realpathSync(git(['rev-parse', '--show-toplevel']).trim()) === realpathSync(root); } catch { /* Source archives have no Git. */ }
  let files;
  if (isCheckout) {
    files = git(staged ? ['ls-files', '--cached', '-z'] : ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
    if (!staged) files = files.filter(file => existsSync(path.join(root, file)));
  } else {
    if (staged) throw new Error('Staged publication hygiene requires this repository Git index.');
    files = [];
    const walk = (dir, prefix = '') => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (['.git', 'node_modules'].includes(entry.name)) continue;
        const rel = prefix + entry.name;
        if (entry.isDirectory()) walk(path.join(dir, entry.name), rel + '/');
        else files.push(rel);
      }
    };
    walk(root);
  }
  return [...new Set(files.filter(isHandoffPath))].sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--staged')) throw new Error('Usage: node scripts/check-publication-hygiene.mjs [--staged]');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const failures = publicationHygiene(root, { staged: args.includes('--staged') });
  if (failures.length) {
    console.error(`Temporary handoffs must not be committed or distributed:\n${failures.map(file => `- ${file}`).join('\n')}`);
    process.exitCode = 1;
  } else console.log(`Publication hygiene passed (${args.includes('--staged') ? 'Git index' : 'candidate source'}): no handoff files.`);
}

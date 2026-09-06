#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { loadRecordDir } from './lib/adopter-kit.mjs';
import { checkScopeBaseline, makeScopeBaseline, scopeBaselineJson } from './lib/scope-contract.mjs';

const options = {};
try {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--write') { options.write = true; continue; }
    const name = { '--records': 'records', '--profile': 'profile', '--inventory': 'inventory', '--baseline': 'baseline' }[args[i]];
    if (!name || !args[i + 1] || options[name]) throw new Error(`unknown/duplicate/incomplete argument ${args[i]}`);
    options[name] = args[++i];
  }
  if (!['records', 'profile', 'inventory', 'baseline'].every(name => options[name])) throw new Error('required: --records DIR --profile FILE --inventory FILE --baseline FILE [--write]');
  const read = async file => JSON.parse(await readFile(file, 'utf8'));
  const records = (await loadRecordDir(options.records)).map(entry => entry.record);
  const profile = await read(options.profile);
  const inventory = await read(options.inventory);
  if (options.write) {
    const baseline = makeScopeBaseline(records, profile, inventory);
    // Initial capture only. Updating reviewed evidence is an explicit diff,
    // never a routine check that teaches itself the current projection.
    await writeFile(options.baseline, scopeBaselineJson(baseline), { flag: 'wx' });
    console.log(`Created initial scope baseline: ${options.baseline}`);
  } else {
    const result = checkScopeBaseline(records, profile, inventory, await read(options.baseline));
    for (const error of result.errors) console.error(`${error.code}: ${error.message}`);
    const states = {};
    for (const item of result.observations) {
      const state = `${item.kind}/${item.recognition}/${item.coverage}`;
      states[state] = (states[state] || 0) + 1;
    }
    console.log(JSON.stringify({ owner: inventory.owner, claims: result.claims.length, observations: states }));
    if (result.errors.length) process.exitCode = 1;
  }
} catch (error) {
  console.error(`OF-SCOPE-INPUT: ${error.message}`);
  process.exitCode = 2;
}

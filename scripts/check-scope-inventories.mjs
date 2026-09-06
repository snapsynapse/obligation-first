#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { compareScopeInventories } from './lib/scope-contract.mjs';
try {
  if (process.argv.length < 4) throw new Error('provide at least two inventory files');
  const inventories = await Promise.all(process.argv.slice(2).map(async file => JSON.parse(await readFile(file, 'utf8'))));
  const errors = compareScopeInventories(inventories);
  for (const error of errors) console.error(`${error.code}: ${error.message}`);
  if (errors.length) process.exitCode = 1;
  else console.log(`Scope inventory compatibility passed for ${inventories.length} declarations. Coverage remains owner-specific; missing parent evidence is not agreement.`);
} catch (error) {
  console.error(`OF-SCOPE-INPUT: ${error.message}`);
  process.exitCode = 2;
}

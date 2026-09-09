#!/usr/bin/env node
import path from 'node:path';
import { runAdopterAdmission } from './lib/adopter-admission.mjs';

if (process.argv.length !== 3) {
  console.error('Usage: node scripts/check-adopter-admission.mjs ADOPTER_ROOT');
  process.exit(1);
}
const result = runAdopterAdmission({ root: path.resolve(process.argv[2]) });
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

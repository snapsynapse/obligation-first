#!/usr/bin/env node
import { open, readdir, realpath, lstat } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { answerDifferences, safeIdentity, safeLabel, safeTraversalError, sha256, REPORT_LIMITS } from './lib/consumer-report.mjs';

const MAX_FILE = 8 * 1024 * 1024, MAX_TOTAL = 256 * 1024 * 1024, MAX_FILES = 20000;
const requestedInvocation = process.env.OF_CONSUMER_REPORT_INVOCATION;
const invocation = typeof requestedInvocation === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestedInvocation) ? requestedInvocation : null;
const report = { schema_version: 1, report_type: 'consumer-traversal', invocation, status: 'error', complete: false,
  fixture: null, inputs: [], cases: [], errors: ['not-completed'], limits: REPORT_LIMITS };
let output, phase = 'invalid-invocation', totalBytes = 0, fileCount = 0;
const args = process.argv.slice(2), positions = args.flatMap((arg, i) => arg === '--report' ? [i] : []);
const reportIndex = positions[0];
const reportPath = reportIndex === undefined ? null : args[reportIndex + 1];
const positional = args.filter((_, i) => i !== reportIndex && i !== reportIndex + 1);
const persist = async () => {
  if (!output) return;
  const bytes = Buffer.from(JSON.stringify(report, null, 2) + '\n');
  await output.truncate(0);
  let offset = 0;
  while (offset < bytes.length) offset += (await output.write(bytes, offset, bytes.length - offset, offset)).bytesWritten;
  await output.sync();
};
async function readBounded(file) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_FILE || totalBytes + stat.size > MAX_TOTAL) throw new Error('input-limit');
    // Limit the read itself as well as the initial stat if the file grows.
    const bytes = Buffer.alloc(stat.size + 1);
    let offset = 0;
    while (offset < bytes.length) { const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset); if (!bytesRead) break; offset += bytesRead; }
    if (offset !== stat.size) throw new Error('input-changed');
    totalBytes += offset;
    return bytes.subarray(0, offset);
  } finally { await handle.close(); }
}
async function recordsIn(directory, index) {
  const entries = [], records = [];
  async function walk(folder, prefix = '', depth = 0) {
    if (depth > 32) throw new Error('input-limit');
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const rel = prefix + entry.name, file = path.join(folder, entry.name);
      if (entry.isDirectory()) await walk(file, rel + '/', depth + 1);
      else if (entry.name.endsWith('.json')) {
        if (!entry.isFile() || ++fileCount > MAX_FILES) throw new Error('input-limit');
        const bytes = await readBounded(file), record = JSON.parse(bytes.toString('utf8'));
        if (!record || Array.isArray(record) || typeof record !== 'object' || typeof record['@id'] !== 'string') throw new Error('invalid-record');
        records.push(record);
        entries.push({ file: safeLabel(rel), id: safeIdentity(record['@id']), sha256: sha256(bytes) });
      }
    }
  }
  await walk(directory);
  if (!records.length) throw new Error('empty-record-directory');
  report.inputs.push({ index, record_count: entries.length, inventory_sha256: sha256(JSON.stringify(entries)), records: entries });
  return records;
}
try {
  // Validate destinations before truncating. Never overwrite an input through
  // path aliases, symlinks, hard links or an output inside a records directory.
  if (reportPath && !reportPath.startsWith('--')) {
    phase = 'unsafe-report-output';
    const destination = path.join(await realpath(path.dirname(path.resolve(reportPath))), path.basename(reportPath));
    const fixturePath = positional[0] ? await realpath(positional[0]).catch(() => path.resolve(positional[0])) : null;
    if (destination === fixturePath) throw new Error('input-output-collision');
    for (const directory of positional.slice(1).filter(arg => !arg.startsWith('--'))) {
      const root = await realpath(directory).catch(() => path.resolve(directory));
      if (destination === root || destination.startsWith(root + path.sep)) throw new Error('input-output-collision');
    }
    const existing = await lstat(destination).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
    if (existing && (!existing.isFile() || existing.nlink !== 1)) throw new Error('unsafe-output');
    output = await open(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
    const stat = await output.stat();
    if (!stat.isFile() || stat.nlink !== 1) throw new Error('unsafe-output');
    await persist();
  }
  phase = 'invalid-invocation';
  if (requestedInvocation !== undefined && !invocation) throw new Error('invalid-invocation');
  if (positions.length > 1 || (reportIndex !== undefined && (!reportPath || reportPath.startsWith('--'))) || positional.length < 2 || positional.length > 33 || positional.some(arg => arg.startsWith('--'))) throw new Error('invalid-invocation');
  phase = 'invalid-fixture';
  const fixtureBytes = await readBounded(positional[0]);
  report.fixture = { sha256: sha256(fixtureBytes), byte_length: fixtureBytes.length };
  const fixture = JSON.parse(fixtureBytes.toString('utf8'));
  if (fixture.version !== 1 || !Array.isArray(fixture.cases) || !fixture.cases.length || fixture.cases.length > 256 || fixture.cases.some(item => !Array.isArray(item.steps) || item.steps.length > 64)) throw new Error('invalid-fixture');
  phase = 'invalid-record-input';
  const records = [];
  for (const [index, directory] of positional.slice(1).entries()) records.push(...await recordsIn(directory, index));
  phase = 'checker-unavailable';
  const { traverseConsumerCase } = await import('./lib/consumer-traversal.mjs');
  phase = 'invalid-traversal';
  for (const item of fixture.cases) {
    const result = traverseConsumerCase(records, item);
    const differenceBudget = 10000 - report.cases.reduce((sum, entry) => sum + entry.differences.length, 0);
    const differences = item.answer ? answerDifferences(item.answer.expected, JSON.parse(JSON.stringify(result.answer)), { maxDifferences: differenceBudget }) : [];
    report.cases.push({ id: safeLabel(result.id), status: result.status, errors: result.errors.map(safeTraversalError), differences });
    console.log(`${result.status}: ${typeof safeLabel(result.id) === 'string' ? safeLabel(result.id) : '[hashed case id]'}; layer sizes ${result.layers.map(layer => layer.length).join(' -> ')}; answer differences ${differences.length}`);
    for (const difference of differences.slice(0, 20)) console.log(`  ${difference.category}: ${difference.path}; expected ${JSON.stringify(difference.expected)}; actual ${JSON.stringify(difference.actual)}`);
    if (differences.length > 20) console.log('  Further differences retained in the optional report.');
    for (const error of result.errors) console.error(safeTraversalError(error));
  }
  report.status = report.cases.some(item => item.status !== 'passed') ? 'failed' : 'passed';
  report.complete = true; report.errors = [];
  phase = 'report-write-failed';
  await persist();
  console.log('Declared graph journeys only; category matches are not applicability and statutory anchors do not promote draft terms.');
  if (report.status !== 'passed') process.exitCode = 1;
} catch {
  report.status = 'error'; report.complete = false; report.errors = [phase];
  try { await persist(); } catch { console.error('consumer-report-write-failed'); }
  console.error(`consumer-traversal-error: ${phase}`);
  process.exitCode = 1;
} finally { await output?.close(); }

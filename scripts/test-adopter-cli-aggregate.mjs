import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectAggregateExport } from './validate-adopter-records.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'scripts/validate-adopter-records.mjs');
const example = path.join(root, 'examples/air-canada/records');
const run = (dir) => spawnSync(process.execPath, [cli, dir], { encoding: 'utf8' });

const tmp = await mkdtemp(path.join(os.tmpdir(), 'of-adopter-aggregate-'));
try {
  const index = { '@context': 'https://obligationfirst.org/v1/context.jsonld', files: { proceedings: 'proceedings.json' } };
  const aggregate = { '@context': index['@context'], proceedings: [] };

  // Aggregate export downloaded without its records/ directory.
  const bare = path.join(tmp, 'bare');
  await mkdir(bare);
  await writeFile(path.join(bare, 'index.json'), JSON.stringify(index));
  await writeFile(path.join(bare, 'proceedings.json'), JSON.stringify(aggregate));
  let result = run(bare);
  assert.equal(result.status, 1, 'bare aggregate export must fail');
  assert.match(result.stdout, /aggregate export \(index\.json lists proceedings\.json\)/);
  assert.match(result.stdout, /records\/ directory/);
  assert.doesNotMatch(result.stdout, /missing @type/, 'aggregate files must not be reported record by record');

  // Aggregate export with a records/ directory: the hint names that path.
  const withRecords = path.join(tmp, 'with-records');
  await cp(bare, withRecords, { recursive: true });
  await cp(example, path.join(withRecords, 'records'), { recursive: true });
  result = run(withRecords);
  assert.equal(result.status, 1, 'aggregate export root must fail even when records/ is present');
  assert.ok(result.stdout.includes(path.join(withRecords, 'records')), 'hint must name the records/ directory');
  assert.equal(run(path.join(withRecords, 'records')).status, 0, 'the named records/ directory must validate');

  // Controls: a typed record named index.json and an ordinary record directory are not aggregates.
  const typed = path.join(tmp, 'typed');
  await mkdir(typed);
  await writeFile(path.join(typed, 'index.json'), JSON.stringify({ '@type': 'of:Proceeding', files: { a: 'a.json' } }));
  assert.equal(await detectAggregateExport(typed), null);
  assert.equal(await detectAggregateExport(example), null);
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log('Adopter CLI aggregate-export hint passed: bare and records/ layouts diagnosed, typed index.json and record directories unaffected.');

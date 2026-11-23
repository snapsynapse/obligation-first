import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRumlExample } from './check-ruml-example.mjs';

await checkRumlExample();
const source = fileURLToPath(new URL('../reference/fixtures/ruml-v1', import.meta.url));
const controls = [
  ['records/obligation.json', r => { r.executableEncoding.kind = 'ruml'; }],
  ['records/obligation.json', r => { r.created_by = 'https://example.org/missing-term'; }],
  ['records/obligation.json', r => { r.enforcement_status = 'enforceable'; }],
  ['missing-eligibility.ruml-result', r => { r.evaluation.results['1'].status = 'false'; r.evaluation.results['1'].reason = 'Unknown coerced to false'; }],
  ['complete.ruml-result', r => { r.rumlReference.id = 'c5da11f2-353d-4fa2-b310-e69a581bde80'; }],
  ['cases.json', r => { r.cases[0].inputs.dp_eligible = false; }, /Case inputs changed/],
  ['binding.json', r => { r.local_rulemap = 'missing.ruml'; }, /Unexpected local rulemap/],
  ['binding.json', r => { r.sha256_file_bytes = {}; }, /Fixture hash inventory changed/],
  ['acknowledgement.ruml', r => { r.rulemap.nodes['1'].capabilities[0].payload.refs[0].id = 'missing_text'; }, /Unresolved or changed synthetic source anchor/],
  ['upstream/ruml.schema.json', r => { r.title = 'Modified upstream'; }, /Pinned upstream byte drift/],
];
for (const [file, mutate, expectedError] of controls) {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'of-ruml-negative-'));
  try {
    await cp(source, temp, { recursive: true });
    const full = path.join(temp, file);
    const record = JSON.parse(await readFile(full, 'utf8'));
    mutate(record);
    const bytes = JSON.stringify(record, null, 2) + '\n';
    await writeFile(full, bytes);
    // Rehash so rejection must come from meaning/shape/binding, not just bytes.
    if (file !== 'binding.json') {
      const manifest = JSON.parse(await readFile(path.join(temp, 'binding.json'), 'utf8'));
      manifest.sha256_file_bytes[file] = createHash('sha256').update(bytes).digest('hex');
      await writeFile(path.join(temp, 'binding.json'), JSON.stringify(manifest));
    }
    if (expectedError) await assert.rejects(checkRumlExample(temp), expectedError);
    else await assert.rejects(checkRumlExample(temp), `Unsafe mutation accepted: ${file}`);
  } finally { await rm(temp, { recursive: true, force: true }); }
}
console.log(`RUML example passed with ${controls.length} schema, reference, pinning and meaning-preservation negative controls.`);

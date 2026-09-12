#!/usr/bin/env node
// Rebuild tracked + new unignored working-tree sources without touching the checkout.
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function treeHashes(dir, prefix = '', result = {}) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const key = prefix + item.name;
    if (item.isDirectory()) await treeHashes(path.join(dir, item.name), key + '/', result);
    else if (item.isFile()) result[key] = createHash('sha256').update(await readFile(path.join(dir, item.name))).digest('hex');
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
export async function checkProjection(root, projection, builder) {
  if (!projection || path.isAbsolute(projection) || projection.split(/[\\/]/).includes('..') || path.normalize(projection) === '.') {
    throw new Error('OF-FRESHNESS-SOURCE: projection must be a repository-relative subdirectory');
  }
  const projectionPrefix = path.normalize(projection).replaceAll(path.sep, '/').replace(/\/$/, '');
  const temporary = await mkdtemp(path.join(tmpdir(), 'of-freshness-'));
  try {
    // Keep a private index and refs while making pinned historical objects
    // available to source validators. No checkout seeds generated output.
    const cloned = spawnSync('git', ['clone', '--local', '--shared', '--no-checkout', '--', path.resolve(root), temporary], { encoding: 'utf8' });
    if (cloned.status !== 0) throw new Error(`OF-FRESHNESS-SOURCE: cannot prepare isolated history: ${cloned.stderr || cloned.error}`);
    const listing = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    if (listing.status !== 0) throw new Error('OF-FRESHNESS-SOURCE: cannot enumerate working tree');
    for (const file of new Set(listing.stdout.split('\0').filter(Boolean))) {
      if (file.startsWith('handoffs/')) continue;
      // Do not seed the rebuild with the output being verified: orphaned records
      // or a builder that no longer emits an artifact must be observable.
      if (file === projectionPrefix || file.startsWith(`${projectionPrefix}/`)) continue;
      await mkdir(path.dirname(path.join(temporary, file)), { recursive: true });
      try { await cp(path.join(root, file), path.join(temporary, file)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; } // deleted sources stay deleted
    }
    await mkdir(path.join(temporary, projection), { recursive: true });
    const built = spawnSync(process.execPath, [builder], { cwd: temporary, encoding: 'utf8', env: { ...process.env, TZ: 'UTC', GIT_OPTIONAL_LOCKS: '0', NODE_PATH: path.join(root, 'node_modules') }, maxBuffer: 20 * 1024 * 1024 });
    if (built.status !== 0) throw new Error(`OF-FRESHNESS-BUILD: ${built.stderr || built.stdout || built.error}`);
    const expected = await treeHashes(path.join(root, projection));
    const actual = await treeHashes(path.join(temporary, projection));
    if (!Object.keys(actual).length) throw new Error('OF-FRESHNESS-BUILD: builder produced no projection artifacts');
    const changed = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].filter(key => expected[key] !== actual[key]);
    if (changed.length) throw new Error(`OF-PROJECTION-STALE: ${changed.length} file(s): ${changed.slice(0, 10).join(', ')}`);
    console.log(`Source projection fresh: ${path.basename(root)} (${Object.keys(actual).length} artifacts)`);
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
if (process.argv[1] && await realpath(fileURLToPath(import.meta.url)) === await realpath(process.argv[1])) {
  try {
    const [root, projection, builder] = process.argv.slice(2);
    if (!root || !projection || !builder) throw new Error('Expected repository, projection directory, builder');
    await checkProjection(path.resolve(root), projection, builder);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { STATUS_FILES, implementationStatusFailures } from './check-implementation-status.mjs';

const root = new URL('../', import.meta.url);
const files = Object.fromEntries(await Promise.all(STATUS_FILES.map(async rel => [rel, await readFile(new URL(rel, root), 'utf8')])));
const pkg = JSON.parse(files['package.json']);
const manifest = JSON.parse(await readFile(new URL(`docs/releases/v${pkg.version}/manifest.json`, root), 'utf8'));
assert.deepEqual(implementationStatusFailures(files, manifest), []);
let mutations = 0;
function fault(name, mutate, diagnostic) {
  const copy = structuredClone(files), release = structuredClone(manifest);
  mutate(copy, release);
  assert(implementationStatusFailures(copy, release).some(e => e.startsWith(diagnostic)), name);
  mutations++;
}
function alterStatus(copy, change) {
  const status = JSON.parse(copy['reference/implementation-status.json']);
  change(status);
  copy['reference/implementation-status.json'] = copy['docs/evaluation-status.json'] = JSON.stringify(status);
}
fault('public status mirror drift', f => { f['docs/evaluation-status.json'] += ' '; }, 'OF-STATUS-MIRROR:');
fault('website makes an unsupported scope claim', f => { f['docs/index.html'] = f['docs/index.html'].replace('unreleased offline tooling', 'released production serializer'); }, 'OF-STATUS-PROSE:');
fault('README loses the current scope block', f => { f['README.md'] = f['README.md'].replace('implementation-status:start', 'removed'); }, 'OF-STATUS-PROSE:');
fault('machine status becomes undiscoverable', f => { f['docs/index.html'] = f['docs/index.html'].replaceAll('https://obligationfirst.org/evaluation-status.json', '/missing.json'); }, 'OF-STATUS-DISCOVERY:');
fault('agent version drift', f => { const a = JSON.parse(f['docs/agents.json']); a.version = 'v0.0.0'; f['docs/agents.json'] = JSON.stringify(a); }, 'OF-STATUS-VERSION:');
fault('production serialization overclaim in both copies', f => alterStatus(f, s => { s.qualified_time.production_serialization = true; }), 'OF-STATUS-F14:');
fault('schema expansion overclaim', f => alterStatus(f, s => { s.qualified_time.changes_record_schema = true; }), 'OF-STATUS-F14:');
fault('adopter ownership drift', f => alterStatus(f, s => { s.qualified_time.owners.push('ai-incident-law'); }), 'OF-STATUS-F14:');
fault('unreviewed namespace promotion', f => alterStatus(f, s => { s.namespace_redirect = 'live'; }), 'OF-STATUS-NAMESPACE:');
fault('F14 becomes packaged without status review', (_, m) => { m.artifacts.push({ path: 'scripts/lib/qualified-time.mjs' }); }, 'OF-STATUS-RELEASE:');
fault('released scope tooling missing from package', (_, m) => { m.artifacts = m.artifacts.filter(a => a.path !== 'scripts/lib/scope-contract.mjs'); }, 'OF-STATUS-RELEASE:');
fault('documented code removed', f => { delete f['scripts/lib/qualified-time.mjs']; }, 'OF-STATUS-MISSING:');
fault('synthetic suite detached from hardening', f => { f['scripts/test-hardening-regressions.mjs'] = f['scripts/test-hardening-regressions.mjs'].replace('await import("./test-qualified-time.mjs")', ''); }, 'OF-STATUS-WIRING:');
fault('native mapping requirement silently removed', f => { f['scripts/verify-federation.mjs'] = f['scripts/verify-federation.mjs'].replaceAll('--require-pending-mapping', ''); }, 'OF-STATUS-WIRING:');
fault('hardening detached from npm test', f => { const p = JSON.parse(f['package.json']); p.scripts.test = 'echo skipped'; f['package.json'] = JSON.stringify(p); }, 'OF-STATUS-WIRING:');
console.log(`Implementation-status checks passed (baseline plus ${mutations} drift mutations).`);

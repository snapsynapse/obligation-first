#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const STATUS_FILES = [
  'reference/implementation-status.json', 'docs/evaluation-status.json',
  'README.md', 'docs/index.html', 'package.json', 'docs/agents.json',
  'scripts/test-hardening-regressions.mjs', 'scripts/verify-federation.mjs',
  'scripts/lib/qualified-time.mjs', 'scripts/check-qualified-time-adopter.mjs',
  'scripts/test-qualified-time.mjs', 'reference/contracts/qualified-time-fixture-v1.md',
  'reference/contracts/qualified-time-fixture-v1.schema.json',
  'reference/fixtures/qualified-time-v1/pending-amendment.json',
];
export function implementationSummary(version) {
  return `The v${version} reference package includes scope continuity evaluation. F14 qualified-time evaluation is released offline reference tooling: expected/fallback branches and evidence/date boundaries are tested, while the v0.6 record schema and production serialization are unchanged. These fixtures do not determine legal applicability or predecessor operative history.`;
}
export function implementationStatusFailures(files, manifest) {
  const failures = [];
  for (const rel of STATUS_FILES) {
    if (typeof files[rel] !== 'string' || !files[rel].trim()) failures.push(`OF-STATUS-MISSING: ${rel}`);
  }
  if (failures.length) return failures;
  let status, pkg, agents;
  try {
    status = JSON.parse(files['reference/implementation-status.json']);
    pkg = JSON.parse(files['package.json']);
    agents = JSON.parse(files['docs/agents.json']);
  } catch { return ['OF-STATUS-JSON: malformed status or release metadata']; }
  if (!status || !pkg || !agents || !manifest || !Array.isArray(manifest.artifacts)) return ['OF-STATUS-JSON: missing status or release metadata'];
  const version = status.released_reference_version;
  if (version !== pkg.version || agents.version !== `v${version}` || manifest.version !== version) failures.push('OF-STATUS-VERSION: released surface versions disagree');
  if (status.status_schema_version !== 1 || status.record_contract !== 'v0.6' ||
      status.scope_continuity?.status !== 'released-reference-tooling' ||
      status.scope_continuity?.command !== 'npm run test:scope') failures.push('OF-STATUS-SCOPE: unsupported scope declaration');
  if (status.namespace_redirect !== 'pending-external-filing') failures.push('OF-STATUS-NAMESPACE: namespace readiness needs reviewed external evidence');
  const q = status.qualified_time;
  if (!q || q.status !== 'released-offline-fixture' ||
      ['changes_record_schema', 'production_serialization', 'determines_legal_applicability', 'determines_predecessor_history'].some(key => q[key] !== false) ||
      q.test_command !== 'node scripts/test-qualified-time.mjs' || q.federation_command !== 'npm run verify:federation' ||
      q.contract_path !== 'reference/contracts/qualified-time-fixture-v1.md' || q.owner_sidecar_path !== 'tests/fixtures/of-qualified-time.json' ||
      JSON.stringify(q.owners) !== JSON.stringify(['every-ai-law', 'publedge']) ||
      JSON.stringify(q.regression_only_adopters) !== JSON.stringify(['ai-incident-law'])) failures.push('OF-STATUS-F14: fixture capability or ownership overclaim');
  if (files['reference/implementation-status.json'] !== files['docs/evaluation-status.json']) failures.push('OF-STATUS-MIRROR: source and served JSON differ');
  const summary = implementationSummary(version);
  for (const rel of ['README.md', 'docs/index.html']) {
    const text = files[rel];
    const matches = [...text.matchAll(/<!-- implementation-status:start -->([\s\S]*?)<!-- implementation-status:end -->/g)];
    const expected = rel.endsWith('.html') ? `<p>${summary}</p>` : summary;
    if (matches.length !== 1 || matches[0][1].trim() !== expected) failures.push(`OF-STATUS-PROSE: ${rel} scope summary differs`);
    if (!text.includes('https://obligationfirst.org/evaluation-status.json')) failures.push(`OF-STATUS-DISCOVERY: ${rel} omits machine status`);
  }
  const paths = new Set(manifest.artifacts.map(a => a.path));
  if (!paths.has('scripts/lib/scope-contract.mjs')) failures.push('OF-STATUS-RELEASE: scope evaluator absent from released inventory');
  if (!paths.has('scripts/lib/qualified-time.mjs') || !paths.has('reference/contracts/qualified-time-fixture-v1.schema.json')) failures.push('OF-STATUS-RELEASE: F14 tooling missing from released inventory');
  if (pkg.scripts?.['test:hardening'] !== 'node scripts/test-hardening-regressions.mjs' ||
      !pkg.scripts?.test?.includes('npm run test:hardening') ||
      !files['scripts/test-hardening-regressions.mjs'].includes('await import("./test-qualified-time.mjs")') ||
      !files['scripts/verify-federation.mjs'].includes('scripts/check-qualified-time-adopter.mjs') ||
      !files['scripts/verify-federation.mjs'].includes('--require-pending-mapping')) failures.push('OF-STATUS-WIRING: advertised fixture checks are not wired');
  return failures;
}
export async function validateImplementationStatus(failures, root = fileURLToPath(new URL('../', import.meta.url))) {
  const files = {};
  for (const rel of STATUS_FILES) {
    try { files[rel] = await readFile(path.join(root, rel), 'utf8'); }
    catch { files[rel] = ''; }
  }
  let manifest;
  try {
    const pkg = JSON.parse(files['package.json']);
    manifest = JSON.parse(await readFile(path.join(root, `docs/releases/v${pkg.version}/manifest.json`), 'utf8'));
  } catch { failures.push('OF-STATUS-RELEASE: cannot read released inventory'); return; }
  failures.push(...implementationStatusFailures(files, manifest));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const failures = [];
  await validateImplementationStatus(failures);
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
  else console.log('Implementation scope, website, and machine-status parity passed.');
}

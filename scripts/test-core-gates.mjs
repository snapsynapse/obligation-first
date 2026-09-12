import assert from "node:assert/strict";
import { readFile, cp, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function gateErrors(pkg, pages) {
  const errors = [];
  if (pkg.scripts["validate:search"] !== "node scripts/check-search.mjs") errors.push("search command changed");
  if (!pkg.scripts.test.startsWith("npm run validate:search && ")) errors.push("canonical test must fail on search defects");
  if (!/^  test:\s*$/m.test(pages) || !/^\s+run: npm test\s*$/m.test(pages)) errors.push("Pages must run canonical test");
  if (!/^  build:\s*\n    needs: test\s*$/m.test(pages) || !/^  deploy:\s*\n    needs: build\s*$/m.test(pages)) errors.push("Pages must depend on successful test and build");
  return errors;
}
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const pages = await readFile(".github/workflows/pages.yml", "utf8");
assert.deepEqual(gateErrors(pkg, pages), []);
assert(gateErrors({ ...pkg, scripts: { ...pkg.scripts, test: pkg.scripts.test.replace("npm run validate:search && ", "") } }, pages).length);
assert(gateErrors(pkg, pages.replace("needs: test", "needs: []")).length);
assert(gateErrors(pkg, pages.replace("run: npm test", "run: npm run validate")).length);
assert(gateErrors({ ...pkg, scripts: { ...pkg.scripts, test: pkg.scripts.test.replace("validate:search &&", "validate:search ;") } }, pages).length);
const root = await mkdtemp(path.join(tmpdir(), "of-search-gate-"));
try {
  await cp("docs", path.join(root, "docs"), { recursive: true });
  await cp("search-audit.config.json", path.join(root, "search-audit.config.json"));
  const baseline = spawnSync(process.execPath, [path.resolve("scripts/check-search.mjs")], { cwd: root, encoding: "utf8" });
  assert.equal(baseline.status, 0, baseline.stdout + baseline.stderr);
  const index = path.join(root, "docs/index.html");
  const text = await readFile(index, "utf8");
  assert.match(text, /rel="canonical"/);
  await writeFile(index, text.replace(/(<link\s+rel="canonical"\s+href=")[^"]+/, '$1https://wrong.example/'));
  const result = spawnSync(process.execPath, [path.resolve("scripts/check-search.mjs")], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0, "seeded canonical defect was accepted");
  assert.match(result.stdout + result.stderr, /canonical/i);
} finally { await rm(root, { recursive: true, force: true }); }
console.log("Core gate regressions passed (search defect blocks canonical test and Pages dependency chain).");

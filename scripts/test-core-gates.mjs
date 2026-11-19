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
  const sitemap = path.join(root, "docs/sitemap.xml");
  const sitemapText = await readFile(sitemap, "utf8");
  await writeFile(sitemap, sitemapText.replace("https://obligationfirst.org/</loc>", "https:&#47;&#47;obligationfirst.org/</loc>"));
  const encoded = spawnSync(process.execPath, [path.resolve("scripts/check-search.mjs")], { cwd: root, encoding: "utf8" });
  assert.equal(encoded.status, 0, encoded.stdout + encoded.stderr);
  await writeFile(sitemap, sitemapText);
  const index = path.join(root, "docs/index.html");
  const text = await readFile(index, "utf8");
  assert.match(text, /rel="canonical"/);
  await writeFile(index, text.replace(/(<link\s+rel="canonical"\s+href=")[^"]+/, '$1https://wrong.example/'));
  const result = spawnSync(process.execPath, [path.resolve("scripts/check-search.mjs")], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0, "seeded canonical defect was accepted");
  assert.match(result.stdout + result.stderr, /canonical/i);
} finally { await rm(root, { recursive: true, force: true }); }
// A bad sitemap URL or redirect must fail before any request reaches that target.
const networkRoot = await mkdtemp(path.join(tmpdir(), "of-search-network-"));
try {
  await writeFile(path.join(networkRoot, "search-audit.config.json"), JSON.stringify({
    contractVersion: 4, canonicalOrigin: "https://obligationfirst.org/",
    sitemaps: ["sitemap.xml"], compareRepositorySitemaps: false,
  }));
  const callsFile = path.join(networkRoot, "calls.json");
  const mockFile = path.join(networkRoot, "mock.mjs");
  await writeFile(mockFile, `import fs from 'node:fs';
const calls = [];
const withUrl = (response, url) => { Object.defineProperty(response, 'url', { value: String(url) }); return response; };
globalThis.fetch = async (url, options) => {
  calls.push(String(url));
  fs.writeFileSync(${JSON.stringify(callsFile)}, JSON.stringify(calls));
  if (options.redirect !== 'manual') throw new Error('automatic redirects are forbidden');
  if (String(url).endsWith('/sitemap.xml')) {
    if (process.env.SEARCH_CASE === 'oversized') return withUrl(new Response('x'.repeat(4 * 1024 * 1024 + 1), {headers:{'content-type':'application/xml'}}), url);
    const target = process.env.SEARCH_CASE === 'bad-location' ? 'http' + '://127.0.0.1:8765/private-get'
      : process.env.SEARCH_CASE === 'noncanonical' ? 'https://obligationfirst.org:443/page'
      : process.env.SEARCH_CASE === 'encoded' ? 'https:&#47;&#47;obligationfirst.org/page'
      : 'https://obligationfirst.org/page';
    return withUrl(new Response('<urlset><url><loc>' + target + '</loc></url></urlset>', {headers:{'content-type':'application/xml'}}), url);
  }
  if (['safe', 'encoded'].includes(process.env.SEARCH_CASE)) return withUrl(new Response('<html><link rel="canonical" href="https://obligationfirst.org/page"></html>', {headers:{'content-type':'text/html'}}), url);
  return withUrl(new Response('', {status:302, headers:{location:'http' + '://127.0.0.1:8765/private-get'}}), url);
};`);
  for (const scenario of ["bad-location", "noncanonical", "bad-redirect", "oversized", "encoded", "safe"]) {
    const result = spawnSync(process.execPath, ["--import", mockFile, path.resolve("scripts/check-production-search.mjs"), "--json"], {
      cwd: networkRoot, encoding: "utf8", env: { ...process.env, SEARCH_CASE: scenario },
    });
    assert.equal(result.status, ["safe", "encoded"].includes(scenario) ? 0 : scenario === "oversized" ? 2 : 1, `${scenario}: ${result.stdout}${result.stderr}`);
    const calls = JSON.parse(await readFile(callsFile, "utf8"));
    assert(!calls.some(url => url.startsWith("http" + "://127.0.0.1:")), `${scenario}: forbidden target was requested`);
    if (["safe", "encoded"].includes(scenario)) assert(calls.includes("https://obligationfirst.org/page"));
    else if (scenario === "oversized") {
      assert.equal(calls.length, 1, "oversized sitemap must stop before a page request");
      assert.match(result.stderr, /exceeds/i);
    } else assert.match(result.stderr, /noncanonical|unapproved/i);
  }
} finally { await rm(networkRoot, { recursive: true, force: true }); }
console.log("Core gate regressions passed (search defect blocks canonical test and Pages dependency chain).");

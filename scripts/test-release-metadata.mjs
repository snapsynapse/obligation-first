import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { isValidReleaseDate, readBundleDate, releaseMetadataErrors, RELEASE_NAME, RELEASE_REPOSITORY } from "./lib/release-metadata.mjs";
import { validateReleaseManifestContract } from "./validate-repo-contracts.mjs";

for (const date of ["2024-02-29", "2000-02-29", "2026-09-12", "0001-01-01"]) assert(isValidReleaseDate(date), date);
for (const date of ["2026-02-30", "2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "2026-01-00", "0000-01-01", "2026-9-12", "2026-09-12T00:00:00Z", "", null]) assert(!isValidReleaseDate(date), String(date));
const valid = { name: RELEASE_NAME, repository: RELEASE_REPOSITORY, release_date: "2026-09-12" };
assert.deepEqual(releaseMetadataErrors(valid, "2026-09-12"), []);
for (const [key, value] of [["name", "another-project"], ["repository", "https://example.com/fork"], ["release_date", "2026-02-30"]]) {
  const failures = [];
  validateReleaseManifestContract(failures, { manifest: { ...valid, [key]: value }, expectedArtifacts: [], shaPaths: [], version: "0.6.6", expectedDate: "2026-09-12" });
  assert(failures.some(error => error.includes(key)), key);
}
assert(releaseMetadataErrors(valid, "2026-09-13").some(error => error.includes("must match")));
assert.equal(readBundleDate("bundle: obligation-first\nbundle_date: 2026-09-12\nfiles:\n  path: abc\n"), "2026-09-12");
for (const input of ["", "bundle_date: 2026-02-30\n", "bundle_date: 2026-09-12\nbundle_date: 2026-09-12\n"]) assert.throws(() => readBundleDate(input));
const output = await mkdtemp(path.join(tmpdir(), "of-invalid-release-date-"));
try {
  const result = spawnSync(process.execPath, ["scripts/make-release.mjs", "--date", "2026-02-30", "--out-dir", output], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /real YYYY-MM-DD calendar date/);
  assert.deepEqual(await readdir(output), [], "invalid date wrote release artifacts");
  const mismatch = spawnSync(process.execPath, ["scripts/make-release.mjs", "--date", "0001-01-01", "--out-dir", output], { encoding: "utf8" });
  assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /release date must match/);
  assert.deepEqual(await readdir(output), [], "mismatched bundle date wrote release artifacts");
} finally { await rm(output, { recursive: true, force: true }); }
console.log("Release metadata regressions passed (identity, calendar dates, bundle parity, no invalid output).");

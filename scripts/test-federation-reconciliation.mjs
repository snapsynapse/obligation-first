import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { reconcileFederation } from "./lib/federation-reconciliation.mjs";

const commit = "a".repeat(40);
const digest = "b".repeat(64);
const artifact = "c".repeat(64);
function healthy() {
  return {
    schema_version: 1,
    observed_at: "2026-09-07T12:00:00Z",
    checker: { commit, version: "0.6.5" },
    adopters: [{
      name: "EveryAILaw",
      role: "adopter",
      source: { commit },
      checker_compatibility: "obligation-first >=0.6.0 <0.7.0",
      accepted_exact_edges_sha256: digest,
      projection: { source_commit: commit, exact_edges_sha256: digest, artifact_sha256: artifact },
      deployed: { source_commit: commit, exact_edges_sha256: digest, artifact_sha256: artifact },
    }],
    upstream_reviews: [{ source: "Semantic Arts gist release notes", cadence_days: 90, reviewed_at: "2026-09-01T00:00:00Z" }],
  };
}
function codes(value) { return value.problems.map((item) => item.code); }
function reconcile(evidence, options = {}) { return reconcileFederation(evidence, { asOf: "2026-09-07T12:00:00Z", ...options }); }

const baseline = reconcile(healthy());
assert.equal(baseline.status, "healthy");
assert.equal(baseline.notification.notify, false);
const unchanged = reconcile(healthy(), { previous: baseline });
assert.equal(unchanged.status, "healthy");
assert.equal(unchanged.notification.notify, false, "healthy evidence must not repeat alerts");

const edge = healthy(); edge.adopters[0].projection.exact_edges_sha256 = "d".repeat(64); edge.adopters[0].deployed.exact_edges_sha256 = "d".repeat(64);
assert.ok(codes(reconcile(edge)).includes("OF-RECONCILIATION-EXACT-EDGE-DRIFT"));
const stale = healthy(); stale.adopters[0].projection.source_commit = "d".repeat(40);
assert.ok(codes(reconcile(stale)).includes("OF-RECONCILIATION-PROJECTION-STALE"));
const incompatible = healthy(); incompatible.adopters[0].checker_compatibility = "obligation-first >=0.7.0 <0.8.0";
assert.ok(codes(reconcile(incompatible)).includes("OF-RECONCILIATION-INCOMPATIBLE-SCHEMA"));
const deployed = healthy(); deployed.adopters[0].deployed.source_commit = "d".repeat(40);
const firstFailure = reconcile(deployed); const repeatedFailure = reconcile(deployed, { previous: firstFailure });
assert.ok(codes(firstFailure).includes("OF-RECONCILIATION-DEPLOYED-SOURCE-MISMATCH"));
assert.equal(firstFailure.notification.notify, true);
assert.equal(repeatedFailure.notification.notify, false, "identical failure must not repeat alerts");
const deployedBytes = healthy(); deployedBytes.adopters[0].deployed.artifact_sha256 = "d".repeat(64);
assert.ok(codes(reconcile(deployedBytes)).includes("OF-RECONCILIATION-DEPLOYED-SOURCE-MISMATCH"));
const pro = healthy(); pro.adopters[0].name = "EVERY-AI-LAW-PRO";
assert.ok(codes(reconcile(pro)).includes("OF-RECONCILIATION-ADOPTER-BOUNDARY"));
const overdue = healthy(); overdue.upstream_reviews[0].reviewed_at = "2026-01-01T00:00:00Z";
assert.ok(codes(reconcile(overdue)).includes("OF-RECONCILIATION-UPSTREAM-REVIEW-DUE"));
const futureReview = healthy(); futureReview.upstream_reviews[0].reviewed_at = "2026-10-01T00:00:00Z";
assert.ok(codes(reconcile(futureReview)).includes("OF-RECONCILIATION-CONFIG"));
const futureObservation = healthy(); futureObservation.observed_at = "2026-10-01T00:00:00Z";
assert.throws(() => reconcile(futureObservation), /observed_at cannot be after asOf/);
const directory = await mkdtemp(path.join(tmpdir(), "of-reconciliation-cli-"));
try {
  const evidencePath = path.join(directory, "evidence.json");
  await writeFile(evidencePath, JSON.stringify(healthy()));
  const duplicate = spawnSync(process.execPath, ["scripts/check-federation-reconciliation.mjs", "--evidence", evidencePath, "--evidence", evidencePath], { encoding: "utf8" });
  assert.equal(duplicate.status, 2);
  assert.match(duplicate.stderr, /--evidence may appear only once/);
} finally {
  await rm(directory, { recursive: true, force: true });
}
console.log("Federation reconciliation rejects edge, freshness, compatibility, deployment, boundary, and review-due mutations without repeat alerts.");

const equivalent = healthy();
equivalent.adopters[0].deployed.source_commit = null;
equivalent.adopters[0].deployed.equivalent_source_commit = commit;
equivalent.adopters[0].deployed.identity = "byte_equivalent_to_checked_out_source";
assert.equal(reconcile(equivalent).status, "healthy");
equivalent.adopters[0].deployed.identity = "unknown";
assert.ok(codes(reconcile(equivalent)).includes("OF-RECONCILIATION-DEPLOYED-SOURCE-MISMATCH"));

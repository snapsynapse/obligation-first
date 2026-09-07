import { createHash } from "node:crypto";
import { satisfies } from "./version-range.mjs";

const SHA = /^[a-f0-9]{64}$/i;
const COMMIT = /^[a-f0-9]{40}$/i;
const PROHIBITED = new Set(["every-ai-law-pro", "everyailaw pro"]);

function problem(code, adopter, detail) {
  return { code, adopter, detail };
}

function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stable(child)]));
}

export function reconcileFederation(evidence, { previous = null, asOf = new Date().toISOString() } = {}) {
  if (!evidence || evidence.schema_version !== 1 || !validDate(evidence.observed_at)) {
    throw new Error("OF-RECONCILIATION-CONFIG: schema_version 1 and observed_at are required");
  }
  if (!Array.isArray(evidence.adopters) || evidence.adopters.length === 0) {
    throw new Error("OF-RECONCILIATION-CONFIG: at least one adopter is required");
  }
  if (!evidence.checker || !COMMIT.test(evidence.checker.commit || "") || !evidence.checker.version) {
    throw new Error("OF-RECONCILIATION-CONFIG: checker commit and version are required");
  }
  if (!validDate(asOf)) throw new Error("OF-RECONCILIATION-CONFIG: asOf must be an ISO date");
  if (Date.parse(evidence.observed_at) > Date.parse(asOf)) {
    throw new Error("OF-RECONCILIATION-CONFIG: observed_at cannot be after asOf");
  }

  const problems = [];
  const names = new Set();
  for (const adopter of evidence.adopters) {
    const name = adopter?.name;
    if (!name || names.has(name)) {
      problems.push(problem("OF-RECONCILIATION-CONFIG", name || "unknown", "adopter names must be unique"));
      continue;
    }
    names.add(name);
    if (PROHIBITED.has(String(name).toLowerCase()) || adopter.role !== "adopter") {
      problems.push(problem("OF-RECONCILIATION-ADOPTER-BOUNDARY", name, "only shared-schema adopters belong in federation"));
      continue;
    }
    const source = adopter.source || {};
    const projection = adopter.projection || {};
    const deployed = adopter.deployed || {};
    if (!COMMIT.test(source.commit || "")) problems.push(problem("OF-RECONCILIATION-CONFIG", name, "source.commit must be a 40-hex commit"));
    if (!satisfies(adopter.checker_compatibility, evidence.checker.version)) {
      problems.push(problem("OF-RECONCILIATION-INCOMPATIBLE-SCHEMA", name, `profile range ${adopter.checker_compatibility || "missing"} excludes ${evidence.checker.version}`));
    }
    if (projection.source_commit !== source.commit || !SHA.test(projection.exact_edges_sha256 || "") || !SHA.test(projection.artifact_sha256 || "")) {
      problems.push(problem("OF-RECONCILIATION-PROJECTION-STALE", name, "projection must identify the current source commit, exact-edge digest, and artifact hash"));
    }
    if (deployed.source_commit !== source.commit || deployed.exact_edges_sha256 !== projection.exact_edges_sha256 || deployed.artifact_sha256 !== projection.artifact_sha256 || !SHA.test(deployed.artifact_sha256 || "")) {
      problems.push(problem("OF-RECONCILIATION-DEPLOYED-SOURCE-MISMATCH", name, "deployed artifact must identify the same source, exact-edge digest, and artifact hash"));
    }
    if (adopter.accepted_exact_edges_sha256 !== projection.exact_edges_sha256) {
      problems.push(problem("OF-RECONCILIATION-EXACT-EDGE-DRIFT", name, "exact-edge digest differs from the reviewed baseline"));
    }
  }

  for (const review of evidence.upstream_reviews || []) {
    if (!review?.source || !Number.isInteger(review.cadence_days) || review.cadence_days < 1 || !validDate(review.reviewed_at)) {
      problems.push(problem("OF-RECONCILIATION-CONFIG", "upstream", "each upstream review needs source, positive cadence_days, and reviewed_at"));
      continue;
    }
    if (Date.parse(review.reviewed_at) > Date.parse(asOf)) {
      problems.push(problem("OF-RECONCILIATION-CONFIG", review.source, "upstream reviewed_at cannot be in the future"));
      continue;
    }
    const due = Date.parse(review.reviewed_at) + review.cadence_days * 86_400_000;
    if (due < Date.parse(asOf)) problems.push(problem("OF-RECONCILIATION-UPSTREAM-REVIEW-DUE", review.source, "low-frequency upstream review is overdue"));
  }

  const fingerprint = createHash("sha256").update(JSON.stringify(stable({ checker: evidence.checker, adopters: evidence.adopters, upstream_reviews: evidence.upstream_reviews || [], problems }))).digest("hex");
  const priorFingerprint = previous?.fingerprint;
  return {
    status: problems.length ? "failed" : "healthy",
    observed_at: evidence.observed_at,
    checker: evidence.checker,
    problems,
    fingerprint,
    notification: {
      notify: problems.length > 0 && priorFingerprint !== fingerprint,
      reason: problems.length ? (priorFingerprint === fingerprint ? "unchanged_failure" : "new_or_changed_failure") : "healthy_or_unchanged",
    },
  };
}

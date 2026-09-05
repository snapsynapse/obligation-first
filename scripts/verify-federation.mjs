#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const obligationFirst = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portfolioRoot = path.dirname(obligationFirst);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const adopters = [
  {
    name: "EveryAILaw",
    root: path.join(portfolioRoot, "every-ai-law"),
    records: "docs/api/v1/of/records",
    profile: "docs/.well-known/obligation-first-naming-profile.jsonld",
    fingerprint: "tests/fixtures/of-contract-fingerprint.json",
    continuity: "tests/fixtures/of-identifier-continuity.json",
  },
  {
    name: "PubLedge",
    root: path.join(portfolioRoot, "publedge"),
    records: "docs/api/v1/of/records",
    profile: "docs/.well-known/obligation-first-naming-profile.jsonld",
    fingerprint: "tests/fixtures/of-contract-fingerprint.json",
    continuity: "tests/fixtures/of-identifier-continuity.json",
  },
  {
    name: "AI Incident Law",
    root: path.join(portfolioRoot, "ai-incident-law"),
    records: "api/v1/of/records",
    profile: ".well-known/obligation-first-naming-profile.jsonld",
    fingerprint: "tests/fixtures/of-contract-fingerprint.json",
    continuity: "tests/fixtures/of-identifier-continuity.json",
  },
];

let failed = false;

function run(label, command, args, options = {}) {
  console.log(`\n## ${label}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd || obligationFirst,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`${label}: ${result.error.message}`);
    failed = true;
    return;
  }
  if (result.status !== 0) failed = true;
}

for (const adopter of adopters) {
  run(`${adopter.name} source projection freshness`, process.execPath, [
    path.join(obligationFirst, "scripts/check-projection-freshness.mjs"),
    adopter.root, path.dirname(adopter.records),
    adopter.name === "AI Incident Law" ? "scripts/build-obligation-first.mjs" : "scripts/build.js",
  ]);
}

run(
  "Validate every adopter record",
  process.execPath,
  [
    path.join(obligationFirst, "scripts/validate-adopter-records.mjs"),
    ...adopters.map((adopter) => path.join(adopter.root, adopter.records)),
  ],
);

run(
  "Expand and round-trip every adopter JSON-LD record",
  process.execPath,
  [
    path.join(obligationFirst, "scripts/validate-jsonld-roundtrip.mjs"),
    ...adopters.map((adopter) => path.dirname(path.join(adopter.root, adopter.records))),
  ],
);

for (const adopter of adopters) {
  run(
    `${adopter.name} naming-profile range`,
    npm,
    ["run", "check:of"],
    {
      cwd: adopter.root,
      env: {
        OBLIGATION_FIRST_DIR: obligationFirst,
        OF_SCHEMA_DIR: path.join(obligationFirst, "schema"),
        CHECK_OF_REQUIRED: "1",
      },
    },
  );
  run(
    `${adopter.name} structural fingerprint`,
    process.execPath,
    [
      path.join(obligationFirst, "scripts/check-adopter-fingerprint.mjs"),
      "--records", path.join(adopter.root, adopter.records),
      "--profile", path.join(adopter.root, adopter.profile),
      "--expected", path.join(adopter.root, adopter.fingerprint),
    ],
  );
  run(
    `${adopter.name} identifier continuity`,
    process.execPath,
    [
      path.join(obligationFirst, "scripts/check-identifier-continuity.mjs"),
      "--records", path.join(adopter.root, adopter.records),
      "--baseline", path.join(adopter.root, adopter.continuity),
    ],
  );
}

run("Compare declared instrument correspondences", process.execPath, [
  path.join(obligationFirst, "scripts/check-entity-agreement.mjs"),
  "--required", process.env.OF_REQUIRED_ENTITY_PAIRS || path.join(portfolioRoot, "every-ai-law/tests/fixtures/of-required-entity-pairs.json"),
  ...adopters.map(adopter => path.join(adopter.root, adopter.records)),
]);

run(
  "Resolve every cross-repository anchor",
  process.execPath,
  [
    path.join(obligationFirst, "scripts/report-anchor-graph.mjs"),
    "--require-all-targets",
    ...adopters.map((adopter) => path.dirname(path.join(adopter.root, adopter.records))),
  ],
);

for (const repository of [{ name: "Obligation-First", root: obligationFirst }, ...adopters]) {
  run(`${repository.name} patch whitespace`, "git", ["diff", "--check"], { cwd: repository.root });
}

if (failed) {
  console.error("\nFederation verification failed.");
  process.exit(1);
}

console.log("\nFederation verification passed.");

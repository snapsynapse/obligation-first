#!/usr/bin/env node
/**
 * Assert that an adopter's published NamingProfile is written against the
 * Obligation-First version in this checkout.
 *
 * Usage:
 *   node scripts/check-adopter-of-version.mjs path/to/obligation-first-naming-profile.jsonld
 *   node scripts/check-adopter-of-version.mjs        # defaults to ./.well-known/... in cwd
 *
 * Adopters call this through a thin wrapper (see AI Incident Law, EveryAILaw,
 * and PubLedge `check:of`) so the parsing rule lives in one place. Generalized
 * from AI Incident Law's scripts/check-of-version.mjs, which was the original.
 *
 * Exit 0 when the profile's `appliesTo` range covers this checkout's version.
 * Exit 1 on a mismatch or an unparseable profile: either the adopter's profile
 * needs updating, or the wrong Obligation-First checkout is in use.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const profilePath = path.resolve(
  process.cwd(),
  process.argv[2] || path.join(".well-known", "obligation-first-naming-profile.jsonld"),
);

let profile;
try {
  profile = JSON.parse(await readFile(profilePath, "utf8"));
} catch (err) {
  console.error(`check-adopter-of-version: cannot read profile at ${profilePath}`);
  console.error(`  ${err.message}`);
  process.exit(1);
}

const appliesTo = profile.appliesTo;
const rangeMatch = String(appliesTo ?? "").match(/obligation-first\s+(\d+)\.(\d+)\.x/);
if (!rangeMatch) {
  console.error(`check-adopter-of-version: cannot parse appliesTo: ${JSON.stringify(appliesTo)}`);
  console.error(`  expected the form "obligation-first <major>.<minor>.x"`);
  process.exit(1);
}
const [, expectedMajor, expectedMinor] = rangeMatch;

const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const versionMatch = String(pkg.version ?? "").match(/^(\d+)\.(\d+)\./);
if (!versionMatch) {
  console.error(`check-adopter-of-version: cannot parse Obligation-First version: ${JSON.stringify(pkg.version)}`);
  process.exit(1);
}
const [, actualMajor, actualMinor] = versionMatch;

if (actualMajor !== expectedMajor || actualMinor !== expectedMinor) {
  console.error(
    `check-adopter-of-version: MISMATCH - profile expects "${appliesTo}" but this checkout is ${pkg.version}`,
  );
  console.error(`  profile: ${profilePath}`);
  console.error(`  Update the profile's appliesTo, or use the matching Obligation-First checkout.`);
  process.exit(1);
}

console.log(`check-adopter-of-version: OK - ${pkg.version} satisfies "${appliesTo}"`);

#!/usr/bin/env node
/**
 * Assert that an adopter's published NamingProfile is compatible with the
 * Obligation-First version in this checkout.
 *
 * Usage:
 *   node scripts/check-adopter-of-version.mjs path/to/obligation-first-naming-profile.jsonld
 *   node scripts/check-adopter-of-version.mjs        # defaults to ./.well-known/... in cwd
 *
 * Adopters call this through a thin wrapper (see AI Incident Law, EveryAILaw,
 * and PubLedge `check:of`) so the rule lives in one place. Range grammar and
 * its rationale are documented in lib/version-range.mjs.
 *
 * Exit 0 when this checkout's version satisfies the profile's declared range.
 * Exit 1 on an unsatisfied range or an unparseable profile.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseAppliesTo, parseVersion } from "./lib/version-range.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const profilePath = path.resolve(
  process.cwd(),
  process.argv[2] || path.join(".well-known", "obligation-first-naming-profile.jsonld"),
);

function fail(message, ...details) {
  console.error(`check-adopter-of-version: ${message}`);
  for (const line of details) console.error(`  ${line}`);
  process.exit(1);
}

let profile;
try {
  profile = JSON.parse(await readFile(profilePath, "utf8"));
} catch (err) {
  fail(`cannot read profile at ${profilePath}`, err.message);
}

const range = parseAppliesTo(profile.appliesTo);
if (!range) {
  fail(
    `cannot parse appliesTo: ${JSON.stringify(profile.appliesTo)}`,
    `expected "obligation-first >=<x.y.z> <<x.y.z>" or the pinned form "obligation-first <x>.<y>.x"`,
    `profile: ${profilePath}`,
  );
}

const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const actual = parseVersion(pkg.version);
if (!actual) fail(`cannot parse Obligation-First version: ${JSON.stringify(pkg.version)}`);

if (!range.test(actual)) {
  fail(
    `MISMATCH - this checkout is ${pkg.version}, outside the profile's range`,
    `profile:   ${profilePath}`,
    `appliesTo: "${profile.appliesTo}" (${range.display})`,
    `Widen the profile's appliesTo, or use an Obligation-First checkout in range.`,
  );
}

console.log(`check-adopter-of-version: OK - ${pkg.version} satisfies "${profile.appliesTo}"`);

#!/usr/bin/env node
/**
 * Validate the NamingProfile standard:
 *   - schema/naming-profile.schema.json compiles under AJV 2020-12
 *   - every worked profile under examples/naming-profiles/*.jsonld validates
 *     against it
 *   - every void:uriRegexPattern compiles as a regular expression, anchors
 *     end-to-end, and accepts its own void:uriSpace as a prefix
 *   - each profile's *-manifest.txt sidecar parses as a flat key:value file,
 *     carries the required fields, and its profile-sha256 / profile-bytes
 *     match the actual profile bytes (tamper-evidence, mirroring the
 *     assistant-guide manifest check)
 *
 * Run via `npm run validate:naming-profile`.
 */

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { parseKeyValueManifest } from "./lib/manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(repoRoot, "schema/naming-profile.schema.json");
const profilesDir = path.join(repoRoot, "examples/naming-profiles");

const REQUIRED_MANIFEST_KEYS = [
  "profile-path",
  "profile-version",
  "profile-sha256",
  "profile-bytes",
  "adopter",
  "spec",
  "spec-version-range",
  "canonical-url",
];

async function listProfiles() {
  let entries;
  try {
    entries = await readdir(profilesDir);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  return entries.filter((f) => f.endsWith(".jsonld")).sort();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkEntityPatterns(profile, file, failures) {
  for (const [entity, ep] of Object.entries(profile.entities || {})) {
    const pattern = ep["void:uriRegexPattern"];
    const space = ep["void:uriSpace"];
    let re;
    try {
      re = new RegExp(pattern);
    } catch (err) {
      failures.push(`${file}: ${entity}: void:uriRegexPattern does not compile (${err.message})`);
      continue;
    }
    if (!pattern.startsWith("^") || !pattern.endsWith("$")) {
      failures.push(`${file}: ${entity}: void:uriRegexPattern must anchor with ^ and $`);
    }
    // The pattern must literally namespace its own uriSpace: after the ^
    // anchor it begins with the regex-escaped uriSpace.
    if (space && !pattern.replace(/^\^/, "").startsWith(escapeRegex(space))) {
      failures.push(
        `${file}: ${entity}: void:uriRegexPattern does not begin with the escaped void:uriSpace (${space})`,
      );
    }
    const template = ep.uriTemplate;
    if (template) {
      if (space && !template.startsWith(space)) {
        failures.push(`${file}: ${entity}: uriTemplate must start with void:uriSpace (${space})`);
      }
      if (!/\{[^}]+\}/.test(template)) {
        failures.push(`${file}: ${entity}: uriTemplate has no RFC 6570 expansion ({...})`);
      } else {
        // A slug expanded from the template must satisfy the descriptive
        // regex — template (generative) and pattern (descriptive) agree.
        const sample = template.replace(/\{[^}]+\}/g, "sample-slug");
        if (!re.test(sample)) {
          failures.push(`${file}: ${entity}: uriTemplate expansion does not match void:uriRegexPattern`);
        }
      }
    }
  }
}

async function checkManifest(profileFile, profileBytes, failures) {
  const manifestFile = profileFile.replace(/\.jsonld$/, "-manifest.txt");
  const manifestPath = path.join(profilesDir, manifestFile);
  let raw;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch {
    failures.push(`${profileFile}: missing manifest sidecar ${manifestFile}`);
    return;
  }
  let manifest;
  try {
    manifest = parseKeyValueManifest(raw);
  } catch (err) {
    failures.push(`${manifestFile}: ${err.message}`);
    return;
  }
  for (const key of REQUIRED_MANIFEST_KEYS) {
    if (!(key in manifest)) failures.push(`${manifestFile}: missing required field ${key}`);
  }
  const sha = createHash("sha256").update(profileBytes).digest("hex");
  if (manifest["profile-sha256"] !== sha) {
    failures.push(`${manifestFile}: profile-sha256 stale — expected ${sha}`);
  }
  if (manifest["profile-bytes"] !== String(profileBytes.length)) {
    failures.push(`${manifestFile}: profile-bytes stale — expected ${profileBytes.length}`);
  }
}

export async function validateNamingProfiles() {
  const failures = [];
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);

  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    failures.push(`schema/naming-profile.schema.json: does not compile (${err.message})`);
    return failures;
  }

  const profiles = await listProfiles();
  if (profiles.length === 0) {
    failures.push("examples/naming-profiles: no *.jsonld worked profile found");
    return failures;
  }

  for (const file of profiles) {
    const fullPath = path.join(profilesDir, file);
    const bytes = await readFile(fullPath);
    let profile;
    try {
      profile = JSON.parse(bytes.toString("utf8"));
    } catch (err) {
      failures.push(`${file}: invalid JSON (${err.message})`);
      continue;
    }
    if (!validate(profile)) {
      for (const e of validate.errors) {
        failures.push(`${file}: ${e.instancePath || "/"} ${e.message}`);
      }
      continue;
    }
    checkEntityPatterns(profile, file, failures);
    await checkManifest(file, bytes, failures);
  }

  return failures;
}

async function main() {
  const failures = await validateNamingProfiles();
  if (failures.length > 0) {
    console.log("Naming-profile validation failed:");
    for (const f of failures) console.log(`- ${f}`);
    process.exit(1);
  }
  console.log("Naming profile schema, worked profiles, and manifests are valid.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

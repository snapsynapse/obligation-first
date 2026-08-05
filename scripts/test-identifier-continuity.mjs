#!/usr/bin/env node

import { OF_CONTEXT } from "./lib/adopter-kit.mjs";
import { CONTINUITY_DIAGNOSTIC_CODES as C, createContinuityBaseline, validateIdentifierContinuity } from "./lib/identifier-continuity.mjs";

const entry = (name, type = "of:Term", fields = {}) => ({ rel: `${name}.json`, record: { "@context": OF_CONTEXT, "@id": `https://example.com/${name}`, "@type": type, ...fields } });
const original = [entry("a"), entry("old", "of:Tombstone", { former_type: "of:Term" })];
const baseline = createContinuityBaseline({ adopter: "Fixture", release: "v1.0.0", entries: original });
const cases = [
  [C.REMOVED_ID, [entry("old", "of:Tombstone", { former_type: "of:Term" })], baseline],
  [C.TYPE_DRIFT, [entry("a", "of:Instrument"), entry("old", "of:Tombstone", { former_type: "of:Term" })], baseline],
  [C.TOMBSTONE_REMOVED, [entry("a")], baseline],
  [C.TOMBSTONE_REACTIVATED, [entry("a"), entry("old")], baseline],
  [C.ACTIVE_AND_TOMBSTONE, [entry("a"), entry("a", "of:Tombstone", { former_type: "of:Term" }), entry("old", "of:Tombstone", { former_type: "of:Term" })], baseline],
];
const failures = [];
for (const [code, records, fixtureBaseline] of cases) {
  const codes = validateIdentifierContinuity(records, fixtureBaseline).map((item) => item.code);
  if (!codes.includes(code)) failures.push(`${code}: bypass fixture was accepted (${codes.join(", ")})`);
}
const tombstoned = [entry("a", "of:Tombstone", { former_type: "of:Term", replaced_by: ["https://example.com/replacement"] }), entry("replacement"), entry("old", "of:Tombstone", { former_type: "of:Term" })];
if (validateIdentifierContinuity(tombstoned, baseline).length > 0) failures.push("valid Tombstone replacement was rejected");
const retiredBaseline = structuredClone(baseline);
retiredBaseline.reviewed_retirements = [{ id: "https://example.com/a", reviewed: "2026-08-04", reason: "merged record", replacement_status: "replaced", replaced_by: ["https://example.com/replacement"] }];
const retired = [entry("replacement"), entry("old", "of:Tombstone", { former_type: "of:Term" })];
if (validateIdentifierContinuity(retired, retiredBaseline).length > 0) failures.push("valid reviewed retirement was rejected");
if (failures.length > 0) { console.error("Identifier continuity regressions failed:"); for (const failure of failures) console.error(`- ${failure}`); process.exit(1); }
console.log("Identifier continuity removal, type, Tombstone, duplicate-state, and replacement checks passed.");

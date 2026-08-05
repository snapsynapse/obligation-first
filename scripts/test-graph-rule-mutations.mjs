#!/usr/bin/env node

import { GRAPH_DIAGNOSTIC_CODES, validateRecordGraphDetailed } from "./lib/adopter-kit.mjs";
import { validateExampleRecordSet } from "./validate-example-graphs.mjs";
import { validateAdopterRecordSet } from "./validate-adopter-records.mjs";
import { GRAPH_RULE_MUTATIONS } from "../tests/fixtures/graph-rule-mutations.mjs";

const failures = [];
const codeFromText = (message) => /^\[([^\]]+)\]/.exec(message)?.[1];
const codesFromText = (messages) => messages.map(codeFromText).filter(Boolean).sort();
const codesFromDetailed = (diagnostics) => diagnostics.map(({ code }) => code).sort();
const expectedCodes = Object.values(GRAPH_DIAGNOSTIC_CODES).sort();
const fixtureCodes = GRAPH_RULE_MUTATIONS.map(({ code }) => code).sort();

if (JSON.stringify(expectedCodes) !== JSON.stringify(fixtureCodes)) {
  failures.push("mutation fixture codes do not exactly cover GRAPH_DIAGNOSTIC_CODES");
}

const schemas = {
  ajv: { getSchema: () => () => true },
  schemaByFile: Object.fromEntries([
    "authority", "jurisdiction", "party", "instrument", "term", "obligation",
    "obligation-category", "proceeding", "allegation", "determination", "tombstone",
  ].map((name) => [`${name}.schema.json`, name])),
};

for (const fixture of GRAPH_RULE_MUTATIONS) {
  const validDetailed = codesFromDetailed(validateRecordGraphDetailed(fixture.valid));
  const invalidDetailed = codesFromDetailed(validateRecordGraphDetailed(fixture.invalid));
  const expected = [fixture.code];
  if (validDetailed.length > 0) failures.push(`${fixture.code}: valid pair emitted ${validDetailed.join(", ")}`);
  if (JSON.stringify(invalidDetailed) !== JSON.stringify(expected)) {
    failures.push(`${fixture.code}: invalid pair emitted ${invalidDetailed.join(", ") || "no diagnostic"}`);
  }

  const exampleCodes = codesFromText(validateExampleRecordSet("/tmp/fixture/records", fixture.invalid, { root: "/tmp" }).failures);
  const adopterCodes = codesFromText(validateAdopterRecordSet(fixture.invalid, schemas).graphFailures);
  if (JSON.stringify(exampleCodes) !== JSON.stringify(expected)) failures.push(`${fixture.code}: example path emitted ${exampleCodes.join(", ")}`);
  if (JSON.stringify(adopterCodes) !== JSON.stringify(expected)) failures.push(`${fixture.code}: adopter path emitted ${adopterCodes.join(", ")}`);
}

if (failures.length > 0) {
  console.error("Graph rule mutation checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`${GRAPH_RULE_MUTATIONS.length}/${expectedCodes.length} graph diagnostics covered by paired valid/invalid mutations across shared, example, and adopter paths.`);

#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { OF_CONTEXT } from "./lib/adopter-kit.mjs";
import { JSONLD_DIAGNOSTIC_CODES as C, validateJsonLdRecord } from "./lib/jsonld-contract.mjs";
import { JSONLD_ROUNDTRIP_FIXTURE, JSONLD_TOMBSTONE_FIXTURE } from "../tests/fixtures/jsonld-roundtrip.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contextDocument = JSON.parse(await readFile(path.join(repoRoot, "schema/context.jsonld"), "utf8"));
const expected = [
  "https://w3id.org/of/v1/Term",
  "https://w3id.org/semanticarts/ns/ontology/gist/ContractTerm",
  "https://w3id.org/semanticarts/ns/ontology/gist/isCategorizedBy",
  "https://w3id.org/of/v1/actorRoles",
  "https://w3id.org/of/v1/sourceCitation",
];
const failures = [];

const valid = await validateJsonLdRecord(JSONLD_ROUNDTRIP_FIXTURE, { contextDocument, expectedIris: expected });
if (valid.length > 0) failures.push(`valid extension fixture failed: ${valid.map((item) => item.code).join(", ")}`);
const tombstone = await validateJsonLdRecord(JSONLD_TOMBSTONE_FIXTURE, {
  contextDocument,
  expectedIris: ["https://w3id.org/of/v1/Tombstone", "https://w3id.org/of/v1/replacedBy"],
});
if (tombstone.length > 0) failures.push(`Tombstone fixture failed: ${tombstone.map((item) => item.code).join(", ")}`);

const remapped = structuredClone(JSONLD_ROUNDTRIP_FIXTURE);
remapped.rel = "fixture/remapped.json";
remapped.record["@context"] = [OF_CONTEXT, { issuedBy: { "@id": "https://evil.example/issuedBy", "@type": "@id" } }];
remapped.record.issuedBy = ["https://example.com/authority"];
const remapFailures = await validateJsonLdRecord(remapped, { contextDocument });
if (!remapFailures.some(({ code }) => code === C.CORE_TERM_REMAP)) failures.push("core term remapping was accepted");

const remote = structuredClone(JSONLD_ROUNDTRIP_FIXTURE);
remote.rel = "fixture/remote-context.json";
remote.record["@context"] = [OF_CONTEXT, "https://example.com/context.jsonld"];
const remoteFailures = await validateJsonLdRecord(remote, { contextDocument });
if (!remoteFailures.some(({ code }) => code === C.REMOTE_CONTEXT)) failures.push("unallowlisted remote context was accepted");

if (failures.length > 0) {
  console.error("JSON-LD contract checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("JSON-LD exact-IRI, extension, remapping, remote-context, Tombstone, and round-trip checks passed.");

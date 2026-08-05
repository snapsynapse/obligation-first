#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function migrateJurisdiction(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  if (value["@type"] !== "gist:Jurisdiction" || !value.ref) return value;
  const { ref, ...rest } = value;
  return { ...rest, "@type": "of:Jurisdiction", territorial_scope: [ref] };
}

export function migrateRecords(inputRecords) {
  const records = inputRecords.map(clone);
  const byId = new Map(records.map((record) => [record["@id"], record]));

  return records.map((record) => {
    if (record.jurisdiction) record.jurisdiction = migrateJurisdiction(record.jurisdiction);

    if (record["@type"] === "of:Proceeding" && record.issuedBy && !record.heardBy) {
      record.heardBy = asArray(record.issuedBy);
      delete record.issuedBy;
    }

    if (record["@type"] === "of:Term" && record.text_is_editorial === true && record.text) {
      record.summary = record.text;
      delete record.text;
      delete record.text_is_editorial;
    }

    if (["of:Obligation", "of:Requirement", "of:Restriction", "of:Permission", "of:Reparation"].includes(record["@type"])) {
      const categories = asArray(record.exactMatch).filter((id) => byId.get(id)?.["@type"] === "of:ObligationCategory");
      if (categories.length > 0) {
        record.isCategorizedBy = [...new Set([...asArray(record.isCategorizedBy), ...categories])];
        const remaining = asArray(record.exactMatch).filter((id) => !categories.includes(id));
        if (remaining.length > 0) record.exactMatch = remaining;
        else delete record.exactMatch;
      }
      delete record.implemented_by_terms;
    }

    if (record.everyailaw_deprecated === true || record.deprecated === true && record.everyailaw_replaced_by) {
      const formerType = record["@type"];
      const replacement = record.everyailaw_replaced_by || record.replaced_by;
      return {
        "@context": record["@context"],
        "@type": "of:Tombstone",
        "@id": record["@id"],
        id: record.id,
        deprecated: true,
        former_type: formerType,
        replaced_by: asArray(replacement),
        notes: record.notes
      };
    }

    return record;
  });
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error("Usage: node scripts/migrate-v0.5-to-v0.6.mjs INPUT.json OUTPUT.json");
    process.exit(2);
  }
  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const records = Array.isArray(input) ? input : input.records;
  if (!Array.isArray(records)) throw new Error("input must be an array or an object with a records array");
  const output = Array.isArray(input) ? migrateRecords(records) : { ...input, records: migrateRecords(records) };
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

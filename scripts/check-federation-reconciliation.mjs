#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { reconcileFederation } from "./lib/federation-reconciliation.mjs";

function option(argv, name) {
  const indexes = argv.map((arg, index) => arg === name ? index : -1).filter((index) => index >= 0);
  if (indexes.length > 1) throw new Error(`OF-RECONCILIATION-CONFIG: ${name} may appear only once`);
  const index = indexes[0] ?? -1;
  if (index < 0) return undefined;
  if (!argv[index + 1] || argv[index + 1].startsWith("--")) throw new Error(`OF-RECONCILIATION-CONFIG: ${name} requires a file`);
  return argv[index + 1];
}

try {
  const args = process.argv.slice(2);
  const evidencePath = option(args, "--evidence");
  const previousPath = option(args, "--previous");
  const asOf = option(args, "--as-of");
  if (!evidencePath || args.some((arg) => arg.startsWith("--") && !["--evidence", "--previous", "--as-of"].includes(arg))) throw new Error("OF-RECONCILIATION-CONFIG: usage: --evidence FILE [--previous FILE] [--as-of ISO]");
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const previous = previousPath ? JSON.parse(await readFile(previousPath, "utf8")) : null;
  const result = reconcileFederation(evidence, { previous, ...(asOf ? { asOf } : {}) });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "healthy") process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}

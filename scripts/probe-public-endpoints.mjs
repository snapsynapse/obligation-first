#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicProbeInventory } from "./lib/contract-inventory.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const versionFlag = args.indexOf("--version");
const packageVersion = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version;
const version = versionFlag === -1 ? packageVersion : args[versionFlag + 1];

if (!version || !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(version)) {
  console.error("probe-public-endpoints: --version requires a semantic version");
  process.exit(2);
}

const urls = await publicProbeInventory(root, version);
if (args.includes("--list")) {
  console.log(urls.join("\n"));
  process.exit(0);
}

let failed = false;
for (const url of urls) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 200) {
      console.log(`OK 200 ${url}`);
    } else {
      console.error(`FAIL ${response.status} ${url}`);
      failed = true;
    }
  } catch (error) {
    console.error(`FAIL network ${url}: ${error.message}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);

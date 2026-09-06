import { readdir } from "node:fs/promises";
import path from "node:path";

const SITE = "https://obligationfirst.org";
const REPOSITORY = "https://github.com/snapsynapse/obligation-first";

const FIXED_RELEASE_ARTIFACTS = [
  { path: "PROTOCOL.md", url: `${REPOSITORY}/blob/main/PROTOCOL.md` },
  { path: "docs/agents.json", url: `${SITE}/agents.json` },
  { path: "docs/llms.txt", url: `${SITE}/llms.txt` },
  { path: "docs/llms-full.txt", url: `${SITE}/llms-full.txt` },
  { path: "assistant-guide.txt", url: `${SITE}/.well-known/assistant-guide.txt` },
  { path: "assistant-guide-manifest.txt", url: `${SITE}/.well-known/assistant-guide-manifest.txt` },
  { path: "CHANGELOG.md", url: `${REPOSITORY}/blob/main/CHANGELOG.md` },
  { path: "package.json", url: `${REPOSITORY}/blob/main/package.json` },
  { path: "package-lock.json", url: `${REPOSITORY}/blob/main/package-lock.json` },
];

// Tooling contracts are separate from the normative /v1/schema inventory.
export function scopeArtifactInventory(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (major === 0 && (minor < 6 || (minor === 6 && patch < 4))) return [];
  return [
    "reference/contracts/scope-contract-v1.md",
    "reference/contracts/scope-inventory-v1.schema.json",
    ...["README.md", "records.json", "profile.json", "inventory.json", "baseline.json"]
      .map((file) => `reference/fixtures/scope-contract-v1/${file}`),
    "scripts/lib/scope-contract.mjs",
    "scripts/check-scope-contract.mjs",
    "scripts/check-scope-inventories.mjs",
    "scripts/test-scope-contract.mjs",
  ].map((artifactPath) => ({ path: artifactPath, url: `${REPOSITORY}/blob/main/${artifactPath}` }));
}

export async function schemaArtifactInventory(root) {
  const schemaDir = path.join(root, "schema");
  const schemaFiles = (await readdir(schemaDir))
    .filter((file) => file.endsWith(".schema.json"))
    .sort();

  return [
    { path: "schema/context.jsonld", url: `${SITE}/v1/context.jsonld` },
    ...schemaFiles.map((file) => ({
      path: `schema/${file}`,
      url: `${SITE}/v1/schema/${file}`,
    })),
  ];
}

export async function coreEndpointInventory(root) {
  return (await schemaArtifactInventory(root)).map((artifact) => artifact.url);
}

export async function releaseArtifactInventory(root, version) {
  const notesPath = `docs/releases/v${version}/RELEASE_NOTES-v${version}.md`;
  return [
    FIXED_RELEASE_ARTIFACTS[0],
    { path: notesPath, url: `${SITE}/releases/v${version}/RELEASE_NOTES-v${version}.md` },
    ...await schemaArtifactInventory(root),
    ...FIXED_RELEASE_ARTIFACTS.slice(1),
    ...scopeArtifactInventory(version),
    ...(version.localeCompare('0.6.5', 'en', { numeric: true }) >= 0 ? [
      'reference/contracts/qualified-time-fixture-v1.md',
      'reference/contracts/qualified-time-fixture-v1.schema.json',
      'reference/fixtures/qualified-time-v1/README.md',
      'reference/fixtures/qualified-time-v1/pending-amendment.json',
      'scripts/lib/qualified-time.mjs', 'scripts/check-qualified-time-adopter.mjs',
      'scripts/test-qualified-time.mjs', 'scripts/build-vocabulary.mjs',
      'scripts/test-vocabulary.mjs', 'docs/v1/vocabulary/index.html',
      'docs/v1/vocabulary/terms.json', 'reference/w3id/of/.htaccess',
      'reference/w3id/of/README.md',
    ].map(p => ({ path: p, url: `${REPOSITORY}/blob/main/${p}` })) : []),
  ];
}

export async function publicProbeInventory(root, version) {
  return [
    ...await coreEndpointInventory(root),
    `${SITE}/llms.txt`,
    `${SITE}/agents.json`,
    `${SITE}/sitemap.xml`,
    `${SITE}/robots.txt`,
    `${SITE}/releases/v${version}/`,
  ];
}

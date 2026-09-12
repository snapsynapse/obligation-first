#!/usr/bin/env node
/** Synchronize release metadata from package.json through explicit managed surfaces. */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { isValidReleaseDate } from "./lib/release-metadata.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function versionForms(root = repoRoot) {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const full = pkg.version;
  const core = full.replace(/-.*$/, "");
  const mm = core.split(".").slice(0, 2).join(".");
  return { full, vfull: `v${full}`, badge: `v${full.replace(/-/g, "--")}`, core, vcore: `v${core}`, vmm: `v${mm}` };
}

export const VERSION_SURFACES = Object.freeze([
  ["MANIFEST.yaml", "# of-version: manifest-bundle", "full"],
  ["SECURITY.md", "<!-- of-version: security-supported -->", "vfull"],
  ["PROTOCOL.md", "# of-version: protocol-frontmatter", "full"],
  ["PROTOCOL.md", "<!-- of-version: protocol-status -->", "vfull"],
  ["reference/review/external-review-questions.md", "<!-- of-version: external-review-status -->", "vfull"],
  ["INTENT.md", "# of-version: intent-frontmatter", "full"],
  ["README.md", "<!-- of-version: readme-badge -->", "badge"],
  ["README.md", "<!-- of-version: readme-live -->", "vfull"],
  ["README.md", "<!-- of-version: readme-release-url -->", "release-url"],
  ["README.md", "<!-- of-version: readme-current -->", "vfull"],
  ["ROADMAP.md", "<!-- of-version: roadmap-current -->", "vfull"],
  ["CLAUDE.md", "<!-- of-version: claude-current -->", "vfull"],
  ["CLAUDE.md", "<!-- of-version: claude-state-current -->", "vfull"],
  ["PROJECT_CONTEXT.md", "<!-- of-version: project-context-current -->", "vfull"],
  ["docs/llms.txt", "<!-- of-version: llms-current -->", "vfull"],
  ["docs/llms.txt", "<!-- of-version: llms-release-url -->", "release-url"],
  ["docs/llms-full.txt", "<!-- of-version: llms-full-current -->", "vfull"],
  ["docs/llms-full.txt", "<!-- of-version: llms-full-release-url -->", "release-url"],
  ["docs/v1/index.html", "<!-- of-version: namespace-release-line -->", "vfull"],
  ["docs/index.html", "<!-- of-version: homepage-byline -->", "vfull"],
  ["docs/index.html", "<!-- of-version: homepage-hook-minor -->", "minor"],
  ["docs/index.html", "<!-- of-version: homepage-cta-minor -->", "minor"],
  ["docs/index.html", "<!-- of-version: homepage-schema-minor -->", "minor"],
  ["docs/index.html", "<!-- of-version: homepage-bind-heading-minor -->", "minor"],
  ["docs/index.html", "<!-- of-version: homepage-bind-copy-minor -->", "minor"],
  ["docs/index.html", "<!-- of-version: homepage-adopters-minor -->", "minor"],
  ["docs/index.html", "<!-- of-version: homepage-canonical -->", "vfull"],
  ["docs/index.html", "<!-- of-version: homepage-footer -->", "vfull"],
]);

const IMPLEMENTATION_STATUS_START = "<!-- implementation-status:start -->";
const IMPLEMENTATION_STATUS_END = "<!-- implementation-status:end -->";

export function implementationSummary(version) {
  return `The v${version} reference package includes scope continuity evaluation. F14 qualified-time evaluation is released offline reference tooling: expected/fallback branches and evidence/date boundaries are tested, while the v0.6 record schema and production serialization are unchanged. These fixtures do not determine legal applicability or predecessor operative history.`;
}

export const STATUS_SURFACES = Object.freeze([
  ["README.md", (summary) => summary],
  ["docs/index.html", (summary) => `    <p>${summary}</p>`],
  ["docs/v1/index.html", (summary) => `<p><a href="/evaluation-status.json">Evaluation implementation status</a>. ${summary}</p>`],
  ["docs/llms.txt", (summary) => `${summary} Machine status: https://obligationfirst.org/evaluation-status.json`],
  ["docs/llms-full.txt", (summary) => `${summary} Machine status: https://obligationfirst.org/evaluation-status.json`],
]);

const FULL = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/;
const VFULL = /v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/;
const VMINOR = /v\d+\.\d+(?!\.\d)/g;
const RELEASE_URL = /\/releases\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\//g;

function replaceTarget(line, mode, forms) {
  if (mode === "full") return line.replace(FULL, forms.full);
  if (mode === "vfull") return line.replace(VFULL, forms.vfull);
  if (mode === "badge") return line.replace(/spec-v\d+\.\d+\.\d+(?:--[0-9A-Za-z.-]+)?-orange/, `spec-${forms.badge}-orange`);
  if (mode === "minor") {
    const matches = [...line.matchAll(VMINOR)];
    const last = matches.at(-1);
    return last ? `${line.slice(0, last.index)}${forms.vmm}${line.slice(last.index + last[0].length)}` : line;
  }
  if (mode === "release-url") return line.replace(RELEASE_URL, `/releases/${forms.vfull}/`);
  throw new Error(`unknown version surface mode: ${mode}`);
}

export function rewriteManagedSurface(content, { marker, mode }, forms) {
  const lines = content.split("\n");
  const matches = lines.flatMap((line, index) => line.includes(marker) ? [index] : []);
  if (matches.length !== 1) return { content, problem: `${marker}: expected exactly one marker, found ${matches.length}` };
  const target = matches[0] + 1;
  if (target >= lines.length) return { content, problem: `${marker}: marker has no managed line` };
  const rewritten = replaceTarget(lines[target], mode, forms);
  if (rewritten === lines[target] && !lines[target].includes(mode === "full" ? forms.full : mode === "minor" ? forms.vmm : forms.vfull)) {
    return { content, problem: `${marker}: managed line has no ${mode} token` };
  }
  lines[target] = rewritten;
  return { content: lines.join("\n"), targetLine: target };
}

export function rewriteManagedBlock(content, { startMarker, endMarker, replacement }) {
  const lines = content.split("\n");
  const starts = lines.flatMap((line, index) => line.includes(startMarker) ? [index] : []);
  const ends = lines.flatMap((line, index) => line.includes(endMarker) ? [index] : []);
  if (starts.length !== 1) return { content, problem: `${startMarker}: expected exactly one marker, found ${starts.length}` };
  if (ends.length !== 1) return { content, problem: `${endMarker}: expected exactly one marker, found ${ends.length}` };
  if (ends[0] <= starts[0]) return { content, problem: `${startMarker}: end marker must follow start marker` };
  const replacementLines = replacement.split("\n");
  lines.splice(starts[0] + 1, ends[0] - starts[0] - 1, ...replacementLines);
  return {
    content: lines.join("\n"),
    targetLines: replacementLines.map((_, index) => starts[0] + 1 + index),
  };
}

function rewriteJson(file, content, forms) {
  JSON.parse(content);
  if (file === "docs/agents.json") {
    const versionLines = content.match(/^\s*"version":\s*"[^"]+",?$/gm) || [];
    const releaseLines = content.match(/^\s*"release_package":\s*"[^"]+",?$/gm) || [];
    if (versionLines.length !== 1 || releaseLines.length !== 1) throw new Error(`${file}: expected exactly one version and release_package metadata field`);
    return content
      .replace(/^([ \t]*"version":\s*")([^"]+)(",?)$/m, `$1${forms.vfull}$3`)
      .replace(/^([ \t]*"release_package":\s*")([^"]+)(",?)$/m, (_, before, url, after) => `${before}${url.replace(RELEASE_URL, `/releases/${forms.vfull}/`)}${after}`);
  }
  const comments = content.match(/^\s*"_comment":\s*"[^"]+",?$/gm) || [];
  if (comments.length !== 1) throw new Error(`${file}: expected exactly one _comment version metadata field`);
  return content.replace(/^([ \t]*"_comment":\s*")([^"]+)(",?)$/m, (_, before, comment, after) => `${before}${comment.replace(VFULL, forms.vfull)}${after}`);
}

function rewriteEmbeddedMetadata(content, forms) {
  const lines = content.split("\n");
  const marker = "<!-- of-version: homepage-howto-minor -->";
  const matches = lines.flatMap((line, index) => line.includes(marker) ? [index] : []);
  if (matches.length !== 1) return { content, problem: `docs/index.html: expected exactly one ${marker} marker, found ${matches.length}` };
  const end = lines.findIndex((line, index) => index > matches[0] && line.includes("</script>"));
  if (end === -1) return { content, problem: "docs/index.html: homepage HowTo marker has no closing script" };
  const targets = [];
  for (let index = matches[0] + 1; index < end; index += 1) if ([...lines[index].matchAll(VMINOR)].length > 0) targets.push(index);
  if (targets.length === 0) return { content, problem: "docs/index.html: homepage HowTo marker has no version-bearing line" };
  lines[targets[0]] = replaceTarget(lines[targets[0]], "minor", forms);
  return { content: lines.join("\n"), targetLine: targets[0] };
}

const CLAIM = /\bv\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\b.{0,50}\b(is the current|release is live|current released specification)\b|\b(live|Status:|currently on the)\b.{0,50}\bv\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\b/i;

export function staleClaims(content, managedLines = new Set()) {
  const problems = [];
  for (const [index, line] of content.split("\n").entries()) {
    if (managedLines.has(index)) continue;
    if (CLAIM.test(line) || (/\bcurrent\b/i.test(line) && RELEASE_URL.test(line))) problems.push(index + 1);
    RELEASE_URL.lastIndex = 0;
  }
  return problems;
}

function rewriteImplementationStatus(content, forms, dateIso) {
  const status = JSON.parse(content);
  if (typeof status.released_reference_version !== "string" || typeof status.status_as_of !== "string") {
    throw new Error("reference/implementation-status.json: expected released_reference_version and status_as_of string fields");
  }
  status.released_reference_version = forms.full;
  status.status_as_of = dateIso;
  return `${JSON.stringify(status, null, 2)}\n`;
}

function rewriteBundleDate(content, dateIso) {
  const matches = content.match(/^bundle_date:[ \t]*\d{4}-\d{2}-\d{2}[ \t]*$/gm) || [];
  if (matches.length !== 1) throw new Error(`MANIFEST.yaml: expected exactly one bundle_date field, found ${matches.length}`);
  return content.replace(/^bundle_date:[ \t]*\d{4}-\d{2}-\d{2}[ \t]*$/m, `bundle_date: ${dateIso}`);
}

async function transformedFiles(root, forms, dateIso) {
  const byFile = new Map();
  const managedLines = new Map();
  for (const [file, marker, mode] of VERSION_SURFACES) {
    if (!byFile.has(file)) byFile.set(file, await readFile(path.join(root, file), "utf8"));
    const result = rewriteManagedSurface(byFile.get(file), { marker, mode }, forms);
    if (result.problem) throw new Error(`${file}: ${result.problem}`);
    byFile.set(file, result.content);
    if (!managedLines.has(file)) managedLines.set(file, new Set());
    managedLines.get(file).add(result.targetLine);
  }
  byFile.set("MANIFEST.yaml", rewriteBundleDate(byFile.get("MANIFEST.yaml"), dateIso));
  const summary = implementationSummary(forms.full);
  for (const [file, render] of STATUS_SURFACES) {
    if (!byFile.has(file)) byFile.set(file, await readFile(path.join(root, file), "utf8"));
    const result = rewriteManagedBlock(byFile.get(file), {
      startMarker: IMPLEMENTATION_STATUS_START,
      endMarker: IMPLEMENTATION_STATUS_END,
      replacement: render(summary),
    });
    if (result.problem) throw new Error(`${file}: ${result.problem}`);
    byFile.set(file, result.content);
    if (!managedLines.has(file)) managedLines.set(file, new Set());
    for (const targetLine of result.targetLines) managedLines.get(file).add(targetLine);
  }
  for (const file of ["schema/context.jsonld", "docs/v1/context.jsonld", "docs/agents.json"]) {
    const content = await readFile(path.join(root, file), "utf8");
    byFile.set(file, rewriteJson(file, content, forms));
  }
  const embedded = rewriteEmbeddedMetadata(byFile.get("docs/index.html"), forms);
  if (embedded.problem) throw new Error(embedded.problem);
  byFile.set("docs/index.html", embedded.content);
  managedLines.get("docs/index.html").add(embedded.targetLine);
  byFile.set("docs/index.html", updateDate(byFile.get("docs/index.html"), dateIso));
  const status = rewriteImplementationStatus(await readFile(path.join(root, "reference/implementation-status.json"), "utf8"), forms, dateIso);
  byFile.set("reference/implementation-status.json", status);
  byFile.set("docs/evaluation-status.json", status);
  for (const [file, content] of byFile) {
    const stale = staleClaims(content, managedLines.get(file) || new Set());
    if (stale.length > 0) throw new Error(`${file}: unmanaged current-version claim or release URL at line(s) ${stale.join(", ")}`);
  }
  return byFile;
}

async function guideProblems(root, forms) {
  const problems = [];
  const expectedGuideRange = `applies-to: obligation-first >=${forms.vmm.slice(1)}.0 <${Number(forms.core.split(".")[0])}.${Number(forms.core.split(".")[1]) + 1}.0`;
  for (const file of ["assistant-guide.txt", "docs/.well-known/assistant-guide.txt"]) {
    const guide = await readFile(path.join(root, file), "utf8");
    if (!guide.includes(expectedGuideRange)) problems.push(`${file}: expected current-minor guide scope ${expectedGuideRange}; update the guide only with guide authority`);
  }
  return problems;
}

async function checkedDate(root, requestedDate) {
  const manifest = await readFile(path.join(root, "MANIFEST.yaml"), "utf8");
  const matches = [...manifest.matchAll(/^bundle_date:[ \t]*(\S+)[ \t]*$/gm)];
  if (matches.length !== 1) throw new Error(`MANIFEST.yaml: expected exactly one bundle_date field, found ${matches.length}`);
  const dateIso = requestedDate ?? matches[0][1];
  if (!isValidReleaseDate(dateIso)) throw new Error(`${requestedDate === undefined ? "MANIFEST.yaml bundle_date" : "--date"} must be a real YYYY-MM-DD calendar date`);
  return dateIso;
}

export async function checkVersions(root = repoRoot, options = {}) {
  const forms = await versionForms(root);
  let dateIso;
  try { dateIso = await checkedDate(root, options.date); } catch (error) { return [error.message]; }
  let transformed;
  try { transformed = await transformedFiles(root, forms, dateIso); } catch (error) { return [error.message]; }
  const problems = [];
  for (const [file, expected] of transformed) {
    const actual = await readFile(path.join(root, file), "utf8");
    if (actual !== expected) problems.push(`${file}: version, date, or implementation-status drift; run node scripts/sync-version.mjs to match package.json (${forms.full})`);
  }
  problems.push(...await guideProblems(root, forms));
  return problems;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function replaceExactlyOne(content, pattern, replacement, label) {
  const matches = content.match(pattern) || [];
  if (matches.length !== 1) throw new Error(`docs/index.html: expected exactly one ${label} date surface, found ${matches.length}`);
  return content.replace(pattern, replacement);
}

function updateDate(content, iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const human = `${MONTHS[month - 1]} ${day}, ${year}`;
  let updated = replaceExactlyOne(content, /(article:modified_time" content=")\d{4}-\d{2}-\d{2}(T)/g, `$1${iso}$2`, "article:modified_time");
  updated = replaceExactlyOne(updated, /("dateModified": ")\d{4}-\d{2}-\d{2}(")/g, `$1${iso}$2`, "JSON-LD dateModified");
  updated = replaceExactlyOne(updated, /(Updated <time datetime=")\d{4}-\d{2}-\d{2}(">)[^<]*(<\/time>)/g, `$1${iso}$2${human}$3`, "visible updated");
  return replaceExactlyOne(updated, /(Last revision: <time datetime=")\d{4}-\d{2}-\d{2}("\>)\d{4}-\d{2}-\d{2}(<\/time>)/g, `$1${iso}$2${iso}$3`, "last revision");
}

export async function syncVersion(root = repoRoot, dateIso = new Date().toISOString().slice(0, 10)) {
  if (!isValidReleaseDate(dateIso)) throw new Error("--date must be a real YYYY-MM-DD calendar date");
  const forms = await versionForms(root);
  const guides = await guideProblems(root, forms);
  if (guides.length > 0) throw new Error(`Version sync refused before writing:\n${guides.map((problem) => `- ${problem}`).join("\n")}`);
  const transformed = await transformedFiles(root, forms, dateIso);
  for (const [file, content] of transformed) await writeFile(path.join(root, file), content);
  console.log(`Synced version ${forms.full} and date ${dateIso} across ${transformed.size} files.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const dateIndexes = args.flatMap((arg, index) => arg === "--date" ? [index] : []);
  const allowed = new Set(["--check", "--date"]);
  const unknown = args.filter((arg, index) => !allowed.has(arg) && !dateIndexes.includes(index - 1));
  if (dateIndexes.length > 1 || unknown.length > 0 || (dateIndexes.length === 1 && !args[dateIndexes[0] + 1])) {
    console.error("sync-version: usage: node scripts/sync-version.mjs [--check] [--date YYYY-MM-DD]");
    process.exit(2);
  }
  const requested = dateIndexes.length === 1 ? args[dateIndexes[0] + 1] : undefined;
  if (requested !== undefined && !isValidReleaseDate(requested)) {
    console.error("sync-version: --date must be a real YYYY-MM-DD calendar date");
    process.exit(2);
  }
  if (check) {
    const problems = await checkVersions(repoRoot, { date: requested });
    if (problems.length > 0) { console.error(`Version drift:\n${problems.map((problem) => `- ${problem}`).join("\n")}`); process.exit(1); }
    console.log(`Version strings, dates, and implementation status are in sync with package.json${requested ? ` for ${requested}` : ""}.`);
  } else {
    await syncVersion(repoRoot, requested);
  }
}

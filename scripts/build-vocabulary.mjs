#!/usr/bin/env node
// F13 documentation targets and proposed w3id rules, derived from the existing context.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export function vocabulary(context) {
  const terms = new Map();
  for (const [alias, value] of Object.entries(context['@context'])) {
    if (alias.startsWith('@')) continue;
    const id = typeof value === 'object' && value ? value['@id'] : value;
    if (typeof id !== 'string') continue;
    const term = id.startsWith('of:') ? id.slice(3) : id.startsWith('https://w3id.org/of/v1/') ? id.slice('https://w3id.org/of/v1/'.length) : null;
    if (!term) continue;
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(term)) throw new Error(`Unexpected vocabulary suffix ${term}`);
    terms.set(term, [...(terms.get(term) || []), alias]);
  }
  return [...terms].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([term, aliases]) => ({ term, aliases: aliases.sort(), iri: `https://w3id.org/of/v1/${term}`, target: `https://obligationfirst.org/v1/vocabulary/#${term}` }));
}
export function redirects(terms, schemas) {
  const lines = ['Options +FollowSymLinks', 'RewriteEngine On', '', '# Documentation resolution only; existing vocabulary IRIs remain unchanged.', 'RewriteRule ^v1/?$ https://obligationfirst.org/v1/ [R=302,L]', 'RewriteRule ^v1/context\\.jsonld$ https://obligationfirst.org/v1/context.jsonld [R=302,L]', 'RewriteRule ^v1/schema/?$ https://obligationfirst.org/v1/schema/ [R=302,L]'];
  for (const schema of schemas) lines.push(`RewriteRule ^v1/schema/${schema.replaceAll('.', '\\.')}\$ https://obligationfirst.org/v1/schema/${schema} [R=302,L]`);
  for (const { term, target } of terms) lines.push(`RewriteRule ^v1/${term}$ ${target} [R=303,L,NE]`);
  lines.push('', '# Unrecognized paths have no redirect rule and remain 404.');
  return lines.join('\n') + '\n';
}
export async function outputs() {
  const { readdir } = await import('node:fs/promises');
  const terms = vocabulary(JSON.parse(await readFile(path.join(root, 'schema/context.jsonld'), 'utf8')));
  const schemas = (await readdir(path.join(root, 'schema'))).filter(f => f.endsWith('.schema.json')).sort();
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Obligation-First vocabulary reference</title><link rel="canonical" href="https://obligationfirst.org/v1/vocabulary/"><style>body{font:18px/1.6 system-ui;max-width:60rem;margin:auto;padding:2rem;color:#172033;background:#fff}a{color:#1649a5}section{border-top:1px solid #ccc;padding:1rem 0}code{overflow-wrap:anywhere}</style></head><body><main><a href="/v1/">Namespace index</a><h1>Vocabulary reference</h1><p>These documentation targets describe the names already mapped by the JSON-LD context. They add no vocabulary or legal semantics. The proposed w3id redirect contribution has not been submitted; permanent-IRI resolution remains pending.</p><p>Consult the <a href="/v1/context.jsonld">context</a>, <a href="/v1/schema/">schemas</a> and <a href="https://github.com/snapsynapse/obligation-first/blob/main/PROTOCOL.md">protocol</a> for definitions and constraints. JSON aliases may differ from expanded IRI suffixes. A documentation redirect is not a machine-readable ontology or proof of applicability.</p>${terms.map(t => `<section id="${t.term}"><h2>${t.term}</h2><p>Vocabulary IRI: <code>${t.iri}</code></p><p>Context aliases: ${t.aliases.map(a => `<code>${esc(a)}</code>`).join(', ')}</p></section>`).join('\n')}</main></body></html>\n`;
  return { 'docs/v1/vocabulary/index.html': html, 'docs/v1/vocabulary/terms.json': JSON.stringify({ status: 'targets-ready-external-filing-pending', terms }, null, 2) + '\n', 'reference/w3id/of/.htaccess': redirects(terms, schemas) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [rel, value] of Object.entries(await outputs())) {
    const file = path.join(root, rel);
    if (process.argv.includes('--check')) { if (await readFile(file, 'utf8') !== value) throw new Error(`F13 drift: ${rel}`); }
    else { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, value); }
  }
}

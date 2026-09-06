import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildAdopterFingerprint, RELATION_FIELDS } from './lib/adopter-fingerprint.mjs';

// The expected inventory comes from the schema and JSON-LD contract, never
// from RELATION_FIELDS. These exclusions document the bounded top-level
// record-edge scope; they are not claims that the excluded values are hashed.
const EXCLUSIONS = {
  '@id': 'Record identity is retained separately in id_inventory.',
  source: 'Top-level source evidence is retained in provenance_claims, not exact_edges.',
  asserted_by_adopter: 'Top-level asserting-adopter evidence is retained in provenance_claims.',
  adopter: 'Naming-profile identity is retained as fingerprint.adopter, not a record edge.',
  'void:uriSpace': 'Nested naming-profile namespace metadata is outside record-edge capture.',
  jurisdiction: 'Exact scope values and local jurisdiction references are checked by the separate versioned scope contract; fingerprint v2 retains shape only.',
  instrument_ref: 'Nested authority_basis/binding_basis references need path-qualified capture; outside P1 top-level edges.',
  party: 'Nested actor_roles.party needs path-qualified capture; top-level parties and role IRIs are captured.',
  obligation: 'Nested remedy.obligation needs path-qualified capture; outside P1 top-level edges.',
  uri: 'Nested executableEncoding artifact references are outside P1 top-level record edges.',
  akn_uri: 'External legal identifier crosswalk, outside P1 exact record-edge inventory.',
  eli_uri: 'External legal identifier crosswalk, outside P1 exact record-edge inventory.',
  ecli_uri: 'External legal identifier crosswalk, outside P1 exact record-edge inventory.',
  urn_lex: 'External legal identifier crosswalk, outside P1 exact record-edge inventory.',
};

function discoverIriFields(schemas, context) {
  const fields = new Set(Object.entries(context)
    .filter(([, definition]) => definition?.['@type'] === '@id')
    .map(([field]) => field));
  const byId = new Map(schemas.map(schema => [schema.$id, schema]));

  function acceptsIri(shape, document, visited = new Set()) {
    if (!shape || typeof shape !== 'object') return false;
    if (shape.format === 'uri' || shape.format === 'iri') return true;
    if (shape.$ref) {
      const [base, fragment = ''] = shape.$ref.split('#');
      const target = base ? byId.get(new URL(base, document.$id).href) : document;
      assert.ok(target, `unresolved schema reference ${shape.$ref}`);
      const identity = `${target.$id}#${fragment}`;
      if (!visited.has(identity)) {
        const next = new Set([...visited, identity]);
        const resolved = fragment.split('/').slice(1).reduce((node, part) =>
          node?.[part.replaceAll('~1', '/').replaceAll('~0', '~')], target);
        assert.ok(resolved, `unresolved schema pointer ${identity}`);
        if (acceptsIri(resolved, target, next)) return true;
      }
    }
    return ['anyOf', 'oneOf', 'allOf'].some(key =>
      shape[key]?.some(child => acceptsIri(child, document, visited)))
      || acceptsIri(shape.items, document, visited);
  }

  function walk(node, document) {
    if (!node || typeof node !== 'object') return;
    for (const [field, definition] of Object.entries(node.properties || {})) {
      if (acceptsIri(definition, document)) fields.add(field);
    }
    for (const child of Object.values(node)) walk(child, document);
  }
  for (const schema of schemas) walk(schema, schema);
  return fields;
}

function assertCoverage(authoritativeFields, implementation) {
  const implemented = new Set(implementation);
  assert.equal(implemented.size, implementation.length, 'duplicate implementation relation');
  for (const [field, reason] of Object.entries(EXCLUSIONS)) {
    assert.ok(reason.length > 20, `${field} needs an explicit exclusion rationale`);
    assert.ok(authoritativeFields.has(field), `stale exclusion: ${field}`);
    assert.ok(!implemented.has(field), `${field} is both captured and excluded`);
  }
  const expected = [...authoritativeFields].filter(field => !Object.hasOwn(EXCLUSIONS, field)).sort();
  assert.deepEqual([...implemented].sort(), expected,
    'Schema/context IRI fields require exact-edge capture or an explicit justified exclusion');
  return expected;
}

const schemaDir = new URL('../schema/', import.meta.url);
const schemas = await Promise.all((await readdir(schemaDir))
  .filter(file => file.endsWith('.schema.json'))
  .map(async file => JSON.parse(await readFile(new URL(file, schemaDir), 'utf8'))));
const context = JSON.parse(await readFile(new URL('context.jsonld', schemaDir), 'utf8'))['@context'];
const authoritativeFields = discoverIriFields(schemas, context);
const expected = assertCoverage(authoritativeFields, RELATION_FIELDS);

// Mutation: dropping a known predicate from the implementation cannot shrink
// the expected inventory along with the implementation's own test loop.
assert.throws(() => assertCoverage(authoritativeFields,
  RELATION_FIELDS.filter(field => field !== 'exactMatch')), /require exact-edge capture/);

// New schema-only or context-only IRI predicates each require classification.
const extraSchema = {
  $id: 'https://example.com/relation-coverage.schema.json',
  properties: { future_schema_relation: { $ref: `${schemas.find(schema => schema.$id.endsWith('/common.schema.json')).$id}#/$defs/iriSet` } },
};
assert.throws(() => assertCoverage(discoverIriFields([...schemas, extraSchema], context), RELATION_FIELDS),
  /require exact-edge capture/);
assert.throws(() => assertCoverage(discoverIriFields(schemas, {
  ...context, future_context_relation: { '@id': 'of:futureContextRelation', '@type': '@id' },
}), RELATION_FIELDS), /require exact-edge capture/);

// Exercise the actual writer against the independently discovered inventory.
const temporary = await mkdtemp(path.join(tmpdir(), 'of-relation-coverage-'));
try {
  const recordsDir = path.join(temporary, 'records');
  const profilePath = path.join(temporary, 'profile.json');
  await mkdir(recordsDir);
  await writeFile(profilePath, JSON.stringify({ adopter: 'https://example.com/', entities: {} }));
  const file = path.join(recordsDir, 'record.json');
  for (const field of expected) {
    const record = { '@id': 'https://example.com/record', '@type': 'of:Determination', [field]: ['https://example.com/target-a'] };
    await writeFile(file, JSON.stringify(record));
    const before = await buildAdopterFingerprint({ recordsDir, profilePath });
    record[field] = ['https://example.com/target-b'];
    await writeFile(file, JSON.stringify(record));
    const after = await buildAdopterFingerprint({ recordsDir, profilePath });
    assert.notEqual(before.exact_edges_sha256, after.exact_edges_sha256, `${field} must retain its exact target`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

console.log(`Independent relation coverage: ${expected.length} captured predicates, ${Object.keys(EXCLUSIONS).length} justified exclusions; omitted/new relation mutations rejected.`);

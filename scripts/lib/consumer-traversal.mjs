import { compareTermBoundaries } from './term-boundaries.mjs';
import { isDeepStrictEqual } from 'node:util';
const asArray = value => Array.isArray(value) ? value : value == null ? [] : [value];
const supported = new Set(['anchors', 'isCategorizedBy', 'parent_instrument', 'creates', 'replaced_by']);

export function traverseConsumerCase(records, fixture) {
  const byId = new Map();
  for (const record of records) {
    if (byId.has(record['@id'])) throw new Error(`Duplicate traversal identity ${record['@id']}`);
    byId.set(record['@id'], record);
  }
  const errors = [];
  const layers = [[fixture.start]];
  const visited = new Set(layers[0]);
  if (!byId.has(fixture.start)) errors.push(`Missing starting record ${fixture.start}`);
  for (const [index, step] of fixture.steps.entries()) {
    if (!supported.has(step.predicate)) throw new Error(`Unsupported traversal predicate ${step.predicate}`);
    const from = step.from ?? index;
    if (!Number.isInteger(from) || from < 0 || from >= layers.length) throw new Error('Traversal must start from a prior layer');
    if (!['forward', 'inverse'].includes(step.direction)) throw new Error('Explicit traversal direction required');
    const sources = new Set(layers[from]);
    const targets = new Set();
    if (step.direction === 'inverse') {
      for (const record of records) if (asArray(record[step.predicate]).some(value => sources.has(value))) targets.add(record['@id']);
    } else for (const source of sources) {
      for (const target of asArray(byId.get(source)?.[step.predicate])) {
        if (typeof target !== 'string') errors.push(`Non-IRI traversal target at ${source}/${step.predicate}`);
        else targets.add(target);
      }
    }
    const actual = [...targets].sort();
    for (const target of actual) {
      visited.add(target);
      if (!byId.has(target)) errors.push(`Unresolved traversal target ${target}`);
    }
    if (!Array.isArray(step.expected) || new Set(step.expected).size !== step.expected.length) throw new Error('Expected traversal set must contain unique IRIs');
    if (JSON.stringify(actual) !== JSON.stringify([...step.expected].sort())) errors.push(`Step ${index + 1} expected IRI set differs`);
    layers.push(actual);
  }
  const boundaries = Object.fromEntries([...visited].sort().map(id => {
    const record = byId.get(id);
    return [id, Object.fromEntries(['projection_basis', 'admission_status', 'source_review_conflicts', 'source_review_unresolved', 'canonical_source_conflicted', 'pub:source_review_state', 'pub:source_review_unresolved',
      'lifecycle_status', 'operative_status', 'enforcement_status', 'evidence_type', 'source']
      .map(field => [field, record && Object.hasOwn(record, field) ? record[field] : null]))];
  }));
  for (const [id, expected] of Object.entries(fixture.expected_boundaries || {})) {
    if (!visited.has(id)) errors.push(`Boundary assertion is not on the traversal: ${id}`);
    for (const [field, value] of Object.entries(expected)) {
      if (!Object.hasOwn(boundaries[id] || {}, field) || JSON.stringify(boundaries[id][field]) !== JSON.stringify(value)) errors.push(`Evidence boundary differs at ${id}/${field}`);
    }
  }
  const termComparisons = [];
  for (const check of fixture.term_comparisons || []) {
    if (!visited.has(check.source) || !visited.has(check.target)) { errors.push('Term comparison must use visited records'); continue; }
    const source = byId.get(check.source), target = byId.get(check.target);
    const result = compareTermBoundaries({ source, target, sourceParent: byId.get(source?.parent_instrument), targetParent: byId.get(target?.parent_instrument), sourceExceptions: check.source_exceptions ?? null, targetExceptions: check.target_exceptions ?? null, asOf: check.as_of ?? null });
    if (!isDeepStrictEqual(result, check.expected)) errors.push(`Term boundary comparison differs: ${check.source} -> ${check.target}`);
    termComparisons.push(result);
  }
  return { id: fixture.id, status: errors.length ? 'failed' : 'passed', layers, boundaries, term_comparisons: termComparisons, errors,
    limits: 'Declared relationships only. Category membership and anchors do not establish applicability, operative force, source entailment or reviewed legacy accuracy. Null means absent evidence, not a negative finding.' };
}

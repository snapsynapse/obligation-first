import { compareTermBoundaries } from './term-boundaries.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
const asArray = value => Array.isArray(value) ? value : value == null ? [] : [value];
const supported = new Set(['anchors', 'isCategorizedBy', 'parent_instrument', 'creates', 'replaced_by']);
const DEONTIC = ['of:Requirement', 'of:Restriction', 'of:Permission', 'of:Reparation'];
const DUTY_TYPES = new Set(['of:Obligation', ...DEONTIC]);
const DRAFT_STATES = new Set(['draft', 'proposed']);
const types = record => asArray(record?.['@type']);
const known = value => value == null || (Array.isArray(value) && !value.length) ? 'unknown' : value;
const provenanceOf = record => ({ source: known(record?.source), source_locator: known(record?.source_locator), source_version: known(record?.source_version) });
const unresolvedOf = record => ['source_review_unresolved', 'pub:source_review_unresolved'].flatMap(field => asArray(record?.[field]));
export const ANSWER_LIMITS = 'Declared relationships only. applicability is never asserted by traversal; a category association is not application of any listed duty. A draft stays a draft after joining operative law. unknown means absent evidence, not a negative finding. Unresolved source questions are carried as count and SHA-256 of their verbatim text so owner wording is preserved without republishing it. source, source_locator and source_version report what the owning record claims about provenance; they do not verify the source text.';

// EV02 answer contract: serialize one bounded consumer answer from a traversal
// without strengthening relation, draft state, review scope, actors, scope or time.
export function buildConsumerAnswer(byId, fixture, layers) {
  const subject = byId.get(fixture.start);
  const anchorTargets = asArray(subject?.anchors).map(id => byId.get(id));
  const kinds = new Set(anchorTargets.map(target => types(target).includes('of:ObligationCategory') ? 'category-association'
    : types(target).some(type => type === 'of:Term' || DUTY_TYPES.has(type)) ? 'direct-anchor' : 'unresolved-anchor'));
  const duties = asArray(fixture.answer.duty_layers).flatMap(index => layers[index] ?? []).map(id => {
    const record = byId.get(id);
    const deontic = DEONTIC.find(type => types(record).includes(type)) ?? (types(record).includes('of:Obligation') ? 'unclassified' : null);
    return { id, deontic, duty_holders: known(record?.duty_holders), duty_holder_roles: known(record?.duty_holder_roles),
      territorial_scope: known(record?.jurisdiction?.territorial_scope), lifecycle_status: known(record?.lifecycle_status),
      operative_status: known(record?.operative_status), effective: known(record?.effective), ...provenanceOf(record),
      admission_status: known(record?.admission_status) };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const visited = [...new Set(layers.flat())].sort();
  const unresolved = Object.fromEntries(visited.map(id => [id, unresolvedOf(byId.get(id))]).filter(([, items]) => items.length)
    .map(([id, items]) => [id, { count: items.length, sha256: createHash('sha256').update(JSON.stringify(items)).digest('hex') }]));
  return {
    version: 1,
    question: fixture.answer.question,
    subject: { id: fixture.start, lifecycle_status: known(subject?.lifecycle_status), operative_status: known(subject?.operative_status),
      enforcement_status: known(subject?.enforcement_status), binding: DRAFT_STATES.has(subject?.lifecycle_status) ? `${subject.lifecycle_status}-not-in-force` : 'not-evaluated',
      territorial_scope: known(subject?.jurisdiction?.territorial_scope), ...provenanceOf(subject), admission_status: known(subject?.admission_status) },
    relation: { kinds: [...kinds].sort(), direct_duty_relations: anchorTargets.filter(target => types(target).some(type => type === 'of:Term' || DUTY_TYPES.has(type))).length, applicability: 'not-asserted' },
    duties,
    unresolved,
    limits: ANSWER_LIMITS,
  };
}

// Reject expectations that strengthen meaning, so a fixture cannot encode an
// application, binding draft, unrestricted scope or whole-record review claim.
export function answerContractErrors(answer) {
  const errors = [];
  if (answer?.relation?.applicability !== 'not-asserted') errors.push('Answer asserts applicability; traversal can only relate duties');
  if (asArray(answer?.relation?.kinds).includes('category-association') && answer?.relation?.direct_duty_relations > 0 && !asArray(answer?.relation?.kinds).includes('direct-anchor')) errors.push('Category association cannot count as a direct duty relation');
  if (DRAFT_STATES.has(answer?.subject?.lifecycle_status) && answer?.subject?.binding !== `${answer.subject.lifecycle_status}-not-in-force`) errors.push('Draft subject promoted beyond draft');
  for (const item of [answer?.subject, ...asArray(answer?.duties)]) {
    if (!item) continue;
    if (item.territorial_scope === 'unrestricted' || (Array.isArray(item.territorial_scope) && item.territorial_scope.includes('*'))) errors.push(`Scope widened to unrestricted at ${item.id}`);
    if (typeof item.admission_status === 'string' && /^(reviewed|source-reviewed|fully-reviewed|verified)$/.test(item.admission_status)) errors.push(`Whole-record review claimed at ${item.id}`);
  }
  for (const duty of asArray(answer?.duties)) if (!(duty.deontic === 'unclassified' || DEONTIC.includes(duty.deontic))) errors.push(`Duty layer contains a non-obligation at ${duty.id}`);
  return errors;
}

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
  let answer = null;
  if (fixture.answer) {
    if (typeof fixture.answer.question !== 'string' || !fixture.answer.question.trim()) throw new Error('Answer contract requires a finite question');
    if (!asArray(fixture.answer.duty_layers).every(index => Number.isInteger(index) && index > 0 && index < layers.length)) throw new Error('Answer duty layers must name traversed layers');
    answer = buildConsumerAnswer(byId, fixture, layers);
    for (const error of answerContractErrors(answer)) errors.push(`Answer contract: ${error}`);
    for (const error of answerContractErrors(fixture.answer.expected)) errors.push(`Expected answer strengthens meaning: ${error}`);
    if (!isDeepStrictEqual(JSON.parse(JSON.stringify(answer)), fixture.answer.expected)) errors.push('Consumer answer differs from the reviewed expectation');
  }
  return { id: fixture.id, status: errors.length ? 'failed' : 'passed', layers, boundaries, term_comparisons: termComparisons, answer, errors,
    limits: 'Declared relationships only. Category membership and anchors do not establish applicability, operative force, source entailment or reviewed legacy accuracy. Null means absent evidence, not a negative finding.' };
}

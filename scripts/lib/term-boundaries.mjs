import { dateBounds } from './qualified-time.mjs';

const types = record => Array.isArray(record?.['@type']) ? record['@type'] : [record?.['@type']];
const uniqueStrings = value => Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim()) ? [...new Set(value)].sort() : null;
const territory = record => uniqueStrings(record?.jurisdiction?.territorial_scope ?? record?.territorial_scope);
const own = (record, key) => record && Object.hasOwn(record, key) ? record[key] : null;

export function compareDatePrecision(left, right) {
  const a = dateBounds(left), b = dateBounds(right);
  if (!a || !b) return 'unknown';
  if (a[1] < b[0]) return 'before';
  if (a[0] > b[1]) return 'after';
  if (a[0] === a[1] && b[0] === b[1] && a[0] === b[0]) return 'same-day';
  return 'overlapping-precision';
}

// A consumer boundary report, not a jurisdiction or temporal applicability
// engine. Explicit exception lists are fixture inputs, never inferred from prose.
export function compareTermBoundaries({ source, target, sourceParent, targetParent,
  sourceExceptions = null, targetExceptions = null, asOf = null }) {
  if (!types(source).includes('of:Term') || !types(target).includes('of:Term')) throw Error('Term boundary comparison requires two Terms');
  const parent = (term, candidate) => candidate?.['@id'] === term.parent_instrument && types(candidate).includes('of:Instrument') ? candidate : null;
  const a = territory(source), b = territory(target);
  const excludedA = uniqueStrings(sourceExceptions), excludedB = uniqueStrings(targetExceptions);
  const common = a && b ? a.filter(code => b.includes(code)) : null;
  const intersection = common && excludedA && excludedB ? common.filter(code => !excludedA.includes(code) && !excludedB.includes(code)) : null;
  const evidence = (term, candidate) => ({
    id: term['@id'], source: own(term, 'source'), locator: own(term, 'source_locator'),
    source_version: own(term, 'source_version'), lifecycle_status: own(term, 'lifecycle_status'),
    operative_status: own(term, 'operative_status'), enforcement_status: own(term, 'enforcement_status'),
    effective: own(term, 'effective'), computed_as_of: own(term, 'computed_as_of'),
    parent_id: term.parent_instrument, parent_effective: own(parent(term, candidate), 'effective'),
    effective_vs_parent: compareDatePrecision(own(term, 'effective'), own(parent(term, candidate), 'effective')),
    effective_vs_as_of: compareDatePrecision(own(term, 'effective'), asOf),
  });
  return {
    source: evidence(source, sourceParent), target: evidence(target, targetParent),
    source_territory: a, target_territory: b,
    source_exceptions: excludedA, target_exceptions: excludedB,
    common_declared_codes: common, intersection_after_declared_exceptions: intersection,
    territory_result: intersection === null ? 'unknown' : intersection.length ? 'declared-overlap' : 'no-declared-common-code',
    source_effective_vs_target: compareDatePrecision(own(source, 'effective'), own(target, 'effective')),
    as_of: asOf, legal_applicability: 'unknown',
    limits: 'Exact declared codes only; no country/subdivision expansion or inference of geographic disjointness. Missing exceptions are unknown, not empty. Date comparisons preserve original precision and do not establish operation, enforcement or an invalid retroactive term. Drafts and missing locators remain explicit.'
  };
}

import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export const REPORT_LIMITS = 'Offline declared graph comparison only; not source acceptance, legal currentness, applicability, deployment or human review. Free text is represented by length and SHA-256. Differences never change the comparison result.';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
const ENUMS = new Set(['unknown', 'unclassified', 'not-asserted', 'not-evaluated', 'draft-not-in-force', 'proposed-not-in-force', 'category-association', 'direct-anchor', 'unresolved-anchor', 'draft', 'proposed', 'enacted', 'in-force', 'repealed', 'superseded', 'operative', 'future', 'enforceable', 'unsignaled', 'legacy-unreviewed', 'source-consistency-reviewed-changes', 'of:Requirement', 'of:Restriction', 'of:Permission', 'of:Reparation']);
const KEYS = new Set(['version', 'question', 'subject', 'relation', 'duties', 'unresolved', 'limits', 'id', 'lifecycle_status', 'operative_status', 'enforcement_status', 'binding', 'territorial_scope', 'source', 'source_locator', 'source_version', 'admission_status', 'kinds', 'direct_duty_relations', 'applicability', 'deontic', 'duty_holders', 'duty_holder_roles', 'effective', 'count', 'sha256']);
export function publicId(value) {
  if (typeof value !== 'string' || value.length > 512 || !/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/.test(value)) return null;
  try { const url = new URL(value); return !url.username && !url.password && !url.search && !url.hash && url.hostname ? value : null; } catch { return null; }
}
export function safeMetadata(value, { digest = false } = {}) {
  if (value === undefined) return { kind: 'missing' };
  if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
  if (typeof value === 'string') {
    if (ENUMS.has(value) || (digest && /^[a-f0-9]{64}$/.test(value))) return value;
    return { kind: 'string', length: value.length, sha256: sha256(value) };
  }
  const serialized = JSON.stringify(value);
  return { kind: Array.isArray(value) ? 'array' : 'object', length: Array.isArray(value) ? value.length : Object.keys(value).length, sha256: sha256(serialized) };
}
export const safeIdentity = value => publicId(value) || safeMetadata(value);
export const safeLabel = value => typeof value === 'string' && /^[a-z0-9][a-z0-9._/-]{0,511}$/.test(value) ? value : safeMetadata(value);
const pointer = parts => parts.map(part => '/' + String(part).replace(/~/g, '~0').replace(/\//g, '~1')).join('');

// Only known answer keys, array positions and public record identifiers enter
// pointers. Unknown/free-text keys are represented at their parent as digests.
export function answerDifferences(expected, actual, { maxDifferences = 10000 } = {}) {
  const differences = [];
  function add(before, after, parts) {
    if (differences.length >= maxDifferences) throw new Error('REPORT_DIFFERENCE_LIMIT');
    const root = parts[0];
    const expectedOwner = root === 'unresolved' ? parts[1] : root === 'duties' ? expected?.duties?.[parts[1]]?.id : expected?.subject?.id;
    const actualOwner = root === 'unresolved' ? parts[1] : root === 'duties' ? actual?.duties?.[parts[1]]?.id : actual?.subject?.id;
    const category = root === 'unresolved' ? 'uncertainty' : root === 'relation' ? 'relation'
      : parts.some(part => ['source', 'source_locator', 'source_version'].includes(part)) ? 'source-provenance' : 'other';
    differences.push({ path: pointer(parts), owner_record_id: safeIdentity(actualOwner ?? expectedOwner ?? null),
      category, expected: safeMetadata(before, { digest: root === 'unresolved' && parts.length === 3 && parts[2] === 'sha256' }),
      actual: safeMetadata(after, { digest: root === 'unresolved' && parts.length === 3 && parts[2] === 'sha256' }),
      ...(expectedOwner && actualOwner && expectedOwner !== actualOwner ? { expected_record_id: safeIdentity(expectedOwner) } : {}) });
  }
  function walk(before, after, parts = []) {
    if (isDeepStrictEqual(before, after)) return;
    if (parts.length > 64) throw new Error('REPORT_DEPTH_LIMIT');
    const object = value => value !== null && typeof value === 'object';
    if ((object(before) || before === undefined) && (object(after) || after === undefined) && (Array.isArray(before) === Array.isArray(after) || before === undefined || after === undefined)) {
      const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].sort();
      const allowed = key => Array.isArray(before) || Array.isArray(after) ? /^(0|[1-9][0-9]*)$/.test(key)
        : parts.length === 1 && parts[0] === 'unresolved' ? Boolean(publicId(key)) : KEYS.has(key);
      if (!keys.length || keys.some(key => !allowed(key))) { add(before, after, parts); return; }
      for (const key of keys) walk(before?.[key], after?.[key], [...parts, key]);
    } else add(before, after, parts);
  }
  walk(expected, actual);
  return differences;
}

// Traversal errors can contain owner-supplied identifiers/field names. Keep
// stable categories, never interpolate those strings or raw exception text.
export function safeTraversalError(error) {
  const known = [
    ['Consumer answer differs', 'consumer-answer-mismatch'], ['Answer contract:', 'answer-contract-violation'],
    ['Expected answer strengthens', 'expected-answer-strengthens-meaning'], ['Missing starting record', 'missing-starting-record'],
    ['Non-IRI traversal target', 'non-iri-target'], ['Unresolved traversal target', 'unresolved-target'],
    ['Step ', 'traversal-target-set-mismatch'], ['Boundary assertion', 'boundary-not-on-traversal'],
    ['Evidence boundary differs', 'evidence-boundary-mismatch'], ['Term comparison must', 'term-comparison-not-on-traversal'],
    ['Term boundary comparison differs', 'term-boundary-mismatch'],
  ];
  return known.find(([prefix]) => typeof error === 'string' && error.startsWith(prefix))?.[1] || 'traversal-error';
}

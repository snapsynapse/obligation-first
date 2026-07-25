/**
 * Version-range parsing for adopter naming profiles.
 *
 * A profile's `appliesTo` declares which Obligation-First versions it was
 * written against. Two forms are accepted:
 *
 *   obligation-first >=0.4.0 <0.6.0    range form (preferred)
 *   obligation-first 0.4.x             pinned-minor form, means >=0.4.0 <0.5.0
 *
 * The range form exists because the pinned form made every additive spec bump
 * a flag day: an adopter using nothing new in 0.5.0 still had to move its
 * profile in lockstep or go red. An adopter that does not depend on a new
 * entity type declares a range wide enough to ride the bump; one that does
 * declares a floor at that version, and the failure is then meaningful.
 */

const SPEC_NAME = /obligation-first/i;

export function parseVersion(value) {
  const match = String(value ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}

// Semver ordering on [major, minor, patch]. Prerelease tags are ignored: the
// spec has never shipped one on a released version, and treating 0.5.0-rc as
// 0.5.0 is the safe direction (satisfied slightly early rather than failing a
// checkout that is functionally the target).
export function compare(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Parse a bare range expression (no spec name) into { display, test }.
 * Returns null when no range is recognizable.
 */
export function parseRange(text) {
  const pinned = String(text ?? "").trim().match(/^(\d+)\.(\d+)\.x$/);
  if (pinned) {
    const major = Number(pinned[1]);
    const minor = Number(pinned[2]);
    return {
      display: `>=${major}.${minor}.0 <${major}.${minor + 1}.0`,
      test: (v) => compare(v, [major, minor, 0]) >= 0 && compare(v, [major, minor + 1, 0]) < 0,
    };
  }

  const comparators = [...String(text ?? "").matchAll(/(>=|<=|>|<|=)\s*(\d+)\.(\d+)\.(\d+)/g)].map((m) => ({
    op: m[1],
    version: [Number(m[2]), Number(m[3]), Number(m[4])],
  }));
  if (comparators.length === 0) return null;

  return {
    display: comparators.map((c) => `${c.op}${c.version.join(".")}`).join(" "),
    test: (v) =>
      comparators.every(({ op, version }) => {
        const c = compare(v, version);
        if (op === ">=") return c >= 0;
        if (op === ">") return c > 0;
        if (op === "<=") return c <= 0;
        if (op === "<") return c < 0;
        return c === 0;
      }),
  };
}

/**
 * Parse a full `appliesTo` string. Returns { display, test } or null.
 * Null means either the spec name is absent or no range could be read; both
 * are adopter errors and callers should report the raw string.
 */
export function parseAppliesTo(appliesTo) {
  const text = String(appliesTo ?? "");
  if (!SPEC_NAME.test(text)) return null;
  return parseRange(text.replace(SPEC_NAME, "").trim());
}

/** Convenience: does `version` (a string) satisfy `appliesTo`? */
export function satisfies(appliesTo, version) {
  const range = parseAppliesTo(appliesTo);
  const parsed = parseVersion(version);
  if (!range || !parsed) return false;
  return range.test(parsed);
}

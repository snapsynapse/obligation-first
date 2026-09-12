const values = value => Array.isArray(value) ? value : value == null ? [] : [value];
const hasType = (record, type) => values(record['@type']).includes(type);
export const CAUSAL_DIAGNOSTIC_CODES = Object.freeze({
  FUTURE_EVIDENCE: 'OF-TIME-FUTURE-EVIDENCE',
  DECISION_BEFORE_FILING: 'OF-TIME-DECISION-BEFORE-FILING',
  VACATES_BEFORE_DECISION: 'OF-TIME-VACATES-BEFORE-DECISION',
  SUNSET_OPERATIVE: 'OF-TIME-SUNSET-OPERATIVE',
});

function exactDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

// Compare only declared causal relations with exact days. No ordering is
// inferred for partial dates, unresolved targets or retrospective commencement.
export function causalDateDiagnostics(entries, asOf = new Date().toISOString().slice(0, 10)) {
  if (!exactDay(asOf)) throw new Error('Causal-date as-of must be an exact calendar day');
  const byId = new Map(entries.map(entry => [entry.record['@id'], entry]));
  const failures = [];
  for (const entry of entries) {
    const { record } = entry;
    for (const field of ['verified', 'retrieved']) {
      if (exactDay(record[field]) && record[field] > asOf) failures.push({
        code: CAUSAL_DIAGNOSTIC_CODES.FUTURE_EVIDENCE, rel: entry.rel, field,
        message: `${entry.rel}: ${field} ${record[field]} is after review as-of ${asOf}`,
      });
    }
    // Mirror of OF-GRAPH-FUTURE-OPERATIVE on the sunset side: a record cannot
    // claim to operate as of a day after its own exact sunset day. Only the
    // record's own explicit computed_as_of is used; effective, parent dates and
    // the review as-of are never substituted, so no retrospective inference.
    if (record.operative_status === 'operative' && exactDay(record.sunset) && exactDay(record.computed_as_of) &&
        record.sunset < record.computed_as_of) failures.push({
      code: CAUSAL_DIAGNOSTIC_CODES.SUNSET_OPERATIVE, rel: entry.rel, field: 'operative_status',
      message: `${entry.rel}: operative as of ${record.computed_as_of} but sunset ${record.sunset} has passed`,
    });
    if (hasType(record, 'of:Proceeding')) for (const target of values(record.hasDetermination)) {
      const decision = byId.get(target)?.record;
      if (decision && hasType(decision, 'of:Determination') && exactDay(record.filed_date) &&
          exactDay(decision.issued_date) && decision.issued_date < record.filed_date) failures.push({
        code: CAUSAL_DIAGNOSTIC_CODES.DECISION_BEFORE_FILING, rel: entry.rel, field: 'hasDetermination', target,
        message: `${entry.rel}: decision ${target} issued ${decision.issued_date} precedes this proceeding's filing ${record.filed_date}`,
      });
    }
    if (hasType(record, 'of:Determination')) for (const target of values(record.vacates)) {
      const prior = byId.get(target)?.record;
      if (prior && hasType(prior, 'of:Determination') && exactDay(record.issued_date) &&
          exactDay(prior.issued_date) && record.issued_date < prior.issued_date) failures.push({
        code: CAUSAL_DIAGNOSTIC_CODES.VACATES_BEFORE_DECISION, rel: entry.rel, field: 'vacates', target,
        message: `${entry.rel}: vacating decision issued ${record.issued_date} precedes target decision ${target} issued ${prior.issued_date}`,
      });
    }
  }
  return failures;
}

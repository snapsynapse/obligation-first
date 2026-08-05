import { asArray, obligationFirstType, recordTypes } from "./adopter-kit.mjs";

export const CONTINUITY_DIAGNOSTIC_CODES = Object.freeze({
  DUPLICATE_CURRENT_ID: "OF-CONTINUITY-DUPLICATE-CURRENT-ID",
  ACTIVE_AND_TOMBSTONE: "OF-CONTINUITY-ACTIVE-AND-TOMBSTONE",
  REMOVED_ID: "OF-CONTINUITY-REMOVED-ID",
  TYPE_DRIFT: "OF-CONTINUITY-TYPE-DRIFT",
  TOMBSTONE_REMOVED: "OF-CONTINUITY-TOMBSTONE-REMOVED",
  TOMBSTONE_REACTIVATED: "OF-CONTINUITY-TOMBSTONE-REACTIVATED",
  INVALID_RETIREMENT: "OF-CONTINUITY-INVALID-RETIREMENT",
  INVALID_REPLACEMENT: "OF-CONTINUITY-INVALID-REPLACEMENT",
});

function stateOf(record) {
  return recordTypes(record).includes("of:Tombstone") ? "tombstone" : "active";
}

export function identifierInventory(entries) {
  return entries
    .filter((entry) => typeof entry.record["@id"] === "string")
    .map((entry) => ({
      id: entry.record["@id"],
      type: obligationFirstType(entry.record) || recordTypes(entry.record)[0] || "untyped",
      state: stateOf(entry.record),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function createContinuityBaseline({ adopter, release, entries, reviewedRetirements = [] }) {
  return {
    manifest_version: 1,
    adopter,
    baseline_release: release,
    identifiers: identifierInventory(entries),
    reviewed_retirements: reviewedRetirements,
  };
}

export function validateIdentifierContinuity(entries, baseline) {
  const failures = [];
  const fail = (code, message, details = {}) => failures.push({ code, message, ...details });
  const groups = new Map();
  for (const entry of entries.filter((item) => typeof item.record["@id"] === "string")) {
    const id = entry.record["@id"];
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(entry);
  }
  for (const [id, group] of groups) {
    if (group.length > 1) fail(CONTINUITY_DIAGNOSTIC_CODES.DUPLICATE_CURRENT_ID, `${id}: appears ${group.length} times in current records`, { id });
    const states = new Set(group.map((entry) => stateOf(entry.record)));
    if (states.has("active") && states.has("tombstone")) {
      fail(CONTINUITY_DIAGNOSTIC_CODES.ACTIVE_AND_TOMBSTONE, `${id}: cannot be active and tombstoned in the same graph`, { id });
    }
  }

  const current = new Map(identifierInventory(entries).map((item) => [item.id, item]));
  const currentRecords = new Map(entries.filter((entry) => entry.record["@id"]).map((entry) => [entry.record["@id"], entry.record]));
  const retirements = new Map();
  for (const retirement of baseline.reviewed_retirements || []) {
    if (!retirement?.id || retirements.has(retirement.id) || !/^\d{4}-\d{2}-\d{2}$/.test(retirement.reviewed || "") || !retirement.reason) {
      fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_RETIREMENT, `invalid reviewed retirement for ${retirement?.id || "missing id"}`);
      continue;
    }
    if (!['none', 'replaced'].includes(retirement.replacement_status)) {
      fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_RETIREMENT, `${retirement.id}: replacement_status must be none or replaced`, { id: retirement.id });
    }
    if (retirement.replacement_status === "replaced" && asArray(retirement.replaced_by).length === 0) {
      fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_REPLACEMENT, `${retirement.id}: reviewed replacement needs replaced_by`, { id: retirement.id });
    }
    if (retirement.replacement_status === "none" && asArray(retirement.replaced_by).length > 0) {
      fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_REPLACEMENT, `${retirement.id}: replacement_status none cannot carry replaced_by`, { id: retirement.id });
    }
    retirements.set(retirement.id, retirement);
  }

  const baselineById = new Map((baseline.identifiers || []).map((item) => [item.id, item]));
  for (const prior of baseline.identifiers || []) {
    const now = current.get(prior.id);
    if (prior.state === "tombstone") {
      if (!now) fail(CONTINUITY_DIAGNOSTIC_CODES.TOMBSTONE_REMOVED, `${prior.id}: baseline Tombstone disappeared`, { id: prior.id });
      else if (now.state !== "tombstone") fail(CONTINUITY_DIAGNOSTIC_CODES.TOMBSTONE_REACTIVATED, `${prior.id}: baseline Tombstone was reactivated`, { id: prior.id });
      continue;
    }
    if (!now) {
      const retirement = retirements.get(prior.id);
      if (!retirement) {
        fail(CONTINUITY_DIAGNOSTIC_CODES.REMOVED_ID, `${prior.id}: active baseline identifier disappeared without a Tombstone or reviewed retirement`, { id: prior.id });
        continue;
      }
      for (const replacement of asArray(retirement.replaced_by)) {
        if (replacement === prior.id || current.get(replacement)?.state !== "active") {
          fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_REPLACEMENT, `${prior.id}: replacement ${replacement} must resolve to a different active identifier`, { id: prior.id });
        }
      }
      continue;
    }
    if (now.state === "active" && now.type !== prior.type) {
      fail(CONTINUITY_DIAGNOSTIC_CODES.TYPE_DRIFT, `${prior.id}: type changed from ${prior.type} to ${now.type}`, { id: prior.id });
    }
    if (now.state === "tombstone") {
      const record = currentRecords.get(prior.id);
      if (record.former_type !== prior.type) {
        fail(CONTINUITY_DIAGNOSTIC_CODES.TYPE_DRIFT, `${prior.id}: Tombstone former_type ${record.former_type || "missing"} does not match ${prior.type}`, { id: prior.id });
      }
      for (const replacement of asArray(record.replaced_by)) {
        if (replacement === prior.id || current.get(replacement)?.state !== "active") {
          fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_REPLACEMENT, `${prior.id}: Tombstone replacement ${replacement} must resolve to a different active identifier`, { id: prior.id });
        }
      }
    }
  }
  for (const id of retirements.keys()) {
    if (!baselineById.has(id)) fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_RETIREMENT, `${id}: reviewed retirement is not in the baseline`, { id });
    if (current.has(id)) fail(CONTINUITY_DIAGNOSTIC_CODES.INVALID_RETIREMENT, `${id}: reviewed retirement still exists in current records`, { id });
  }
  return failures;
}

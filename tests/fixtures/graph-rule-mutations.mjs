import { OF_CONTEXT, GRAPH_DIAGNOSTIC_CODES as C } from "../../scripts/lib/adopter-kit.mjs";

const id = (name) => `https://example.com/${name}`;
const entry = (name, type, fields = {}) => ({
  rel: `fixture/${name}.json`,
  record: { "@context": OF_CONTEXT, "@id": id(name), "@type": type, ...fields },
});
const clone = (records) => structuredClone(records);

const authority = () => entry("authority", "of:Authority");
const instrument = (name = "instrument", fields = {}) => entry(name, "of:Instrument", fields);
const term = (name = "term", fields = {}) => entry(name, "of:Term", fields);
const obligation = (name = "obligation", fields = {}) => entry(name, "of:Requirement", fields);
const category = () => entry("category", "of:ObligationCategory");
const allegation = (name = "allegation") => entry(name, "of:Allegation");
const determination = (name = "determination", fields = {}) => entry(name, "of:Determination", {
  disposition: "issued",
  target_instrument: id("instrument"),
  ...fields,
});

function paired(code, valid, mutate) {
  const invalid = clone(valid);
  mutate(invalid);
  return { code, valid, invalid };
}

export const GRAPH_RULE_MUTATIONS = [
  paired(C.MISSING_ID, [authority()], (records) => delete records[0].record["@id"]),
  paired(C.DUPLICATE_ID, [authority(), entry("party", "of:Party")], (records) => { records[1].record["@id"] = records[0].record["@id"]; }),
  paired(C.MISSING_LOCAL_REFERENCE, [authority(), instrument("instrument", { issuedBy: id("authority") })], (records) => { records[1].record.issuedBy = id("absent"); }),
  paired(C.WRONG_REFERENCE_TYPE, [authority(), instrument("instrument", { issuedBy: id("authority") })], (records) => { records[0].record["@type"] = "of:Instrument"; }),
  paired(C.INVALID_FIELD_DOMAIN, [authority(), entry("proceeding", "of:Proceeding", { heardBy: id("authority") })], (records) => { records[1].record["@type"] = "of:Instrument"; }),
  paired(C.HAS_TERM_INVERSE, [instrument("instrument", { hasTerm: id("term") }), term("term", { parent_instrument: id("instrument") })], (records) => { delete records[1].record.parent_instrument; }),
  paired(C.CREATES_INVERSE, [term("term", { creates: id("obligation") }), obligation("obligation", { created_by: id("term") })], (records) => { delete records[1].record.created_by; }),
  paired(C.RECOGNIZES_INVERSE, [instrument(), obligation("obligation", { recognized_by: id("determination") }), determination("determination", { recognizes: id("obligation") })], (records) => { delete records[1].record.recognized_by; }),
  paired(C.IMPOSES_INVERSE, [instrument(), obligation("obligation", { imposed_by: id("determination") }), determination("determination", { imposes: id("obligation") })], (records) => { delete records[1].record.imposed_by; }),
  paired(C.SELF_TRIGGER, [obligation("obligation")], (records) => { records[0].record.triggers_on_violation_of = id("obligation"); }),
  paired(C.CATEGORY_EXACT_MATCH, [category(), obligation("obligation", { isCategorizedBy: id("category") })], (records) => { delete records[1].record.isCategorizedBy; records[1].record.exactMatch = id("category"); }),
  paired(C.DUPLICATE_RELATION_ALIAS, [obligation()], (records) => { records[0].record.implemented_by_terms = [id("term")]; }),
  paired(C.ISSUED_DETERMINATION_DECIDES, [instrument(), allegation(), determination()], (records) => { records[2].record.decides = id("allegation"); }),
  paired(C.ISSUED_DETERMINATION_TARGET, [instrument(), determination()], (records) => { delete records[1].record.target_instrument; }),
  paired(C.ADJUDICATIVE_DETERMINATION_DECIDES, [allegation(), determination("determination", { disposition: "upheld", decides: id("allegation"), target_instrument: undefined })], (records) => { delete records[1].record.decides; }),
  paired(C.WOULD_SUPERSEDE_LIFECYCLE, [instrument("prior"), instrument("instrument", { lifecycle_status: "proposed", wouldSupersede: id("prior") })], (records) => { records[1].record.lifecycle_status = "active"; }),
  paired(C.FUTURE_ENFORCEMENT, [instrument("instrument", { lifecycle_status: "proposed", enforcement_status: "not_in_force" })], (records) => { records[0].record.enforcement_status = "enforceable"; }),
  paired(C.VOLUNTARY_ENFORCEMENT_BASIS, [instrument("instrument", { normative_force: "voluntary", enforcement_status: "enforceable", binding_basis: { kind: "contract" } })], (records) => { delete records[0].record.binding_basis; }),
  paired(C.INACTIVE_ENFORCEMENT, [instrument("instrument", { lifecycle_status: "repealed", enforcement_status: "not_in_force" })], (records) => { records[0].record.enforcement_status = "enforceable"; }),
  paired(C.FUTURE_OPERATIVE, [instrument("instrument", { effective: "2027-01-01", computed_as_of: "2026-01-01", operative_status: "not_yet_operative" })], (records) => { records[0].record.operative_status = "operative"; }),
  paired(C.PROCEEDING_DETERMINATION_SCOPE, [allegation("a"), allegation("b"), determination("determination", { disposition: "upheld", decides: id("a"), target_instrument: undefined }), entry("proceeding", "of:Proceeding", { hasAllegation: [id("a")], hasDetermination: [id("determination")] })], (records) => { records[2].record.decides = id("b"); }),
  paired(C.CONSTRAINED_ENFORCEMENT_EVIDENCE, [instrument("instrument", { enforcement_status: "routine" })], (records) => { records[0].record.enforcement_status = "constrained"; }),
  paired(C.VACATED_DETERMINATION_RELATION, [allegation(), determination("vacated", { disposition: "vacated", decides: id("allegation"), target_instrument: undefined }), determination("vacating", { disposition: "upheld", decides: id("allegation"), target_instrument: undefined, vacates: id("vacated") })], (records) => { delete records[2].record.vacates; }),
  paired(C.DEFEASIBILITY_CYCLE, [term("a", { defeats: id("b") }), term("b")], (records) => { records[1].record.undercuts = id("a"); }),
];

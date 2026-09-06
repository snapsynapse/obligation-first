# Obligation-First v0.6.4

This patch adds deterministic scope continuity evaluation without changing the v0.6 record schemas, JSON-LD mappings, identifiers, or legal semantics.

## Scope evaluation

The versioned scope inventory contract separates adopter-owned recognition from modeled, uncovered, and unknown coverage. Exact record/path/value baselines detect schema-valid scope substitutions, lost territorial specificity, and institutional identity changes that structural fingerprints cannot detect. Local Jurisdiction references, legacy shapes, inventory ownership, parent conflicts, source evidence, and baseline overwrite refusal have deterministic checks.

The synthetic eval suite includes ISO versus OECD and British Columbia versus Canada, preserves absent evidence, and checks that issuance is independent from administration and enforcement. Shared evaluator artifacts, tooling schema, and fixtures are included in the release hash inventory. Run `npm run test:scope`; the full `npm test` gate also runs these checks.

## Adoption and compatibility

Existing `obligation-first >=0.6.0 <0.7.0` ranges and fingerprint v2 baselines remain compatible. Context version comments change; context mappings and record schemas do not. Scope evaluation is an additional, explicitly configured gate. Unresolved external jurisdiction references remain schema-valid but fail this evaluator until an explicit resolution contract exists.

EveryAILaw, PubLedge, and AI Incident Law own their inventories and baselines. Their CI integrations require an exact OF revision containing the companion evaluator. Packaging this release does not establish that downstream pins or hosted workflows have adopted it. Recognition does not certify coverage, legal applicability, or source correctness.

## Discovery

The homepage, README, LLM files, and agent endpoint inventory link to the contract, schema, and fixtures. Assistant guide 0.1.4 adds the scope eval action and refreshed provenance. Discovery and artifact-inventory regressions guard these surfaces.

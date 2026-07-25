# Obligation-First v0.5.0 Release Notes

Release date: 2026-07-25

## Summary

Adds the category layer. `of:ObligationCategory` is a jurisdiction-neutral duty concept that Obligations are classified under and that interpretive records may reference when they concern the concept rather than any single statutory duty. Additive: no existing record changes meaning, and every profile published against v0.4.x keeps validating.

The release also removes the flag-day coupling between the spec and its adopters. A naming profile's `appliesTo` may now declare a version range, so an adopter that does not use a new entity type rides an additive release instead of having to move in lockstep with it.

## What changed

- **`of:ObligationCategory`** (`schema/obligation-category.schema.json`). Required `@type`, `@id`, `title`; optional `content`, `scheme`, `sameAs`, `exactMatch`, `notes`. Carries no `jurisdiction`, no `created_by`, and no duty holder, because a Category is not a duty. One carrying `created_by` is a modelling error.
- **`of:scheme`** (ObligationCategory to IRI, skos:inScheme), so an adopter can publish more than one taxonomy and a consumer can tell whose taxonomy a Category came from.
- **`of:anchors` range extended** to `Obligation | Term | ObligationCategory`. A Determination about a named statutory duty anchors the Obligation; one about the duty concept generally anchors the Category.
- **`appliesTo` accepts a version range** — `obligation-first >=0.5.0 <0.6.0`. The pinned form `obligation-first 0.4.x` still parses and still means `>=0.4.0 <0.5.0`.
- **`ObligationCategory` accepted in naming profiles**, and the worked EveryAILaw profile in `examples/naming-profiles/` declares one.
- **`report-anchor-graph` derives aggregate-collection keys** from `DEFAULT_COMPANION_DIRS` rather than a hardcoded list, so a new entity type cannot be skipped silently.
- **`make-release` sweeps `schema/`** so a schema added since the previous release is included in the package rather than dropped from the artifact list.

## Why the category layer

The adopters had already worked around the missing type, badly. EveryAILaw published ten abstract concepts as its Obligations, so 134 Terms collapsed into 10 Obligation records and 128 of the resulting `creates` edges failed the `created_by` back-reference rule. Meanwhile 47 of 59 live cross-adopter anchors pointed at `human-oversight`: the graph's most-referenced nodes were concepts wearing an Obligation type.

Commensurability across jurisdictions is the right idea. It was in the wrong slot. Obligations now join their categories via `exactMatch`, and records that are genuinely about a concept anchor the Category.

## Compatibility

Adopter records: fully compatible. Nothing in v0.4.x becomes invalid, and no field changes meaning.

Naming profiles: fully compatible. A profile declaring `obligation-first 0.4.x` is rejected against a 0.5.0 checkout exactly as before, which is why PubLedge and AI Incident Law widen to `>=0.4.0 <0.6.0` in this cycle and thereafter ride additive releases unchanged. EveryAILaw declares `>=0.5.0 <0.6.0` because it publishes `ObligationCategory` records and genuinely requires this version.

IRI major version: unchanged at `v1`.

Adopters classifying Obligations under concepts should publish those concepts as `of:ObligationCategory`, join via `exactMatch`, and repoint concept-directed anchors at the Category IRIs.

## Verification

```bash
npm test
```

The release package includes `manifest.json` and `sha256.txt` checksums for public release artifacts.

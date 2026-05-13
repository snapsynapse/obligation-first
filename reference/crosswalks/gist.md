# Crosswalk: Obligation-First ↔ Semantic Arts gist

Mapping every `of:` term to its gist class binding. Source: [Semantic Arts gist](https://semanticarts.com/gist/), vendored at [`vendor/gist/gistCore.ttl`](../../vendor/gist/gistCore.ttl).

## Spine entities

| of: term | gist class | Notes |
|---|---|---|
| `of:Authority` | wraps `gist:Organization` | Not a single gist class — `of:Authority` is an interface combining `gist:Organization` (subtype as needed: `gist:GovernmentOrganization`, `gist:Court`, `gist:Organization`) with `authority_basis` metadata. The `authority_basis.instrument_ref` traces the Authority's grounding to a specific Instrument. |
| `of:Instrument` | `gist:Agreement` (for negotiated artifacts: JIA, RMA, contract) <br> `gist:Specification` (for promulgated artifacts: statute, regulation, ruling) | Subtype determined by Instrument kind. |
| `of:Term` | `gist:ContractTerm` | One-to-one binding. |
| `of:Obligation` | abstract — bound through subclasses | See deontic quartet below. |

## Deontic quartet

| of: term | gist class | LegalRuleML |
|---|---|---|
| `of:Requirement` | `gist:Requirement` | `lrml:Obligation` |
| `of:Restriction` | `gist:Restriction` | `lrml:Prohibition` |
| `of:Permission` | `gist:Permission` | `lrml:Permission` |
| `of:Reparation` | Open for Semantic Arts review | `lrml:Reparation` |

**Open question for Semantic Arts review:** Reparation in legal-rule semantics is a *secondary* obligation that fires when a primary obligation is violated. gist's existing `gist:Requirement`, `gist:Restriction`, `gist:Permission` cover primary obligations. Does `gist:Requirement` with a `triggeredBy` predicate suffice, or does Reparation merit its own gist class? Tracked in [external review questions](../review/external-review-questions.md).

## Proceeding strand

| of: term | gist class | Notes |
|---|---|---|
| `of:Proceeding` | `gist:Event` (subtype `LegalProceeding`) | A Proceeding is a temporally-extended event with a docket. |
| `of:Allegation` | `gist:Statement` | Asserted facts; not authoritative until decided. |
| `of:Determination` | `gist:Determination` | One-to-one binding. Already in gist. |

## Relations

| of: predicate | gist analog | Notes |
|---|---|---|
| `of:issuedBy` | derived from `gist:isAffectedBy` family | Custom relation; gist does not have a single "issued" predicate. |
| `of:hasTerm` | composition (rdfs:subPropertyOf gist relations) | Custom relation. |
| `of:creates` | (no direct gist analog) | Custom relation: a Term creates an Obligation. gist's `gist:produces` is close but at the wrong abstraction level. |
| `of:hasAllegation` | (no direct gist analog) | Custom relation. |
| `of:hasDetermination` | (no direct gist analog) | Custom relation. |
| `of:decides` | (no direct gist analog) | Custom relation: a Determination resolves an Allegation. |
| `of:anchors` | (no direct gist analog) | Custom relation: a Determination anchors to the Obligation it interprets. |
| `of:defeats` | (no direct gist analog) | Custom relation: defeasibility per Lawsky / LegalRuleML §7.4. |

## Vendoring

The gist snapshot at [`vendor/gist/gistCore.ttl`](../../vendor/gist/gistCore.ttl) is pinned to gist 14.1.0 (released 2026-Apr-17). Refresh policy:

- **Patch / minor:** review release notes at https://semanticarts.com/gist/ ; refresh if no breaking changes
- **Major:** evaluate impact, run worked examples, decide on a per-version basis
- **Cadence:** target one refresh per major Obligation-First release

## What gist provides that we use

- Foundational class hierarchy (`gist:Thing`, `gist:Specification`, `gist:Agreement`, `gist:Event`, `gist:Statement`, `gist:Determination`, `gist:Organization`, `gist:Jurisdiction`)
- Deontic primitives (`gist:Requirement`, `gist:Restriction`, `gist:Permission`)
- Provenance hooks (gist's connection to provenance is via `prov:` and gist-internal predicates)

## What we add on top

- The four-role spine *as a named pattern* (Authority / Instrument / Term / Obligation)
- The proceeding strand (Proceeding / Allegation / Determination as a coherent triad)
- Reparation as a fourth deontic operator
- Defeasibility (`of:defeats`)
- The recursive Authority basis (every Authority's grounding is itself an Instrument on the spine)
- Polymorphic `of:executableEncoding`

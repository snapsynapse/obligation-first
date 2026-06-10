# Crosswalk: Obligation-First ↔ Semantic Arts gist

Mapping every `of:` term to its gist class binding. Source: [Semantic Arts gist](https://semanticarts.com/gist/), vendored at [`vendor/gist/gistCore.ttl`](../../vendor/gist/gistCore.ttl).

## Spine entities

| of: term | gist class | Notes |
|---|---|---|
| `of:Authority` | wraps `gist:Organization` | Not a single gist class — `of:Authority` is an interface combining `gist:Organization` (subtype as needed: `gist:GovernmentOrganization`, or a local subtype; gist 14.1.0 defines no Court class) with `authority_basis` metadata. The `authority_basis.instrument_ref` traces the Authority's grounding to a specific Instrument. |
| `of:Instrument` | `gist:Agreement` (for negotiated artifacts: JIA, RMA, contract) <br> `gist:Specification` (for promulgated artifacts: statute, regulation, ruling) | Subtype determined by Instrument kind. |
| `of:Term` | `gist:ContractTerm` | One-to-one binding. |
| `of:Obligation` | abstract — bound through subclasses | See deontic quartet below. |

## Deontic quartet

| of: term | gist class | LegalRuleML |
|---|---|---|
| `of:Requirement` | `gist:Requirement` | `lrml:Obligation` |
| `of:Restriction` | `gist:Restriction` | `lrml:Prohibition` |
| `of:Permission` | `gist:Permission` | `lrml:Permission` |
| `of:Reparation` | `gist:Requirement` + `gist:Intention` (+ `gist:Event` when actuated) — see note | `lrml:Reparation` |

### Reparation gist binding (v0.2)

Per [Dave McComb / Semantic Arts feedback, 2026-05-26](../../CHANGELOG.md), the gist binding for `of:Reparation` is closed in v0.2. The `of:Reparation` class itself is **kept** as a distinct deontic subclass — LegalRuleML 1:1 alignment, SPARQL queryability (`?r a of:Reparation`), and type-keyed validators all depend on it. What changed is how that class expresses in gist terms. gist does not need a fourth deontic class; instead it carries reparation in three layers:

1. **The statutory declaration** — the secondary duty itself maps to `gist:Requirement`. (An `of:Reparation` instance is a gist:Requirement at the gist level; the of: class adds the legal-domain distinction LegalRuleML and adopters need.)
2. **The declared intent to repair** — compensation, restitution, deterrence — attaches as a `gist:Intention` on the creating Term. Most consumers won't need this layer, but it is the right anchor for the speech-act intent of the statute.
3. **The actuated reparation** — when a remedy is actually ordered or carried out, it is recorded through the proceeding strand as a `Determination`. Conceptually that disposition maps to `gist:Event`; a formal of:→gist:Event binding for the actuated act is deferred to a later minor version.

This mirrors Dave's contract analogy: a contract document is `gist:Content`; the commitments it brings into existence are `gist:Commitment`-shaped (`gist:Requirement` in our case); the intent of the speech act is `gist:Intention`; the act when it happens is `gist:Event`. The same layering applies to a reparation provision in a statute.

## Proceeding strand

| of: term | gist class | Notes |
|---|---|---|
| `of:Proceeding` | `gist:Event` (subtype `LegalProceeding`) | A Proceeding is a temporally-extended event with a docket. |
| `of:Allegation` | `gist:Content` (assertion text) + `gist:Intention` (speech-act intent, only when the claim is itself intent-bearing — libel, fraud, defamation) | Asserted facts; not authoritative until decided. gist does not define a `gist:Statement` class — see "Reparation pattern" note above for the parallel speech-act-vs-content treatment. |
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

- Foundational class hierarchy (`gist:Thing`, `gist:Specification`, `gist:Agreement`, `gist:Event`, `gist:Content`, `gist:Intention`, `gist:Determination`, `gist:Organization`, `gist:Jurisdiction`)
- Deontic primitives (`gist:Requirement`, `gist:Restriction`, `gist:Permission`)
- Provenance hooks (gist's connection to provenance is via `prov:` and gist-internal predicates)

## What we add on top

- The four-role spine *as a named pattern* (Authority / Instrument / Term / Obligation)
- The proceeding strand (Proceeding / Allegation / Determination as a coherent triad)
- Reparation as a fourth deontic operator (`of:Reparation`), with a layered gist binding: `gist:Requirement` + `gist:Intention` (+ `gist:Event` when actuated)
- Defeasibility (`of:defeats`)
- The recursive Authority basis (every Authority's grounding is itself an Instrument on the spine)
- Polymorphic `of:executableEncoding`

# External review questions

Status: v0.3.1
Scope: public review packet for ontology and rules-as-code reviewers

This document collects the questions that should be answered before the v0.1 freeze. It is intentionally public-safe: project strategy, private outreach notes, and recipient-specific language do not live here.

## Primary review targets

### Semantic Arts gist

The gist crosswalk is in [reference/crosswalks/gist.md](../crosswalks/gist.md). The current binding is:

| Obligation-First term | Current gist binding |
|---|---|
| `of:Authority` | wraps `gist:Organization` or subtype |
| `of:Instrument` | `gist:Agreement` or `gist:Specification`, depending on artifact kind |
| `of:Term` | `gist:ContractTerm` |
| `of:Requirement` | `gist:Requirement` |
| `of:Restriction` | `gist:Restriction` |
| `of:Permission` | `gist:Permission` |
| `of:Proceeding` | `gist:Event` with legal proceeding semantics |
| `of:Allegation` | `gist:Content` (text) + `gist:Intention` (when intent-bearing) |
| `of:Determination` | `gist:Determination` |

Open questions:

1. ~~Is `gist:Statement` the right binding for `of:Allegation`?~~ **Resolved 2026-05-26** (Dave McComb / Semantic Arts): gist defines no `gist:Statement` class. Bind the assertion text to `gist:Content`; reach for `gist:Intention` only when the asserted claim is itself intent-bearing (libel, fraud).
2. ~~Should `of:Reparation` bind to `gist:Requirement` with a trigger relation, or does secondary obligation semantics justify a dedicated gist class?~~ **Resolved 2026-05-26** (Dave McComb / Semantic Arts): gist does not need a fourth deontic class. The gist binding for `of:Reparation` is the layered pattern `gist:Requirement` (the secondary duty) + `gist:Intention` (declared intent to repair on the creating Term) + `gist:Event` (the actuated reparation, recorded via the proceeding strand). The `of:Reparation` class itself is preserved in v0.2 — LegalRuleML 1:1 alignment and SPARQL queryability depend on it. v0.2 is therefore a binding-only update; no of:-vocabulary change, no adopter migration.
3. Is `of:Authority` as an interface over `gist:Organization` plus `authority_basis` a reasonable gist-compatible pattern, or should the authority role be expressed differently?
4. Is `of:Instrument` split between `gist:Agreement` and `gist:Specification` sufficient for laws, regulations, contracts, joint interpretations, and rulings?

## LegalRuleML

The LegalRuleML crosswalk is in [reference/crosswalks/legalruleml.md](../crosswalks/legalruleml.md). The current binding is:

| Obligation-First term | LegalRuleML alignment |
|---|---|
| `of:Requirement` | `lrml:Obligation` |
| `of:Restriction` | `lrml:Prohibition` |
| `of:Permission` | `lrml:Permission` |
| `of:Reparation` | `lrml:Reparation` |
| `of:defeats` | cross-Term override relation related to LegalRuleML defeasibility |

Open questions:

1. Is the deontic-quartet alignment correct, especially the use of `Requirement` as the concrete subclass corresponding to `lrml:Obligation`?
2. Is binary `of:defeats` sufficient for v0.1, with `of:rebuts` and `of:undercuts` deferred until an adopter needs the LegalRuleML distinction?
3. Should a LegalRuleML encoding pointer remain under polymorphic `of:executableEncoding` with `kind: "lrml"`, or should a dedicated `of:legalRuleMLEncoding` predicate be introduced later?

## Worked examples to review first

1. [Colorado SB 24-205](../../examples/colorado-sb24-205/README.md): tests the split between legislative state, enforcement posture, and proposed replacement.
2. [Moffatt v. Air Canada](../../examples/air-canada/README.md): tests the proceeding strand and the Allegation to Determination distinction.
3. [Utah OAIP JIA](../../examples/publedge-jia-utah-72/README.md): tests joint interpretation and cross-portfolio anchors.

## Review outcomes

Before v0.1 freezes, each open question should be marked as one of:

- Accepted: no schema change required.
- Changed: schema, context, examples, or docs updated.
- Deferred: explicitly recorded in [ROADMAP.md](../../ROADMAP.md) with a reopen trigger.


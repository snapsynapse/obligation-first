# Crosswalk: Obligation-First ↔ LegalRuleML 1.0

Mapping Obligation-First's deontic quartet and defeasibility to LegalRuleML 1.0 (OASIS Standard). Source: [LegalRuleML at OASIS](https://docs.oasis-open.org/legalruleml/) — entry point for the LegalRuleML Technical Committee's published artifacts (Core spec, Akoma Ntoso integration, dependencies).

## Why this crosswalk matters

LegalRuleML is the most widely-known OASIS standard for representing legal norms. Adopters of Obligation-First should be able to interoperate with LegalRuleML-encoded rules. Adopters of LegalRuleML should see Obligation-First as a complementary upper layer for cross-instrument relationships, not a competitor at the rule-encoding layer.

## Deontic operator alignment

| Obligation-First | LegalRuleML 1.0 (§5.3) | Semantic equivalence |
|---|---|---|
| `of:Requirement` | `lrml:Obligation` | A primary duty to act |
| `of:Restriction` | `lrml:Prohibition` | A primary duty to refrain |
| `of:Permission` | `lrml:Permission` | An authorized capacity to act |
| `of:Reparation` | `lrml:Reparation` | A secondary duty triggered by violation |

Direct alignment. The naming difference (`Requirement` vs `Obligation`) is to avoid the term collision: in Obligation-First, `Obligation` is the *abstract superclass* of all four deontic operators, so `Requirement` names the specific subclass. LegalRuleML uses `Obligation` for what we call `Requirement`.

`of:Reparation` is preserved as a distinct deontic subclass in v0.2 specifically to keep this 1:1 LegalRuleML alignment intact and to keep SPARQL queries (`?r a of:Reparation`) clean. v0.2 only changed the *gist* binding for the class — see [reference/crosswalks/gist.md — Reparation gist binding](gist.md) for the layered `gist:Requirement` + `gist:Intention` (+ `gist:Event`) pattern (Semantic Arts feedback, 2026-05-26).

## Defeasibility alignment

LegalRuleML 1.0 §7.4 specifies `lr:DefeasibleRule` and exception hierarchies, distinguishing *rebuttal* (counter-conclusion) from *undercut* (denying the rule's applicability in this context). Obligation-First's defeasibility predicates are the cross-instrument counterpart:

- A `lrml:DefeasibleRule` represents a single rule that can be defeated.
- `of:defeats` represents the cross-Term relationship: Term A's Obligation overrides Term B's Obligation. General/fallback predicate.
- `of:rebuts` — subproperty of `of:defeats`. Aligns with the LegalRuleML rebut case (opposite conclusion).
- `of:undercuts` — subproperty of `of:defeats`. Aligns with the LegalRuleML undercut case (denies applicability).

These compose with LegalRuleML. A rule encoding a Term's logic can be marked `lr:DefeasibleRule`; the *which-rule-defeats-which* metadata lives at the spine layer, and the rebut/undercut distinction can flow through to `of:rebuts` / `of:undercuts` where the source rule annotates the type.

## Proceeding strand

LegalRuleML does not formally model proceedings, allegations, or determinations — its scope is the rule, not the legal matter that turns on the rule. Obligation-First's proceeding strand is therefore a clean addition with no overlap.

## Recommended interop pattern

For an adopter using both standards:

```yaml
"@context":
  - https://obligationfirst.org/v1/
  - http://docs.oasis-open.org/legalruleml/ns/v1.0/

"@type": of:Term
"@id": https://everyailaw.com/term/colorado-sb24-205-transparency.json
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
text: "A developer ... shall use reasonable care ..."
creates:
  - https://everyailaw.com/obligation/transparency.json
lrml_encoded_as: https://everyailaw.com/lrml/colorado-sb24-205-transparency.xml
```

The Term's `@id` is adopter-local and opaque — whatever the adopter's `.well-known` naming profile declares (here EveryAILaw's live, `.json`-served grammar), never a jurisdiction-encoded slug. Jurisdiction is a typed `gist:Jurisdiction` field carrying an ISO 3166-2 `ref`, never part of the slug. The LegalRuleML encoding rides as the typed `lrml_encoded_as` crosswalk that points from the Obligation-First Term to the LegalRuleML XML encoding of its rule logic — never as the `@id`. The field is conditional: present where a LegalRuleML encoding exists, absent otherwise.

## Open questions

1. Should Obligation-First formalize a `of:legalRuleMLEncoding` predicate in v0.1 (parallel to `of:executableEncoding`), or defer to v0.2?
2. LegalRuleML has richer defeasibility constructs than `of:defeats` alone (priority hierarchies, rebut/undercut distinction). Should `of:defeats` carry sub-types, or stay binary?

Both forwarded to LegalRuleML community for review.

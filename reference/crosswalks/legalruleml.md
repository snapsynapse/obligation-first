# Crosswalk: Obligation-First ↔ LegalRuleML 1.0

Mapping Obligation-First's deontic quartet and defeasibility to LegalRuleML 1.0 (OASIS Standard). Source: [LegalRuleML 1.0 spec](https://docs.oasis-open.org/legalruleml/legalruleml-core/v1.0/legalruleml-core-v1.0.html).

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

## Defeasibility alignment

LegalRuleML 1.0 §7.4 specifies `lr:DefeasibleRule` and exception hierarchies. Obligation-First's `of:defeats` predicate is the cross-instrument counterpart:

- A `lrml:DefeasibleRule` represents a single rule that can be defeated
- `of:defeats` represents the cross-Term relationship: Term A's Obligation overrides Term B's Obligation

These compose. A LegalRuleML rule encoding a Term's logic can be marked `DefeasibleRule`; the *which-rule-defeats-which* metadata lives in `of:defeats` at the spine layer.

## Proceeding strand

LegalRuleML does not formally model proceedings, allegations, or determinations — its scope is the rule, not the legal matter that turns on the rule. Obligation-First's proceeding strand is therefore a clean addition with no overlap.

## Recommended interop pattern

For an adopter using both standards:

```yaml
"@context":
  - https://w3id.org/of/v1/
  - http://docs.oasis-open.org/legalruleml/ns/v1.0/

"@type": of:Term
"@id": https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
text: "A developer ... shall use reasonable care ..."
creates:
  - https://everyailaw.com/obligation/co-sb24-205-reasonable-care
lrml_encoded_as: https://everyailaw.com/lrml/co-sb24-205-1703.xml
```

The `lrml_encoded_as` field (or equivalent — TBD whether to formalize this in v0.1 or defer) points from the Obligation-First Term to the LegalRuleML XML encoding of its rule logic.

## Open questions

1. Should Obligation-First formalize a `of:legalRuleMLEncoding` predicate in v0.1 (parallel to `of:executableEncoding`), or defer to v0.2?
2. LegalRuleML has richer defeasibility constructs than `of:defeats` alone (priority hierarchies, rebut/undercut distinction). Should `of:defeats` carry sub-types, or stay binary?

Both forwarded to LegalRuleML community for review.

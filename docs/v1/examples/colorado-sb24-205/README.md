# Worked example: Colorado SB 24-205 — a three-layer reality

This example does more than round-trip a single provision through the spine. It models Colorado's actual AI regulatory posture — a deliberately demanding test, because Colorado's situation is **not a simple "enacted law" case**. It is three layers operating simultaneously and not in alignment:

| Layer | Current condition | Practical effect |
|---|---|---|
| Legislation | SB 24-205 has been repealed and reenacted by its successor | The original compliance target no longer stands on its own |
| Enforcement | Attorney General enforcement was paused pending rulemaking; a federal court ordered a stay | Near-term enforcement risk was materially reduced |
| Political direction | SB26-189, an ADMT (automated decision-making technology) statute, was enacted on 2026-05-14 and supersedes SB 24-205 | The operative framework is now the successor statute |

A schema that can only model "the law" and not "the law's actual operating posture" is not useful for sensemaking. Obligation-First has to model all three layers, or it doesn't earn its place.

The good news: it can. The spine handles legislation. The proceeding strand handles enforcement. A second `enacted` Instrument with a `supersedes` relationship handles the legislative succession. The example below shows each layer round-tripped, then closes with a section on what this exercise revealed about the schema's strengths and the items that still need work.

## Record convention (v0.3.1)

Every record in this example follows the worked-example record convention:

- `@context` is the string `https://obligationfirst.org/v1/`.
- `@id` is a neutral, suffixless `obligationfirst.org` IRI of the form `https://obligationfirst.org/v1/examples/colorado-sb24-205/<entity-type>/<local-id>`. No jurisdiction code is encoded in the slug.
- `jurisdiction` is a typed field — `{ "@type": "gist:Jurisdiction", "ref": "us-co" }` — never a slug component. The federal-court records carry `ref: "us"`.
- Internal cross-references point at the neutral `@id` values within this example, so the record graph is internally consistent.
- Where a record corresponds to a real adopter entity, it carries `sameAs` to that adopter's published IRI (with the adopter's served `.json`). The two instruments and two of the authorities have real adopter counterparts; the remaining nine records are teaching constructs with no adopter counterpart and carry no `sameAs`.

## Why this is the right test for the schema

A schema claiming to model AI law that flattens Colorado into "SB 24-205 is enacted" misses the practical reality every Colorado-based reviewer knows: a statute that has since been repealed and reenacted, a period with no active rule set for implementing it, federal litigation that froze enforcement, and a successor bill moving through the legislative channel and now enacted.

That triangulation between *legislation*, *enforcement*, and *political direction* is exactly the reason an obligation-first model matters. Two laws with the same Obligation are commensurable even when their texts differ; the same is true *over time* within one jurisdiction — the Obligation that SB 24-205 §6-1-1703 expressed is the comparable unit when evaluating the successor ADMT statute, not the literal text. Colorado also happens to be the home of Semantic Arts, creators and stewards of the [gist](https://github.com/semanticarts/gist) upper ontology we're leveraging with this project.

## Layer 1 — Legislation (the spine)

This layer round-trips one provision (§6-1-1703 duty of care) through Authority / Instrument / Term / Obligation.

### Authority — Colorado General Assembly (enacting)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Authority
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/general-assembly
organization:
  "@type": gist:GovernmentOrganization
  name: Colorado General Assembly
authority_basis:
  kind: statutory
  instrument_ref: https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/co-constitution
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
```

### Authority — Colorado Attorney General (enforcing — currently constrained)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Authority
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/attorney-general
organization:
  "@type": gist:GovernmentOrganization
  name: Colorado Attorney General
authority_basis:
  kind: regulatory
  instrument_ref: https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/sb24-205
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
sameAs:
  - https://everyailaw.com/authority/colorado-ag.json
```

### Instrument — SB 24-205

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Instrument
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/sb24-205
title: "Concerning consumer protections in interactions with artificial intelligence systems"
short_title: "Colorado AI Act"
citation: "C.R.S. §6-1-1701 et seq."
issuedBy: https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/general-assembly
kind: statute
enacted: 2024-05-17
effective: 2026-06-30
status: repealed
enforcement_status: constrained
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
hasTerm:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/term/sb24-205-duty-of-care
source: https://leg.colorado.gov/sites/default/files/2024a_205_signed.pdf
sameAs:
  - https://everyailaw.com/instrument/colorado-sb24-205.json
```

The two state fields are independent: `status: repealed` describes the legislative state after the successor statute reenacted these provisions, while `enforcement_status: constrained` records the enforcement posture that held during the active period. The cause of the enforcement constraint is expressed via Layer 2 (the proceeding strand) — a federal-court Determination that anchors back to this Instrument's Reparation. The crosswalk to the live EveryAILaw record, which also shows SB 24-205 as `repealed`, rides as `sameAs`.

### Term — duty of care (§6-1-1703)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Term
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/term/sb24-205-duty-of-care
text: >
  A developer of a high-risk artificial intelligence system shall use
  reasonable care to protect consumers from any known or reasonably
  foreseeable risks of algorithmic discrimination arising from the
  intended and contracted uses of the high-risk artificial intelligence
  system.
section: "§6-1-1703(1)"
parent_instrument: https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/sb24-205
creates:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/obligation/reasonable-care
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/obligation/violation-reparation
```

### Obligation — Requirement (reasonable care duty)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Requirement
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/obligation/reasonable-care
title: Reasonable care duty for high-risk AI developers
duty_holder_type: developer
trigger: "deploys a high-risk artificial intelligence system"
content: >
  Use reasonable care to protect consumers from known or reasonably
  foreseeable risks of algorithmic discrimination.
created_by: https://obligationfirst.org/v1/examples/colorado-sb24-205/term/sb24-205-duty-of-care
```

### Obligation — Reparation (consequence of violation)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Reparation
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/obligation/violation-reparation
title: Civil penalty for violation of reasonable care duty
triggers_on_violation_of: https://obligationfirst.org/v1/examples/colorado-sb24-205/obligation/reasonable-care
remedy_kind: civil_penalty
enforcement_authority: https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/attorney-general
content: >
  A violation of §6-1-1703 constitutes an unfair or deceptive trade
  practice subject to enforcement under C.R.S. §6-1-105.
created_by: https://obligationfirst.org/v1/examples/colorado-sb24-205/term/sb24-205-duty-of-care
```

Obligation-First keeps `of:Reparation` as a distinct deontic subclass — the LegalRuleML 1:1 alignment and SPARQL queryability both depend on it. The *gist binding* for Reparation, per Semantic Arts feedback (Dave McComb, 2026-05-26): the declared duty maps to `gist:Requirement`; the legislative intent to repair attaches as `gist:Intention` to the creating Term; the actuated reparation, when it occurs, is recorded through the proceeding strand and conceptually maps to `gist:Event`.

## Layer 2 — Enforcement posture (the proceeding strand)

The federal court order staying enforcement is itself a Determination. The AG's public statement is a separate Determination (administrative, not judicial). Both anchor back to Obligations on the spine. The records in this layer are teaching constructs — they illustrate the proceeding strand and carry no adopter `sameAs`.

### Proceeding — federal litigation freezing enforcement

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Proceeding
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/proceeding/federal-litigation
title: "Federal litigation challenging Colorado SB 24-205 enforcement"
filed_date: 2025-09-01
issuedBy: https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/federal-district-court
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us
hasAllegation:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/allegation/enforcement-challenge
hasDetermination:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/determination/stay-order
notes: >
  Plaintiffs challenged the AG's authority to enforce SB 24-205 absent
  rulemaking. Federal court ordered enforcement stay until final rules
  are adopted.
```

### Determination — federal court stay

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Determination
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/determination/stay-order
issued_date: 2025-12-15
issuedBy: https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/federal-district-court
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us
decides:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/allegation/enforcement-challenge
disposition: confirmed
anchors:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/obligation/violation-reparation
notes: >
  The Determination does NOT void the underlying obligation in §6-1-1703;
  the Requirement remains in the schema as enacted. What the Determination
  affects is the enforcement_authority's capacity to act on the Reparation
  until rulemaking completes.
```

The `anchors` link points at the Reparation Obligation defined in Layer 1 of this same example. The anchor is therefore an in-example join, not a cross-repo claim: both the Determination and the Reparation it constrains are neutral records here, joined by their `obligationfirst.org` IRIs.

### Determination — AG public statement of non-enforcement intent

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Determination
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/determination/ag-non-enforcement-statement
issued_date: 2025-11-30
issuedBy: https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/attorney-general
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
decides: []   # this Determination is administrative, not adjudicative
disposition: issued
anchors:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/obligation/violation-reparation
notes: >
  AG stated to the federal court he does not intend to enforce SB 24-205
  or any replacement law until rulemaking is complete; has not yet
  initiated formal rulemaking. This is enforcement *posture*, not a
  ruling on the law itself.
```

## Layer 3 — Legislative succession (the second Instrument)

SB26-189, the ADMT statute, was enacted on 2026-05-14 and repeals-and-reenacts the SB 24-205 provisions with new requirements for automated decision-making technology in consequential decisions. Because it is now enacted, it is modeled with `status: enacted` and a `supersedes` relationship to SB 24-205. The predecessor's `status` is correspondingly `repealed`.

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Instrument
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/sb26-189
title: "SB26-189 Automated Decision-Making Technology"
issuedBy: https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/ai-policy-work-group
kind: statute
status: enacted
supersedes:
  - https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/sb24-205
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
source: https://leg.colorado.gov/bills/sb26-189
sameAs:
  - https://everyailaw.com/instrument/colorado-sb26-189.json
```

SB26-189 repeals and reenacts the SB 24-205 AI provisions, shifting from a high-risk AI governance model toward an ADMT framework for consequential decisions: technical documentation, consumer notices, post-adverse-outcome explanation, correction rights, meaningful human review, record retention, and a cure period before enforcement where cure is possible. The crosswalk to the live EveryAILaw record, which shows SB26-189 as `enacted` (2026-05-14), rides as `sameAs`.

### Authority — Colorado AI Policy Work Group

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Authority
"@id": https://obligationfirst.org/v1/examples/colorado-sb24-205/authority/ai-policy-work-group
organization:
  "@type": gist:Organization
  name: Colorado AI Policy Work Group (governor-backed)
authority_basis:
  kind: regulatory
  instrument_ref: https://obligationfirst.org/v1/examples/colorado-sb24-205/instrument/governor-executive-order-establishing-work-group
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
```

Advisory body, not an enacting authority. Its outputs are recommendations, not binding instruments. The recursive Authority basis still works: `authority_basis` traces to the executive order that established the group, which is itself an Instrument on the spine.

## Findings

### What the schema handled well

1. **The three-layer reality round-trips cleanly.** Spine = legislation, proceeding strand = enforcement posture, second `enacted` Instrument with `supersedes` = legislative succession. No special-casing required.
2. **The recursive Authority basis paid off.** The Colorado AI Policy Work Group is not a government department; it's a governor-convened advisory body. Its `authority_basis.instrument_ref` points to the executive order that created it. The schema handles this without a "non-government Authority" exception.
3. **Reparation modeled the right thing.** The §6-1-1703 duty creates a Requirement (use reasonable care). Violation of that Requirement triggers a Reparation (civil penalty enforced by AG). The federal stay does not vacate the Requirement — it constrains the Reparation's `enforcement_authority`'s capacity to act. That distinction is exactly what Reparation as a separate deontic class enables.
4. **`anchors` from a Determination back to an Obligation worked within the example graph.** The federal court's stay and the Reparation it constrains are both neutral records here, joined by their `obligationfirst.org` IRIs. Real-world identity rides separately in `sameAs` crosswalks on the records that have adopter counterparts.
5. **The split between `status` and `enforcement_status` carried weight.** SB 24-205 is `status: repealed` *and* carries `enforcement_status: constrained` for the period it was active. A schema that forced these into a single field would have to either lose information or invent a "stayed-pending-rulemaking" enum value that wouldn't generalize across jurisdictions. The split avoids both.
6. **`supersedes` is the right verb post-enactment.** With SB26-189 now enacted, `supersedes` states the whole-Instrument replacement directly. The subjunctive `wouldSupersede` form is reserved for `proposed` Instruments that have not yet been enacted.

### Schema relations this example exercises

- **`of:enforcement_status`** — a closed flat enum (`routine | constrained | unsignaled`) sibling to `of:status`. Independent dimension. The cause of a non-routine state is expressed via the proceeding strand, deliberately not baked into the enum. See PROTOCOL.md "Why enforcement cause lives in the proceeding strand" for the rationale.
- **`of:supersedes`** — Instrument → Instrument, post-enactment, whole-Instrument replacement. Distinct from `of:defeats` (which is Term-level). Does not imply Term-level defeats automatically.
- **`of:wouldSupersede`** — the subjunctive form, used by `proposed` Instruments. Migrates to `supersedes` on enactment, which is exactly the transition SB26-189 has now completed.

### What this example deliberately leaves abstract

The federal-litigation dates and caption are illustrative. The proceeding-strand records (proceeding, allegation, both determinations) and several spine authorities are teaching constructs with no adopter counterpart; they exist to demonstrate the strand, and carry neutral `@id` values with no `sameAs`. The records validate against the schema and graph validators regardless.

# Worked example: Colorado SB 24-205 — a three-layer reality

This example does more than round-trip a single provision through the spine. It models Colorado's actual AI regulatory posture as of May 2026 — a deliberately demanding test, because Colorado's situation is **not a simple "enacted law" case**. It is three layers operating simultaneously and not in alignment:

| Layer | Current condition | Practical effect |
|---|---|---|
| Legislation | SB 24-205 remains enacted Colorado law | A compliance target still exists on paper |
| Enforcement | Attorney General enforcement is paused until rulemaking is complete; federal court has ordered the stay | Near-term enforcement risk is materially reduced |
| Political direction | Governor-backed work group endorses a replacement ADMT (automated decision-making technology) framework | Likely destination differs from current statute |

A schema that can only model "the law" and not "the law's actual operating posture" is not useful for sensemaking. Obligation-First has to model all three layers, or it doesn't earn its place.

The good news: it can. The spine handles legislation. The proceeding strand handles enforcement. A second `proposed` Instrument with the right relationships handles political direction. The example below shows each layer round-tripped, then closes with a section on what this exercise revealed about the schema's strengths and the items that still need work.

## Why this is the right test for the schema

The current legal-and-policy landscape in Colorado is widely covered in regulatory commentary, and a schema claiming to model AI law that flattens this situation into "SB 24-205 is enacted" misses the practical reality every Colorado-based reviewer knows. The briefing this example is built from describes the apparent contradiction directly: a live statute, no active rule set for implementing it, federal litigation freezing enforcement, and a policy process aimed at replacement rather than operationalization.

That triangulation between *legislation*, *enforcement*, and *political direction* is exactly the reason an obligation-first model matters. Two laws with the same Obligation are commensurable even when their texts differ; the same is true *over time* within one jurisdiction — the Obligation that today's SB 24-205 §6-1-1703 expresses is the comparable unit when evaluating a future ADMT statute, not the literal text. Colorado also happens to be the home of Semantic Arts, creators and stewards of the [gist](https://github.com/semanticarts/gist) upper ontology we're leveraging with this project.

## Layer 1 — Legislation (the spine)

This layer round-trips one provision (§6-1-1703 duty of care) through Authority / Instrument / Term / Obligation.

### Authority — Colorado General Assembly (enacting)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Authority
"@id": https://everyailaw.com/authority/us-co-general-assembly
organization:
  "@type": gist:GovernmentOrganization
  name: Colorado General Assembly
authority_basis:
  kind: statutory
  instrument_ref: https://everyailaw.com/instrument/co-constitution
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
```

### Authority — Colorado Attorney General (enforcing — currently constrained)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Authority
"@id": https://everyailaw.com/authority/us-co-attorney-general
organization:
  "@type": gist:GovernmentOrganization
  name: Colorado Attorney General
authority_basis:
  kind: regulatory
  instrument_ref: https://everyailaw.com/instrument/co-sb24-205#enforcement
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
```

### Instrument — SB 24-205

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Instrument
"@id": https://everyailaw.com/instrument/co-sb24-205
title: "Concerning consumer protections in interactions with artificial intelligence systems"
short_title: "Colorado AI Act"
citation: "C.R.S. §6-1-1701 et seq."
issuedBy: https://everyailaw.com/authority/us-co-general-assembly
enacted: 2024-05-17
effective: 2026-06-30
status: enacted
hasTerm:
  - https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
  - https://everyailaw.com/term/co-sb24-205-1707-rebuttable-presumption
  # ... additional terms
source: https://leg.colorado.gov/sites/default/files/2024a_205_signed.pdf
akn_uri: https://akn.everyailaw.com/us/co/act/2024/sb-205/main
notes: >
  Statute remains enacted law as of 2026-05-04. Effective date 2026-06-30
  remains on the legislative calendar. However, enforcement is presently
  stayed by federal court order pending completion of rulemaking — see
  Layer 2 (proceeding strand) below. The status field captures the
  legislative state only; enforcement posture is modeled separately.
```

### Term — duty of care (§6-1-1703)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Term
"@id": https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
text: >
  A developer of a high-risk artificial intelligence system shall use
  reasonable care to protect consumers from any known or reasonably
  foreseeable risks of algorithmic discrimination arising from the
  intended and contracted uses of the high-risk artificial intelligence
  system.
section: "§6-1-1703(1)"
parent_instrument: https://everyailaw.com/instrument/co-sb24-205
creates:
  - https://everyailaw.com/obligation/co-sb24-205-reasonable-care
  - https://everyailaw.com/obligation/co-sb24-205-violation-reparation
defeats:
  - https://everyailaw.com/term/co-sb24-205-1707-rebuttable-presumption
executableEncoding: null
```

### Obligation — Requirement (reasonable care duty)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Requirement
"@id": https://everyailaw.com/obligation/co-sb24-205-reasonable-care
title: Reasonable care duty for high-risk AI developers
duty_holder_type: developer
trigger: "deploys a high-risk artificial intelligence system"
content: >
  Use reasonable care to protect consumers from known or reasonably
  foreseeable risks of algorithmic discrimination.
created_by: https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
```

### Obligation — Reparation (consequence of violation)

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Reparation
"@id": https://everyailaw.com/obligation/co-sb24-205-violation-reparation
title: Civil penalty for violation of reasonable care duty
triggers_on_violation_of: https://everyailaw.com/obligation/co-sb24-205-reasonable-care
remedy_kind: civil_penalty
enforcement_authority: https://everyailaw.com/authority/us-co-attorney-general
content: >
  A violation of §6-1-1703 constitutes an unfair or deceptive trade
  practice subject to enforcement under C.R.S. §6-1-105. Note: the
  enforcement authority's ability to act on this Reparation is presently
  stayed — see Layer 2 below.
created_by: https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
```

## Layer 2 — Enforcement posture (the proceeding strand)

The federal court order staying enforcement is itself a Determination. The AG's public statement is a separate Determination (administrative, not judicial). Both anchor back to Obligations on the spine.

### Proceeding — federal litigation freezing enforcement

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Proceeding
"@id": https://aiincidentlaw.org/proceeding/co-sb24-205-federal-litigation
title: "Federal litigation challenging Colorado SB 24-205 enforcement"
filed_date: 2025-XX-XX   # date placeholder — to be filled from court record
issuedBy: https://aiincidentlaw.org/authority/us-co-federal-district-court
hasAllegation:
  - https://aiincidentlaw.org/allegation/co-sb24-205-enforcement-challenge
hasDetermination:
  - https://aiincidentlaw.org/determination/co-sb24-205-stay-order
notes: >
  Plaintiffs challenged the AG's authority to enforce SB 24-205 absent
  rulemaking. Federal court ordered enforcement stay until final rules
  are adopted.
```

### Determination — federal court stay

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Determination
"@id": https://aiincidentlaw.org/determination/co-sb24-205-stay-order
issued_date: 2025-XX-XX   # placeholder
issuedBy: https://aiincidentlaw.org/authority/us-co-federal-district-court
decides:
  - https://aiincidentlaw.org/allegation/co-sb24-205-enforcement-challenge
disposition: confirmed
anchors:
  - https://everyailaw.com/obligation/co-sb24-205-violation-reparation
notes: >
  The Determination does NOT void the underlying obligation in §6-1-1703;
  the Requirement remains in the schema as enacted. What the Determination
  affects is the enforcement_authority's capacity to act on the Reparation
  until rulemaking completes.
```

### Determination — AG public statement of non-enforcement intent

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Determination
"@id": https://aiincidentlaw.org/determination/co-ag-non-enforcement-statement
issued_date: 2025-XX-XX
issuedBy: https://everyailaw.com/authority/us-co-attorney-general
decides: []   # this Determination is administrative, not adjudicative
disposition: issued
anchors:
  - https://everyailaw.com/obligation/co-sb24-205-violation-reparation
notes: >
  AG stated to the federal court he does not intend to enforce SB 24-205
  or any replacement law until rulemaking is complete; has not yet
  initiated formal rulemaking. This is enforcement *posture*, not a
  ruling on the law itself.
```

## Layer 3 — Political direction (a second proposed Instrument)

The Colorado AI Policy Work Group's endorsed ADMT replacement framework is itself an Instrument, modeled with `status: proposed`. It does not yet exist as enacted law; it points toward where Colorado may go.

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Instrument
"@id": https://everyailaw.com/instrument/co-admt-proposed
title: "Proposed ADMT framework (replacement for SB 24-205)"
issuedBy: https://everyailaw.com/authority/us-co-ai-policy-work-group
status: proposed
notes: >
  Endorsed by Colorado AI Policy Work Group as a replacement for SB 24-205,
  shifting from a high-risk AI governance model toward a privacy-style
  ADMT framework: notice, explanation, human review, correction rights,
  record retention. Not yet introduced as legislation as of 2026-05-04.
  If enacted, would likely supersede SB 24-205 — see deferred decision
  in ROADMAP.md regarding `of:supersedes` vs `of:defeats` semantics.
```

The schema does not yet have a first-class `of:supersedes` relation distinct from `of:defeats`. This example surfaces that gap explicitly (see [Findings](#findings) below).

### Authority — Colorado AI Policy Work Group

```yaml
"@context": https://obligationfirst.org/v1/
"@type": of:Authority
"@id": https://everyailaw.com/authority/us-co-ai-policy-work-group
organization:
  "@type": gist:Organization
  name: Colorado AI Policy Work Group (governor-backed)
authority_basis:
  kind: regulatory
  instrument_ref: https://everyailaw.com/instrument/co-governor-executive-order-establishing-work-group
jurisdiction:
  "@type": gist:Jurisdiction
  ref: us-co
notes: >
  Advisory body, not an enacting authority. Its outputs are recommendations,
  not binding instruments. The recursive Authority basis still works:
  authority_basis traces to the executive order that established the
  group, which is itself an Instrument on the spine.
```

## Findings

This example earned its place. Three findings worth carrying forward:

### What the schema handled well

1. **The three-layer reality round-trips cleanly.** Spine = legislation, proceeding strand = enforcement posture, second `status: proposed` Instrument = political direction. No special-casing required.
2. **The recursive Authority basis paid off.** The Colorado AI Policy Work Group is not a government department; it's a governor-convened advisory body. Its `authority_basis.instrument_ref` points to the executive order that created it. The schema handles this without a "non-government Authority" exception.
3. **Reparation modeled the right thing.** The §6-1-1703 duty creates a Requirement (use reasonable care). Violation of that Requirement triggers a Reparation (civil penalty enforced by AG). The federal stay does not vacate the Requirement — it constrains the Reparation's `enforcement_authority`'s capacity to act. That distinction is exactly what Reparation as a separate deontic class enables.
4. **`anchors` from a Determination back to an Obligation worked across repos.** The federal court's stay is a record in AI Incident Law; the Obligation it constrains is a record in EveryAILaw. The IRI binding makes the cross-repo join trivial.

### What the schema didn't handle well — items for v0.2

1. **`Instrument.status` is overloaded.** The current enum (`proposed | enacted | in-force | amended | sunset | repealed | superseded | withdrawn`) describes legislative state only. SB 24-205 is `enacted` with a future effective date, but enforcement is stayed — that's a separate dimension the status field cannot express. **Proposal for v0.2:** introduce `enforcement_status` as a sibling to `status`, with values like `routine | stayed | pending-rulemaking | unsignaled`.
2. **No first-class `of:supersedes` relation.** When/if the ADMT framework is enacted, it would replace SB 24-205. We have `of:defeats` (cross-Term override per defeasibility), but supersession is whole-Instrument. **Proposal for v0.2:** introduce `of:supersedes` as an Instrument-to-Instrument relation distinct from `of:defeats`.
3. **No `of:proposed_replacement_for`.** Pre-enactment, the relationship between a proposed Instrument and the existing one it would replace is significant for sensemaking but has no first-class predicate. **Proposal for v0.2:** consider `of:proposed_replacement_for` (Instrument → Instrument) as a soft predecessor to the eventual `of:supersedes`.

### What this example deliberately leaves unfinished

Several `XX-XX` date placeholders for the federal litigation. This example is a schema demonstration, not a litigation tracker; specific dates and case captions can be filled by an adopter (likely AI Incident Law) when binding to v0.1. The schema validates regardless.

## What this means for the McComb conversation

The brief version: Obligation-First does not flatten Colorado's AI regulatory posture into a single tidy statute record. It models the spine, the litigation, and the policy direction as three separate but related layers, and the gaps it surfaces (overloaded `status`, missing `supersedes`, missing `proposed_replacement_for`) are honest v0.2 work items rather than concealed weaknesses.

For Colorado-based reviewers — Semantic Arts is in Boulder — this is the right level of fidelity. A schema that ignores the litigation and the work group's ADMT proposal would not be a serious model of Colorado AI law as it actually exists right now.

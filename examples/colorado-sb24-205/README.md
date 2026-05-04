# Worked example: Colorado SB 24-205 §6-1-1703

Round-trips one provision of the Colorado AI Act through the Obligation-First spine. Tests Authority → Instrument → Term → Obligation composition with a real, in-force statute.

## Why this example

Colorado SB 24-205 is the first comprehensive US state AI law to come into force. It's algorithmically structured (impact assessments triggered by thresholds, safe harbors with conditions) — exactly the shape that benefits from obligation-first modeling. If this provision round-trips cleanly through the spine, the schema covers the substantial majority of state-level AI law.

This example also exercises:

- An Authority with two role types (the General Assembly enacts; the Attorney General enforces)
- A Term that creates multiple Obligations of different deontic kinds (Requirement + Reparation)
- ELI-style Instrument identification
- An `executableEncoding` placeholder for future Catala/Blawx encoding

## The records

### 1. Authority — Colorado General Assembly (enacting)

```yaml
"@context": https://w3id.org/of/v1/
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

### 2. Authority — Colorado Attorney General (enforcing)

```yaml
"@context": https://w3id.org/of/v1/
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

Two Authorities, two `authority_basis` kinds, one statute. The General Assembly's authority traces to the Colorado Constitution; the AG's enforcement authority traces back to SB 24-205 itself — a recursive grounding that the schema handles without special-casing.

### 3. Instrument — Colorado SB 24-205

```yaml
"@context": https://w3id.org/of/v1/
"@type": of:Instrument
"@id": https://everyailaw.com/instrument/co-sb24-205
title: "Concerning consumer protections in interactions with artificial intelligence systems"
short_title: "Colorado AI Act"
citation: "C.R.S. §6-1-1701 et seq."
issuedBy: https://everyailaw.com/authority/us-co-general-assembly
enacted: 2024-05-17
effective: 2026-02-01
status: enacted
hasTerm:
  - https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
  - https://everyailaw.com/term/co-sb24-205-1703-impact-assessment
  - https://everyailaw.com/term/co-sb24-205-1703-disclosure
  # ... additional terms
source: https://leg.colorado.gov/sites/default/files/2024a_205_signed.pdf
akn_uri: https://akn.everyailaw.com/us/co/act/2024/sb-205/main
```

### 4. Term — duty of care (§6-1-1703)

```yaml
"@context": https://w3id.org/of/v1/
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
executableEncoding: null   # Catala/Blawx encoding TBD
```

### 5. Obligation — Requirement (reasonable care duty)

```yaml
"@context": https://w3id.org/of/v1/
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

### 6. Obligation — Reparation (consequence of violation)

```yaml
"@context": https://w3id.org/of/v1/
"@type": of:Reparation
"@id": https://everyailaw.com/obligation/co-sb24-205-violation-reparation
title: Civil penalty for violation of reasonable care duty
triggers_on_violation_of: https://everyailaw.com/obligation/co-sb24-205-reasonable-care
remedy_kind: civil_penalty
enforcement_authority: https://everyailaw.com/authority/us-co-attorney-general
content: >
  A violation of §6-1-1703 constitutes an unfair or deceptive trade
  practice subject to enforcement under C.R.S. §6-1-105.
created_by: https://everyailaw.com/term/co-sb24-205-1703-duty-of-care
```

## Round-trip findings

- ✅ Two Authorities (enactor + enforcer) attached to one Instrument works
- ✅ One Term creating both a Requirement and a Reparation works — exactly the case Reparation was added to handle
- ✅ `defeats` predicate cleanly expresses the §6-1-1707 rebuttable-presumption exception to the §6-1-1703 duty
- ✅ ELI-style URI scheme works; Akoma Ntoso element IRI cohabits via `akn_uri` companion field
- ⚠ Open question: should `duty_holder_type` and `trigger` be standardized, or stay repo-local? They feel like they want a vocabulary, but standardizing would expand v0.1 scope. Defer.
- ⚠ Open question: Reparation's `triggers_on_violation_of` is asymmetric to Term's `creates`. Should there be a separate `of:violationOf` relation? Note for v0.2.

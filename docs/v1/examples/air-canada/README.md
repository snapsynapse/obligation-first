# Worked example: Moffatt v. Air Canada

This v0.6 example round-trips AI Incident Law record AIEL-2024-001 through the Obligation-First proceeding strand.

## What the example proves

- `of:Proceeding` uses `heardBy`, not `issuedBy`, for the tribunal.
- Claimant and respondent are typed `of:Party` records with explicit roles.
- Allegations identify their asserting Party and the Party they concern.
- The common-law duty is a concrete `of:Requirement` grounded by `recognized_by` because no legislative Term created it.
- The Determination links the recognized Obligation to the remedy.
- Links to AI Incident Law records use `describesSameEntityAs`, not `owl:sameAs`, because the two repositories publish corresponding representations with different modeling granularity.
- Territorial scope (`ca-bc`) and institutional competence (the BCCRT) remain distinct.

## Graph

```text
Moffatt and Air Canada -> Proceeding -> heardBy BCCRT
Moffatt -> asserts Allegations -> allegedly violate Requirement
BCCRT Determination -> recognizes Requirement -> remedy
Requirement -> duty_holders Air Canada -> owed_to Moffatt
```

The authoritative decision is [Moffatt v. Air Canada, 2024 BCCRT 149](https://canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html). The live adopter projection is at [AI Incident Law](https://aiincidentlaw.org/).

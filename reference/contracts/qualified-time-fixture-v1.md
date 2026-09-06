# Qualified-time fixture contract v1

Scope: Obligation-First offline F14 acceptance fixtures and the EveryAILaw/PubLedge owner sidecars. This is a tooling contract, not a normative OF schema or vocabulary extension.

Status: implemented locally on 2026-09-05 America/Denver; not released or deployed. The v0.6.4 release and its immutable package are unchanged. Implementation: `scripts/lib/qualified-time.mjs`. Shape: `qualified-time-fixture-v1.schema.json`. Synthetic regressions run in `npm run test:hardening`; owner fixtures run in `npm run verify:federation`.

## Interpretation

A fixture carries a precisely scoped subject, an explicit `as_of` date, one condition, and two named branches. `expected` is the date selected when the stated condition is satisfied; `fallback` is selected when it is unsatisfied at the stated as-of. Neither label assigns probability or legal force. Adoption and signature alone do not establish a different condition such as publication or commencement.

Each branch retains its source citation and original date precision. Null represents missing evidence or a missing date. An omitted required field is malformed input, not an alternative spelling of unknown. ISO year, month, and day dates are supported; impossible calendar dates fail. No current clock, network request, fuzzy matching, or corpus total participates in evaluation.

| Condition evidence | Result branch | Date comparison |
|---|---|---|
| Satisfied, evidenced at or before as-of | expected | Compare only this branch's supported date |
| Unsatisfied, evidenced at or before as-of | fallback | Compare only this branch's supported date |
| Unknown | unknown | Unknown, even if branch dates happen to match |
| Conflicted, with evidence | conflicted | Conflicted, never agreement |
| Missing as-of, condition source, or observation date | unknown | No branch inferred |
| Observation after as-of | unknown | Later evidence cannot establish this fixture's earlier state |

`observed_on` describes the dated observation supporting the condition, not when a developer ran the test. This fixture convention conservatively rejects retrospective use of later observations; it is not a general model of historical evidence. An explicitly supplied future as-of can exercise a scenario but makes no prediction about intervening legal changes.

The output is `{branch, date, state}`. `state` is `before`, `on-or-after`, `unknown`, or `conflicted`. It compares as-of with the selected date only. It is never an assertion of applicability, enforcement, whole-instrument operative status, or compliance. A month/year is compared using internal bounds; an overlapping as-of is unknown. The original partial date is returned unchanged, never completed with an invented day. Missing selected-branch evidence cannot be replaced by the other branch's date.

An optional `assertion` is checked against all three output fields. Adopter acceptance cases must have assertions. Stable diagnostic prefixes are `F14-SHAPE`, `F14-DATE`, `F14-ASSERTION-BRANCH`, `F14-ASSERTION-DATE`, `F14-ASSERTION-STATE`, `F14-ADOPTER-SHAPE`, `F14-COVERAGE`, `F14-RECORD-DRIFT`, `F14-BINDING-DRIFT`, and `F14-NATIVE-MAPPING`, `F14-ADOPTER-READ`, and `F14-USAGE`. Missing evidence is reported in result reasons separately from invalid assertions.

## Synthetic pre-operative amendment

`reference/fixtures/qualified-time-v1/pending-amendment.json` uses only invented, redistributable facts and example.org identifiers. It preserves an amended planning month and an unamended scheduled day while commencement remains unresolved. Tests exercise satisfied, unsatisfied, unknown, conflicted, missing-date, partial-date, future-evidence, and contradictory-assertion variants.

The EveryAILaw federation invocation requires `--require-pending-mapping`; deleting the native mapping cannot bypass that gate. EveryAILaw's owner fixture includes the native `amendment_status` / provision `effective` / `effective_if_unamended` mapping. `amendment_status.expected` is a publication/commencement window; it is not substituted for a provision's amended effective date. An `adopted-awaiting-publication` stage does not select the amended branch. This is an offline mapping example, not a new pending instrument or a change to the production exporter.

## Colorado boundary, not a historical conclusion

Official sources were rechecked on 2026-09-05 America/Denver: [SB 26-189 bill history](https://leg.colorado.gov/bills/sb26-189) and [signed act](https://leg.colorado.gov/bill_files/116489/download). The downloaded signed PDF matches EveryAILaw's stored original, SHA-256 `87a8824f9071c63d2d47b736e414d28e216f5387ef5602484e53127bc94b283e`. Pages 23-24 were visually inspected, including the May 14 approval. Section 1 was checked against the stored raw text.

The acceptance sidecars separate section 5(1)'s January 1, 2027 general commencement, section 5(2)'s enumerated upon-passage provisions, and section 5(3)'s January 1, 2027 decision-date cutoff. Section 1's repeal-and-reenactment relationship cannot supply a universal effective date. The section 5(2) scope includes specified sections in both titles 6 and 10 and sections 4, 5, and 6 of the act; it is not limited to three rulemaking subsections.

At the fixed September 5 as-of, the general-date comparison is before and the upon-passage-date comparison is on-or-after. This does not establish the predecessor's operative history. That acceptance case remains unknown pending source review of commencement, intervening legislation, and any judicial orders. It also does not settle the separate HB 26-1263 harmonization question.

Both owner sidecars live at `tests/fixtures/of-qualified-time.json`. They bind to the actual successor export's identity, enactment date, scalar effective date, and unknown operative status. Existing cross-entity agreement and projection freshness gates remain in force. The sidecars preserve the distinctions for acceptance testing; published scalar records do not yet serialize this qualified-time structure. They are not evidence of production adoption of the tooling contract.

## Remaining decisions

- Review predecessor historical assertions in the owning corpora using the necessary official sources; do not infer their truth or falsity from signature alone.
- Demonstrate a production representation need from a second adopter before proposing a normative schema extension. Two acceptance sidecars alone do not meet that threshold.
- General temporal causality, nested provenance, evidence-tier policy, relationship migration metadata, and F15 consumer traversals remain separate work.
- A later delivery tranche must decide how to distribute/version the evaluator. No release-pinned inventory, package, or identifier changes in this fixture tranche.

## Local verification

The [initial acceptance record](../F14-acceptance-2026-09-05.json) preserves the first 42-check candidate and its hashes. The [subsequent documentation/eval pass](../documentation-audit-2026-09-05.md) adds native-mapping omission, input/IO, calendar-boundary and timezone checks, plus code-backed surface parity. The current synthetic suite has 60 checks. Earlier candidate hashes are historical, not assertions about the later edited files.

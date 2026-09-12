# Colorado evolution companion

This two-record companion is a synthetic current-contract teaching set at the fixed `2026-09-05` as-of date. It leaves the [Colorado SB 24-205 historical fixture](../colorado-sb24-205/README.md) intact. It is not a current legal-status report, a source refresh, or a conclusion about predecessor operation, enforcement, applicability, or compliance.

The records use only the bounded evidence already exercised by the local F14 owner sidecars: Colorado SB 26-189's `2026-05-14` enactment, the section 5(1) `2027-01-01` general date, and the section 1 replacement relationship. See the [qualified-time fixture contract](https://github.com/snapsynapse/obligation-first/blob/main/reference/contracts/qualified-time-fixture-v1.md). The companion intentionally has no `verified` or `retrieved` field, because it does not claim a new source review.

| Record | Lifecycle | Operation | Enforcement | Evidence boundary |
|---|---|---|---|---|
| `co-sb24-205-predecessor` | Omitted pending owner lifecycle decision | `unknown` | `unknown` | The successor relationship does not establish predecessor history or choose a predecessor label. |
| `co-sb26-189-successor` | `enacted` | `unknown` | `unknown` | Enactment and a section-specific date do not establish whole-instrument operation or enforcement. |

These fields answer different questions. `lifecycle_status` describes the legislative state, and its omission on the predecessor preserves the unresolved owner decision. `operative_status` states whether this record is known to operate at the fixed as-of. `enforcement_status` states what is known about enforceability at that as-of. `unknown` is an explicit evidence boundary, not an absence claim.

The successor's `supersedes` edge is asserted only because the frozen signed-act review identified the section 1 replacement relationship. The edge does not choose a predecessor lifecycle label, and no Term-level replacement is inferred. The companion deliberately omits a scalar `effective` field: section 5(1)'s January 1, 2027 date has scoped exceptions, which the F14 sidecar keeps separately. The predecessor uses `describesSameEntityAs` to connect this independently maintained teaching description to the historical fixture. The successor uses the same weaker correspondence relation for the two owner records named in their local F14 sidecars. None of these links is `sameAs`, which would assert property-merge identity.

The retained historical fixture's synthetic litigation, determinations, legacy status fields, and former enforcement narrative are not current facts and are not reused here. A future record-level source review can add facts only with its own evidence and as-of boundary.

# Obligation-First v0.4.3

Reverts an unintended breaking change shipped in v0.4.2.

The v0.4.2 code-review pass added a `pattern` constraint
(`^[a-z]{2}(-[a-z0-9]{1,3})?$`) to `jurisdiction/ref` across seven schemas,
restricting the field to ISO 3166 codes. The constraint never existed before
v0.4.2 and rejected already-published conforming records from adopters
tracking supranational bodies (OECD, G7, Council of Europe, ISO) that have no
ISO 3166 alpha-2 code — despite the field's own description promising
"country/supranational" coverage. v0.4.2 described itself as additive at the
schema level; this constraint was not.

## Fixed

- `jurisdiction/ref` pattern constraint removed from `authority`,
  `instrument`, `obligation`, `proceeding`, `allegation`, `determination`,
  and `naming-profile` schemas, restoring the v0.4.1 contract
  (description-only guidance; ISO 3166 codes remain the recommended form).

How the spec should model non-territorial issuers — including whether bodies
without enforcement power belong under `Authority` at all — is deliberately
not decided here; it is an open design question for v0.5.

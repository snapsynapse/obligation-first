# Design note: IRI federation and identifier crosswalks

Status: Accepted 2026-06-02. Implementation in progress (this note plus PROTOCOL amendments land first; schema, profile format, validator, handoff reconciliation, and example realignment follow).

Scope: how Obligation-First record `@id` values relate to each other and to external standard identifiers across adopters. This is a standards-level decision for the Obligation-First spec. It is additive and non-breaking to v0.1 / v0.2 adopter records.

## Why this exists

A worked example (EU AI Act Article 50) was found minting `everyailaw.com` IRIs that do not match what EveryAILaw actually publishes (`eu-commission` vs the live `european-commission`, suffixless vs `.json`, plus ~15 invented term and obligation IRIs). A four-way audit across the three live adopters (EveryAILaw, PubLedge, AI Incident Law) and all four worked examples showed the problem is systemic, not local:

- Because of the `.json` suffix alone, zero of the 50 example `@id` values resolve against any live adopter.
- The examples were authored to match the binding handoffs in `reference/handoffs/`. All three adopters then implemented differently from their own handoffs, and from each other. One Colorado statute has three different IRIs across the ecosystem.
- The divergences are of three kinds: true drift (same entity, same adopter, different IRI), legitimate adopter editorial autonomy (EveryAILaw spells out states, PubLedge uses full issuance IDs, AI Incident Law uses opaque `aiel-` sequences), and same-law-different-role (EveryAILaw models the law, PubLedge models its issuance instrument; correctly distinct, joined by `anchors`).

The root cause is twofold: PROTOCOL told authors example `@id` values were "aspirational" predictions of adopter IRIs (a license to guess), and the binding handoffs prescribed schemes no adopter follows. Nothing reconciled prediction against live data once an adopter went live.

## The decision

Obligation-First is a public standard, optimized for adoption ease even at the spec's own expense. Wherever a solved problem or norm exists, default to it.

1. `@id` is federated. Record `@id` values are adopter-local, opaque, and permanent. An `@id` identifies the adopter's record about a legal entity, not the entity's canonical external identifier. Obligation-First does not prescribe slug grammar; each adopter declares its own.

2. Standard identifiers ride as typed crosswalks. ELI, ECLI, Akoma Ntoso, urn:lex, Wikidata, and the rest are carried as typed properties on the record, never as the `@id`. Cross-adopter joins key on crosswalks, not slugs.

3. Permanence with redirects. Once published, an `@id` does not change. A namespace reorganization MUST keep the old `@id` resolving via HTTP 301 (W3C "Cool URIs Don't Change"). A rename is therefore not a breaking change as long as the redirect persists. This is what lets canonical identity and "do not restructure anyone's files" coexist.

4. Each adopter publishes a naming profile. At a `.well-known` location, using VoID `uriSpace` and `uriRegexPattern` plus an RFC 6570 URI Template and a declared list of supplied crosswalks. The profile is adopter-owned and adopter-published; Obligation-First consumes and validates against it, and never prescribes it. This is deliberate: the handoffs failed precisely because they were a spec-held prescription that drifted from adopter reality. ELI is the proof the pattern works: every EU member state publishes its own ELI URI template and a registry collects them. We borrow ELI's governance pattern, not just its identifiers.

5. Jurisdiction is a typed ISO 3166-2 field, never a slug component. All three adopters already carry `jurisdiction` as `us-co`, `us-ut`, `ca-bc` in a separate field. The examples and handoffs are the outlier that jammed it into the slug. Defaulting to ISO 3166 dissolves the `co` vs `us-co` vs `colorado` argument.

## Crosswalk matrix (recommended default profile)

Requirements are RFC 2119 and conditional on coverage. A US-only adopter is never failed for lacking an ELI that does not exist. This matrix is the recommended baseline; an adopter's actual obligations are whatever its `.well-known` profile declares, and the validator checks the data against that declaration.

Cross-cutting (every entity):
- `@id` resolves and is permanent (301 on rename). MUST, Level 1.
- `@type`, `@context`. MUST, Level 1.
- `.well-known` naming profile published. MUST to be "bound," Level 2.
- `jurisdiction` as ISO 3166-2 / 3166-1. MUST, Level 2.

| Entity | Crosswalk | Req | Condition |
|---|---|---|---|
| Authority | Wikidata QID (`sameAs`) | SHOULD | body has an entry |
| Authority | LCNAF, ISNI, EU Named Authority List | MAY | supplements or substitutes |
| Instrument | ELI (`eli_uri`) | MUST | jurisdiction issues ELIs |
| Instrument | `citation` (human) | SHOULD | always |
| Instrument | urn:lex | MAY | fallback where no ELI |
| Instrument | Akoma Ntoso (`akn_uri`) | MAY | AKN encoding exists |
| Term | Akoma Ntoso element IRI (`akn_uri`) | SHOULD | provision has an AKN representation |
| Term | `section` (human) | MUST | always |
| Term | executable encoding (Catala etc.) | MAY | executable logic exists |
| Obligation | LegalRuleML deontic alignment | SHOULD | the `of:` deontic class already maps |
| Obligation | EuroVoc concept (`sameAs`) | SHOULD | subject has a EuroVoc concept |
| Proceeding | ECLI | MUST | ECLI jurisdiction |
| Proceeding | neutral citation | MUST | common-law neutral-citation jurisdiction, no ECLI |
| Proceeding | docket / CourtListener id | SHOULD | US and other docket systems |
| Allegation | doctrine / legal-concept ref | MAY | claim maps to a named doctrine |
| Determination | ECLI / neutral citation | MUST | citable court decision |
| Determination | urn:lex / source-document id | SHOULD | administrative determination |

The EuroVoc row is the deliberate bridge for the obligation-abstraction question (EveryAILaw's one abstract `transparency` across 38 laws vs a provision-specific obligation): both can point at the same EuroVoc concept, reconciling the two models through a shared concept rather than a shared `@id`. The bridge is accepted; the modeling decision itself is still open.

## Conformance level changes

- Level 2 additionally requires: a published `.well-known` naming profile, and `jurisdiction` as an ISO 3166 code. This tightens Level 2 going forward. It is a pre-freeze policy change recorded in the CHANGELOG, not a record-validation break (records still validate; `additionalProperties` already admits the crosswalk fields).
- Level 3 is redefined: every crosswalk the adopter's naming profile declares is present on every applicable record, with the matrix above as the recommended baseline.

## Rationale and the tradeoffs we accepted

- Default to norms: ISO 3166 for jurisdiction, ELI / ECLI / urn:lex / Akoma Ntoso for legal-source identity, VoID + RFC 6570 + RFC 8615 for the profile, "Cool URIs Don't Change" for permanence, LegalRuleML and EuroVoc for deontic and subject alignment. We adopt rather than invent.
- Federated `@id` retires a whole class of the conflicts we found: term-by-section-number vs term-by-topic, abbreviated vs spelled-out states, prefix-in-slug vs prefix-in-field all become declared local variation, not bugs. They matter only at the seams, where crosswalks carry the join.
- Wikidata at SHOULD for authorities (decided 2026-06-02, with reservations recorded). The cons of SHOULD-on-Wikidata are real: granularity mismatch (sub-units like the SEC Division of Corporation Finance have no QID, only the parent does, which invites false `exactMatch`), the convergence trap (a SHOULD on one system only yields a join if everyone picks it), a rigor-hierarchy inversion (legal-domain authority control lives in LCNAF / ISNI / EU NAL), source governance (crowd-maintained, no SLA), and global coverage skew against non-Western adopters. SHOULD softens the coverage cons by allowing omission with reason. The decision stands because the alternatives cost more: MAY loses the interop floor, and a SHOULD-on-a-class with a tie-break rule adds spec complexity. The choice is to keep one easy-to-satisfy recommended authority key and live with its known weaknesses.
- urn:lex at MAY for instruments (not SHOULD), because it is an unratified IETF draft and we will not make an unratified scheme load-bearing.

Accepted consequence to be explicit about: this convention fully solves cross-adopter identity for EU law (ELI is MUST where issued) and leaves it best-effort for US and Canadian law, because both candidate universal keys for non-EU material (urn:lex, Wikidata) are now optional or authority-only. The Colorado-statute-three-ways case that motivated this work is therefore not mechanically reconciled by the matrix; it rests on `citation` consistency or an optional shared identifier until a future round chooses to tighten the non-EU join key.

## Settled vs still open

Settled by this decision: `@id` federation, permanence with 301 redirects, the `.well-known` profile at Level 2, ISO 3166 jurisdiction at Level 2, the crosswalk matrix with Wikidata at SHOULD and urn:lex at MAY, and the Level 2 / Level 3 redefinitions.

### Resolved 2026-06-02 (v0.3.1)

Three previously-open items were resolved after a full surface assessment confirmed that ~70% of worked-example records are teaching constructs with no adopter counterpart.

- Example namespace (was #18): worked-example records use a neutral `obligationfirst.org` namespace, never an adopter host. Real-world identity rides in crosswalks. This makes examples self-contained and honest, and removes the false NOTICE claim that records are "reproduced from the EveryAILaw corpus."
- `.json` suffix (was #19): the canonical `@id` is suffixless; representations are reached by content negotiation. Adopters that serve `.json` declare that in their own `.well-known` profile. Example `@id` values are suffixless; crosswalk references to adopters use the adopter's served form (with `.json`).
- Crosswalk-field scope: the crosswalk properties (`jurisdiction` as a typed `gist:Jurisdiction` with an ISO 3166 `ref`, `eli_uri`, `ecli_uri`, `neutral_citation`, `urn_lex`, `akn_uri`, `sameAs`, `exactMatch`) are defined as first-class terms in `schema/context.jsonld` and populated on example records per the matrix.

### Worked-example record convention (v0.3.1)

Every worked-example record MUST follow this shape:

- `@context`: `https://obligationfirst.org/v1/` (a string; an array only if the example genuinely needs a repo-local extension). Never `w3id.org/of/v1/` in a record — that is the vocabulary namespace, not the context document.
- `@id`: `https://obligationfirst.org/v1/examples/<example-slug>/<entity-type>/<local-id>`, suffixless. `<entity-type>` is the lowercase role (`authority`, `instrument`, `term`, `obligation`, `proceeding`, `allegation`, `determination`). `<local-id>` is an opaque, lowercase-kebab descriptor with NO jurisdiction code in it (drop `us-`, `us-co-`, `eu-`, `ca-bc-`; keep meaningful descriptors like `sb24-205`, `art-50-2`, `attorney-general`, `bccrt`).
- `jurisdiction`: where the entity has one, a typed `{ "@type": "gist:Jurisdiction", "ref": "<ISO 3166-1 or 3166-2>" }` (e.g. `us-co`, `us-ut`, `ca-bc`, `eu`). Never encode jurisdiction in the slug.
- Internal cross-references (`issuedBy`, `hasTerm`, `parent_instrument`, `created_by`, `anchors`, `decides`, `hasAllegation`, `hasDetermination`, `target_instrument`, `triggers_on_violation_of`, `enforcement_authority`, `instrument_ref`): repoint to the new neutral `@id` values within the same example, so the record graph stays internally consistent.
- Crosswalks to the real world, per the matrix: where the entity corresponds to a real adopter entity, add `sameAs: ["<real adopter IRI, with the adopter's served `.json`>"]`. Where a standard legal identifier exists, add it as a typed field (`eli_uri` for the AI Act, `neutral_citation` or `ecli_uri` for cases, `akn_uri` for provisions, `exactMatch` to a EuroVoc concept for an obligation subject). Do not invent standard identifiers; only add ones that genuinely exist.
- A broken cross-adopter `anchors` that pointed at a non-existent adopter entity is repointed to the real entity the live adopter actually publishes (verified against the live export).

### Still open (each its own round)

- Identity-fidelity enforcement mechanism: live resolution vs vendored registry snapshot vs both.
- Whether and when to tighten the non-EU instrument join key.
- The obligation-abstraction model (EuroVoc bridge accepted; the model is not).
- Naming-profile expressiveness (loose regex vs generative template) and a public conformance tool.

The three binding handoffs were reconciled to live adopter data in v0.3.1 (they previously prescribed schemes no adopter followed).

## Implementation plan

Landing now: this design note, and PROTOCOL amendments (reverse the Term-`@id`-is-standard-IRI guidance, add the federation and permanence rules, add the naming-profile and crosswalk section, update the worked-example paragraph, redefine Level 2 and Level 3). Deferred to later rounds with their own decisions: schema and `context.jsonld` crosswalk fields, the `.well-known` profile format and its schema, the conformance validator, handoff reconciliation, and example realignment.

## Prior art referenced

ISO 3166-1 / 3166-2 (jurisdictions); ELI, ECLI, urn:lex (IETF draft), Akoma Ntoso Naming Convention, USLM (legal-source identity); Wikidata, LCNAF (id.loc.gov), ISNI (ISO 27729), EU Named Authority Lists, LEI (ISO 17442) (authority and party identity); EuroVoc (subject concepts); LegalRuleML (deontic logic), Catala (executable, article-scoped law); VoID `uriSpace` / `uriRegexPattern`, RFC 6570 URI Templates, RFC 8615 `.well-known`, W3C "Cool URIs Don't Change" (declaration, templating, discovery, permanence).

# Consumer successor proposal, October 3, 2026

Scope: Obligation-First technical review of uncertainty preservation for the EAL534 candidate. This is an offline proposal, not an adopted fixture, source acceptance, security disposition or human content judgment. The active September 24 fixture, consumer contract, federation entry point, schemas and release artifacts are unchanged. Candidate `reviewed_on` is null; the historical date is retained only under `prior_fixture`.

## Bounded proposal

The [candidate](candidate.json) changes only the count and hash for four explicitly selected Utah unresolved-review entries. All other case and answer fields must remain identical to the frozen fixture. The qualification arrays grow from five items to seven; neither old wording nor the two new qualifications is removed. Full wording remains EAL-owned.

| Journey | Selected unresolved entry |
|---|---|
| `mata-category-related-duties` | Utah safety-policy human-oversight obligation |
| `draft-publedge-term-statutory-records` | Utah instrument, disclosure term and disclosure obligation |

The prior receipt digest is `e512520664a8e0b2fda64efc96588766faeb5ad9e9f13cb810b1b1b9cc07a0ce`; proposed digest is `47ad5c7f7b3b7574cfd109e343d8d65c22e65624746d0b73b9e2410eb6d7c60f`. These are observed metadata changes, not adjudications of the underlying questions.

## Exact input evidence

OF checker baseline is `23f493cdf6ee50e8f32f060f2b44593a61ad2d2d`. [Input inventories](input-inventories.json) bind every record-file byte and filename, computed independently from Git objects:

| Owner | Revision | Record files |
|---|---|---:|
| EAL candidate | `6dd7badebed140f5d4505c75c6063dcf98d08ad2` | 601 |
| PubLedge main | `72196297a99667110b5ae4584c73bf2f60951c2f` | 130 |
| PubLedge draft21 alternate | `f1f5eab2727d8032155ab6a4b0f5ba8328692e36` | 130 |
| AIL main | `0a79a1ff29718ef118bf020f9d8ee0d68fce5d7a` | 357 |

The historical EAL534 CI merge `bb399cb422293a6efedc1739f3ed037e498be3b7` has the same tree as the candidate: `8c85f5de667359c3b90482b415b16e5612b06dfe`. No new source retrieval or corpus build is part of this proof.

## Reproduction

From the OF repository root with its existing lock-matched dependencies, supply record directories exported from the exact Git revisions above. The verifier rejects inventory mismatch and prints the matched revision tuple. Changing PubLedge input chooses the separately pinned main or draft experiment; it does not modify candidate status or adopt either tuple.

Replace: EAL_RECORDS -> directory containing the 601 EAL candidate record JSON files
Replace: PUB_RECORDS -> directory containing the 130 PubLedge main or draft21 record JSON files
Replace: AIL_RECORDS -> directory containing the 357 AIL main record JSON files
Customize
```bash
node reference/reviews/consumer-successor-2026-10-03/verify.mjs EAL_RECORDS PUB_RECORDS AIL_RECORDS
```
The [verifier](verify.mjs) checks the pinned primary tuple and permitted PubLedge alternate, historical fixture path/date/hash, proposal-only status, null human-review date, the exact eight scalar changes, every unchanged case/answer field, two expected historical failures, and all three candidate journeys. It then removes and rewrites uncertainty separately on each affected producer record. All eight mutations must remain detectable. The official consumer-traversal regression suite independently retains its 16 meaning-strengthening controls.

## Observed result and remaining boundary

Both PubLedge pairings passed the candidate proof: three journeys each, all eight uncertainty mutations rejected, no other case fields changed. The historical fixture still reproduces its two failures. The existing traversal suite passed three journeys and 16 meaning-strengthening controls. Initial execution lacked isolated-checkout dependencies; a temporary link to the identical-lock installed OF dependencies enabled the checks without installation.

This closes the mechanical hypothesis, not active federation acceptance. No script selects this candidate by default. Adoption remains a separately reviewable OF change on an accepted exact component tuple; four EAL candidate-history scanner findings and source-review gates remain unchanged. No human disposition is requested by this proposal. Existing ignored handoffs remain unconsumed.

Final verification: the full OF npm test gate passed with npm offline mode and a credential-free child environment. Independent review recomputed all four record inventories from Git objects and verified both positive pairings. It found a missing provenance-metadata assertion; that was repaired. Separate forged tuple, prior date and prior path mutations now fail. Final review found no remaining material issue. The temporary dependency link was removed after testing. No commit, push or fixture adoption occurred.

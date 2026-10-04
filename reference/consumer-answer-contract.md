# Consumer answer contract (EV02)

`buildConsumerAnswer` in `scripts/lib/consumer-traversal.mjs` serializes one bounded answer from a declared consumer journey. It is operational validation of meaning preservation, not a record-schema extension or a legal applicability engine.

A journey opts in with an `answer` block: a finite `question`, the traversal layers that hold the answer's duties (`duty_layers`), and a reviewed `expected` answer. The answer carries:

- `subject`: the starting record's lifecycle, operative and enforcement states, declared territorial scope and admission status. A draft or proposed subject is reported as `draft-not-in-force` or `proposed-not-in-force` whatever it joins.
- `relation`: the kinds of anchor the subject declares (`category-association`, `direct-anchor`, `unresolved-anchor`), the count of direct Term or Obligation anchors, and `applicability: not-asserted`. Traversal never asserts that a case applied, or a party is bound by, any duty.
- `duties`: for each duty on the named layers, its deontic class (`unclassified` when only `of:Obligation` is declared), duty-holder parties and roles, territorial scope, lifecycle and operative state, effective date, source version and admission status. Absent evidence is the string `unknown`.
- `unresolved`: for every visited record with unresolved source-review questions, their count and the SHA-256 of their verbatim text. Owner wording is preserved and change-detected without being republished here.

`answerContractErrors` rejects answers and expectations that would strengthen meaning: asserted applicability, a category association counted as a direct relation, a draft promoted beyond draft, scope widened to unrestricted, a whole-record review status, or a non-obligation on a duty layer. An exact comparison with the reviewed expectation detects everything else: lost draft state, removed or rewritten unresolved questions, a deontic class defaulted to Requirement, or an invented actor.

## Reviewed answers

`reference/fixtures/consumer-traversals-2026-09-24.json` carries two answers, frozen on the adopter commits in its `answer_tuple`:

- Mata v. Avianca sanctions determination: a category association with zero direct duty relations. The 34 human-oversight duties are related duties, not duties the court applied. Zero direct relations is an allowed coverage result; no edge is invented to change it.
- Draft PubLedge Utah OAIP chatbot-disclosure term: one direct anchor to the EveryAILaw SB 149 term and its statutory disclosure duty. The draft stays `draft-not-in-force` after joining operative law, the statutory duty's deontic class stays `unclassified`, its duty-holder parties and source version stay `unknown`, and the draft's seven unresolved questions travel with the answer.

Replay against sibling checkouts through `npm run verify:federation`, or directly:

Replace: EAL_RECORDS -> EveryAILaw `docs/api/v1/of/records`; PUB_RECORDS -> PubLedge `docs/api/v1/of/records`; AIL_RECORDS -> AI Incident Law `api/v1/of/records`.
Customize
```bash
node scripts/check-consumer-traversals.mjs reference/fixtures/consumer-traversals-2026-09-24.json EAL_RECORDS PUB_RECORDS AIL_RECORDS
```
`scripts/test-consumer-traversal.mjs` exercises the contract on synthetic records with ten meaning-strengthening controls and runs in the hardening gate. A new answer, or a changed answer after an owner projection change, needs owner review of the expected block; the contract does not supply missing legal history.

## Offline failure evidence

The consumer CLI accepts optional `--report PATH`. The federation runner forwards `OF_CONSUMER_REPORT` when set. Without that option the comparison and failing exit status remain the same. Reports never adopt a candidate or update a reviewed expectation.

Replace: EAL_RECORDS -> EveryAILaw record directory
Replace: PUB_RECORDS -> PubLedge record directory
Replace: AIL_RECORDS -> AI Incident Law record directory
Replace: REPORT_JSON -> writable JSON report path outside every input directory and distinct from the fixture
Customize
```bash
node scripts/check-consumer-traversals.mjs reference/fixtures/consumer-traversals-2026-09-24.json EAL_RECORDS PUB_RECORDS AIL_RECORDS --report REPORT_JSON
```
A version 1 report contains `report_type: consumer-traversal`, `status: passed|failed|error`, `complete`, the exact fixture SHA-256, per-input record identities and exact byte hashes, cases and bounded diagnostic codes. `passed` and `failed` require a complete traversal; malformed or missing input produces `error` with `complete: false`. The report is initialized as incomplete before reading inputs, replacing a previous success. Unsafe or unwritable destinations fail with a diagnostic and cannot promise a new report. Symlink/hard-link destinations and destinations that alias the fixture or fall inside an input directory are rejected without overwriting them.

Each answer difference carries an RFC 6901 `path`, `owner_record_id`, category (`relation`, `source-provenance`, `uncertainty` or `other`) and expected/actual metadata. A shifted duty array also carries `expected_record_id` when its before/after identities differ. Missing and null remain distinct. Counts, uncertainty-digest fields and a finite vocabulary of statuses remain readable; free text, source locators, unexpected object fields and unsafe identifiers are represented by length/type and SHA-256. Raw unresolved text, raw record bodies and exception messages are never included. Public HTTPS record identifiers without query strings, fragments or credentials may appear in identifiers and pointers; bounded lowercase file/case labels may appear in their identity fields. Hex-looking free source text is still hashed. Unknown field names are summarized at their parent pointer rather than emitted. This diagnostic classification does not decide whether a change is acceptable.

Input inventory hashes are SHA-256 of compact UTF-8 JSON of the report's ordered `records` entries (`file`, `id`, exact file-byte `sha256`). Inputs are ordered by CLI argument; nested files use deterministic lexical directory order. The hashes bind the bytes parsed in this invocation, not Git commits or acceptance. A private orchestration receipt must supply the actual owner/checker revision tuple and bind this report to its run. The optional `OF_CONSUMER_REPORT_INVOCATION` must be a canonical lowercase UUIDv4 and is copied to top-level `invocation`; absent metadata produces null. Private orchestration must pass its fresh invocation UUID and reject a report with a different or missing binding. Invalid supplied metadata produces incomplete error evidence without echoing the value. Reports contain no generated timestamp and repeated identical inputs and invocation metadata produce identical bytes.

Bounds are 32 input directories, 20,000 record files total, 8 MiB per file including the fixture, 256 MiB total input bytes, 256 cases, 64 traversal steps per case, directory depth 32, answer-difference depth 64 and 10,000 differences total. Exceeding a bound produces an incomplete error report, never a truncated pass. Console output shows at most 20 differences per case; the report retains all differences within the total bound. Invalid input errors retain only evidence collected before failure and must not be treated as a complete inventory.

`test-consumer-report.mjs`, included in the existing hardening gate, exercises deterministic hashes, field-level uncertainty changes, free-text redaction, provenance changes, invalid/missing inputs, stale-success replacement, output aliases, missing/null/type distinctions and changed array identities. Existing consumer meaning-strengthening controls remain unchanged.

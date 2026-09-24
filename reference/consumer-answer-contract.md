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

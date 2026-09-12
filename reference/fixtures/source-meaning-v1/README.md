# Source-meaning regression fixture v1

This frozen input contains 22 selected cases across wrong document, version, event, exception, commencement, translation and unsupported-negative claims. Six retained official-source excerpts supply 16 cases; three explicitly synthetic sources supply six event, version and translation controls. Official excerpts carry the original artifact SHA-256, source URL and excerpt digest. The originals remain with the owning source repositories; the fixture does not copy their corpus.

`cases.json` contains inputs only. `labels.json` contains the source-adjudicated labels and reasons; the initial provisional labels remain in `labels-initial-2026-09-09.json`. Disagreements and their resolutions are retained explicitly. Agent adjudication is not a human legal determination. Inputs were authored after known errors were investigated, so this is a selected regression set, not an unbiased benchmark of corpus accuracy.

A blinded evaluator receives only `cases.json`, the three label definitions included in it, and the requested JSON output shape. It must provide the dataset SHA-256, evaluator identity, and exactly one `{id, label, reason}` result per case. Source support is judged only from the supplied evidence. Missing evidence is distinct from an incompatible source proposition. No browsing or production-data mutation is required for a prediction run.

`score-source-meaning.mjs` verifies input and prediction binding, checks case coverage, excludes explicitly disputed labels from scored denominators, and reports the full confusion matrix, false accepts, false rejects, warranted/unwarranted abstentions and results by error class. An abstention on a supported claim remains visible even though it is not counted as an affirmative false rejection. Misclassifying insufficient evidence as contradiction is also reported separately.

The scorer's synthetic unit test proves arithmetic and malformed-input rejection only. It is not a source-meaning evaluation result. An actual run needs separately retained evaluator predictions and a scored report. A passing result on these cases cannot certify a corpus, replace source admission, authenticate a reviewer, or establish a production model's legal accuracy.

## September 9 run

The gpt-5.6-sol owner agent read only the frozen inputs before submitting its initial predictions. It had worked on owner corrections earlier in the session; this was label-blind evaluation, not an independent blind audit of the whole project. Against the initial provisional labels, 19 of 22 answers matched. Source adjudication corrected one coordinator label: the Texas waiting period prohibits action before day 60 regardless of cure. The other two disagreements were evaluator errors that treated missing evidence as contradiction. Both were resolved explicitly under the input definitions.

Against the corrected, source-adjudicated labels, the unchanged initial predictions match 20 of 22 cases. There were zero false accepts, zero affirmative false rejections of supported claims, three warranted abstentions, and two incorrect rejections where evidence was insufficient. There are no remaining disputed labels in this bounded set. The discussion-time corrections were not substituted into the original predictions or counted as new blind successes.

The original labels, original score, unchanged predictions, source-adjudication record and final score are retained separately. This establishes a scored regression exercise with visible failure classes, not production-model acceptance or a general accuracy claim. Any later evaluator run must bind the same input digest or identify a new dataset version.

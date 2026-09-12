# Term-link consumer boundaries

`scripts/lib/term-boundaries.mjs` compares the evidence available on two linked Terms and their actual parent Instruments. It is operational validation, not a record-schema extension or a legal applicability engine.

The report retains both source URLs, clause locators, source versions, lifecycle/operative/enforcement states, effective-date precision and explicit computed-as-of values. A missing locator or version is returned as null. Parent dates are used only when the provided Instrument has the exact declared parent identifier.

Territorial comparison uses exact declared codes. The report distinguishes common declared codes from an intersection after explicitly supplied exclusions. Missing exclusion evidence remains null; it cannot silently become an empty list. No country/subdivision expansion or geographic-disjointness inference occurs. `no-declared-common-code` describes the supplied sets only. Actor, activity and other legal exceptions are not inferred from territorial codes or source prose.

Date comparison returns before, after, same-day, overlapping-precision or unknown. A month/year is never replaced with an invented exact day. A Term before its parent is reported for source review; it is not automatically rejected because legitimate retrospective commencement exists. An elapsed effective date does not promote a draft or establish current operation. Legal applicability is always unknown.

The existing PubLedge draft-to-EveryAILaw statutory consumer journey now asserts this complete report against actual records, alongside exact graph targets. Both declare Utah; their exceptions and computed-as-of evidence remain unknown. The source Term retains draft/future/unsignaled status and an unknown parent effective date. The exact expected report detects source/locator drift, lost territory, changed dates or promotion of the draft.

`scripts/test-term-boundaries.mjs` exercises supplied inclusion/exclusion sets, unknown exceptions, absent and unrelated parents, partial/invalid dates, source/locator mutations and draft-state mutations through the consumer traversal. The tests are included in the existing hardening gate. Broader territorial hierarchies, clause-level applicability and production qualified-time serialization need separately demonstrated owner requirements and reviewed source mappings.

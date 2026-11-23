# Pinned upstream RUML schemas

Copyright 2026 Rulemapping Group GmbH. Published by Law as Code Institut GmbH. The two JSON Schemas are unmodified copies from [Law-as-Code-Institute/ruml](https://github.com/Law-as-Code-Institute/ruml/tree/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/schemas), commit `d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4`, retrieved 2026-11-22.

Source paths: `schemas/ruml.schema.json`, `schemas/ruml-result.schema.json` and `LICENSES/Apache-2.0.txt` (copied as `LICENSE-APACHE`). These files are Apache-2.0. The separately CC BY-SA 4.0 specification prose has not been copied. Original file hashes are in the parent [binding ledger](../binding.json).

These schemas are fixture dependencies, not additions to OF's shared `schema/` or published schema inventory. They check structural validity only; semantic and evaluator checks remain separate. The checker reuses existing AJV 2020-12 and `ajv-formats` dependencies, requiring no new package or runtime fetch.

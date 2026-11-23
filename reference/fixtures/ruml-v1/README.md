# Synthetic RUML and OF fixture

An original fictional draft demonstrates one Requirement linked to the RUML encoding of its trigger conditions. No real law, organization, applicability finding or corpus content is represented. Start with the [quickstart](../../ruml-quickstart.md). Run from the repository root.

Literal
```bash
node scripts/check-ruml-example.mjs
```
| File | Purpose |
|---|---|
| `records/` | Four OF JSON-LD records: Instrument, Term, Requirement and Party |
| `acknowledgement.ruml` | Two boolean trigger conditions, one AND root and synthetic source text |
| `cases.json` | Complete-mode inputs and author-written status expectations |
| `*.ruml-result` | Expected result shapes, not runtime evidence |
| `binding.json` | Local identity mapping, upstream pin and SHA-256 file-byte ledger |
| `upstream/` | Unmodified JSON Schemas and Apache-2.0 attribution |

Synthetic encoding/source URIs are not hosted. The binding maps them locally and does not assert equality between OF identities and RUML UUIDs. Root `true` means trigger conditions satisfied, not duty performed. Input absence stays `undefined`.

The offline checker does not execute JSONata or claim full RUML conformance. The hardening suite includes it and ten negative controls. Inputs/expectations and upstream byte identities are frozen independently of the editable ledger; this is not an arbitrary-case validator. Intentionally changing a fixture requires reviewing its source, mappings, expectations and checker together before recomputing affected ledger entries. Rehashing unexplained drift is not acceptance. These byte hashes are not RUML canonical hashes or signatures.

The original JSON, `.ruml` and `.ruml-result` example data are Apache-2.0, like the example code. The explanatory Markdown is CC BY 4.0 under the repository's reference-material terms. Upstream schema attribution and its Apache-2.0 license are preserved in `upstream/`.

# RUML quickstart

Attach legal context to a RUML rulemap using the existing Obligation-First (OF) contract. Keep your editor and evaluator. OF describes the provision, duty, duty holder and legal relationships; RUML carries the decision logic.

This experimental example targets RUML specification 1.0.0 and OF v0.6. It is not an official RUML crosswalk, new shared schema or conformance certification. See the [synthetic fixture](fixtures/ruml-v1/README.md) and [crosswalk](crosswalks/ruml.md).

## Follow one duty into a rulemap

The fictional draft says: when a request is eligible and its evidence is complete, Example Review Office must send an acknowledgement.

Four OF records describe the Instrument, its Term, the Requirement it creates and the fictional Party that owes the duty. The Requirement's existing `executableEncoding` uses `kind: other` and an artifact URI and version. No vocabulary change is needed.

Inspect the [Instrument](fixtures/ruml-v1/records/instrument.json), [Term](fixtures/ruml-v1/records/term.json), [Requirement](fixtures/ruml-v1/records/obligation.json) and [Party](fixtures/ruml-v1/records/party.json), then follow the encoding into the [rulemap](fixtures/ruml-v1/acknowledgement.ruml) and [case inputs/expectations](fixtures/ruml-v1/cases.json). The case identifier `complete` names the eligible example; all three cases use complete evaluation mode.

The RUML root checks the two trigger conditions. It does not check that an acknowledgement was sent, bind a real party or decide which law applies. The separate [binding file](fixtures/ruml-v1/binding.json) connects the synthetic encoding URI to the local file and root node UUID. It is fixture metadata, not an OF record, RUML sidecar or proposed shared contract.

| Input | Complete-mode root expectation | Meaning |
|---|---|---|
| Eligible, complete evidence | `true` | Trigger conditions satisfied; performance of the duty not assessed |
| Ineligible, complete evidence | `false` | Trigger conditions not satisfied for the supplied facts |
| Eligibility absent, complete evidence | `undefined` | Missing evidence stays unknown |

All legal records remain a fictional draft, operative status inactive and enforcement unknown. A true computation does not promote them to operative law. The source and encoding URIs use `example.org` as synthetic identifiers, not hosted endpoints; inspect them through the local binding.

## Validate locally

Use Node 20 or later. Run commands from the repository root. Installation uses the committed lockfile, disables lifecycle scripts and does not submit a dependency audit.

Literal
```bash
npm ci --ignore-scripts --no-audit --no-fund
```
Run the complete fixture check, offline after installation.

Literal
```bash
node scripts/check-ruml-example.mjs
```
Success reports four OF records and three expected results. This checks OF shapes, graph links, JSON-LD round trips, pinned upstream RUML JSON Schemas, file-byte hashes and source/encoding/node bindings. The unchanged adopter CLI also accepts the records.

Literal
```bash
node scripts/validate-adopter-records.mjs reference/fixtures/ruml-v1/records
```
Run ten negative controls covering unsupported encoding kind, broken grounding, promoted enforcement, unknown converted to false, wrong result reference, changed inputs, wrong local path, missing hash coverage, broken text anchor and a modified upstream schema. Fixture-file edits are rehashed so their rejection tests the claimed contract rather than only detecting byte drift.

Literal
```bash
node scripts/test-ruml-example.mjs
```
## Run in your evaluator

The result files are author-written expectations, not execution receipts. The checker does not execute JSONata, implement all RUML semantic rules or qualify as a RUML parser/evaluator. Structural validation is not full RUML conformance.

Load `reference/fixtures/ruml-v1/acknowledgement.ruml` in your RUML evaluator, enable its required `ruml:datapoints`, `ruml:query` and `ruml:text-reference` capabilities, supply each input object from `cases.json` and select `complete` mode. Compare node statuses to each case's `expected` map. Save actual output separately and record the evaluator/version and configuration.

Expressions check input existence before returning the boolean value; absence yields no result and therefore `undefined`. Do not replace absence with false. Pin mode and child order: RUML optimized and complete modes can differ when an unknown precedes a decisive child. See [RUML operators](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/03-data-model/3-6-operators.md).

## Attach your own rulemap

1. Identify the source-backed Instrument, Term and Obligation using your adopter's permanent IRIs. Keep exact source text separate from editorial summaries and preserve unknown facts.
2. Link the appropriate Term or Obligation through `executableEncoding` with `kind: other`, an artifact URI and version. State the bounded question it encodes: trigger, performance or something else. The link does not prove equivalence to a provision.
3. Keep OF identity separate from the RUML file UUID, node UUID, local LexID and result-instance path. Maintain an application-owned mapping; do not use `sameAs` between a duty and its encoding.
4. Validate OF records with the [adopter kit](adopter-kit.md), RUML semantic rules with a suitable implementation, and runtime behavior against reviewed expected cases. These are separate checks.
5. Retain versions and hashes of actual evaluated artifacts/dependencies, mode, inputs and evaluator identity. AI nodes also need concrete model/configuration and prompts. Do not create an OF Determination from a computed result without evidence of an authoritative legal act.

The nested encoding object accepts only documented fields. Node selectors, digests and results belong in separate application evidence, not invented fields inside that object. Named extension contexts remain an alternative for real publishing needs under the existing extension policy.

For this frozen teaching example, the checker pins the three input objects and their reviewed expectations; it is not a validator for arbitrary new cases. When adapting the example, add and review your own cases and run them in your evaluator rather than treating a rehashed fixture as runtime acceptance.

The fixture is original synthetic content under this repository's Apache-2.0 example-code terms. Copied upstream schemas retain their [license and attribution](fixtures/ruml-v1/upstream/README.md). No EveryAILaw corpus content or real source admission is included.

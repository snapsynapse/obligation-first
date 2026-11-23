# Crosswalk: Obligation-First and RUML 1.0.0

Status: experimental directional guidance, 2026-11-22. This is not normative equivalence, an official RUML endorsement, automatic conversion or a shared-schema change. The [quickstart](../ruml-quickstart.md) uses the existing OF v0.6 encoding reference.

## Sources and versions

The [authoritative English specification](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/index.md) declares RUML 1.0.0. Its serialized `$specVersion` is `1.0`, distinct from a rulemap's content `metadata.version`. This comparison pins source commit `d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4`. RUML [section 1.5](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/01-introduction/1-5-relationship-to-other-standards.md) defines no formal adjacent-standard mapping.

OF authority remains in [PROTOCOL.md](../../PROTOCOL.md), the existing [encoding schema](../../schema/executable-encoding.schema.json) and [semantic decisions](../decisions/README.md).

## Directional mapping

| RUML concept | OF connection | Required qualification |
|---|---|---|
| Rulemap artifact | Term or Obligation `executableEncoding`, `kind: other` | Reference to an encoding, not an equivalent legal entity; pin content version |
| File/node UUID | Application mapping to permanent OF `@id` | A provision, duty and executable node are different objects |
| Local LexID | Numeric string key within one RUML file | Not a tree position, result path or permanent duty identifier |
| Result path, e.g. `1.2` | Evaluation-instance location | Modular nodes can have multiple instances/results |
| Text anchor `represents` | Evidence connecting an encoding to a source Term | Does not establish `creates`, correct interpretation or complete provision coverage |
| Text anchor `refers-to` | Relied-upon text or definition | Does not automatically assert OF `anchors`, `defeats`, `rebuts` or `undercuts` |
| `ruml:tree-reference` | Immutable-version external node reference | Does not execute its target or assert legal identity |
| `ruml:tree-include` | Executed dependency | Not evidence of legal incorporation by reference |
| Publisher `organization` | Model publication responsibility | Does not identify the legal issuer, administrator, enforcer or adjudicator |
| Jurisdiction tag | Input to reviewed jurisdiction mapping | Preserve territorial/institutional competence; a tag does not establish applicability |
| Document status and validity | Partial legal/model-state evidence | No total mapping to OF normative force, lifecycle, operation and enforcement |
| Result status and reason | Evidence for the stated computational question | Not automatically compliance, applicability or an authoritative Determination |
| Human-decision action | Workflow evidence | Does not alone establish an authoritative legal act |

RUML sources: [metadata](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/03-data-model/3-3-metadata-object.md), [text references](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/04-capabilities/4-12-ruml-text-reference.md), [tree references](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/04-capabilities/4-15-ruml-tree-reference.md), [tree includes](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/04-capabilities/4-16-ruml-tree-include.md), [results](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/05-result-format/5-1-result-model.md).

## Preserve meaning

- A true boolean does not choose between Requirement, Permission, Restriction, Reparation or an unknown deontic class. Ground the class in source evidence.
- A draft model may encode an in-force law; an approved model may encode future law. Preserve model-review status and source legal status independently. Both are drafts in the synthetic fixture; that is not a general conversion rule.
- Missing input, technical error, conflicting evidence and intentional skip must not collapse into legal noncompliance. Preserve runtime status/reason separately from legal state.
- References, digests and signatures support traceability/integrity, not source admission, legal truth or renewed human-verification dates.
- Preserve source-specific rights/attribution in the owning application. An open format does not license a linked corpus; the shared encoding object has no rights field.

## Runtime boundaries

RUML [operators](https://github.com/Law-as-Code-Institute/ruml/blob/d2ac818f6ed87c2bcf5b69430adf2efa8ba3c6a4/spec/en/03-data-model/3-6-operators.md) make mode/order consequential for some unknown-containing inputs. Its XOR uses disjunction semantics, with early exit in optimized mode, rather than conventional exclusive OR. Translate behavior, not operator names.

Unknown required capabilities must fail closed. JSONata, external dependencies, custom combiners and concrete AI configuration need independent implementation/provenance checks. This crosswalk neither resolves RUML voting ambiguities nor guarantees deterministic AI outputs. OF does not supply an evaluator or cure an incorrect encoding.

The fixture ledger uses ordinary SHA-256 over stored file bytes, not RUML canonical hashes or a signed container. Expected result files omit the optional `rumlReference.hash`; they are authored expectations, not runtime receipts. Production evidence should pin actual evaluated artifacts and apply RUML canonicalization wherever a RUML hash is required.

## Acceptance

Keep OF shape/graph/JSON-LD validation, RUML structural/semantic conformance and reviewed runtime outcomes separate. The bundled checker proves OF validation, upstream JSON Schema validation and synthetic binding/expectation consistency. An evaluator still needs to run the fixture before runtime compatibility can be claimed.

Use application-owned mappings first. Shared expansion remains governed by [INTENT.md](../../INTENT.md), including demonstrated multi-adopter need. A new `ruml` enum, legal-status translator, corpus converter and result-to-Determination promotion are outside this example.

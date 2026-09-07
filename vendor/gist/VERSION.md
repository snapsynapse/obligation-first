# gist pinned vendor snapshot

This directory bundles Semantic Arts gist for Obligation-First vocabulary bindings and reproducible local validation.

## Snapshot identity

- Upstream: https://github.com/semanticarts/gist
- Original snapshot date: 2026-04-18.
- Reconciled release: [v14.1.0](https://github.com/semanticarts/gist/releases/tag/v14.1.0), published 2026-04-17.
- On 2026-09-07, the local `gistCore.ttl` matched the tagged `ontologies/gistCore.ttl` Git blob `194b55a04730cf4b053c69572e6974b8382182cb` exactly. No ontology bytes were changed by this documentation correction.
- The tagged ontology itself retains `https://w3id.org/semanticarts/ontology/gistCoreX.x.x` as its version IRI. That placeholder does not prove that these bytes differ from the release.
- `UPSTREAM-README.md` and `LICENSE.txt` remain the original vendored companion files; the ontology comparison does not attest their equivalence to the tagged companions.

## Scope and updates

The snapshot supports the gist crosswalks in this repository. It does not establish that upstream has remained unchanged or that downstream records are current. Review upstream releases separately; select and record a concrete tag before replacing files, then refresh MANIFEST.yaml and run the repository validation gate. Do not silently replace a pinned dependency with the default branch.

## License

gist is released under [CC BY 4.0](LICENSE.txt). See the repository attribution and license files.

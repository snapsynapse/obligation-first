# gist — Pinned Vendor Snapshot

This directory bundles a snapshot of [Semantic Arts gist](https://github.com/semanticarts/gist), the upper ontology PubLedge schemas bind to.

## Snapshot details

- Source: https://github.com/semanticarts/gist (develop branch)
- Snapshot date: 2026-04-18
- Local source path at vendoring time: `~/Git/_vendors/gist-develop/`
- Files bundled:
  - `gistCore.ttl` — core OWL 2 DL ontology (Turtle)
  - `LICENSE.txt` — CC-BY 4.0
  - `UPSTREAM-README.md` — copy of upstream README at snapshot time

The upstream `gistCore.ttl` declares its `owl:versionIRI` as `https://w3id.org/semanticarts/ontology/gistCoreX.x.x` — version placeholder unfilled because the snapshot is from the develop branch, not a tagged release. When PubLedge cuts v0.1, replace this snapshot with the latest tagged release of gist and update this note with the resolved version IRI.

## Why bundled

PubLedge pins gist for reproducibility. Validators (`scripts/validate.js`) and the JSON-LD context (`schema/json/context.jsonld`) resolve gist IRIs against this local snapshot first, falling back to the live `w3id.org` resolution only when needed. This matches PubLedge's skill-provenance posture: every external dependency is hash-pinned and locally fetchable.

## License

gist is released under [CC-BY 4.0](LICENSE.txt). PubLedge cites Semantic Arts in `ATTRIBUTION.md` per the license terms.

## Updating the snapshot

```bash
# Fetch latest tagged release
git -C ~/Git/_vendors clone --depth 1 https://github.com/semanticarts/gist.git
cp ~/Git/_vendors/gist/ontologies/gistCore.ttl vendor/gist/
cp ~/Git/_vendors/gist/LICENSE.txt vendor/gist/
cp ~/Git/_vendors/gist/README.md vendor/gist/UPSTREAM-README.md

# Update this VERSION.md with the new tag and date
# Re-run skill-provenance verifier to refresh hashes
```

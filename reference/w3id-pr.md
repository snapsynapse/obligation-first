# w3id.org contribution readiness

Status: generated targets and contribution ready for validation; external filing pending.

The complete contribution is in [of/.htaccess](w3id/of/.htaccess) and [of/README.md](w3id/of/README.md). Generate with `node scripts/build-vocabulary.mjs`; check with `node scripts/build-vocabulary.mjs --check` and `node scripts/test-vocabulary.mjs`.

All existing expanded OF terms resolve to explicit documentation fragments. Context aliases are shown independently of IRI suffixes. Terms use HTTP 303; root, context and the 14 schema documents use 302. Unknown paths remain unmatched. No identifiers or normative meanings change. This is documentation resolution, not ontology content negotiation.

After deploying and verifying the hosted targets, the contribution may be submitted to https://github.com/perma-id/w3id.org. Submission and upstream merge remain separate from this release; the permanent namespace must continue to be described as pending until verified live.

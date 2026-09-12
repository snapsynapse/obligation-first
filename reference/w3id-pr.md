# w3id.org contribution readiness

Status: generated targets and contribution ready for validation; external filing pending.

The complete contribution is in [of/.htaccess](w3id/of/.htaccess) and [of/README.md](w3id/of/README.md). Generate with `node scripts/build-vocabulary.mjs`; check with `node scripts/build-vocabulary.mjs --check` and `node scripts/test-vocabulary.mjs`.

The prepared contribution maps all existing expanded OF terms to explicit documentation fragments. Context aliases are shown independently of IRI suffixes. The proposed rules use 303 redirects for terms and 302 for root, context and the 14 schema documents. Unknown paths remain unmatched. No identifiers or normative meanings change. This is documentation resolution, not ontology content negotiation.

After deploying and verifying the hosted targets, the contribution may be submitted to https://github.com/perma-id/w3id.org. Submission and upstream merge remain separate from this release; the permanent namespace must continue to be described as pending until verified live.

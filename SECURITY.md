# Security Policy

## Supported versions

The Obligation-First spec is in `v0.1.0-draft`. Only the latest draft is supported. Once `v0.1.0` freezes, the latest minor version of the current major will be supported.

## Reporting a vulnerability

For schema-level vulnerabilities (e.g., a class binding that opens a privilege-escalation path in an adopter system), open a GitHub issue tagged `security`. Do not include PII or production data.

For implementation-level issues in adopter projects (PubLedge, EveryAILaw, AI Incident Law), report to those projects directly.

## Integrity

Canonical files are hashed in `MANIFEST.yaml` (SHA-256). Run `./scripts/validate-hashes.sh` to verify. Tampering with spec text or schemas is detectable.

## Scope

In scope:

- Schema design flaws that allow ambiguous interpretation
- IRI scheme weaknesses
- Crosswalk errors that misrepresent standards

Out of scope:

- Adopter implementation bugs
- Issues in vendored upstream ontologies (report upstream to Semantic Arts for gist)

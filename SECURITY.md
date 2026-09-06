# Security Policy

## Supported versions

<!-- of-version: security-supported -->
The Obligation-First spec is at `v0.6.5`. Only the latest published version is supported.

## Reporting a vulnerability

For schema-level vulnerabilities (e.g., a class binding that opens a privilege-escalation path in an adopter system), open a GitHub issue tagged `security`. Do not include PII or production data.

For implementation-level issues in adopter projects (PubLedge, EveryAILaw, AI Incident Law), report to those projects directly.

## Integrity

Repository integrity checks are part of the local test suite:
```bash
npm test
```
For the public assistant guide, Obligation-First publishes a GuideCheck Level 4 sidecar manifest at `https://obligationfirst.org/.well-known/assistant-guide-manifest.txt`. The repository contract validator recomputes the guide SHA-256, byte count, manifest URL, and public repository anchor:
```bash
npm run validate:contracts
```
GuideCheck conformance is a provenance and form check, not a safety or trust claim.

## Scope

In scope:

- Schema design flaws that allow ambiguous interpretation
- IRI scheme weaknesses
- Crosswalk errors that misrepresent standards

Out of scope:

- Adopter implementation bugs
- Issues in vendored upstream ontologies (report upstream to Semantic Arts for gist)

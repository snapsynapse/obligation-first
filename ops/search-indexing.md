<!-- Upstream template: portfolio-search-indexing-audit bundle v5; repository contract v4 -->
---
title: "Search indexing"
purpose: "Property-specific index policy, validation commands, deployment gate, and console follow-up."
status: active
updated: 2026-08-20
owner: "PAICE.work PBC"
open_tasks:
  - "Review GSC when Page indexing and HTTPS reports populate, or on 2026-08-22 if they remain unavailable."
---
# Search indexing

Canonical origin: `https://obligationfirst.org/`

Console property ID: `sc-domain:obligationfirst.org`

Property mode: `website`

Generated output: `docs`

If deployment assembles a separate staging directory, this path must name that exact deployable artifact, not its source directory.

## Index policy

| Surface | Policy | Reason |
|---|---|---|
| Current specification pages at `/`, `/v1/`, `/v1/schema/`, and `/v1/examples/` | Index and include in sitemap | Primary human-readable specification destinations |
| Immutable release landing pages under `/releases/` | Index and include in sitemap | Human-readable historical release records |
| `/404.html` | `noindex` and omit from sitemap | Error route, not a content destination |
| Context, schemas, manifests, checksums, feeds, robots, and agent surfaces | Crawlable machine surfaces, omit from sitemap | Machine consumption or discovery, not canonical HTML |
| `/changelog.html` | Omit from sitemap | Canonical points to the repository changelog |

## Validation lanes

- Offline: `node scripts/check-search.mjs`
- Production after deployment: `node scripts/check-production-search.mjs`
- Machine-readable output: add `--json`
- Local HTTP test: add `--base=http://127.0.0.1:8765/` after starting the static server on port 8765

Exit code `0` is pass, `1` is a site defect, and `2` is configuration or infrastructure failure.

For a creator-profile or external-platform property, replace the website validation lanes with the reports and controls the property actually exposes. Do not invent repository, production, sitemap, or indexing work.

## Evidence ownership and privacy

- This file is the living property policy and current-state summary.
- Sanitized dated observations belong under `ops/search/<provider>/YYYY-MM-DD/` and are tracked in Git.
- Dated evidence records report dates, exact counts, public example URLs, classifications, accepted actions, repeat policy, and the next-review condition.
- Account identity, private queries, raw exports, screenshots, traces, and authenticated browser state must not be committed.
- Temporary private material belongs under `.search-evidence-private/`; Comet and Playwright artifacts belong outside the repository or under ignored `.playwright-mcp/`.
- A cross-property queue may point to this repository, but it does not replace this policy or authorize repository, deployment, or console mutation.

## Deployment and console sequence

1. Run the normal build and offline search contract.
2. If deployment copies or transforms output, stage the exact deployable artifact with the same builder used by release automation.
3. Ensure repository-wide checks include newly scaffolded files, including checks based on `git ls-files`.
4. Deploy through the repository's normal release path.
5. Wait for the deployment to complete.
6. Run the production search contract.
7. Confirm the deployed sitemap URL set matches the repository sitemap.
8. Refresh a materially changed stale sitemap at most once, using its full canonical URL for a domain property.
9. Inspect or request indexing for canonical HTML pages.
10. Start issue-group validation only when matching production behavior is live.
11. Record console state under `ops/search/<provider>/YYYY-MM-DD/`.

## Expected noise

- HTTP and `www` variants redirect to the canonical bare HTTPS origin.
- `/404.html` is intentionally `noindex`.
- Machine-readable endpoints remain crawlable but are intentionally absent from the HTML sitemap.
- `/changelog.html` intentionally canonicalizes to GitHub and is absent from the sitemap.

## Current baseline

Initial evidence: [Google Search Console audit, 2026-08-18](search/GoogleSearchConsole/2026-08-18/audit.md).

At the initial console inspection, the property was processing data and had no submitted sitemap. The homepage URL inspection reported indexed and HTTPS-valid. After deployment passed the production contract, Search Console accepted and read the sitemap with status `Success` and 17 discovered pages.

Current evidence: [Google Search Console audit, 2026-08-20](search/GoogleSearchConsole/2026-08-20/audit.md).

The repository and production contracts each pass 17 sitemap pages with zero defects and zero infrastructure failures. Search Console last read the sitemap on 2026-08-19 with status `Success` and 17 discovered pages. The homepage is indexed. Aggregate Page indexing and HTTPS reports remain unavailable while Google processes data; sampled specification and release routes are classified as pending recrawl rather than site defects.

## Console action ledger

Read this table before opening the console. Add only observed actions and confirmations. An accepted request remains pending until a later report proves completion.

| Provider and property | Action and target | Accepted at | Confirmation | Result class | Repeat policy | Next review |
|---|---|---|---|---|---|---|
| Google Search Console, `sc-domain:obligationfirst.org` | Submit `https://obligationfirst.org/sitemap.xml` | 2026-08-18 | Status `Success`; last read 2026-08-19; 17 discovered pages | Accepted and processed | Do not repeat while accepted | Review when Page indexing and HTTPS reports populate, or on 2026-08-22 |

Keep rejected attempts and unknown outcomes distinct from accepted actions. Do not repeat an accepted action merely because the provider report remains stale.

## Do-not-repeat list

- Do not resubmit `https://obligationfirst.org/sitemap.xml` while it remains accepted and healthy.
- Do not request indexing for the already indexed homepage.
- Do not validate intentional host or protocol redirects, `/404.html`, `/changelog.html`, or machine-surface sitemap exclusions.
- After a future indexing request is accepted, wait for a report refresh before considering another action.

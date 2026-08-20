---
title: "Google Search Console audit"
property: "sc-domain:obligationfirst.org"
observed: 2026-08-20
status: waiting
---
# Google Search Console audit

## Property identity

- Canonical origin: `https://obligationfirst.org/`
- Search Console property: `sc-domain:obligationfirst.org`
- The URL `resource_id` and visible property selector both identified `sc-domain:obligationfirst.org` before reports were read.
- No account identity, private query, export, screenshot, trace, or browser-state artifact is stored here.

## Repository and production evidence

| Surface | Evidence | Result |
|---|---|---|
| Repository | Commit `855846d65b42891fab3804ff0a909195b94b9b6f`; full `npm test` | Pass |
| Generated output | `node scripts/check-search.mjs --json` | 17 pages, 0 defects, 0 infrastructure failures |
| Deployment | GitHub Pages deployment `5975159397` at the repository commit | Success |
| Production | `node scripts/check-production-search.mjs --json` with authorized network access | 17 pages, 0 defects, 0 infrastructure failures |

The sandboxed production attempt failed on DNS and is infrastructure evidence only. The authorized-network rerun is the production result.

## Report dates and state

| Surface | Report date or update | Observation | Classification |
|---|---|---|---|
| Performance | Data for 2026-08-18; UI last updated 4.5 hours before inspection | 0 clicks, 2 impressions, 0% CTR, average position 2 | Observed metric values |
| Page indexing | No report date available | Processing data; aggregate indexed and excluded counts unavailable | Unknown, not zero |
| Sitemaps | Submitted 2026-08-18; last read 2026-08-19 | `Success`; 17 discovered pages; 0 discovered videos | Healthy; zero videos is expected |
| HTTPS | No report date available | Processing data; aggregate count unavailable | Unknown, not zero |
| Core Web Vitals | Last updated 2026-08-18 | Insufficient mobile and desktop usage data for the preceding 90 days | External limitation |
| Enhancements | No report date available | No enhancement report yet | Unknown, not zero |
| Manual actions | Current UI state | No issues detected | Healthy |
| Security issues | Current UI state | No issues detected | Healthy |
| Temporary removals | Preceding six months | No requests submitted | Observed zero |

## URL inspection samples

| URL | Stored indexing state | Discovery and crawl evidence | Classification |
|---|---|---|---|
| `https://obligationfirst.org/` | URL is on Google; page indexed; HTTPS-valid | Sitemap detected; crawled 2026-08-18 at 8:38:59 PM as displayed, with no timezone shown; successful fetch; crawl and indexing allowed; declared and selected canonicals agree | Healthy |
| `https://obligationfirst.org/v1/` | Discovered - currently not indexed | Sitemap detected; no referring page detected; no crawl recorded | Pending recrawl |
| `https://obligationfirst.org/v1/schema/` | Discovered - currently not indexed | Sitemap and homepage detected; no crawl recorded | Pending recrawl |
| `https://obligationfirst.org/v1/examples/` | Discovered - currently not indexed | Sitemap detected; no crawl recorded | Pending recrawl |
| `https://obligationfirst.org/releases/v0.6.3/` | URL is unknown to Google | Stored inspection did not yet detect the sitemap or a referring page; no crawl recorded, although the successfully processed sitemap contains the URL | Pending provider reconciliation and recrawl |

## Classification summary

- Defects: none supported by repository or production evidence.
- Pending recrawl: three sampled specification routes and the current release route.
- Expected noise: zero discovered videos, intentional host and protocol redirects, deliberate `/404.html` noindex, external canonical for `/changelog.html`, and machine surfaces omitted from the HTML sitemap.
- Policy decisions: none.
- External limitations: insufficient Core Web Vitals field data.
- Unknown: aggregate Page indexing, HTTPS, and enhancement counts while reports are still processing.

## Console action ledger

| Provider and property | Action and target | Accepted at | Observed confirmation | Result class | Repeat policy | Next review |
|---|---|---|---|---|---|---|
| Google Search Console, `sc-domain:obligationfirst.org` | Submit `https://obligationfirst.org/sitemap.xml` | 2026-08-18 | `Success`; last read 2026-08-19; 17 discovered pages | Accepted and processed | Do not repeat while accepted | Review when Page indexing and HTTPS reports populate, or on 2026-08-22 |

No console action was performed during this audit. No indexing request or validation batch was accepted or active. No export was taken.

## Next review

Recheck when the Page indexing and HTTPS reports stop showing `Processing data`, or on 2026-08-22 if they remain unavailable. If the sampled canonical routes remain excluded after that refresh, inspect the populated issue group before proposing one indexing request per eligible URL. Record each observed confirmation and never repeat an accepted request before the named report refresh.

# w3id.org PR preparation

Status: ready-to-file checklist
Target identifier: `https://w3id.org/of/v1/`
Resolution target: `https://obligationfirst.org/v1/`

The w3id.org process asks projects to add a directory for the intended identifier containing `.htaccess` redirect rules and a `README.md` with contact information, then submit a pull request to the [perma-id/w3id.org](https://github.com/perma-id/w3id.org) repository. The public README says the pull request should include contact info, tested redirects, and a descriptive commit message.

## Proposed directory

```text
of/
  .htaccess
  README.md
```

## Proposed `.htaccess`

```apache
Options +FollowSymLinks
RewriteEngine on

# Obligation-First v1 permanent identifiers.
# Contact: Sam Rogers, PAICE.work PBC, https://paice.work/

RewriteRule ^v1/?$ https://obligationfirst.org/v1/ [R=302,L]
RewriteRule ^v1/context\.jsonld$ https://obligationfirst.org/v1/context.jsonld [R=302,L]
RewriteRule ^v1/schema/?$ https://obligationfirst.org/v1/schema/ [R=302,L]
RewriteRule ^v1/schema/(.*)$ https://obligationfirst.org/v1/schema/$1 [R=302,L]
```

Use `302` while v0.1 is still draft. After v0.1 freezes and the redirect target is stable, a follow-up PR can switch these to `301`.

## Proposed `README.md`

```markdown
# Obligation-First

Obligation-First is an open upper schema for normative content: laws, cases, and joint interpretations. It defines a JSON-LD context and JSON Schemas for the Authority / Instrument / Term / Obligation spine and the Proceeding / Allegation / Determination strand.

Canonical site: https://obligationfirst.org/
Repository: https://github.com/snapsynapse/obligation-first
Maintainer: Sam Rogers, PAICE.work PBC, https://paice.work/

## Identifiers

- https://w3id.org/of/v1/ redirects to https://obligationfirst.org/v1/
- https://w3id.org/of/v1/context.jsonld redirects to https://obligationfirst.org/v1/context.jsonld
- https://w3id.org/of/v1/schema/ redirects to https://obligationfirst.org/v1/schema/
- https://w3id.org/of/v1/schema/*.schema.json redirects to the corresponding schema under https://obligationfirst.org/v1/schema/
```

## Local checks before filing

- [ ] `https://obligationfirst.org/v1/` returns 200.
- [ ] `https://obligationfirst.org/v1/context.jsonld` returns 200.
- [ ] `https://obligationfirst.org/v1/schema/` returns 200.
- [ ] All eight schema files return 200.
- [ ] The repo docs consistently describe `https://w3id.org/of/v1/` as the canonical vocabulary IRI and `https://obligationfirst.org/v1/` as the resolution target.

## PR checklist

- [ ] Fork `https://github.com/perma-id/w3id.org`.
- [ ] Add `of/.htaccess`.
- [ ] Add `of/README.md`.
- [ ] Commit with a descriptive message such as `Add Obligation-First permanent identifier`.
- [ ] Open a PR from the fork to `perma-id/w3id.org`.
- [ ] After merge, update [ROADMAP.md](../ROADMAP.md) and [CHANGELOG.md](../CHANGELOG.md).


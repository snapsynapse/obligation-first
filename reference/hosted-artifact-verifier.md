# Hosted artifact verifier

`scripts/verify-hosted-artifacts.mjs` is a post-deployment acceptance check for one generated release manifest. It supplements `probe-public-endpoints.mjs`; the existing probe remains a HEAD reachability check and is unchanged.

The verifier accepts only an explicit release version, exact 40-hex source commit, and matching `v<version>` tag. It resolves that tag through the GitHub Git API, including annotated tags, and requires that it resolves to the supplied commit. Source bytes are fetched only from `raw.githubusercontent.com/<owner>/<repository>/<commit>/<path>`. It never treats a mutable `blob/main` page as source artifact bytes.

For every manifest item, the verifier checks the immutable source URL. It also checks every manifest URL under the canonical served origin. It compares SHA-256 bytes to the manifest, enforces an extension-specific content-type allowlist, uses GET with manual redirects, rejects every redirect unless an exact `--allow-redirect FROM=TO` pair is supplied, bounds response bodies at 2 MiB and applies a 20-second timeout. It fails when the manifest has a missing, extra, duplicate, malformed, or URL-mismatched artifact relative to `releaseArtifactInventory`.

The command also checks the homepage, `/v1/` namespace and indexes, vocabulary, every currently tracked served example README, JSON, JSON-LD and text fixture path, discovery/status files, feeds, sitemap, changelog, security contact, and the release package index, manifest and checksum list. The example-path inventory is read from `docs/v1/examples/` in the checked-out release tree; a path missing at the supplied immutable source revision fails rather than being silently skipped. These supporting surfaces are compared to bytes fetched from the same immutable source commit, because they are not all hash entries in the release manifest.

The command refuses a draft manifest by default. `status: draft` is existing package metadata and does not itself establish that a release is unpublished: v0.6.5 is an example of a deployed historical package retaining that label. A release process may run the checker after the explicit publication step with `--allow-draft`; that override verifies bytes only and does not change publication state.

Replace: RELEASE_VERSION -> the deployed release version, without a leading `v`
Replace: SOURCE_COMMIT -> the full 40-character commit resolved by that release's signed tag

Customize
```
node scripts/verify-hosted-artifacts.mjs --version RELEASE_VERSION --source-revision SOURCE_COMMIT --source-tag vRELEASE_VERSION --allow-draft
```

This check is not wired into local `npm test` or Pages workflows. Run it only after the final tag and deployment identify the same immutable commit. The expected post-deploy workflow placement is after the existing deployment/reachability check, with the final tag target passed explicitly. It must not be run as proof that an un-deployed candidate is live.

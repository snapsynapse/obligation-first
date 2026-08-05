import { OF_CONTEXT } from "../../scripts/lib/adopter-kit.mjs";

export const JSONLD_ROUNDTRIP_FIXTURE = {
  rel: "fixture/contract-term.json",
  record: {
    "@context": [OF_CONTEXT, { local_note: "https://example.com/vocab/localNote" }],
    "@id": "https://example.com/term/contract",
    "@type": ["of:Term", "gist:ContractTerm"],
    parent_instrument: "https://example.com/instrument/contract",
    isCategorizedBy: ["https://example.com/category/contract"],
    actor_roles: [{ party: "https://example.com/party/vendor", role: "vendor" }],
    source_citation: "Contract section 4",
    source_locator: "page 8",
    source_version: "2026-08-04",
    verified: true,
    local_note: "adopter extension",
  },
};

export const JSONLD_TOMBSTONE_FIXTURE = {
  rel: "fixture/tombstone.json",
  record: {
    "@context": OF_CONTEXT,
    "@id": "https://example.com/term/retired",
    "@type": "of:Tombstone",
    former_type: "of:Term",
    replaced_by: ["https://example.com/term/replacement"],
    deprecated: "2026-08-04",
  },
};

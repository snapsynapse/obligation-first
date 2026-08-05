import jsonld from "jsonld";
import { OF_CONTEXT } from "./adopter-kit.mjs";

export const JSONLD_DIAGNOSTIC_CODES = Object.freeze({
  CORE_TERM_REMAP: "OF-JSONLD-CORE-TERM-REMAP",
  REMOTE_CONTEXT: "OF-JSONLD-REMOTE-CONTEXT",
  EXPECTED_IRI: "OF-JSONLD-EXPECTED-IRI",
  ROUNDTRIP_DRIFT: "OF-JSONLD-ROUNDTRIP-DRIFT",
  PROCESSOR: "OF-JSONLD-PROCESSOR",
});

function stableSemantic(value) {
  if (Array.isArray(value)) {
    return value.map(stableSemantic).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableSemantic(value[key])]));
  }
  return value;
}

function termId(definition) {
  if (typeof definition === "string") return definition;
  return definition?.["@id"];
}

function expandCompactIri(value, context) {
  if (typeof value !== "string") return value;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  const colon = value.indexOf(":");
  if (colon > 0) {
    const prefix = value.slice(0, colon);
    const suffix = value.slice(colon + 1);
    const prefixDefinition = termId(context[prefix]);
    if (typeof prefixDefinition === "string") return `${prefixDefinition}${suffix}`;
  }
  return `${context["@vocab"] || ""}${value}`;
}

export function canonicalTermIris(contextDocument) {
  const context = contextDocument["@context"];
  return new Map(
    Object.entries(context)
      .filter(([term]) => !term.startsWith("@"))
      .map(([term, definition]) => [term, expandCompactIri(termId(definition), context)]),
  );
}

export function localDocumentLoader(contextDocument) {
  return async (url) => {
    if (url !== OF_CONTEXT) {
      const error = new Error(`remote JSON-LD context is not allowlisted: ${url}`);
      error.code = JSONLD_DIAGNOSTIC_CODES.REMOTE_CONTEXT;
      throw error;
    }
    return { contextUrl: null, documentUrl: OF_CONTEXT, document: contextDocument };
  };
}

function extensionContexts(record) {
  const contexts = Array.isArray(record["@context"]) ? record["@context"] : [record["@context"]];
  return contexts.filter((context) => context && typeof context === "object" && !Array.isArray(context));
}

export async function validateJsonLdRecord(entry, { contextDocument, expectedIris = [] }) {
  const failures = [];
  const terms = canonicalTermIris(contextDocument);
  const canonicalDefinitions = contextDocument["@context"];
  const fail = (code, message) => failures.push({ code, message, rel: entry.rel });

  const contexts = Array.isArray(entry.record["@context"]) ? entry.record["@context"] : [entry.record["@context"]];
  for (const context of contexts) {
    if (typeof context === "string" && context !== OF_CONTEXT) {
      fail(JSONLD_DIAGNOSTIC_CODES.REMOTE_CONTEXT, `${entry.rel}: remote JSON-LD context is not allowlisted: ${context}`);
    }
  }

  for (const extension of extensionContexts(entry.record)) {
    for (const term of Object.keys(extension)) {
      if (!terms.has(term)) continue;
      if (JSON.stringify(extension[term]) !== JSON.stringify(canonicalDefinitions[term])) {
        fail(JSONLD_DIAGNOSTIC_CODES.CORE_TERM_REMAP, `${entry.rel}: extension context redefines core term ${term}`);
      }
    }
  }
  if (failures.length > 0) return failures;

  try {
    const options = { documentLoader: localDocumentLoader(contextDocument), safe: true };
    const expanded = await jsonld.expand(entry.record, options);
    const node = expanded.find((candidate) => candidate["@id"] === entry.record["@id"]) || expanded[0] || {};

    for (const key of Object.keys(entry.record)) {
      if (!terms.has(key)) continue;
      const expected = terms.get(key);
      if (!Object.hasOwn(node, expected)) {
        fail(JSONLD_DIAGNOSTIC_CODES.EXPECTED_IRI, `${entry.rel}: ${key} did not expand to ${expected}`);
      }
    }
    for (const iri of expectedIris) {
      const present = node["@type"]?.includes(iri) || Object.hasOwn(node, iri);
      if (!present) fail(JSONLD_DIAGNOSTIC_CODES.EXPECTED_IRI, `${entry.rel}: expected expanded IRI ${iri}`);
    }

    const compacted = await jsonld.compact(expanded, entry.record["@context"], options);
    const roundTripped = await jsonld.expand(compacted, options);
    if (JSON.stringify(stableSemantic(expanded)) !== JSON.stringify(stableSemantic(roundTripped))) {
      fail(JSONLD_DIAGNOSTIC_CODES.ROUNDTRIP_DRIFT, `${entry.rel}: expansion changed after compact/expand round trip`);
    }
  } catch (error) {
    const code = error.code === JSONLD_DIAGNOSTIC_CODES.REMOTE_CONTEXT
      ? JSONLD_DIAGNOSTIC_CODES.REMOTE_CONTEXT
      : JSONLD_DIAGNOSTIC_CODES.PROCESSOR;
    fail(code, `${entry.rel}: ${error.message}`);
  }
  return failures;
}

export async function validateJsonLdRecords(entries, options) {
  const results = await Promise.all(entries.map((entry) => validateJsonLdRecord(entry, options)));
  return results.flat();
}

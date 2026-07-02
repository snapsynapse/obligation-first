/**
 * Shared parser for the flat key:value manifest sidecars used by the
 * assistant-guide manifest and the naming-profile manifests.
 */

export function parseKeyValueManifest(text) {
  const out = {};
  for (const [index, line] of text.split("\n").entries()) {
    if (!line.trim()) continue;
    const match = line.match(/^([a-z0-9-]+): (.+)$/);
    if (!match) {
      throw new Error(`malformed manifest line ${index + 1}`);
    }
    out[match[1]] = match[2];
  }
  return out;
}

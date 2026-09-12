// Shared release identity and strict calendar-date checks. No Date rollover acceptance.
export const RELEASE_NAME = "obligation-first";
export const RELEASE_REPOSITORY = "https://github.com/snapsynapse/obligation-first";

export function isValidReleaseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= lengths[month - 1];
}

export function releaseMetadataErrors(manifest, expectedDate) {
  const errors = [];
  if (manifest.name !== RELEASE_NAME) errors.push(`name must be ${RELEASE_NAME}`);
  if (manifest.repository !== RELEASE_REPOSITORY) errors.push(`repository must be ${RELEASE_REPOSITORY}`);
  if (!isValidReleaseDate(manifest.release_date)) errors.push("release_date must be a real YYYY-MM-DD calendar date");
  if (expectedDate !== undefined) {
    if (!isValidReleaseDate(expectedDate)) errors.push("MANIFEST.yaml bundle_date must be a real YYYY-MM-DD calendar date");
    else if (manifest.release_date !== expectedDate) errors.push(`release_date must match MANIFEST.yaml bundle_date ${expectedDate}`);
  }
  return errors;
}

export function readBundleDate(text) {
  const dates = [...text.matchAll(/^bundle_date: (.*)$/gm)];
  if (dates.length !== 1) throw new Error("MANIFEST.yaml must contain exactly one bundle_date");
  const value = dates[0][1].trim();
  if (!isValidReleaseDate(value)) throw new Error("MANIFEST.yaml bundle_date must be a real YYYY-MM-DD calendar date");
  return value;
}

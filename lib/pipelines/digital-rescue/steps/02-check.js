/**
 * Step 02 — Website Health Check
 * @module pipelines/digital-rescue/steps/02-check
 *
 * Pings the website URL from a Place result and determines if it qualifies
 * for the Digital Rescue pipeline (broken link, Wix subdomain, no website, etc.)
 *
 * CONTRACT:
 *   Input:  { place, badWebsitePatterns, timeoutMs }
 *   Output: { qualifies: boolean, reason: string, place }
 */

import { BAD_WEBSITE_PATTERNS, WEBSITE_CHECK_TIMEOUT_MS } from "../config.js";

/** The set of "rescue-worthy" reasons we report */
export const RESCUE_REASONS = {
  NO_WEBSITE: "no_website",
  BAD_PATTERN: "bad_pattern", // Wix, Weebly, etc.
  NOT_FOUND: "http_404",
  DNS_FAILURE: "dns_failure",
  TIMEOUT: "timeout",
  SERVER_ERROR: "server_error", // 5xx
};

/**
 * Check whether a Place's website qualifies for Digital Rescue.
 *
 * @param {Object} params
 * @param {Object} params.place - Normalized Place from step 01
 * @param {RegExp[]} [params.badWebsitePatterns] - URL patterns that flag a bad presence
 * @param {number} [params.timeoutMs] - Fetch timeout in ms
 * @returns {Promise<{ qualifies: boolean, reason: string|null, place: Object }>}
 */
export async function checkWebsiteHealth({
  place,
  badWebsitePatterns = BAD_WEBSITE_PATTERNS,
  timeoutMs = WEBSITE_CHECK_TIMEOUT_MS,
}) {
  // Case 1: No website at all — immediate qualify
  if (!place.website) {
    return { qualifies: true, reason: RESCUE_REASONS.NO_WEBSITE, place };
  }

  // Case 2: Website matches a "bad presence" pattern (Wix, etc.)
  const matchesBadPattern = badWebsitePatterns.some((pattern) =>
    pattern.test(place.website),
  );
  if (matchesBadPattern) {
    return { qualifies: true, reason: RESCUE_REASONS.BAD_PATTERN, place };
  }

  // Case 3: Actually ping the URL and check the response
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(place.website, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timer);

    if (response.status === 404) {
      return { qualifies: true, reason: RESCUE_REASONS.NOT_FOUND, place };
    }

    if (response.status >= 500) {
      return { qualifies: true, reason: RESCUE_REASONS.SERVER_ERROR, place };
    }

    // Website is healthy
    return { qualifies: false, reason: null, place };
  } catch (err) {
    clearTimeout(timer);

    if (err.name === "AbortError") {
      return { qualifies: true, reason: RESCUE_REASONS.TIMEOUT, place };
    }

    // Most likely a DNS resolution failure
    return { qualifies: true, reason: RESCUE_REASONS.DNS_FAILURE, place };
  }
}

/**
 * Step 01 — Search
 * @module pipelines/digital-rescue/steps/01-search
 *
 * Queries Google Places Nearby Search for businesses in a given location.
 * Returns a normalized array of Place objects for downstream steps.
 *
 * CONTRACT:
 *   Input:  { mapsClient, location: { lat, lng }, radius, types, maxResults }
 *   Output: Array<{ placeId, name, website, types, rating, userRatingsTotal, vicinity }>
 */

/**
 * Search for businesses near a location using Google Places Nearby Search.
 *
 * @param {Object} params
 * @param {import('@googlemaps/google-maps-services-js').Client} params.mapsClient - Injected Maps client
 * @param {{ lat: number, lng: number }} params.location - Center of search
 * @param {number} params.radius - Search radius in meters
 * @param {string[]} params.types - Place type filters
 * @param {number} params.maxResults - Max results to return
 * @returns {Promise<Array<Object>>} Normalized place results
 */
export async function searchBusinesses({
  mapsClient,
  location,
  radius,
  types,
  maxResults,
}) {
  const allResults = [];

  for (const type of types) {
    try {
      const response = await mapsClient.placesNearby({
        params: {
          location: { lat: location.lat, lng: location.lng },
          radius,
          type,
          key: process.env.GOOGLE_PLACES_API_KEY,
        },
      });

      const places = response.data.results || [];

      for (const place of places) {
        // Deduplicate by placeId across types
        if (allResults.some((r) => r.placeId === place.place_id)) continue;

        allResults.push(normalizePlaceResult(place));

        if (allResults.length >= maxResults) break;
      }

      if (allResults.length >= maxResults) break;
    } catch (err) {
      // Log and continue — a single type failure shouldn't halt the search
      console.error(
        `[digital-rescue][01-search] Google Places API error for type "${type}":`,
        err.message,
      );
    }
  }

  return allResults;
}

/**
 * Normalize a raw Google Place result into our internal shape.
 *
 * @param {Object} place - Raw Google Places API result
 * @returns {Object} Normalized place
 */
function normalizePlaceResult(place) {
  return {
    placeId: place.place_id,
    name: place.name,
    website: place.website || null,
    types: place.types || [],
    rating: place.rating || null,
    userRatingsTotal: place.user_ratings_total || 0,
    vicinity: place.vicinity || null,
    // The Places Nearby API doesn't return reviews — we call Place Details for those in step 03
    reviewsSnippet: null,
  };
}

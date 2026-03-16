/**
 * Digital Rescue Pipeline — Configuration
 * @module pipelines/digital-rescue/config
 *
 * All tunable parameters for the pipeline. If you need to change search radius,
 * add a city, or adjust kill-switch behavior — this is the ONLY file you edit.
 */

/**
 * Kill switch — set ENABLE_DIGITAL_RESCUE_PIPELINE=false in .env to halt all runs.
 */
export const PIPELINE_ENABLED =
  process.env.ENABLE_DIGITAL_RESCUE_PIPELINE !== "false";

/**
 * I-35 Corridor search locations.
 * Each entry produces one Places API nearby-search call per pipeline run.
 * Coordinates: [lat, lng]
 */
export const CORRIDOR_LOCATIONS = [
  { name: "San Marcos", lat: 29.8833, lng: -97.9414 },
  { name: "Kyle", lat: 29.9891, lng: -97.8772 },
  { name: "Buda", lat: 30.0852, lng: -97.8403 },
  { name: "Wimberley", lat: 29.9983, lng: -98.0978 },
  { name: "New Braunfels", lat: 29.703, lng: -98.1245 },
];

/**
 * Search radius in meters for each location.
 * ~30 miles = ~48,000m. Keeping it tighter per city for precision.
 */
export const SEARCH_RADIUS_METERS = 8000;

/**
 * Google Places business type filters.
 * We target local services, not chains or franchises.
 * @see https://developers.google.com/maps/documentation/places/web-service/supported_types
 */
export const BUSINESS_TYPES = [
  "home_goods_store",
  "plumber",
  "electrician",
  "painter",
  "roofing_contractor",
  "general_contractor",
  "landscaping",
  "car_repair",
  "food",
  "restaurant",
  "bakery",
  "cafe",
];

/**
 * Max Places results to fetch per location per pipeline run.
 * Google Places Nearby returns max 20 per page without nextPageToken.
 */
export const MAX_RESULTS_PER_LOCATION = 20;

/**
 * Website patterns that indicate a "rescued" candidate.
 * Any website URL matching these patterns is flagged as a bad presence.
 */
export const BAD_WEBSITE_PATTERNS = [
  /\.wixsite\.com/i,
  /\.weebly\.com/i,
  /\.squarespace\.com\/preview/i,
  /\.myshopify\.com/i,
  /\.business\.site/i, // Google's own free site builder
  /\.godaddysites\.com/i,
];

/**
 * Timeout in milliseconds for website health checks.
 * Keep short — we're pinging hundreds of URLs.
 */
export const WEBSITE_CHECK_TIMEOUT_MS = 5000;

/**
 * Minimum Google rating to qualify a business for the pipeline.
 * We want businesses that are real and have some community presence.
 * Set to 0 to disable this filter.
 */
export const MIN_RATING = 3.0;

/**
 * Minimum number of Google reviews to qualify.
 * Prevents picking up ghost businesses with no customers.
 */
export const MIN_REVIEW_COUNT = 3;

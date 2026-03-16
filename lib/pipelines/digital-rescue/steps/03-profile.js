/**
 * Step 03 — Profile Synthesis
 * @module pipelines/digital-rescue/steps/03-profile
 *
 * Uses Google Places Details API to fetch reviews, then passes that data
 * to Gemini to synthesize a short "business story" paragraph. This story
 * becomes the `businessStory` input for siteGenerator in step 04.
 *
 * CONTRACT:
 *   Input:  { place, mapsClient, callGemini }
 *   Output: { businessStory: string, category: string, inferredCategory: string }
 */

/** Map Google Place types to our internal category labels */
const TYPE_TO_CATEGORY = {
  plumber: "Plumbing",
  electrician: "Electrical",
  painter: "Painting",
  roofing_contractor: "Roofing",
  general_contractor: "Home Services",
  landscaping: "Landscaping",
  car_repair: "Auto Repair",
  restaurant: "Restaurant",
  food: "Food & Beverage",
  bakery: "Bakery",
  cafe: "Café",
  home_goods_store: "Home Goods",
};

const FALLBACK_CATEGORY = "Local Business";

/**
 * Fetch Place Details to get reviews, then use Gemini to draft a business story.
 *
 * @param {Object} params
 * @param {Object} params.place - Normalized Place from step 01/02
 * @param {import('@googlemaps/google-maps-services-js').Client} params.mapsClient - Injected Maps client
 * @param {Function} params.callGemini - Injected Gemini call function
 * @returns {Promise<{ businessStory: string, category: string }>}
 */
export async function synthesizeProfile({ place, mapsClient, callGemini }) {
  // Step 1: Fetch Place Details to get reviews
  let reviewsText = "";
  try {
    const detailsResponse = await mapsClient.placeDetails({
      params: {
        place_id: place.placeId,
        fields: ["reviews", "formatted_address", "formatted_phone_number"],
        key: process.env.GOOGLE_PLACES_API_KEY,
      },
    });

    const reviews = detailsResponse.data.result?.reviews || [];

    // Concat the top 3 reviews into a block of text for the LLM
    reviewsText = reviews
      .slice(0, 3)
      .map((r) => `"${r.text}"`)
      .join("\n");
  } catch (err) {
    // Not fatal — we'll generate a profile without reviews
    console.warn(
      `[digital-rescue][03-profile] Could not fetch reviews for ${place.placeId}:`,
      err.message,
    );
  }

  // Step 2: Infer category from Place types
  const category = inferCategory(place.types);

  // Step 3: Build prompt and call Gemini
  const systemPrompt = `You are a local business copywriter. Given a business name, location, category, and up to 3 customer reviews, write a 2-3 sentence "Business Story" paragraph in second person (e.g. "Joe's Plumbing has been serving..."). 
  
Rules:
- Do NOT invent specific facts not supported by the input data
- Do NOT include specific prices, phone numbers, or addresses
- Keep it warm, local, and genuine
- Output ONLY the paragraph text — no titles, no quotes, no extra commentary`;

  const userPrompt = `Business Name: ${place.name}
Location: ${place.vicinity || "Central Texas"}
Category: ${category}

Customer Reviews:
${reviewsText || "No reviews available. Write a generic, compelling business story for this type of business in Central Texas."}

Write the business story now.`;

  try {
    const storyText = await callGemini(systemPrompt, userPrompt);
    return {
      businessStory: storyText.trim(),
      category,
    };
  } catch (err) {
    console.error(
      `[digital-rescue][03-profile] Gemini call failed for ${place.placeId}:`,
      err.message,
    );
    // Fall back to a safe generic story
    return {
      businessStory: `${place.name} is a trusted local ${category.toLowerCase()} business serving the Central Texas community.`,
      category,
    };
  }
}

/**
 * Infer a human-readable category from an array of Google Place types.
 *
 * @param {string[]} types - Google Place types array
 * @returns {string} Category label
 */
function inferCategory(types = []) {
  for (const type of types) {
    if (TYPE_TO_CATEGORY[type]) return TYPE_TO_CATEGORY[type];
  }
  return FALLBACK_CATEGORY;
}

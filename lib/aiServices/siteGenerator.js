/**
 * AI Site Generator Service
 *
 * Takes raw business input (story, name, category, vibe preference)
 * and generates SiteConfig JSON via Gemini 2.0 Flash.
 *
 * Produces 3 variations by shuffling hero layouts and vibe presets
 * while keeping the AI-generated copy consistent.
 *
 * @module siteGenerator
 */

const {
  validateSiteConfig,
  VALID_HERO_LAYOUTS,
} = require("../schemas/siteConfigSchema.js");
const {
  resolveVibeToConfig,
  getVibesByTheme,
  VIBE_PRESETS,
} = require("../config/vibePresets.js");

/**
 * System prompt for Gemini site generation.
 * Strictly instructs the model to output valid SiteConfig JSON.
 */
const SYSTEM_PROMPT = `You are a world-class web copywriter specializing in Central Texas small businesses.

Your job: take messy business data and produce a JSON object matching the SiteConfig schema below.

RULES:
- Write highly engaging, conversion-optimized copy
- Be specific to the business — never use generic filler text
- Keep headlines punchy (under 80 characters)
- Keep subtitles compelling (under 150 characters)
- Write a genuine "About" story in 2-3 short paragraphs
- Generate 3 value propositions for the services section
- DO NOT invent contact info (phone numbers, emails, addresses) — leave those fields empty
- DO NOT include any HTML tags
- CRITICAL: Output ONLY valid JSON — no markdown fences, no commentary
- CRITICAL: All strings must be properly escaped. DO NOT use literal newlines inside strings. Use strictly "\\n\\n" for paragraph breaks inside the bio string.

SiteConfig JSON Schema:
{
  "businessName": "string (from input)",
  "category": "string (from input)",
  "theme": "string (from input)",
  "description": "string (SEO meta description, under 160 chars)",
  "sections": [
    {
      "type": "hero",
      "visible": true,
      "data": {
        "headline": "string (punchy, under 80 chars)",
        "subtitle": "string (compelling, under 150 chars)",
        "ctaText": "string (action-oriented, e.g. 'Get a Free Quote')",
        "ctaLink": "#contact",
        "layout": "string (from provided layout option)"
      }
    },
    {
      "type": "services",
      "visible": true,
      "data": {
        "title": "Our Services",
        "items": [
          { "title": "string", "description": "string (1-2 sentences)" }
        ]
      }
    },
    {
      "type": "about",
      "visible": true,
      "data": {
        "title": "Our Story",
        "bio": "string (2-3 paragraphs separated by newlines)"
      }
    },
    {
      "type": "contact",
      "visible": true,
      "data": {
        "title": "string (e.g. 'Ready to Get Started?')",
        "subtitle": "string (e.g. 'Contact us for a free estimate')"
      }
    }
  ]
}`;

/**
 * Generates a SiteConfig JSON from raw business input using Gemini.
 *
 * @param {Object} input
 * @param {string} input.businessName - Business name
 * @param {string} input.businessStory - Raw business description (from speech-to-text or typed)
 * @param {string} input.category - Business category
 * @param {string} [input.vibePreset] - Selected vibe preset ID
 * @param {string} [input.sourceUrl] - Scraped social media URL (future use)
 * @param {Object} options
 * @param {Function} options.callGemini - Injected Gemini API call function (for testability)
 * @returns {Promise<{ success: boolean, config: Object|null, error: string|null }>}
 */
async function generateSiteConfig(input, { callGemini }) {
  const { businessName, businessStory, category, vibePreset } = input;

  // Resolve vibe to theme + layout config
  const vibeConfig = vibePreset ? resolveVibeToConfig(vibePreset) : null;
  const theme = vibeConfig?.theme || "the-trade";
  const heroLayout = vibeConfig?.heroLayout || "clean";
  const validLayouts = VALID_HERO_LAYOUTS[theme] || ["clean"];

  // Build the user prompt
  const userPrompt = `Business Name: ${businessName}
Category: ${category}
Theme: ${theme}
Hero Layout: ${heroLayout}

Business Story / Description:
${businessStory || "No description provided. Write generic but compelling copy for a " + category + " business in Central Texas."}

Generate the SiteConfig JSON now. Use the theme "${theme}" and hero layout "${heroLayout}".`;

  try {
    const rawResponse = await callGemini(SYSTEM_PROMPT, userPrompt);

    // Parse JSON from response (handle potential markdown fences)
    let parsed;
    try {
      const cleaned = rawResponse
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return {
        success: false,
        config: null,
        error: `Failed to parse AI response as JSON: ${parseErr.message}`,
      };
    }

    // Ensure required fields are set
    parsed.businessName = businessName;
    parsed.category = category;
    parsed.theme = theme;

    // Inject branding from vibe preset
    if (vibeConfig) {
      parsed.branding = {
        ...parsed.branding,
        primaryColor: vibeConfig.branding.primaryColor,
        accentColor: vibeConfig.branding.accentColor,
      };
      parsed.font = vibeConfig.font;
    }

    // Validate
    const validation = validateSiteConfig(parsed);
    if (!validation.valid) {
      // Non-fatal: return sanitized version with warnings
      console.warn("[SiteGenerator] Validation warnings:", validation.errors);
    }

    return {
      success: true,
      config: validation.sanitized,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      config: null,
      error: `AI generation failed: ${err.message}`,
    };
  }
}

/**
 * Generates 3 variations of a SiteConfig by shuffling hero layouts
 * and vibe presets while keeping the AI-generated copy consistent.
 *
 * Strategy: Generate ONE base config from the AI, then create
 * 2 additional variations by swapping the heroLayout and vibePreset.
 * This keeps cost to a single API call (~$0.001) while giving 3 options.
 *
 * @param {Object} input - Same as generateSiteConfig input
 * @param {Object} options - Same as generateSiteConfig options
 * @returns {Promise<{ success: boolean, variations: Object[], error: string|null }>}
 */
async function generateVariations(input, { callGemini }) {
  // Generate the base config
  const baseResult = await generateSiteConfig(input, { callGemini });
  if (!baseResult.success) {
    return { success: false, variations: [], error: baseResult.error };
  }

  const baseConfig = baseResult.config;
  const baseTheme = baseConfig.theme;
  const validLayouts = VALID_HERO_LAYOUTS[baseTheme] || ["clean"];

  // Get the current hero layout
  const heroSection = baseConfig.sections?.find((s) => s.type === "hero");
  const currentLayout = heroSection?.data?.layout || validLayouts[0];

  // Get alternative vibes for this theme
  const themeVibes = getVibesByTheme(baseTheme);
  const currentVibeId = input.vibePreset;
  const alternativeVibes = themeVibes.filter((v) => v.id !== currentVibeId);

  // Create variations by swapping layout + vibe colors
  const variations = [baseConfig];

  for (let i = 0; i < 2 && variations.length < 3; i++) {
    const altLayout =
      validLayouts[
        (validLayouts.indexOf(currentLayout) + i + 1) % validLayouts.length
      ];
    const altVibe = alternativeVibes[i % alternativeVibes.length];

    const variant = JSON.parse(JSON.stringify(baseConfig)); // Deep clone

    // Swap hero layout
    const variantHero = variant.sections?.find((s) => s.type === "hero");
    if (variantHero?.data) {
      variantHero.data.layout = altLayout;
    }

    // Swap branding if alternative vibe exists
    if (altVibe) {
      variant.branding = {
        ...variant.branding,
        primaryColor: altVibe.colors.primary,
        accentColor: altVibe.colors.accent,
      };
      variant.font = altVibe.font;
    }

    variations.push(variant);
  }

  return {
    success: true,
    variations,
    error: null,
  };
}

module.exports = {
  generateSiteConfig,
  generateVariations,
  SYSTEM_PROMPT,
};

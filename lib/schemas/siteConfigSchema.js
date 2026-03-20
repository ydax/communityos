/**
 * SiteConfig Runtime Validation Schema
 *
 * Validates AI-generated SiteConfig JSON objects before they are saved
 * to Firestore. Replaces TypeScript/Zod with runtime JavaScript validation.
 *
 * @module siteConfigSchema
 */

// Valid values for constrained fields
const VALID_THEMES = ["the-maker", "the-trade", "the-venue"];
const VALID_SECTION_TYPES = [
  "hero",
  "services",
  "about",
  "contact",
  "gallery",
  "testimonials",
];
const VALID_HERO_LAYOUTS = {
  "the-maker": ["grid", "centered", "fullscreen"],
  "the-trade": ["clean", "bold", "minimal"],
  "the-venue": ["cinematic", "split", "gallery"],
};
const VALID_STATUSES = ["draft", "active", "suspended"];
const VALID_CATEGORIES = [
  // Home Services
  "fencing",
  "plumbing",
  "landscaping",
  "electrical",
  "hvac",
  "roofing",
  "general_contractor",
  // Broader Local Business Categories
  "events",
  "catering",
  "food",
  "retail",
  "home_goods",
  "fitness",
  "beauty",
  "photography",
  "education",
  "consulting",
  "nonprofit",
  "automotive",
  "pet_services",
  "cleaning",
  "moving",
  "other",
];
const MAX_LENGTHS = {
  businessName: 100,
  description: 500,
  headline: 120,
  subtitle: 200,
  bio: 2000,
  sectionTitle: 100,
  sectionText: 2000,
};

/**
 * Strips HTML tags from a string to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function stripHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/<[^>]*>/g, "").trim();
}

/**
 * Enforces max length on a string, truncating if necessary
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function enforceMaxLength(str, maxLen) {
  if (typeof str !== "string") return str;
  return str.length > maxLen ? str.substring(0, maxLen) : str;
}

/**
 * Validates a hex color string
 * @param {string} color
 * @returns {boolean}
 */
function isValidHexColor(color) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Validates and sanitizes a single section object
 * @param {Object} section
 * @param {string} theme - The site theme (determines valid hero layouts)
 * @returns {{ valid: boolean, errors: string[], sanitized: Object }}
 */
function validateSection(section, theme) {
  const errors = [];
  const sanitized = { ...section };

  if (!section || typeof section !== "object") {
    return {
      valid: false,
      errors: ["Section must be an object"],
      sanitized: null,
    };
  }

  // Validate type
  if (!VALID_SECTION_TYPES.includes(section.type)) {
    errors.push(
      `Invalid section type: "${section.type}". Must be one of: ${VALID_SECTION_TYPES.join(", ")}`,
    );
  }

  // Validate visible flag
  if (typeof section.visible !== "boolean") {
    sanitized.visible = true; // Default to visible
  }

  // Validate data object
  if (!section.data || typeof section.data !== "object") {
    sanitized.data = {};
  } else {
    const data = { ...section.data };

    // Sanitize all string fields in data
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        data[key] = stripHtml(value);

        // Enforce specific max lengths based on key
        if (key === "headline") {
          data[key] = enforceMaxLength(data[key], MAX_LENGTHS.headline);
        } else if (key === "subtitle") {
          data[key] = enforceMaxLength(data[key], MAX_LENGTHS.subtitle);
        } else if (key === "bio") {
          data[key] = enforceMaxLength(data[key], MAX_LENGTHS.bio);
        } else if (key === "title") {
          data[key] = enforceMaxLength(data[key], MAX_LENGTHS.sectionTitle);
        } else {
          data[key] = enforceMaxLength(data[key], MAX_LENGTHS.sectionText);
        }
      }
    }

    // Validate hero layout if this is a hero section
    if (section.type === "hero" && data.layout) {
      const validLayouts =
        VALID_HERO_LAYOUTS[theme] || VALID_HERO_LAYOUTS["the-trade"];
      if (!validLayouts.includes(data.layout)) {
        data.layout = validLayouts[0]; // Default to first valid layout
        errors.push(
          `Invalid hero layout "${section.data.layout}" for theme "${theme}". Defaulting to "${data.layout}".`,
        );
      }
    }

    sanitized.data = data;
  }

  return { valid: errors.length === 0, errors, sanitized };
}

/**
 * Validates and sanitizes a complete SiteConfig JSON object.
 *
 * @param {Object} config - Raw SiteConfig JSON (typically from AI output)
 * @returns {{ valid: boolean, errors: string[], sanitized: Object|null }}
 *
 * @example
 * const result = validateSiteConfig({
 *   businessName: 'Joe\'s Fencing',
 *   category: 'fencing',
 *   theme: 'the-trade',
 *   sections: [
 *     { type: 'hero', visible: true, data: { headline: 'Expert Fence Solutions' } },
 *   ],
 * });
 * if (result.valid) {
 *   // Save result.sanitized to Firestore
 * }
 */
function validateSiteConfig(config) {
  const errors = [];

  if (!config || typeof config !== "object") {
    return {
      valid: false,
      errors: ["SiteConfig must be a non-null object"],
      sanitized: null,
    };
  }

  const sanitized = { ...config };

  // --- Required string fields ---

  // businessName
  if (
    !config.businessName ||
    typeof config.businessName !== "string" ||
    !config.businessName.trim()
  ) {
    errors.push("businessName is required and must be a non-empty string");
  } else {
    sanitized.businessName = enforceMaxLength(
      stripHtml(config.businessName),
      MAX_LENGTHS.businessName,
    );
  }

  // category — accept any non-empty string; warn if not in the suggested list
  if (!config.category || typeof config.category !== "string" || !config.category.trim()) {
    errors.push("category is required and must be a non-empty string");
  } else if (!VALID_CATEGORIES.includes(config.category)) {
    // Unknown category is allowed — just not in the curated list
    // No error pushed; category passthrough enables any business type
  }

  // theme
  if (!VALID_THEMES.includes(config.theme)) {
    errors.push(
      `Invalid theme: "${config.theme}". Must be one of: ${VALID_THEMES.join(", ")}`,
    );
    sanitized.theme = "the-trade"; // Default fallback
  }

  // --- Optional string fields ---

  if (config.description) {
    sanitized.description = enforceMaxLength(
      stripHtml(config.description),
      MAX_LENGTHS.description,
    );
  }

  // --- Sections array ---

  if (!Array.isArray(config.sections) || config.sections.length === 0) {
    errors.push("sections must be a non-empty array");
    sanitized.sections = [];
  } else {
    const sanitizedSections = [];
    for (let i = 0; i < config.sections.length; i++) {
      const sectionResult = validateSection(
        config.sections[i],
        sanitized.theme,
      );
      if (!sectionResult.valid) {
        sectionResult.errors.forEach((err) =>
          errors.push(`sections[${i}]: ${err}`),
        );
      }
      if (sectionResult.sanitized) {
        sanitizedSections.push(sectionResult.sanitized);
      }
    }
    sanitized.sections = sanitizedSections;

    // Ensure at least one hero section
    const hasHero = sanitizedSections.some((s) => s.type === "hero");
    if (!hasHero && sanitizedSections.length > 0) {
      errors.push('sections must include at least one "hero" section');
    }
  }

  // --- Branding (optional) ---

  if (config.branding && typeof config.branding === "object") {
    const branding = { ...config.branding };

    if (branding.primaryColor && !isValidHexColor(branding.primaryColor)) {
      errors.push(`Invalid primaryColor hex: "${branding.primaryColor}"`);
      delete branding.primaryColor;
    }
    if (branding.accentColor && !isValidHexColor(branding.accentColor)) {
      errors.push(`Invalid accentColor hex: "${branding.accentColor}"`);
      delete branding.accentColor;
    }

    sanitized.branding = branding;
  }

  // --- Contact (optional) ---

  if (config.contact && typeof config.contact === "object") {
    const contact = { ...config.contact };
    if (contact.email) contact.email = stripHtml(contact.email);
    if (contact.phone) contact.phone = stripHtml(contact.phone);
    sanitized.contact = contact;
  }

  // --- Status ---

  if (config.status && !VALID_STATUSES.includes(config.status)) {
    sanitized.status = "draft";
  } else if (!config.status) {
    sanitized.status = "draft";
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: sanitized,
  };
}

module.exports = {
  validateSiteConfig,
  validateSection,
  stripHtml,
  enforceMaxLength,
  isValidHexColor,
  VALID_THEMES,
  VALID_SECTION_TYPES,
  VALID_HERO_LAYOUTS,
  VALID_STATUSES,
  VALID_CATEGORIES,
  MAX_LENGTHS,
};

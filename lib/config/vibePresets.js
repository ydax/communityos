/**
 * Vibe Presets for AI Website Generation
 *
 * Pre-defined aesthetic configurations that the AI selects from
 * during site generation. Each preset maps to one of the 3 rigid themes
 * and includes curated colors and typography that are guaranteed
 * to look premium together.
 *
 * These presets are shown to users during onboarding as a visual
 * "Vibe Selection" grid the user can tap to set their aesthetic preference.
 *
 * @module vibePresets
 */

/**
 * @typedef {Object} VibePreset
 * @property {string} id - Unique identifier
 * @property {string} label - User-facing label
 * @property {string} description - Short description for the selection UI
 * @property {string} emoji - Emoji icon for quick visual identification
 * @property {string} theme - Maps to one of the 3 rigid themes
 * @property {Object} colors - Curated color palette
 * @property {string} colors.primary - Primary brand color (hex)
 * @property {string} colors.accent - Accent/CTA color (hex)
 * @property {string} colors.background - Background tint (hex)
 * @property {string} font - Google Font family name
 * @property {string} heroLayout - Default hero layout for this vibe
 */

const VIBE_PRESETS = {
  "rugged-pro": {
    id: "rugged-pro",
    label: "Rugged Professional",
    description: "Bold and dependable — built for trades",
    emoji: "🔨",
    theme: "the-trade",
    colors: {
      primary: "#2C3E50",
      accent: "#E67E22",
      background: "#F8F9FA",
    },
    font: "Inter",
    heroLayout: "bold",
  },

  "clean-modern": {
    id: "clean-modern",
    label: "Clean & Modern",
    description: "Sleek minimalism that builds trust",
    emoji: "✨",
    theme: "the-maker",
    colors: {
      primary: "#1A1A2E",
      accent: "#0F3460",
      background: "#FFFFFF",
    },
    font: "Outfit",
    heroLayout: "centered",
  },

  "warm-friendly": {
    id: "warm-friendly",
    label: "Warm & Friendly",
    description: "Approachable and inviting — perfect for family businesses",
    emoji: "🌻",
    theme: "the-venue",
    colors: {
      primary: "#5D4037",
      accent: "#FF8F00",
      background: "#FFF8E1",
    },
    font: "Nunito",
    heroLayout: "split",
  },

  "texas-bold": {
    id: "texas-bold",
    label: "Texas Bold",
    description: "Confident and proud — Central Texas through and through",
    emoji: "⭐",
    theme: "the-trade",
    colors: {
      primary: "#1B4332",
      accent: "#D4A373",
      background: "#F5F5F0",
    },
    font: "Roboto Slab",
    heroLayout: "clean",
  },

  "fresh-green": {
    id: "fresh-green",
    label: "Fresh & Green",
    description: "Natural and eco-conscious — great for landscapers",
    emoji: "🌿",
    theme: "the-venue",
    colors: {
      primary: "#2D6A4F",
      accent: "#95D5B2",
      background: "#F0FFF4",
    },
    font: "Nunito",
    heroLayout: "cinematic",
  },

  "premium-dark": {
    id: "premium-dark",
    label: "Premium Dark",
    description: "Sophisticated and high-end",
    emoji: "🖤",
    theme: "the-maker",
    colors: {
      primary: "#0D1117",
      accent: "#58A6FF",
      background: "#161B22",
    },
    font: "Inter",
    heroLayout: "fullscreen",
  },

  "classic-craft": {
    id: "classic-craft",
    label: "Classic Craftsman",
    description: "Timeless quality — for artisans and builders",
    emoji: "🪵",
    theme: "the-maker",
    colors: {
      primary: "#3E2723",
      accent: "#BF360C",
      background: "#EFEBE9",
    },
    font: "Merriweather",
    heroLayout: "grid",
  },

  "bright-energy": {
    id: "bright-energy",
    label: "Bright & Energetic",
    description: "Fun and dynamic — stands out from the crowd",
    emoji: "⚡",
    theme: "the-trade",
    colors: {
      primary: "#1565C0",
      accent: "#FF6F00",
      background: "#E3F2FD",
    },
    font: "Outfit",
    heroLayout: "minimal",
  },
};

/**
 * Returns all vibe presets as an array (for rendering the selection grid)
 * @returns {VibePreset[]}
 */
function getAllVibePresets() {
  return Object.values(VIBE_PRESETS);
}

/**
 * Get a specific vibe preset by ID
 * @param {string} vibeId
 * @returns {VibePreset|null}
 */
function getVibePreset(vibeId) {
  return VIBE_PRESETS[vibeId] || null;
}

/**
 * Get all vibe presets for a specific theme
 * @param {string} themeName - e.g. 'the-maker'
 * @returns {VibePreset[]}
 */
function getVibesByTheme(themeName) {
  return Object.values(VIBE_PRESETS).filter((v) => v.theme === themeName);
}

/**
 * Resolve a vibe preset into branding + theme config
 * suitable for merging into a SiteConfig object
 * @param {string} vibeId
 * @returns {Object|null} - { theme, branding: { primaryColor, accentColor }, heroLayout }
 */
function resolveVibeToConfig(vibeId) {
  const preset = VIBE_PRESETS[vibeId];
  if (!preset) return null;

  return {
    theme: preset.theme,
    branding: {
      primaryColor: preset.colors.primary,
      accentColor: preset.colors.accent,
    },
    heroLayout: preset.heroLayout,
    font: preset.font,
  };
}

module.exports = {
  VIBE_PRESETS,
  getAllVibePresets,
  getVibePreset,
  getVibesByTheme,
  resolveVibeToConfig,
};

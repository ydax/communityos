import TheTrade from "./themes/TheTrade.js";
import TheMaker from "./themes/TheMaker.js";
import TheVenue from "./themes/TheVenue.js";
import { getTheme } from "../../styles/themes.js";

/**
 * Site Renderer Component
 * Dynamically renders a site based on theme and configuration.
 *
 * Supports two modes:
 * 1. Normal rendering (existing): reads site.theme and selects the component
 * 2. Vibe-enhanced rendering: when site.branding has overrides from a vibe preset,
 *    merges them into the theme config for custom colors/fonts
 *
 * @param {Object} props - Component props
 * @param {Object} props.site - Site configuration object (SiteConfig JSON)
 * @param {boolean} [props.editMode=false] - Enable tap-to-edit overlays
 * @param {Function} [props.onSectionEdit] - Callback when a section is tapped in edit mode
 */
export default function SiteRenderer({
  site,
  editMode = false,
  onSectionEdit,
}) {
  // Get base theme config
  const baseTheme = getTheme(site.theme || "the-trade");

  // Merge branding overrides from vibe presets (if present)
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...(site.branding?.primaryColor && {
        primary: site.branding.primaryColor,
      }),
      ...(site.branding?.accentColor && { accent: site.branding.accentColor }),
    },
    fonts: {
      ...baseTheme.fonts,
      ...(site.font && { heading: site.font, body: site.font }),
    },
  };

  // Map theme names to components
  const themeComponents = {
    "the-trade": TheTrade,
    "the-maker": TheMaker,
    "the-venue": TheVenue,
  };

  // Get the appropriate theme component, fallback to Trade
  const ThemeComponent = themeComponents[site.theme] || TheTrade;

  return (
    <ThemeComponent
      site={site}
      theme={theme}
      editMode={editMode}
      onSectionEdit={onSectionEdit}
    />
  );
}

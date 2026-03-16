/**
 * Theme Definitions
 * Three rigid theme palettes for site rendering
 */

export const themes = {
  'the-maker': {
    name: 'The Maker',
    description: 'Creative/Artisan Aesthetic',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      dark: '#2D3142',
      light: '#F8F9FA'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  },
  'the-trade': {
    name: 'The Trade',
    description: 'Professional Services',
    colors: {
      primary: '#2C3E50',
      secondary: '#E67E22',
      accent: '#3498DB',
      dark: '#1A252F',
      light: '#ECF0F1'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  },
  'the-venue': {
    name: 'The Venue',
    description: 'Event-Focused Design',
    colors: {
      primary: '#9B59B6',
      secondary: '#F39C12',
      accent: '#E74C3C',
      dark: '#34495E',
      light: '#F5F5F5'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  }
};

/**
 * Get theme configuration by theme ID
 * @param {string} themeId - Theme identifier
 * @returns {Object} Theme configuration
 */
export function getTheme(themeId) {
  return themes[themeId] || themes['the-trade'];
}

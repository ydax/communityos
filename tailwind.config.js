/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme: "The Maker" - Creative/Artisan Aesthetic
        maker: {
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
          accent: "#FFE66D",
          dark: "#2D3142",
          light: "#F8F9FA",
        },
        // Theme: "The Trade" - Professional Services (Shopify-inspired)
        trade: {
          primary: "#0A2540", // Deep navy - sophisticated, professional
          secondary: "#FF6B35", // Vibrant coral-orange - energetic, warm
          accent: "#0066FF", // Bright blue - trustworthy, modern
          success: "#00AB76", // Green - positive actions
          dark: "#000B1A", // Near-black - maximum contrast
          light: "#F7FAFC", // Soft gray-blue - clean background
          muted: "#64748B", // Muted gray - secondary text
        },
        // Theme: "The Venue" - Event-Focused Design
        venue: {
          primary: "#9B59B6",
          secondary: "#F39C12",
          accent: "#E74C3C",
          dark: "#34495E",
          light: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
        mono: ["Menlo", "monospace"],
      },
      spacing: {
        128: "32rem",
        144: "36rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 15px 0 rgba(0, 0, 0, 0.08)",
        medium: "0 4px 20px 0 rgba(0, 0, 0, 0.12)",
        strong: "0 8px 30px 0 rgba(0, 0, 0, 0.16)",
      },
      lineHeight: {
        tight: "1.1",
        snug: "1.3",
        relaxed: "1.6",
      },
    },
  },
  plugins: [],
};

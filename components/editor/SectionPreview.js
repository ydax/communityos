import { useState } from "react";

/**
 * SectionPreview Component
 * Live preview of the site with current edits
 *
 * @param {Object} props - Component props
 * @param {Object} props.site - Site data with sections
 * @param {string} props.theme - Current theme
 */
export default function SectionPreview({ site, theme }) {
  const [previewMode, setPreviewMode] = useState("desktop"); // "mobile" | "desktop"

  return (
    <div className="bg-gray-100 w-full h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Preview Header */}
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div>
            <h3 className="font-bold text-gray-800">Live Preview</h3>
            <p className="text-sm text-gray-600">Theme: {theme}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`px-3 py-1 text-xs border rounded transition-colors ${
                previewMode === "mobile"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              📱 Mobile
            </button>
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`px-3 py-1 text-xs border rounded transition-colors ${
                previewMode === "desktop"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              💻 Desktop
            </button>
          </div>
        </div>

        {/* Preview Content — constrained width in mobile mode */}
        <div
          className={`mx-auto transition-all duration-300 bg-white rounded-lg shadow-xl overflow-hidden ${
            previewMode === "mobile" ? "max-w-[390px]" : "w-full"
          }`}
        >
          {/* Render sections in order */}
          {site.sections &&
            site.sections.map((section, index) => {
              if (!section.visible) return null;

              return (
                <div
                  key={index}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  {renderSectionPreview(section, theme)}
                </div>
              );
            })}

          {/* Empty state */}
          {(!site.sections || site.sections.length === 0) && (
            <div className="p-12 text-center text-gray-500">
              <p>No sections configured yet.</p>
              <p className="text-sm mt-2">Add sections using the editor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render preview for a specific section type
 */
function renderSectionPreview(section, theme) {
  const getThemeColors = () => {
    const themes = {
      "the-maker": { primary: "#FF6B6B", secondary: "#4ECDC4" },
      "the-trade": { primary: "#2C3E50", secondary: "#E67E22" },
      "the-venue": { primary: "#9B59B6", secondary: "#F39C12" },
    };
    return themes[theme] || themes["the-trade"];
  };

  const colors = getThemeColors();

  switch (section.type) {
    case "hero":
      return (
        <div
          className="relative h-96 flex items-center justify-center text-white"
          style={{ backgroundColor: colors.primary }}
        >
          <div className="text-center z-10">
            <h1 className="text-5xl font-bold mb-4">
              {section.data?.headline || "Your Headline Here"}
            </h1>
            <p className="text-xl mb-6">
              {section.data?.subheadline || "Your subheadline"}
            </p>
            {section.data?.ctaText && (
              <button
                className="px-8 py-3 rounded-lg font-semibold"
                style={{ backgroundColor: colors.secondary }}
              >
                {section.data.ctaText}
              </button>
            )}
          </div>
        </div>
      );

    case "services":
      return (
        <div className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }}
            >
              Our Services
            </h2>
            <p className="text-gray-600 mb-8">
              Services will be auto-populated from your Item Library
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-32 bg-gray-200 rounded mb-4" />
                  <h3 className="font-bold mb-2">Service {i}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Description of the service
                  </p>
                  <button
                    className="px-4 py-2 rounded font-semibold text-white"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "about":
      return (
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{ color: colors.primary }}
              >
                About Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {section.data?.bio ||
                  "Your about text will appear here. Tell your story..."}
              </p>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      );

    case "contact":
      return (
        <div className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl font-bold text-center mb-8"
              style={{ color: colors.primary }}
            >
              Contact Us
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4">Get in Touch</h3>
                {section.data?.phone && (
                  <p className="mb-2">📞 {section.data.phone}</p>
                )}
                {section.data?.email && (
                  <p className="mb-2">📧 {section.data.email}</p>
                )}
                {section.data?.address && (
                  <p className="mb-2">📍 {section.data.address}</p>
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4">Send a Message</h3>
                <form className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full px-4 py-2 border rounded"
                    disabled
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded"
                    disabled
                  />
                  <textarea
                    placeholder="Message"
                    rows={4}
                    className="w-full px-4 py-2 border rounded"
                    disabled
                  />
                  <button
                    type="button"
                    className="w-full px-4 py-2 rounded font-semibold text-white"
                    style={{ backgroundColor: colors.primary }}
                    disabled
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      );

    case "gallery":
      return (
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl font-bold text-center mb-8"
              style={{ color: colors.primary }}
            >
              Gallery
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {(section.data?.images || [1, 2, 3, 4, 5, 6])
                .slice(0, 6)
                .map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-200 rounded-lg"
                  />
                ))}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="py-8 px-4 bg-gray-100 text-center text-gray-500">
          Unknown section type: {section.type}
        </div>
      );
  }
}

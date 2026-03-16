import HeroSection from "../sections/HeroSection.js";
import ServicesSection from "../sections/ServicesSection.js";

/**
 * "The Trade" Theme
 * Professional services aesthetic for home service providers
 *
 * Hero layout variants: 'clean' (default), 'bold', 'minimal'
 *
 * @param {Object} props - Component props
 * @param {Object} props.site - Site configuration
 * @param {Object} props.theme - Theme configuration
 * @param {boolean} [props.editMode] - Enable tap-to-edit overlays
 * @param {Function} [props.onSectionEdit] - Callback when a section is tapped in edit mode
 */
export default function TheTrade({
  site,
  theme,
  editMode = false,
  onSectionEdit,
}) {
  const { businessName, id: siteId, sections = [] } = site;

  // Extract section data (support both 'data' and legacy 'content' fields)
  const heroSection = sections.find((s) => s.type === "hero") || {};
  const aboutSection = sections.find((s) => s.type === "about") || {};
  const contactSection = sections.find((s) => s.type === "contact") || {};
  const heroData = heroSection.data || heroSection.content || {};
  const aboutData = aboutSection.data || aboutSection.content || {};
  const contactData = contactSection.data || contactSection.content || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Uses universal HeroSection with layout variants */}
      <HeroSection
        businessName={businessName}
        theme={theme}
        data={heroData}
        variant="trade"
        editMode={editMode}
        onEdit={onSectionEdit}
      />

      {/* Services Section */}
      <ServicesSection
        siteId={siteId}
        theme="trade"
        sectionData={{ title: "Our Services" }}
      />

      {/* About Section */}
      {aboutSection.visible !== false && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2
              className="text-3xl font-bold text-center mb-8"
              style={{ color: theme.colors.primary }}
            >
              {aboutData.title || "About Us"}
            </h2>
            <div className="max-w-2xl mx-auto text-center text-gray-600">
              {aboutData.bio ? (
                aboutData.bio.split("\n").map((paragraph, i) => (
                  <p key={i} className="mb-4">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>Business information will appear here.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{ color: theme.colors.primary }}
        >
          {contactData.title || "Get In Touch"}
        </h2>
        <div className="max-w-md mx-auto text-center">
          <p className="text-gray-600 mb-6">
            {contactData.subtitle ||
              "Ready to work with us? Contact us to get started."}
          </p>

          {/* Contact details */}
          {(contactData.phone || contactData.email) && (
            <div className="space-y-3 mb-6">
              {contactData.phone && (
                <p>
                  <a
                    href={`tel:${contactData.phone}`}
                    className="text-gray-700 hover:underline"
                  >
                    📞 {contactData.phone}
                  </a>
                </p>
              )}
              {contactData.email && (
                <p>
                  <a
                    href={`mailto:${contactData.email}`}
                    className="text-gray-700 hover:underline"
                  >
                    ✉️ {contactData.email}
                  </a>
                </p>
              )}
            </div>
          )}

          <a
            href={`mailto:${contactData.email || `info@${site.domain}`}`}
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-white"
        style={{ backgroundColor: theme.colors.dark }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">
            &copy; 2026 {businessName}. All rights reserved.
          </p>
          <p className="text-sm opacity-75 flex items-center justify-center gap-1.5">
            Powered by{" "}
            <a
              href="https://centraltexas.com"
              className="underline inline-flex items-center gap-1"
            >
              <img
                src="/logo.png"
                alt=""
                width={14}
                height={14}
                className="inline-block brightness-0 invert opacity-75"
              />
              CentralTexas.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

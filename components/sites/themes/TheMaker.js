import HeroSection from "../sections/HeroSection.js";
import ServicesSection from "../sections/ServicesSection.js";

/**
 * "The Maker" Theme
 * Craftsman/portfolio focus with grid-based layouts
 * Ideal for construction, fabrication, and trade businesses that emphasize materials and craftsmanship
 *
 * Hero layout variants: 'grid' (default), 'centered', 'fullscreen'
 *
 * @param {Object} props - Component props
 * @param {Object} props.site - Site configuration
 * @param {Object} props.theme - Theme configuration
 * @param {boolean} [props.editMode] - Enable tap-to-edit overlays
 * @param {Function} [props.onSectionEdit] - Callback when a section is tapped in edit mode
 */
export default function TheMaker({
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
        variant="maker"
        editMode={editMode}
        onEdit={onSectionEdit}
      />

      {/* Services Section - 3-column grid */}
      <ServicesSection
        siteId={siteId}
        theme="maker"
        sectionData={{
          title: "Our Services",
          description: "Expert craftsmanship backed by years of experience",
        }}
      />

      {/* About Section - Side-by-side layout */}
      {aboutSection.visible !== false && (
        <section
          className="py-20 px-4"
          style={{ backgroundColor: `${theme.colors.secondary}10` }}
        >
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* About Image */}
              {aboutData.image && (
                <div className="relative h-96 rounded-lg overflow-hidden shadow-lg order-2 lg:order-1">
                  <img
                    src={aboutData.image}
                    alt="About Us"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* About Content */}
              <div className="order-1 lg:order-2">
                <h2
                  className="text-4xl font-bold mb-6"
                  style={{ color: theme.colors.primary }}
                >
                  {aboutData.title || `About ${businessName}`}
                </h2>
                <div className="text-lg text-gray-700 leading-relaxed space-y-4">
                  {aboutData.bio ? (
                    aboutData.bio
                      .split("\n")
                      .map((paragraph, i) => <p key={i}>{paragraph}</p>)
                  ) : (
                    <p>Your business story will appear here.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio/Gallery Section - Optional */}
      {sections.find((s) => s.type === "gallery" && s.visible !== false) && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="container mx-auto">
            <h2
              className="text-4xl font-bold text-center mb-12"
              style={{ color: theme.colors.primary }}
            >
              Our Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const gal = sections.find((s) => s.type === "gallery");
                const images = gal?.data?.images || gal?.content?.images || [];
                return images.map((image, i) => (
                  <div
                    key={i}
                    className="relative h-64 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                  >
                    <img
                      src={image}
                      alt={`Project ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section - Centered with emphasis */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2
            className="text-4xl font-bold mb-6"
            style={{ color: theme.colors.primary }}
          >
            {contactData.title || "Let's Build Together"}
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            {contactData.subtitle ||
              "Ready to start your project? Get in touch for a free consultation."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {contactData.phone && (
              <div className="p-6 rounded-lg bg-gray-50">
                <div
                  className="text-2xl mb-2"
                  style={{ color: theme.colors.secondary }}
                >
                  📞
                </div>
                <div className="font-semibold text-gray-800 mb-1">Phone</div>
                <a
                  href={`tel:${contactData.phone}`}
                  className="text-gray-600 hover:underline"
                >
                  {contactData.phone}
                </a>
              </div>
            )}

            {contactData.email && (
              <div className="p-6 rounded-lg bg-gray-50">
                <div
                  className="text-2xl mb-2"
                  style={{ color: theme.colors.secondary }}
                >
                  ✉️
                </div>
                <div className="font-semibold text-gray-800 mb-1">Email</div>
                <a
                  href={`mailto:${contactData.email}`}
                  className="text-gray-600 hover:underline"
                >
                  {contactData.email}
                </a>
              </div>
            )}

            {contactData.address && (
              <div className="p-6 rounded-lg bg-gray-50">
                <div
                  className="text-2xl mb-2"
                  style={{ color: theme.colors.secondary }}
                >
                  📍
                </div>
                <div className="font-semibold text-gray-800 mb-1">Location</div>
                <div className="text-gray-600">{contactData.address}</div>
              </div>
            )}
          </div>

          <a
            href={`mailto:${contactData.email || `info@${site.domain}`}`}
            className="inline-block px-10 py-4 rounded-lg font-bold text-white text-lg transition-colors shadow-lg hover:shadow-xl"
            style={{ backgroundColor: theme.colors.accent }}
          >
            Request a Quote
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 text-white"
        style={{ backgroundColor: theme.colors.dark }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg mb-3">
            &copy; 2026 {businessName}. All rights reserved.
          </p>
          <p className="text-sm opacity-90 flex items-center justify-center gap-1.5">
            Powered by{" "}
            <a
              href="https://centraltexas.com"
              className="underline hover:opacity-100 inline-flex items-center gap-1"
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

import HeroSection from "../sections/HeroSection.js";
import ServicesSection from "../sections/ServicesSection.js";

/**
 * "The Venue" Theme
 * Visual/experiential focus for high-end services
 * Ideal for landscaping, events, design services that emphasize aesthetics and portfolios
 *
 * Hero layout variants: 'cinematic' (default), 'split', 'gallery'
 *
 * @param {Object} props - Component props
 * @param {Object} props.site - Site configuration
 * @param {Object} props.theme - Theme configuration
 * @param {boolean} [props.editMode] - Enable tap-to-edit overlays
 * @param {Function} [props.onSectionEdit] - Callback when a section is tapped in edit mode
 */
export default function TheVenue({
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
  const gallerySection = sections.find((s) => s.type === "gallery") || {};
  const heroData = heroSection.data || heroSection.content || {};
  const aboutData = aboutSection.data || aboutSection.content || {};
  const contactData = contactSection.data || contactSection.content || {};
  const galleryData = gallerySection.data || gallerySection.content || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Uses universal HeroSection with layout variants */}
      <HeroSection
        businessName={businessName}
        theme={theme}
        data={heroData}
        variant="venue"
        editMode={editMode}
        onEdit={onSectionEdit}
      />

      {/* Services Section - Card-based with large images */}
      <ServicesSection
        siteId={siteId}
        theme="venue"
        sectionData={{
          title: "Our Services",
          description: "Curated experiences crafted with passion and precision",
        }}
      />

      {/* Gallery Section - Full-width showcase */}
      {gallerySection.visible !== false && galleryData.images?.length > 0 && (
        <section className="py-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {galleryData.images.map((image, i) => (
              <div
                key={i}
                className="relative h-96 overflow-hidden group cursor-pointer"
              >
                <img
                  src={image}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}CC` }}
                >
                  <span className="text-white text-2xl font-bold">
                    View Project
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About Section - Elegant centered layout */}
      {aboutSection.visible !== false && (
        <section className="py-24 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2
                className="text-5xl font-bold mb-6"
                style={{ color: theme.colors.primary }}
              >
                {aboutData.title || "Our Story"}
              </h2>
              {aboutData.image && (
                <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl mb-8 mx-auto max-w-2xl">
                  <img
                    src={aboutData.image}
                    alt="About Us"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="text-xl text-gray-700 leading-relaxed space-y-6 text-center">
              {aboutData.bio ? (
                aboutData.bio
                  .split("\n")
                  .map((paragraph, i) => <p key={i}>{paragraph}</p>)
              ) : (
                <p>Your business story will appear here.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section - Premium feel */}
      <section
        className="py-24 px-4 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
        }}
      >
        {/* Decorative Elements */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
          style={{
            backgroundColor: theme.colors.accent,
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{
            backgroundColor: theme.colors.accent,
            transform: "translate(-40%, 40%)",
          }}
        />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">
              {contactData.title || "Let's Create Something Beautiful"}
            </h2>
            <p className="text-2xl opacity-90">
              {contactData.subtitle || "Get in touch to discuss your vision"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {contactData.phone && (
              <div className="text-center p-6 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm">
                <div className="text-4xl mb-3">📞</div>
                <div className="font-bold text-lg mb-2">Call Us</div>
                <a
                  href={`tel:${contactData.phone}`}
                  className="hover:underline opacity-90 hover:opacity-100"
                >
                  {contactData.phone}
                </a>
              </div>
            )}

            {contactData.email && (
              <div className="text-center p-6 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm">
                <div className="text-4xl mb-3">✉️</div>
                <div className="font-bold text-lg mb-2">Email Us</div>
                <a
                  href={`mailto:${contactData.email}`}
                  className="hover:underline opacity-90 hover:opacity-100 break-all"
                >
                  {contactData.email}
                </a>
              </div>
            )}

            {contactData.address && (
              <div className="text-center p-6 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm">
                <div className="text-4xl mb-3">📍</div>
                <div className="font-bold text-lg mb-2">Visit Us</div>
                <div className="opacity-90">{contactData.address}</div>
              </div>
            )}
          </div>

          <div className="text-center">
            <a
              href={`mailto:${contactData.email || `info@${site.domain}`}`}
              className="inline-block px-12 py-5 rounded-full font-bold text-lg transition-all shadow-2xl hover:shadow-3xl hover:scale-105"
              style={{ backgroundColor: "white", color: theme.colors.primary }}
            >
              Start Your Project
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 text-white"
        style={{ backgroundColor: theme.colors.dark }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl mb-3">{businessName}</p>
          <p className="text-sm opacity-75 mb-4">
            &copy; 2026 All rights reserved.
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

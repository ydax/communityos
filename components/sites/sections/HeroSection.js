/**
 * Hero Section Component
 * Reusable hero section with multiple layout variants.
 *
 * Layout variants are per-theme:
 *   TheMaker:  'grid' (split 2-col), 'centered', 'fullscreen'
 *   TheTrade:  'clean' (gradient), 'bold' (dark bg), 'minimal' (text only)
 *   TheVenue:  'cinematic' (full-screen overlay), 'split', 'gallery'
 *
 * @param {Object} props - Component props
 * @param {string} props.businessName - Business name to display
 * @param {Object} props.theme - Theme configuration (colors, fonts)
 * @param {Object} [props.data] - Section data from SiteConfig JSON
 * @param {string} [props.data.headline] - Hero headline text
 * @param {string} [props.data.subtitle] - Hero subtitle text
 * @param {string} [props.data.ctaText] - Call-to-action button text
 * @param {string} [props.data.ctaLink] - Call-to-action link
 * @param {string} [props.data.image] - Hero background/feature image URL
 * @param {string} [props.data.layout] - Layout variant (theme-dependent)
 * @param {string} [props.variant] - Which theme variant set to use: 'maker', 'trade', 'venue'
 * @param {boolean} [props.editMode] - Enable tap-to-edit overlays
 * @param {Function} [props.onEdit] - Edit callback
 */
export default function HeroSection({
  businessName,
  theme,
  data = {},
  variant = "trade",
  editMode = false,
  onEdit,
}) {
  const headline = data.headline || businessName || "Welcome";
  const subtitle =
    data.subtitle || data.subheadline || "Professional service you can trust.";
  const ctaText = data.ctaText || "Get Started";
  const ctaLink = data.ctaLink || "#contact";
  const image = data.image || null;
  const layout = data.layout || getDefaultLayout(variant);

  // Determine which renderer to use based on variant + layout
  const renderKey = `${variant}-${layout}`;

  const editProps = editMode
    ? {
        onClick: (e) => {
          e.preventDefault();
          onEdit?.("hero", data);
        },
        style: { cursor: "pointer" },
        "data-editable": "hero",
      }
    : {};

  switch (renderKey) {
    // ── TheMaker layouts ──

    case "maker-grid":
      return (
        <section
          className="relative py-20 px-4"
          style={{ backgroundColor: `${theme.colors.primary}15` }}
          {...editProps}
        >
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1
                  className="text-5xl md:text-6xl font-bold mb-6"
                  style={{ color: theme.colors.primary }}
                >
                  {headline}
                </h1>
                <p className="text-xl text-gray-700 mb-8">{subtitle}</p>
                <a
                  href={ctaLink}
                  className="inline-block px-8 py-4 rounded-lg font-bold text-white text-lg transition-colors shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {ctaText}
                </a>
              </div>
              {image && (
                <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
                  <img
                    src={image}
                    alt={businessName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case "maker-centered":
      return (
        <section
          className="py-24 px-4 text-center"
          style={{ backgroundColor: `${theme.colors.primary}10` }}
          {...editProps}
        >
          <div className="container mx-auto max-w-3xl">
            <h1
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{ color: theme.colors.primary }}
            >
              {headline}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10">
              {subtitle}
            </p>
            <a
              href={ctaLink}
              className="inline-block px-10 py-4 rounded-lg font-bold text-white text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {ctaText}
            </a>
            {image && (
              <div className="mt-12 relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-2xl">
                <img
                  src={image}
                  alt={businessName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </section>
      );

    case "maker-fullscreen":
      return (
        <section
          className="relative min-h-[80vh] flex items-center justify-center"
          {...editProps}
        >
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-60" />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.dark || "#1a1a2e"} 100%)`,
              }}
            />
          )}
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              {headline}
            </h1>
            <p className="text-xl md:text-2xl text-white opacity-90 mb-10">
              {subtitle}
            </p>
            <a
              href={ctaLink}
              className="inline-block px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-2xl hover:shadow-3xl hover:scale-105"
              style={{
                backgroundColor: theme.colors.accent || theme.colors.primary,
                color: "white",
              }}
            >
              {ctaText}
            </a>
          </div>
        </section>
      );

    // ── TheTrade layouts ──

    case "trade-clean":
      return (
        <section
          className="py-20 md:py-32"
          style={{
            background: `linear-gradient(to bottom, ${theme.colors.light || "#ECF0F1"}, white)`,
          }}
          {...editProps}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-4xl md:text-6xl font-bold mb-6"
                style={{ color: theme.colors.primary }}
              >
                {headline}
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8">
                {subtitle}
              </p>
              <a
                href={ctaLink}
                className="inline-block px-8 py-4 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {ctaText}
              </a>
            </div>
          </div>
        </section>
      );

    case "trade-bold":
      return (
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{ backgroundColor: theme.colors.primary }}
          {...editProps}
        >
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{
              backgroundColor: theme.colors.accent,
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                {headline}
              </h1>
              <p className="text-xl text-white opacity-85 mb-8 max-w-2xl">
                {subtitle}
              </p>
              <a
                href={ctaLink}
                className="inline-block px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: theme.colors.accent || "#E67E22",
                  color: "white",
                }}
              >
                {ctaText}
              </a>
            </div>
          </div>
          {image && (
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-2/5">
              <img
                src={image}
                alt={businessName}
                className="w-full h-full object-cover opacity-50"
              />
            </div>
          )}
        </section>
      );

    case "trade-minimal":
      return (
        <section className="py-32 px-4" {...editProps}>
          <div className="container mx-auto max-w-2xl text-center">
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: theme.colors.primary }}
            >
              {headline}
            </h1>
            <div
              className="w-16 h-1 mx-auto mb-6 rounded"
              style={{
                backgroundColor: theme.colors.accent || theme.colors.secondary,
              }}
            />
            <p className="text-lg text-gray-600 mb-8">{subtitle}</p>
            <a
              href={ctaLink}
              className="inline-block px-6 py-3 border-2 rounded-lg font-semibold transition-colors hover:text-white"
              style={{
                borderColor: theme.colors.primary,
                color: theme.colors.primary,
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.colors.primary;
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = theme.colors.primary;
              }}
            >
              {ctaText}
            </a>
          </div>
        </section>
      );

    // ── TheVenue layouts ──

    case "venue-cinematic":
      return (
        <section
          className="relative h-screen flex items-center justify-center"
          {...editProps}
        >
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}CC 0%, ${theme.colors.secondary}99 100%)`,
                }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
              }}
            />
          )}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {headline}
            </h1>
            <p className="text-2xl md:text-3xl text-white mb-10 opacity-95">
              {subtitle}
            </p>
            <a
              href={ctaLink}
              className="inline-block px-12 py-5 rounded-full font-bold text-lg transition-all shadow-2xl hover:shadow-3xl hover:scale-105"
              style={{ backgroundColor: theme.colors.accent, color: "white" }}
            >
              {ctaText}
            </a>
          </div>
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-3 bg-white rounded-full" />
            </div>
          </div>
        </section>
      );

    case "venue-split":
      return (
        <section
          className="min-h-[90vh] flex flex-col lg:flex-row"
          {...editProps}
        >
          <div
            className="flex-1 flex items-center justify-center p-8 lg:p-16"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <div className="max-w-lg text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                {headline}
              </h1>
              <p className="text-xl opacity-90 mb-8">{subtitle}</p>
              <a
                href={ctaLink}
                className="inline-block px-10 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: theme.colors.accent, color: "white" }}
              >
                {ctaText}
              </a>
            </div>
          </div>
          {image ? (
            <div className="flex-1 relative min-h-[50vh] lg:min-h-0">
              <img
                src={image}
                alt={businessName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex-1 relative min-h-[50vh] lg:min-h-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`,
              }}
            />
          )}
        </section>
      );

    case "venue-gallery":
      return (
        <section className="relative py-24 px-4" {...editProps}>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${theme.colors.primary}10 0%, white 100%)`,
            }}
          />
          <div className="container mx-auto relative z-10 text-center">
            <h1
              className="text-6xl md:text-7xl font-bold mb-4"
              style={{ color: theme.colors.primary }}
            >
              {headline}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
              {subtitle}
            </p>
            {image && (
              <div className="rounded-3xl overflow-hidden shadow-2xl mx-auto max-w-4xl mb-8">
                <img src={image} alt={businessName} className="w-full h-auto" />
              </div>
            )}
            <a
              href={ctaLink}
              className="inline-block px-10 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              style={{ backgroundColor: theme.colors.accent, color: "white" }}
            >
              {ctaText}
            </a>
          </div>
        </section>
      );

    // Default fallback
    default:
      return (
        <section
          className="py-20 md:py-32"
          style={{
            background: `linear-gradient(to bottom, ${theme.colors.light || "#F8F9FA"}, white)`,
          }}
          {...editProps}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-4xl md:text-6xl font-bold mb-6"
                style={{ color: theme.colors.primary }}
              >
                {headline}
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8">
                {subtitle}
              </p>
              <a
                href={ctaLink}
                className="inline-block px-8 py-4 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {ctaText}
              </a>
            </div>
          </div>
        </section>
      );
  }
}

/**
 * Returns the default layout for a given theme variant
 * @param {string} variant - 'maker', 'trade', or 'venue'
 * @returns {string}
 */
function getDefaultLayout(variant) {
  switch (variant) {
    case "maker":
      return "grid";
    case "trade":
      return "clean";
    case "venue":
      return "cinematic";
    default:
      return "clean";
  }
}

import Link from "next/link";
import Image from "next/image";

/**
 * CentralTexas.com Marketing Homepage - Shopify-inspired Design
 * Main landing page with trust signals, social proof, and professional polish
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="CentralTexas.com"
              width={36}
              height={36}
              className="group-hover:scale-105 transition-transform"
              priority
            />
            <span className="text-lg font-bold text-trade-dark tracking-tight">
              Central<span className="text-[#E8495A]">Texas</span>.com
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/marketplace"
              className="text-sm font-medium text-trade-muted hover:text-trade-dark transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/get-started"
              className="px-5 py-2 bg-[#E8495A] text-white rounded-lg text-sm font-semibold hover:bg-[#d63d4e] shadow-sm hover:shadow-md transition-all"
            >
              Get Your Free Website
            </Link>
          </div>
          <Link
            href="/get-started"
            className="md:hidden px-4 py-2 bg-[#E8495A] text-white rounded-lg text-sm font-semibold hover:bg-[#d63d4e] transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-trade-light via-white to-blue-50 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-trade-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-trade-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 lg:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-trade-success/10 text-trade-success rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Free Forever • No Credit Card Required</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-trade-dark mb-6 leading-tight">
              Stop Paying for Your Website
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-trade-muted mb-6 leading-relaxed max-w-3xl mx-auto">
              Build a beautiful, mobile-perfect site on your own domain —
              completely free. Built for local businesses in the I-35
              corridor.
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm text-trade-muted">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-trade-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-trade-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>Secure & reliable</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-trade-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Join 50+ businesses</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/get-started"
                className="group px-8 py-4 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark shadow-medium hover:shadow-strong transition-all duration-200 inline-flex items-center justify-center gap-2"
              >
                <span>Get Your Free Website</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/marketplace"
                className="px-8 py-4 border-2 border-trade-secondary text-trade-secondary rounded-lg font-semibold hover:bg-trade-secondary hover:text-white transition-all duration-200 inline-flex items-center justify-center"
              >
                Browse Marketplace
              </Link>
            </div>

            <div className="mt-6 text-sm text-trade-muted">
              <Link
                href="/how-it-works"
                className="hover:text-trade-primary underline"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 md:py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-trade-dark mb-4">
              Everything You Need to Succeed Online
            </h2>
            <p className="text-lg md:text-xl text-trade-muted max-w-2xl mx-auto">
              Professional features designed for local businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="group bg-white rounded-xl p-6 md:p-8 border border-gray-200 hover:border-trade-accent hover:shadow-medium transition-all duration-200">
              <div className="w-12 h-12 bg-trade-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-trade-accent/20 transition-colors">
                <svg
                  className="w-6 h-6 text-trade-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-trade-dark mb-3">
                Custom Domain
              </h3>
              <p className="text-trade-muted leading-relaxed">
                Your business, your domain. Professional presence with no
                subdomains or compromises.
              </p>
            </div>

            <div className="group bg-white rounded-xl p-6 md:p-8 border border-gray-200 hover:border-trade-accent hover:shadow-medium transition-all duration-200">
              <div className="w-12 h-12 bg-trade-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-trade-secondary/20 transition-colors">
                <svg
                  className="w-6 h-6 text-trade-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-trade-dark mb-3">
                Mobile Perfect
              </h3>
              <p className="text-trade-muted leading-relaxed">
                Stunning on every device. Your site automatically adapts without
                any coding required.
              </p>
            </div>

            <div className="group bg-white rounded-xl p-6 md:p-8 border border-gray-200 hover:border-trade-accent hover:shadow-medium transition-all duration-200">
              <div className="w-12 h-12 bg-trade-success/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-trade-success/20 transition-colors">
                <svg
                  className="w-6 h-6 text-trade-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-trade-dark mb-3">
                Accept Payments
              </h3>
              <p className="text-trade-muted leading-relaxed">
                Get paid directly with secure checkout. We handle all the
                technical complexity for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Examples Section */}
      <div className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-trade-dark mb-4">
              See the Platform in Action
            </h2>
            <p className="text-lg md:text-xl text-trade-muted max-w-2xl mx-auto">
              Explore demo sites showcasing our multi-tenant capabilities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* CTX Roofing - The Maker */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-shadow">
              <div className="h-48 bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white text-6xl">🏗️</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-trade-dark mb-2">
                  CTX Roofing
                </h3>
                <p className="text-sm text-trade-muted mb-3">
                  New Braunfels, TX
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Demonstrates complex pricing, variants (materials), and custom
                  domain setup
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    The Maker Theme
                  </span>
                </div>
                <a
                  href="//ctx.us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-trade-primary font-semibold hover:text-trade-dark"
                >
                  <span>View Site</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Bluebonnet Plumbing - The Trade */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-6xl">🔧</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-trade-dark mb-2">
                  Bluebonnet Rapid Plumbing
                </h3>
                <p className="text-sm text-trade-muted mb-3">
                  North Austin / Round Rock, TX
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Shows fixed pricing, mobile-first design, and urgent service
                  offerings
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    The Trade Theme
                  </span>
                </div>
                <a
                  href="//bluebonnet-plumbing.centraltexas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-trade-primary font-semibold hover:text-trade-dark"
                >
                  <span>View Site</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* River City Scapes - The Venue */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-6xl">🌿</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-trade-dark mb-2">
                  River City Scapes
                </h3>
                <p className="text-sm text-trade-muted mb-3">
                  San Antonio (Stone Oak), TX
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Features visual portfolios, recurring services, and high-end
                  positioning
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    The Venue Theme
                  </span>
                </div>
                <a
                  href="//river-city-scapes.centraltexas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-trade-primary font-semibold hover:text-trade-dark"
                >
                  <span>View Site</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-trade-primary font-semibold hover:text-trade-dark text-lg"
            >
              <span>Browse All Listings in Marketplace</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-trade-light/50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-trade-dark mb-8">
              Trusted by Local Businesses Across Central Texas
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center gap-1 mb-3 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-trade-muted italic mb-3 text-sm leading-relaxed">
                  "Setup was incredibly easy. Had my catering business online
                  in under 10 minutes."
                </p>
                <p className="text-sm font-semibold text-trade-dark">
                  — Local Caterer, Austin
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center gap-1 mb-3 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-trade-muted italic mb-3 text-sm leading-relaxed">
                  "Finally a website I can actually manage myself. No more
                  calling my nephew for updates!"
                </p>
                <p className="text-sm font-semibold text-trade-dark">
                  — HVAC Services, San Antonio
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center gap-1 mb-3 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-trade-muted italic mb-3 text-sm leading-relaxed">
                  "The payment system just works. My clients can book and pay
                  right from my site."
                </p>
                <p className="text-sm font-semibold text-trade-dark">
                  — Event Planner, Round Rock
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-trade-muted">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-trade-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>99.9% uptime guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-trade-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-trade-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free forever</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-trade-primary to-trade-dark text-white rounded-2xl p-8 md:p-12 text-center shadow-strong relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg md:text-xl mb-2 opacity-90">
                Join 50+ local businesses already building their online
                presence
              </p>
              <p className="text-sm mb-8 opacity-75">
                No credit card required • Setup in 5 minutes • Free forever
              </p>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-trade-primary rounded-lg font-semibold hover:bg-trade-light shadow-medium hover:shadow-strong transition-all duration-200"
              >
                <span>Create Your Free Site</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="CentralTexas.com"
                width={28}
                height={28}
              />
              <span className="font-bold text-trade-dark">
                Central<span className="text-[#E8495A]">Texas</span>.com
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-trade-muted">
              <Link
                href="/marketplace"
                className="hover:text-trade-dark transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/get-started"
                className="hover:text-trade-dark transition-colors"
              >
                Get Started
              </Link>
            </div>
            <p className="text-sm text-trade-muted/75">
              &copy; 2026 CentralTexas.com. All rights reserved.
            </p>
            <p className="text-xs text-trade-muted/60">
              Serving the I-35 Innovation Corridor: Austin ↔ San Antonio
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

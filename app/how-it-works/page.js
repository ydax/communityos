/**
 * How It Works Page - Shopify-inspired design
 * Explains the CentralTexas.com platform and business model
 */
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-trade-light to-white py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-trade-dark mb-4">
              How It Works
            </h1>
            <p className="text-lg md:text-xl text-trade-muted max-w-2xl mx-auto">
              A free website builder for small and medium-sized businesses, powered by a local
              marketplace.
            </p>
          </div>
        </div>
      </div>

      {/* Three Steps */}
      <div className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
              {/* Connecting lines (hidden on mobile) */}
              <div
                className="hidden md:block absolute top-14 left-0 right-0 h-0.5 bg-gradient-to-r from-trade-accent via-trade-secondary to-trade-success opacity-30"
                style={{ top: "4rem", left: "16.67%", right: "16.67%" }}
              ></div>

              <div className="bg-white rounded-xl p-6 md:p-8 text-center border border-gray-200 hover:border-trade-accent hover:shadow-medium transition-all relative">
                <div className="w-16 h-16 bg-gradient-to-br from-trade-accent to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-medium">
                  1
                </div>
                <h3 className="text-lg md:text-xl font-bold text-trade-dark mb-3">
                  Get Your Site
                </h3>
                <p className="text-trade-muted leading-relaxed">
                  We build a professional website for your business on
                  your own custom domain.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 md:p-8 text-center border border-gray-200 hover:border-trade-accent hover:shadow-medium transition-all relative">
                <div className="w-16 h-16 bg-gradient-to-br from-trade-secondary to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-medium">
                  2
                </div>
                <h3 className="text-lg md:text-xl font-bold text-trade-dark mb-3">
                  Manage Listings
                </h3>
                <p className="text-trade-muted leading-relaxed">
                  List your products, services, and events using our simple
                  admin tools.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 md:p-8 text-center border border-gray-200 hover:border-trade-accent hover:shadow-medium transition-all relative">
                <div className="w-16 h-16 bg-gradient-to-br from-trade-success to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-medium">
                  3
                </div>
                <h3 className="text-lg md:text-xl font-bold text-trade-dark mb-3">
                  Get Discovered
                </h3>
                <p className="text-trade-muted leading-relaxed">
                  Your listings automatically appear on CentralTexas.com where
                  local customers search.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Business Model */}
      <div className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-trade-light/50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold text-trade-dark mb-6">
                Why Is It Free?
              </h2>

              <p className="text-trade-muted mb-8 text-lg leading-relaxed">
                Unlike traditional website builders that charge monthly fees,
                we've built a
                <span className="font-semibold text-trade-primary">
                  {" "}
                  SaaS-Enabled Marketplace
                </span>{" "}
                model:
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-trade-accent/10 to-trade-accent/5 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 md:w-7 md:h-7 text-trade-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-2 text-lg">
                      You Get the Tool
                    </h4>
                    <p className="text-trade-muted leading-relaxed">
                      A professional website builder with all the features you
                      need - completely free.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-trade-secondary/10 to-trade-secondary/5 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 md:w-7 md:h-7 text-trade-secondary"
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
                  </div>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-2 text-lg">
                      We Get the Network
                    </h4>
                    <p className="text-trade-muted leading-relaxed">
                      Your business feeds into our local marketplace, helping
                      customers discover trusted local companies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-trade-success/10 to-trade-success/5 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 md:w-7 md:h-7 text-trade-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-2 text-lg">
                      Revenue from Transactions
                    </h4>
                    <p className="text-trade-muted leading-relaxed">
                      We earn a small fee (10%) only when you get paid through
                      the platform. No bookings = no charge.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-trade-accent/10 to-trade-accent/5 border-l-4 border-trade-accent p-6 md:p-8 rounded-lg">
                <p className="text-trade-dark font-semibold text-lg">
                  Bottom line: We succeed when you succeed. Your growth powers
                  the marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold text-trade-dark mb-8">
                What's Included
              </h2>

              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-trade-success flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-1">
                      Your Own Domain
                    </h4>
                    <p className="text-trade-muted text-sm leading-relaxed">
                      Not example.centraltexas.com - we mean YourBusiness.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-trade-success flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-1">
                      Mobile Optimized
                    </h4>
                    <p className="text-trade-muted text-sm leading-relaxed">
                      Looks perfect on phones, tablets, and desktops
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-trade-success flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-1">
                      Platform Listings
                    </h4>
                    <p className="text-trade-muted text-sm leading-relaxed">
                      Showcase your products, services, and events with photos, descriptions, and
                      pricing
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-trade-success flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-1">
                      Online Booking
                    </h4>
                    <p className="text-trade-muted text-sm leading-relaxed">
                      Let customers request quotes, buy products, and book directly
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-trade-success flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-1">
                      Payment Processing
                    </h4>
                    <p className="text-trade-muted text-sm leading-relaxed">
                      Accept credit cards and get paid quickly
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-trade-success flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-trade-dark mb-1">
                      Marketplace Visibility
                    </h4>
                    <p className="text-trade-muted text-sm leading-relaxed">
                      Automatic listing on CentralTexas.com for local discovery
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-trade-light to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-trade-dark mb-6">
              Ready to Get Started?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/get-started"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark shadow-medium hover:shadow-strong transition-all"
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
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 text-trade-primary border-2 border-trade-primary rounded-lg font-semibold hover:bg-trade-primary hover:text-white transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: "How It Works - CentralTexas.com",
  description:
    "Learn how CentralTexas.com provides free websites for small and medium-sized businesses through our SaaS-enabled marketplace model.",
};

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Marketplace Page
 * Displays all active listings from across all sites
 * Demonstrates the "supply aggregation" capability of the platform
 */
export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  // Apply filters when listings or filter values change
  useEffect(() => {
    applyFilters();
  }, [listings, searchTerm, typeFilter, categoryFilter]);

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/marketplace/listings?limit=100");

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error("Error fetching marketplace listings:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((listing) => listing.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (listing) => listing.category === categoryFilter,
      );
    }

    // Search filter (case-insensitive)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.title?.toLowerCase().includes(search) ||
          listing.description?.toLowerCase().includes(search) ||
          listing.siteName?.toLowerCase().includes(search),
      );
    }

    setFilteredListings(filtered);
  };

  // Extract unique categories from listings
  const categories = [
    ...new Set(listings.map((l) => l.category).filter(Boolean)),
  ].sort();

  // Format price display
  const formatPrice = (listing) => {
    const pricing = listing.pricing || {};

    if (pricing.model === "fixed" && pricing.amount) {
      return `$${pricing.amount}`;
    } else if (pricing.model === "hourly" && pricing.basePrice) {
      return `$${pricing.basePrice}/hr`;
    } else if (pricing.model === "quote") {
      return "Request Quote";
    }

    return "Contact for Pricing";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        {/* Nav bar */}
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="CentralTexas.com"
              width={32}
              height={32}
              className="brightness-0 invert group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-bold text-white tracking-tight">
              CentralTexas.com
            </span>
          </Link>
          <Link
            href="/get-started"
            className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Get Your Free Website
          </Link>
        </div>
        <div className="container mx-auto max-w-6xl px-4 pb-16 pt-8">
          <h1 className="text-5xl font-bold mb-4">
            Discover Local Home Services
          </h1>
          <p className="text-xl opacity-90">
            Find trusted service providers across Central Texas
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search services or businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="service">Services</option>
                <option value="good">Goods</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">
              {filteredListings.length}{" "}
              {filteredListings.length === 1 ? "result" : "results"}
            </span>
            {(typeFilter !== "all" ||
              categoryFilter !== "all" ||
              searchTerm) && (
              <>
                <span>·</span>
                <button
                  onClick={() => {
                    setTypeFilter("all");
                    setCategoryFilter("all");
                    setSearchTerm("");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-300" />
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 rounded mb-2" />
                    <div className="h-4 bg-gray-300 rounded mb-2" />
                    <div className="h-4 bg-gray-300 rounded w-2/3 mb-4" />
                    <div className="h-10 bg-gray-300 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Error Loading Listings
              </div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchListings}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && filteredListings.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No listings found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search term
              </p>
              {(typeFilter !== "all" ||
                categoryFilter !== "all" ||
                searchTerm) && (
                <button
                  onClick={() => {
                    setTypeFilter("all");
                    setCategoryFilter("all");
                    setSearchTerm("");
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && filteredListings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Listing Image */}
                  {listing.images && listing.images[0] ? (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-white text-6xl">
                        {listing.type === "service" ? "🔧" : "📦"}
                      </span>
                    </div>
                  )}

                  {/* Listing Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    {listing.category && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">
                        {listing.category}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                      {listing.title}
                    </h3>

                    {/* Description */}
                    {listing.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="text-2xl font-bold text-blue-600 mb-4">
                      {formatPrice(listing)}
                    </div>

                    {/* Business Attribution */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        by:{" "}
                        <span className="font-semibold text-gray-700">
                          {listing.siteName}
                        </span>
                      </div>
                      <Link
                        href={`//${listing.siteDomain}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Site →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            Are you a service provider?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get your own professional website and join our marketplace — it's
            free!
          </p>
          <Link
            href="/get-started"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}

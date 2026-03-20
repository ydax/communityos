"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ListingGrid from "@/components/listings/ListingGrid";
import ListingFilters from "@/components/listings/ListingFilters";
import ListingDialog from "@/components/listings/ListingDialog";

/**
 * Item Library Page
 * Square-style admin interface for managing listings
 */
function ListingsPage() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    // Initialize Firebase on client side only
    const initFirebase = async () => {
      const { getFirestore } = await import("firebase/firestore");
      const { getAuth } = await import("firebase/auth");
      const { initializeApp, getApps } = await import("firebase/app");

      // Initialize Firebase if not already initialized
      if (!getApps().length) {
        initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });
      }

      setDb(getFirestore());
    };

    initFirebase();
  }, []);

  if (!db) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trade-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <ListingsPageContent db={db} />;
}

function ListingsPageContent({ db }) {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [currentSiteId, setCurrentSiteId] = useState(null);
  const [error, setError] = useState(null);

  // TODO: Replace with actual site selection logic
  // For now, hardcoding a site ID for demo purposes
  useEffect(() => {
    // In production, get this from user context or site selector
    setCurrentSiteId("site_demo");
  }, []);

  // Fetch listings
  useEffect(() => {
    if (!currentSiteId || !db) return;

    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use API route instead of direct Firebase call
        const response = await fetch(`/api/listings?siteId=${currentSiteId}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setListings(data.listings || []);
        setFilteredListings(data.listings || []);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to load listings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [currentSiteId, db]);

  // Apply filters
  const handleFilterChange = (filters) => {
    let filtered = [...listings];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchLower) ||
          listing.description?.toLowerCase().includes(searchLower),
      );
    }

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((listing) => listing.type === filters.type);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (listing) => listing.status === filters.status,
      );
    }

    setFilteredListings(filtered);
  };

  // Create or update listing
  const handleSaveListing = async (listingData) => {
    try {
      if (editingListing) {
        // Update existing listing via API
        const response = await fetch(`/api/listings/${editingListing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listingData),
        });

        if (!response.ok) throw new Error("Update failed");

        // Update local state
        setListings((prev) =>
          prev.map((l) =>
            l.id === editingListing.id ? { ...l, ...listingData } : l,
          ),
        );
        setFilteredListings((prev) =>
          prev.map((l) =>
            l.id === editingListing.id ? { ...l, ...listingData } : l,
          ),
        );
      } else {
        // Create new listing via API
        const response = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listingData),
        });

        if (!response.ok) throw new Error("Create failed");

        const result = await response.json();
        const newListing = { id: result.listingId, ...listingData };
        setListings((prev) => [newListing, ...prev]);
        setFilteredListings((prev) => [newListing, ...prev]);
      }

      setIsDialogOpen(false);
      setEditingListing(null);
    } catch (error) {
      console.error("Error saving listing:", error);
      throw error;
    }
  };

  // Handle edit
  const handleEdit = (listing) => {
    setEditingListing(listing);
    setIsDialogOpen(true);
  };

  // Handle archive
  const handleArchive = async (listing) => {
    if (!confirm(`Are you sure you want to archive "${listing.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });

      if (!response.ok) throw new Error("Archive failed");

      // Update local state
      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, status: "archived" } : l,
        ),
      );
      setFilteredListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, status: "archived" } : l,
        ),
      );
    } catch (error) {
      console.error("Error archiving listing:", error);
      alert("Failed to archive listing. Please try again.");
    }
  };

  // Handle duplicate
  const handleDuplicate = async (listing) => {
    try {
      const duplicateData = {
        ...listing,
        title: `${listing.title} (Copy)`,
        status: "draft",
      };
      delete duplicateData.id;

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      });

      if (!response.ok) throw new Error("Duplicate failed");

      const result = await response.json();
      const newListing = { id: result.listingId, ...duplicateData };
      setListings((prev) => [newListing, ...prev]);
      setFilteredListings((prev) => [newListing, ...prev]);
    } catch (error) {
      console.error("Error duplicating listing:", error);
      alert("Failed to duplicate listing. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="text-sm text-gray-600 hover:text-gray-800 mb-1 block"
              >
                ← Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-trade-primary">
                Item Library
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingListing(null);
                  setIsDialogOpen(true);
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Quick Add
              </button>
              <Link
                href="/admin/listings/new"
                className="px-6 py-3 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors"
              >
                + Add Item
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <ListingFilters onFilterChange={handleFilterChange} />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-trade-primary">
              {listings.length}
            </div>
            <div className="text-sm text-gray-600">Total Listings</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-green-600">
              {listings.filter((l) => l.status === "active").length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-blue-600">
              {listings.filter((l) => l.type === "service").length}
            </div>
            <div className="text-sm text-gray-600">Services</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-purple-600">
              {listings.filter((l) => l.type === "good").length}
            </div>
            <div className="text-sm text-gray-600">Goods</div>
          </div>
        </div>

        {/* Listing Grid */}
        <ListingGrid
          listings={filteredListings}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDuplicate={handleDuplicate}
          isLoading={isLoading}
        />
      </main>

      {/* Create/Edit Dialog */}
      <ListingDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingListing(null);
        }}
        onSave={handleSaveListing}
        listing={editingListing}
        siteId={currentSiteId}
      />
    </div>
  );
}

export default ListingsPage;

"use client";

import { useState } from "react";
import ListingGrid from "@/components/listings/ListingGrid";
import ListingFilters from "@/components/listings/ListingFilters";
import ListingDialog from "@/components/listings/ListingDialog";

export default function ListingsClient({ initialListings, ownerId, siteId }) {
  const [listings, setListings] = useState(initialListings || []);
  const [filteredListings, setFilteredListings] = useState(initialListings || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [error, setError] = useState(null);

  // Apply filters
  const handleFilterChange = (filters) => {
    let filtered = [...listings];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchLower) ||
          listing.description?.toLowerCase().includes(searchLower),
      );
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((listing) => listing.type === filters.type);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (listing) => listing.status === filters.status,
      );
    }

    setFilteredListings(filtered);
  };

  // Note: We use the existing API routes but must append ownerId if the API doesn't extract from session cookie,
  // OR we can implement Server Actions for the dashboard specifically to leverage session auth.
  // For now, we will use Server Actions or custom fetch to dashboard-specific mutations.
  // Let's implement handles using direct fetch to existing APIs, but the API might need ownerId update.
  // wait, existing APIs (POST /api/listings) does not set ownerId today. 
  // We should pass ownerId in the listingData payload to create it.
  
  const handleSaveListing = async (listingData) => {
    try {
      if (editingListing) {
        // Update existing listing via API
        const response = await fetch(`/api/listings/${editingListing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // Include ownerId
          body: JSON.stringify({ ...listingData, ownerId }),
        });

        if (!response.ok) throw new Error("Update failed");

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
          body: JSON.stringify({ ...listingData, ownerId }),
        });

        if (!response.ok) throw new Error("Create failed");

        const result = await response.json();
        const newListing = { id: result.listingId, ...listingData, ownerId };
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

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setIsDialogOpen(true);
  };

  const handleArchive = async (listing) => {
    if (!confirm(`Are you sure you want to archive "${listing.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived", ownerId }),
      });

      if (!response.ok) throw new Error("Archive failed");

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

  const handleDuplicate = async (listing) => {
    try {
      const duplicateData = {
        ...listing,
        title: `${listing.title} (Copy)`,
        status: "draft",
        ownerId,
      };
      delete duplicateData.id;
      delete duplicateData.createdAt;
      delete duplicateData.updatedAt;

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

  if (!siteId) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900">No Site Found</h2>
        <p className="mt-2 text-gray-600">You need to set up a site before you can manage listings.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-trade-primary">Item Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your services and goods catalog
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingListing(null);
              setIsDialogOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-trade-primary hover:bg-trade-dark"
          >
            + Add Item
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <ListingFilters onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-trade-primary">{listings.length}</div>
          <div className="text-sm text-gray-600">Total Listings</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">
            {listings.filter((l) => l.status === "active").length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">
            {listings.filter((l) => l.type === "service").length}
          </div>
          <div className="text-sm text-gray-600">Services</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">
            {listings.filter((l) => l.type === "good").length}
          </div>
          <div className="text-sm text-gray-600">Goods</div>
        </div>
      </div>

      <ListingGrid
        listings={filteredListings}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onDuplicate={handleDuplicate}
        isLoading={false}
      />

      <ListingDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingListing(null);
        }}
        onSave={handleSaveListing}
        listing={editingListing}
        siteId={siteId}
      />
    </>
  );
}

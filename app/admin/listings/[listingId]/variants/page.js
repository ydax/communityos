"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import VariantTable from "@/components/listings/VariantTable";
import VariantForm from "@/components/listings/VariantForm";

/**
 * Variants Page
 * Manage variants for a specific listing
 */
export default function VariantsPage() {
  const params = useParams();
  const listingId = params.listingId;

  const [db, setDb] = useState(null);
  const [listing, setListing] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [error, setError] = useState(null);

  // Initialize Firebase on client side
  useEffect(() => {
    const initFirebase = async () => {
      const { getFirestore } = await import("firebase/firestore");
      const { initializeApp, getApps } = await import("firebase/app");

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

  // Fetch listing and variants
  useEffect(() => {
    if (!db || !listingId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch via API routes
        const listingRes = await fetch(`/api/listings/${listingId}`);
        if (!listingRes.ok) throw new Error("Failed to fetch listing");
        const listingData = await listingRes.json();

        if (!listingData.listing) {
          setError("Listing not found");
          return;
        }
        setListing(listingData.listing);

        // Fetch variants (using Firebase client for now)
        const { listVariantsByListing } =
          await import("@/lib/dbServices/listingsService");
        const variantsData = await listVariantsByListing(db, listingId);
        setVariants(variantsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [listingId, db]);

  // Save variant (create or update)
  const handleSaveVariant = async (variantData) => {
    try {
      const { createVariant, updateVariant } =
        await import("@/lib/dbServices/listingsService");
      const { recordInventoryMovement } =
        await import("@/lib/dbServices/inventoryService");

      if (editingVariant) {
        // Update existing variant
        await updateVariant(db, editingVariant.id, variantData);

        setVariants((prev) =>
          prev.map((v) =>
            v.id === editingVariant.id ? { ...v, ...variantData } : v,
          ),
        );
      } else {
        // Create new variant
        const newVariantId = await createVariant(db, variantData);

        const newVariant = { id: newVariantId, ...variantData };
        setVariants((prev) => [...prev, newVariant]);

        // Record initial inventory if quantity > 0
        if (variantData.inventory.quantity > 0) {
          await recordInventoryMovement(db, {
            variantId: newVariantId,
            listingId: variantData.listingId,
            siteId: variantData.siteId,
            type: "restock",
            quantity: variantData.inventory.quantity,
            reason: "Initial stock",
            balanceAfter: variantData.inventory.quantity,
            performedBy: "admin",
            metadata: {
              createdAt: new Date(),
              source: "admin_ui",
            },
          });
        }
      }

      setIsFormOpen(false);
      setEditingVariant(null);
    } catch (error) {
      console.error("Error saving variant:", error);
      throw error;
    }
  };

  // Edit variant
  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setIsFormOpen(true);
  };

  // Delete variant
  const handleDelete = async (variantId) => {
    try {
      const { deleteVariant } =
        await import("@/lib/dbServices/listingsService");
      await deleteVariant(db, variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
    } catch (error) {
      console.error("Error deleting variant:", error);
      alert("Failed to delete variant. Please try again.");
    }
  };

  // Adjust inventory
  const handleInventoryAdjust = async (variantId, adjustment, reason) => {
    try {
      const { updateVariantInventory } =
        await import("@/lib/dbServices/listingsService");
      const { recordInventoryMovement } =
        await import("@/lib/dbServices/inventoryService");

      const variant = variants.find((v) => v.id === variantId);
      if (!variant) return;

      const newQuantity = variant.inventory.quantity + adjustment;

      // Update variant inventory
      await updateVariantInventory(db, variantId, newQuantity);

      // Record inventory movement
      await recordInventoryMovement(db, {
        variantId: variantId,
        listingId: variant.listingId,
        siteId: variant.siteId,
        type: adjustment > 0 ? "restock" : "adjustment",
        quantity: adjustment,
        reason: reason,
        balanceAfter: newQuantity,
        performedBy: "admin",
        metadata: {
          createdAt: new Date(),
          source: "admin_ui",
        },
      });

      // Update local state
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? { ...v, inventory: { ...v.inventory, quantity: newQuantity } }
            : v,
        ),
      );
    } catch (error) {
      console.error("Error adjusting inventory:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trade-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin/listings"
            className="text-trade-primary hover:text-trade-dark font-semibold"
          >
            ← Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin/listings"
                className="text-sm text-gray-600 hover:text-gray-800 mb-1 block"
              >
                ← Back to Listings
              </Link>
              <h1 className="text-2xl font-bold text-trade-primary">
                Manage Variants
              </h1>
              {listing && <p className="text-gray-600 mt-1">{listing.title}</p>}
            </div>
            <button
              onClick={() => {
                setEditingVariant(null);
                setIsFormOpen(true);
              }}
              className="px-6 py-3 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors"
            >
              + Add Variant
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-trade-primary">
              {variants.length}
            </div>
            <div className="text-sm text-gray-600">Total Variants</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-green-600">
              {variants.filter((v) => v.status === "active").length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-blue-600">
              {variants.reduce(
                (sum, v) => sum + (v.inventory?.quantity || 0),
                0,
              )}
            </div>
            <div className="text-sm text-gray-600">Total Inventory</div>
          </div>
        </div>

        {/* Variants Table */}
        <VariantTable
          variants={variants}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onInventoryAdjust={handleInventoryAdjust}
          isLoading={false}
        />
      </main>

      {/* Variant Form Dialog */}
      {listing && (
        <VariantForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingVariant(null);
          }}
          onSave={handleSaveVariant}
          variant={editingVariant}
          listing={listing}
        />
      )}
    </div>
  );
}

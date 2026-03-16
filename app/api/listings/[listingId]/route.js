import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import {
  getListingById,
  updateListing,
  deleteListing,
} from "@/lib/dbServices/listingsService";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

/**
 * GET /api/listings/[listingId]
 * Get a single listing by ID
 */
export async function GET(request, { params }) {
  try {
    const { listingId } = params;
    const db = getFirestore();

    const listing = await getListingById(db, listingId);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error) {
    console.error("[GET /api/listings/[listingId]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/listings/[listingId]
 * Update a listing
 */
export async function PATCH(request, { params }) {
  try {
    const { listingId } = params;
    const body = await request.json();
    const db = getFirestore();

    await updateListing(db, listingId, body);

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully",
    });
  } catch (error) {
    console.error("[PATCH /api/listings/[listingId]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/listings/[listingId]
 * Delete a listing
 */
export async function DELETE(request, { params }) {
  try {
    const { listingId } = params;
    const db = getFirestore();

    await deleteListing(db, listingId);

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/listings/[listingId]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

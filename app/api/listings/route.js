import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import {
  createListing,
  updateListing,
  deleteListing,
  listListings,
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
 * GET /api/listings
 * List all listings with optional filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const db = getFirestore();

    const filters = {};
    if (siteId) filters.siteId = siteId;
    if (type) filters.type = type;
    if (status) filters.status = status;

    const result = await listListings(db, filters);

    return NextResponse.json({
      success: true,
      listings: result.items,
      total: result.total,
    });
  } catch (error) {
    console.error("[GET /api/listings] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/listings
 * Create a new listing
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const db = getFirestore();

    const listingId = await createListing(db, body);

    return NextResponse.json({
      success: true,
      listingId,
      message: "Listing created successfully",
    });
  } catch (error) {
    console.error("[POST /api/listings] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

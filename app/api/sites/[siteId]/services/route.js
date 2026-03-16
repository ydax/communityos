import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { listListings } from "@/lib/dbServices/listingsService";

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
 * GET /api/sites/[siteId]/services
 * Get all active services for a site
 */
export async function GET(request, { params }) {
  try {
    const { siteId } = params;
    const db = getFirestore();

    const result = await listListings(db, {
      siteId,
      type: "service",
      status: "active",
    });

    return NextResponse.json({
      success: true,
      services: result.items,
      total: result.total,
    });
  } catch (error) {
    console.error("[GET /api/sites/[siteId]/services] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

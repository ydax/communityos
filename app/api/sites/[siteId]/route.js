import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getSiteById, updateSite } from "@/lib/dbServices/sitesService";

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
 * GET /api/sites/[siteId]
 * Get a single site by ID
 */
export async function GET(request, { params }) {
  try {
    const { siteId } = params;
    const db = getFirestore();

    const site = await getSiteById(db, siteId);

    if (!site) {
      return NextResponse.json(
        { success: false, error: "Site not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      site,
    });
  } catch (error) {
    console.error("[GET /api/sites/[siteId]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/sites/[siteId]
 * Update a site
 */
export async function PATCH(request, { params }) {
  try {
    const { siteId } = params;
    const body = await request.json();
    const db = getFirestore();

    await updateSite(db, siteId, body);

    return NextResponse.json({
      success: true,
      message: "Site updated successfully",
    });
  } catch (error) {
    console.error("[PATCH /api/sites/[siteId]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

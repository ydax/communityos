import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSiteById, updateSite } from "@/lib/dbServices/sitesService";

/**
 * GET /api/sites/[siteId]
 * Get a single site by ID
 */
export async function GET(request, { params }) {
  try {
    const { siteId } = params;
    
    // adminDb is already initialized from lib/firebase/admin
    const db = adminDb;

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
    const db = adminDb;

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

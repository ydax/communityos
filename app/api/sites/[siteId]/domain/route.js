import { NextResponse } from "next/server";
import { getSiteById, updateSite } from "@/lib/dbServices/sitesService";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request, { params }) {
  try {
    const { siteId } = params;
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 },
      );
    }

    const { VERCEL_API_TOKEN, VERCEL_PROJECT_ID } = process.env;
    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json(
        { error: "Server configuration error. Missing Vercel API tokens." },
        { status: 500 },
      );
    }

    // 1. Verify Site Exists
    const site = await getSiteById(adminDb, siteId);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // 2. Add domain to Vercel Project
    console.log(
      `[POST /domain] Adding domain ${domain} to Vercel Project ${VERCEL_PROJECT_ID}`,
    );
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      },
    );

    const vercelData = await vercelRes.json();
    if (!vercelRes.ok) {
      return NextResponse.json(
        {
          error: vercelData.error?.message || "Failed to add domain to Vercel",
          details: vercelData,
        },
        { status: vercelRes.status },
      );
    }

    // 3. Update Firestore site customDomain
    console.log(
      `[POST /domain] Updating Firestore site ${siteId} with customDomain ${domain}`,
    );
    await updateSite(adminDb, siteId, {
      customDomain: domain,
    });

    return NextResponse.json({ success: true, domain, vercel: vercelData });
  } catch (error) {
    console.error("[POST /api/sites/[siteId]/domain] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { siteId } = params;

    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "Domain query param is required" },
        { status: 400 },
      );
    }

    const { VERCEL_API_TOKEN, VERCEL_PROJECT_ID } = process.env;
    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json(
        { error: "Server configuration error. Missing tokens." },
        { status: 500 },
      );
    }

    // 1. Remove domain from Vercel
    console.log(`[DELETE /domain] Removing domain ${domain} from Vercel`);
    const vercelRes = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        },
      },
    );

    const vercelData = await vercelRes.json();
    // Accept 404 (already deleted) as success
    if (!vercelRes.ok && vercelRes.status !== 404) {
      return NextResponse.json(
        {
          error:
            vercelData.error?.message || "Failed to remove domain from Vercel",
          details: vercelData,
        },
        { status: vercelRes.status },
      );
    }

    // 2. Update Firestore site to remove customDomain
    const site = await getSiteById(adminDb, siteId);
    if (site && site.customDomain === domain) {
      console.log(
        `[DELETE /domain] Removing customDomain from Firestore site ${siteId}`,
      );
      await updateSite(adminDb, siteId, {
        customDomain: null,
      });
    }

    return NextResponse.json({ success: true, removed: domain });
  } catch (error) {
    console.error("[DELETE /api/sites/[siteId]/domain] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 },
    );
  }
}

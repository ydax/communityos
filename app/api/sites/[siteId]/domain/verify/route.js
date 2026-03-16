import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
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
        { error: "Server configuration error. Missing Vercel API tokens." },
        { status: 500 },
      );
    }

    console.log(`[GET /domain/verify] Checking configuration for ${domain}`);

    // 1. Get DNS configuration requirement from Vercel
    const configRes = await fetch(
      `https://api.vercel.com/v6/domains/${domain}/config?projectId=${VERCEL_PROJECT_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        },
      },
    );

    const configData = await configRes.json();
    if (!configRes.ok) {
      return NextResponse.json(
        {
          error: configData.error?.message || "Failed to fetch domain config",
          details: configData,
        },
        { status: configRes.status },
      );
    }

    // 2. Refresh & Fetch Vercel project domain status (to see if verified)
    // Invoking the verify endpoint immediately to trigger Vercel to check
    await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        },
      },
    );

    const domainRes = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        },
      },
    );

    const domainData = await domainRes.json();

    return NextResponse.json({
      success: true,
      domain,
      verified: domainData.verified || false,
      misconfigured: configData.misconfigured || false,
      status: domainData.status || "unknown",
      config: configData,
      recordInfo: domainData,
    });
  } catch (error) {
    console.error("[GET /api/sites/[siteId]/domain/verify] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 },
    );
  }
}

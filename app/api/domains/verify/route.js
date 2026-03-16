import { NextResponse } from "next/server";

/**
 * POST /api/domains/verify
 *
 * Verifies that a custom domain has the correct DNS CNAME record
 * pointing to cname.vercel-dns.com, and updates the site document.
 *
 * Request body:
 *   - siteId (string, required) - Site to update
 *   - domain (string, required) - Custom domain to verify
 *
 * Response:
 *   - verified (boolean)
 *   - message (string)
 */
export async function POST(request) {
  try {
    const { siteId, domain } = await request.json();

    if (!siteId || !domain) {
      return NextResponse.json(
        { verified: false, message: "siteId and domain are required" },
        { status: 400 },
      );
    }

    // Clean the domain
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .trim();

    // Verify DNS via lookup
    let dnsVerified = false;
    try {
      // Use DNS over HTTPS (Cloudflare) for serverless compatibility
      const dnsRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=CNAME`,
        { headers: { Accept: "application/dns-json" } },
      );

      if (dnsRes.ok) {
        const dnsData = await dnsRes.json();
        const answers = dnsData.Answer || [];
        dnsVerified = answers.some(
          (a) => a.type === 5 && a.data?.includes("vercel-dns.com"),
        );
      }
    } catch (dnsErr) {
      console.warn("[domain-verify] DNS lookup failed:", dnsErr.message);
    }

    if (!dnsVerified) {
      return NextResponse.json({
        verified: false,
        message: `DNS not configured. Please add a CNAME record pointing ${cleanDomain} to cname.vercel-dns.com. Changes can take up to 48 hours to propagate.`,
      });
    }

    // Update site document with new domain
    try {
      const { getFirestore } = require("firebase-admin/firestore");
      const db = getFirestore();

      await db.collection("sites").doc(siteId).update({
        domain: cleanDomain,
        "metadata.updatedAt": new Date(),
      });
    } catch (dbErr) {
      console.error("[domain-verify] Failed to update site:", dbErr);
      return NextResponse.json(
        {
          verified: false,
          message: "DNS verified but failed to update site record.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      verified: true,
      message: `Domain ${cleanDomain} verified and configured! SSL will be provisioned automatically.`,
    });
  } catch (err) {
    console.error("[domain-verify] Unexpected error:", err);
    return NextResponse.json(
      { verified: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

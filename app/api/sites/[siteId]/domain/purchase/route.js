import { NextResponse } from "next/server";
import {
  checkDomainAvailability,
  purchaseDomain,
  setVercelNameservers,
} from "@/lib/apiServices/porkbunService";
import { adminDb } from "@/lib/firebase/admin";
import { getSiteById, updateSite } from "@/lib/dbServices/sitesService";

/**
 * POST /api/sites/[siteId]/domain/purchase
 *
 * Executes the full "Buy it For Me" pipeline:
 * 1. Re-checks domain availability + price (prevents stale UI state)
 * 2. Purchases the domain via Porkbun
 * 3. Points Porkbun nameservers → Vercel
 * 4. Adds domain to Vercel project via CLI (spawned process)
 * 5. Updates Firestore site document
 *
 * Body: { domain: "davidsplumbing.com" }
 */
export async function POST(request, { params }) {
  const { siteId } = params;

  let domain;
  try {
    const body = await request.json();
    domain = body.domain?.trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!domain || !domain.includes(".")) {
    return NextResponse.json(
      { error: "A valid domain is required, e.g. davidsplumbing.com" },
      { status: 400 },
    );
  }

  // ── 1. Verify site exists ──────────────────────────────
  const site = await getSiteById(adminDb, siteId);
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // ── 2. Check availability + get exact price ────────────
  let availability;
  try {
    availability = await checkDomainAvailability(domain);
  } catch (err) {
    return NextResponse.json(
      { error: `Availability check failed: ${err.message}` },
      { status: 502 },
    );
  }

  if (!availability.available) {
    return NextResponse.json(
      {
        error: `${domain} is no longer available.`,
        available: false,
      },
      { status: 409 },
    );
  }

  // ── 3. Purchase domain ─────────────────────────────────
  let purchase;
  try {
    purchase = await purchaseDomain(domain, availability.price);
  } catch (err) {
    return NextResponse.json(
      { error: `Purchase failed: ${err.message}` },
      { status: 502 },
    );
  }

  // ── 4. Point DNS → Vercel ──────────────────────────────
  try {
    await setVercelNameservers(domain);
  } catch (err) {
    // Non-fatal: domain is bought, just NS update failed.
    // Log and continue — the user can point them manually.
    console.error("[purchase] NS update failed:", err.message);
  }

  // ── 5. Add domain to Vercel project via Vercel REST API ─
  const { VERCEL_API_TOKEN, VERCEL_PROJECT_ID } = process.env;
  if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
    try {
      await fetch(
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
    } catch (err) {
      console.error("[purchase] Vercel domain add failed:", err.message);
      // Non-fatal — Vercel CLI fallback can be run manually
    }
  }

  // ── 6. Update Firestore ────────────────────────────────
  await updateSite(adminDb, siteId, {
    customDomain: domain,
    customDomainStatus: "pending_dns",
    customDomainAddedAt: new Date(),
    customDomainSource: "purchased", // vs "manual"
  });

  return NextResponse.json({
    success: true,
    domain: purchase.domain,
    orderId: purchase.orderId,
    costUsd: `$${(purchase.cost / 100).toFixed(2)}`,
    remainingBalanceUsd: purchase.balanceUsd,
    message: `${domain} purchased and linked! DNS is propagating — this typically takes 5–30 minutes.`,
  });
}

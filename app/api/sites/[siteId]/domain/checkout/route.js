import { NextResponse } from "next/server";
import { checkDomainAvailability } from "@/lib/apiServices/porkbunService";
import { adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * POST /api/sites/[siteId]/domain/checkout
 *
 * 1. Verifies the domain is available via Porkbun.
 * 2. Creates a Stripe Checkout Session for the user to purchase it.
 * 3. Returns the Checkout URL.
 */
export async function POST(request, { params }) {
  const { siteId } = params;

  let domain;
  let successUrl;
  let cancelUrl;
  try {
    const body = await request.json();
    domain = body.domain?.trim().toLowerCase();
    successUrl = body.successUrl || "https://centraltexas.com/admin";
    cancelUrl = body.cancelUrl || "https://centraltexas.com/admin";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!domain || !domain.includes(".")) {
    return NextResponse.json(
      { error: "A valid domain is required, e.g. davidsplumbing.com" },
      { status: 400 },
    );
  }

  // 1. Verify site exists
  const siteDoc = await adminDb.collection("sites").doc(siteId).get();
  if (!siteDoc.exists) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // 2. Check availability + get exact price
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

  // Calculate price (Porkbun cost + our margin)
  // Porkbun gives us price as a string, e.g., "11.08"
  const costPennies = Math.round(parseFloat(availability.price) * 100);
  const checkoutPennies = Math.max(1500, costPennies + 500); // Minimum $15, or at least $5 margin

  // 3. Create Stripe Checkout Session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Domain Registration: ${domain}`,
              description: "1-year custom domain registration and automatic configuration.",
            },
            unit_amount: checkoutPennies,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "domain_purchase",
        siteId,
        domain,
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      domain,
      priceUsd: (checkoutPennies / 100).toFixed(2),
    });
  } catch (err) {
    console.error("[checkout] Stripe session creation failed:", err.message);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

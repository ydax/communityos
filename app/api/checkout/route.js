import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";
import { getListingById } from "@/lib/dbServices/listingsService";
import { createOrder, linkPaymentIntent } from "@/lib/dbServices/ordersService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * POST /api/checkout
 * Creates a Stripe Checkout Session for a listing with destination charges (10% platform fee)
 */
export async function POST(request) {
  try {
    const { listingId, siteId, quantity = 1, buyerInfo = {}, variantId = null } = await request.json();

    if (!listingId || !siteId) {
      return NextResponse.json({ error: "Missing listingId or siteId" }, { status: 400 });
    }

    // 1. Fetch site and listing
    const siteRef = adminDb.collection("sites").doc(siteId);
    const siteDoc = await siteRef.get();

    if (!siteDoc.exists) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const site = siteDoc.data();
    if (!site.stripeAccountId || site.stripeAccountStatus !== "active") {
      // For demo, we might allow bypassing if in test mode, but typically we block
      return NextResponse.json({ error: "Site cannot accept payments yet" }, { status: 400 });
    }

    const listing = await getListingById(adminDb, listingId);
    if (!listing || listing.status !== "active") {
      return NextResponse.json({ error: "Listing unavailable" }, { status: 404 });
    }

    // 2. Determine price
    let unitPriceCents = 0;
    let title = listing.title;

    if (listing.type === "good" && variantId) {
      const variantDoc = await adminDb.collection("variants").doc(variantId).get();
      if (!variantDoc.exists) {
         return NextResponse.json({ error: "Variant not found" }, { status: 404 });
      }
      const variant = variantDoc.data();
      unitPriceCents = Math.round(variant.price * 100);
      title = `${listing.title} - ${variant.name}`;
      
      // Basic inventory check
      if ((variant.inventory?.quantity || 0) < quantity) {
         return NextResponse.json({ error: "Insufficient inventory" }, { status: 400 });
      }
    } else {
      unitPriceCents = Math.round((listing.pricing?.basePrice || 0) * 100);
    }

    if (unitPriceCents <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const totalAmount = unitPriceCents * quantity;
    const platformFee = Math.floor(totalAmount * 0.1); // 10% fee

    // 3. Create Order locally (Pending)
    const orderId = await createOrder(adminDb, {
      siteId,
      listingId,
      variantId,
      buyerInfo,
      amount: totalAmount,
      platformFee,
    });

    // 4. Create Stripe Checkout Session
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title,
              description: listing.description || undefined,
            },
            unit_amount: unitPriceCents,
          },
          quantity,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: site.stripeAccountId,
        },
        metadata: {
          orderId,
          siteId,
        },
      },
      client_reference_id: orderId,
      metadata: {
        orderId,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/checkout/canceled?order_id=${orderId}`,
    });

    // Save session.payment_intent to order when we have it from webhook, 
    // but the session provides it early if needed. We mainly rely on client_reference_id.

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

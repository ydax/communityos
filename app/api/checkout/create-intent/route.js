import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";
import { getListingById } from "@/lib/dbServices/listingsService";
import { createOrder } from "@/lib/dbServices/ordersService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * POST /api/checkout/create-intent
 *
 * Creates a Stripe PaymentIntent and returns the client_secret for the
 * native Payment Element. Replaces the old Stripe Hosted Checkout flow.
 *
 * Supports two charge routing modes based on checkout context:
 *
 * 1. **Standalone (Direct Charges):** Buyer is on `joesfencing.com`.
 *    PaymentIntent is created on Joe's Connect account. Joe is the
 *    Merchant of Record. CivicOS takes `application_fee_amount`.
 *
 * 2. **Marketplace (Separate Charges + Transfers):** Buyer is on
 *    `centraltexas.com/marketplace` with items from multiple vendors.
 *    PaymentIntent is created on the platform account with a
 *    `transfer_group`. Post-payment webhook executes vendor transfers.
 *
 * REQUEST: {
 *   items: [{ listingId, siteId, variantId?, quantity }],
 *   context: 'standalone' | 'marketplace',
 *   buyerEmail?: string,
 *   buyerUserId?: string
 * }
 *
 * RESPONSE: {
 *   clientSecret: string,
 *   orderId: string,
 *   stripeAccountId?: string   // For standalone — client needs this for loadStripe()
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, context = "standalone", buyerEmail, buyerUserId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // ─── Resolve items and calculate totals ──────────────────────────
    const resolvedItems = [];
    let totalAmountCents = 0;

    // Group items by siteId for vendor validation
    const siteIds = [...new Set(items.map((i) => i.siteId))];

    // For standalone context, all items must belong to one vendor
    if (context === "standalone" && siteIds.length > 1) {
      return NextResponse.json(
        { error: "Standalone checkout supports only one vendor" },
        { status: 400 }
      );
    }

    // Fetch all referenced sites
    const sitesMap = {};
    for (const siteId of siteIds) {
      const siteDoc = await adminDb.collection("sites").doc(siteId).get();
      if (!siteDoc.exists) {
        return NextResponse.json(
          { error: `Site ${siteId} not found` },
          { status: 404 }
        );
      }
      sitesMap[siteId] = { id: siteDoc.id, ...siteDoc.data() };
    }

    // Validate Stripe readiness and resolve prices
    for (const item of items) {
      const site = sitesMap[item.siteId];
      if (context === "standalone" && (!site.stripeAccountId || site.stripeAccountStatus !== "active")) {
        return NextResponse.json(
          { error: "This store cannot accept payments yet" },
          { status: 400 }
        );
      }

      const listing = await getListingById(adminDb, item.listingId);
      if (!listing || listing.status !== "active") {
        return NextResponse.json(
          { error: `Listing "${item.listingId}" is unavailable` },
          { status: 404 }
        );
      }

      let unitPriceCents = 0;
      let title = listing.title;

      if (listing.type === "good" && item.variantId) {
        const variantDoc = await adminDb.collection("variants").doc(item.variantId).get();
        if (!variantDoc.exists) {
          return NextResponse.json({ error: "Variant not found" }, { status: 404 });
        }
        const variant = variantDoc.data();
        unitPriceCents = Math.round(variant.price * 100);
        title = `${listing.title} - ${variant.name}`;

        if ((variant.inventory?.quantity || 0) < (item.quantity || 1)) {
          return NextResponse.json({ error: `Insufficient inventory for ${title}` }, { status: 400 });
        }
      } else {
        unitPriceCents = Math.round((listing.pricing?.basePrice || 0) * 100);
      }

      if (unitPriceCents <= 0) {
        return NextResponse.json(
          { error: `Invalid price for ${title}` },
          { status: 400 }
        );
      }

      const quantity = item.quantity || 1;
      const lineTotal = unitPriceCents * quantity;
      totalAmountCents += lineTotal;

      resolvedItems.push({
        listingId: item.listingId,
        siteId: item.siteId,
        variantId: item.variantId || null,
        title,
        unitPriceCents,
        quantity,
        lineTotal,
        vendorStripeAccountId: site.stripeAccountId,
      });
    }

    const platformFee = Math.floor(totalAmountCents * 0.1); // 10% platform fee

    // ─── Create order in Firestore ────────────────────────────────────
    const orderId = await createOrder(adminDb, {
      siteId: context === "standalone" ? siteIds[0] : "marketplace",
      listingId: resolvedItems[0].listingId, // Primary listing
      amount: totalAmountCents,
      platformFee,
      buyerInfo: {
        email: buyerEmail || null,
        userId: buyerUserId || null,
      },
      checkoutContext: context,
      lineItems: resolvedItems,
    });

    // ─── Create PaymentIntent ─────────────────────────────────────────

    if (context === "standalone") {
      // ═══ STANDALONE: Direct Charges on vendor's Connect account ═══
      const vendorSite = sitesMap[siteIds[0]];
      const vendorStripeId = vendorSite.stripeAccountId;

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: totalAmountCents,
          currency: "usd",
          application_fee_amount: platformFee,
          metadata: {
            orderId,
            siteId: siteIds[0],
            context: "standalone",
          },
          automatic_payment_methods: { enabled: true },
        },
        {
          stripeAccount: vendorStripeId,
        }
      );

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        orderId,
        stripeAccountId: vendorStripeId,
      });

    } else {
      // ═══ MARKETPLACE: Separate Charges + Transfers on platform ═══
      const transferGroup = `ORDER-${orderId}`;

      // Build transfer metadata for the webhook to execute later
      const vendorSplits = {};
      for (const item of resolvedItems) {
        const vendorShare = item.lineTotal - Math.floor(item.lineTotal * 0.1);
        if (vendorSplits[item.vendorStripeAccountId]) {
          vendorSplits[item.vendorStripeAccountId] += vendorShare;
        } else {
          vendorSplits[item.vendorStripeAccountId] = vendorShare;
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: "usd",
        transfer_group: transferGroup,
        metadata: {
          orderId,
          context: "marketplace",
          vendorSplits: JSON.stringify(vendorSplits),
        },
        automatic_payment_methods: { enabled: true },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        orderId,
        // No stripeAccountId — use platform account
      });
    }
  } catch (error) {
    console.error("[checkout/create-intent] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

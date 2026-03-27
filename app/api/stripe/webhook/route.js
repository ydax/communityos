import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/stripe/webhook
 * Listens for Stripe events like account.updated
 */
export async function POST(request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated":
        const account = event.data.object;
        await handleAccountUpdated(account);
        break;
      case "checkout.session.completed":
        const session = event.data.object;
        if (session.metadata?.type === "domain_purchase") {
          await handleDomainPurchase(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      // Handle other events as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handleAccountUpdated(account) {
  const stripeAccountId = account.id;

  // Verify the account metadata indicates it's ours, and fetch site id
  const siteId = account.metadata?.siteId;

  if (!siteId) {
    // Attempt to lookup via query
    const sitesSnapshot = await adminDb
      .collection("sites")
      .where("stripeAccountId", "==", stripeAccountId)
      .limit(1)
      .get();
      
    if (sitesSnapshot.empty) {
      console.warn(`Could not find site associated with account ${stripeAccountId}`);
      return;
    }
    
    const siteDoc = sitesSnapshot.docs[0];
    await updateSiteStatus(siteDoc, account);
  } else {
    // We have the site ID directly from metadata
    const siteRef = adminDb.collection("sites").doc(siteId);
    const siteDoc = await siteRef.get();
    
    if (!siteDoc.exists) {
       console.warn(`Site ${siteId} does not exist`);
       return;
    }
    await updateSiteStatus(siteDoc, account);
  }
}

async function updateSiteStatus(siteDoc, account) {
  const isDetailsSubmitted = account.details_submitted;
  const isChargesEnabled = account.charges_enabled;
  const isPayoutsEnabled = account.payouts_enabled;

  let status = "pending";
  if (isChargesEnabled && isPayoutsEnabled) {
    status = "active";
  } else if (isDetailsSubmitted) {
    status = "restricted"; // Or pending verification
  }

  await siteDoc.ref.update({
    stripeAccountStatus: status,
    stripeDetailsSubmitted: isDetailsSubmitted,
    stripeChargesEnabled: isChargesEnabled,
    stripePayoutsEnabled: isPayoutsEnabled,
    updatedAt: new Date(),
  });
  
  console.log(`Updated site ${siteDoc.id} Stripe status to ${status}`);
}

import { updateOrderStatus, linkPaymentIntent, getOrderById } from "@/lib/dbServices/ordersService";
import { FieldValue } from "firebase-admin/firestore";
import { checkDomainAvailability, purchaseDomain, setVercelNameservers } from "@/lib/apiServices/porkbunService";

async function handleDomainPurchase(session) {
  const { siteId, domain } = session.metadata || {};
  if (!siteId || !domain) {
    console.error("Missing siteId or domain in domain_purchase session metadata");
    return;
  }

  try {
    // 1. Re-check availability and get exact cost
    const availability = await checkDomainAvailability(domain);
    if (!availability.available) {
      throw new Error(`Domain ${domain} is no longer available.`);
    }

    // 2. Buy domain from Porkbun
    const purchase = await purchaseDomain(domain, availability.price);
    console.log(`Successfully purchased ${domain}. Porkbun Order: ${purchase.orderId}`);

    // 3. Set Vercel DNS
    try {
      await setVercelNameservers(domain);
    } catch (nsErr) {
      console.error(`[purchase] NS update failed for ${domain}:`, nsErr.message);
    }

    // 4. Add domain to Vercel project via Vercel REST API
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
        console.error(`[purchase] Vercel domain add failed for ${domain}:`, err.message);
      }
    }

    // 5. Update Firestore site document
    await adminDb.collection("sites").doc(siteId).update({
      customDomain: domain,
      customDomainStatus: "pending_dns",
      customDomainAddedAt: new Date(),
      customDomainSource: "purchased_via_stripe",
      updatedAt: new Date(),
    });

  } catch (err) {
    console.error(`Failed to provision domain ${domain}. Issuing refund.`, err.message);

    // Issue refund
    if (session.payment_intent) {
      try {
        await stripe.refunds.create({
          payment_intent: session.payment_intent,
        });
        console.log(`Refunded payment intent ${session.payment_intent}`);
      } catch (refundErr) {
        console.error("Failed to issue refund:", refundErr.message);
      }
    }

    // Mark as failed in Firestore
    await adminDb.collection("sites").doc(siteId).update({
      customDomainStatus: "failed_refunded",
      customDomainLastError: err.message,
      updatedAt: new Date(),
    });
  }
}

async function handleCheckoutCompleted(session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) {
    console.warn("No orderId found in checkout session metadata");
    return;
  }

  // Update order status to completed
  try {
    await updateOrderStatus(adminDb, orderId, "completed");
    
    // Also link the payment intent if available
    if (session.payment_intent) {
      await linkPaymentIntent(adminDb, orderId, session.payment_intent);
    }

    // Increment Analytics
    const order = await getOrderById(adminDb, orderId);
    if (order && order.siteId) {
      const analyticsRef = adminDb.collection("analytics").doc(order.siteId);
      await analyticsRef.set({
        totalRevenue: FieldValue.increment(order.amount),
        totalOrders: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    
    console.log(`Successfully completed order ${orderId} via Stripe checkout`);
  } catch (error) {
    console.error(`Failed to process checkout completion for order ${orderId}:`, error);
  }
}

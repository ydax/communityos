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
        await handleCheckoutCompleted(session);
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

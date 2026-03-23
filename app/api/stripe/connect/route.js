import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * GET /api/stripe/connect
 * Generates an onboarding link for Stripe Connect Express accounts.
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const ownerId = decoded.uid;

    // Get the site to check if they already have a connected account
    const sitesSnapshot = await adminDb
      .collection("sites")
      .where("ownerId", "==", ownerId)
      .limit(1)
      .get();

    if (sitesSnapshot.empty) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const siteDoc = sitesSnapshot.docs[0];
    const siteData = siteDoc.data();
    let stripeAccountId = siteData.stripeAccountId;

    // If no Stripe Account ID exists, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: decoded.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          ownerId,
          siteId: siteDoc.id,
        },
      });

      stripeAccountId = account.id;

      // Save the account ID to Firestore
      await siteDoc.ref.update({
        stripeAccountId,
        stripeAccountStatus: "pending",
        updatedAt: new Date(),
      });
    }

    // Determine return/refresh URLs based on request host
    const origin = new URL(request.url).origin;

    // Create the account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/dashboard/settings?stripe_refresh=true`,
      return_url: `${origin}/dashboard/settings?stripe_return=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error creating Stripe Connect link:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

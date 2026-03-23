import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const ownerId = decoded.uid;

    const sitesSnapshot = await adminDb
      .collection("sites")
      .where("ownerId", "==", ownerId)
      .limit(1)
      .get();

    if (sitesSnapshot.empty) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const siteData = sitesSnapshot.docs[0].data();
    const stripeAccountId = siteData.stripeAccountId;

    if (!stripeAccountId) {
       return NextResponse.json({ error: "No connected account" }, { status: 400 });
    }

    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("Error creating Stripe login link:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

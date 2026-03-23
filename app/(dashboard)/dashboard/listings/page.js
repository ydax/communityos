import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import ListingsClient from "./ListingsClient";

export const metadata = {
  title: "Listings | Owner Dashboard",
};

export default async function DashboardListingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let decodedClaims;
  try {
    decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    redirect("/login");
  }

  const ownerId = decodedClaims.uid;
  let siteId = null;

  // Get site ID for this owner
  const sitesSnapshot = await adminDb
    .collection("sites")
    .where("ownerId", "==", ownerId)
    .limit(1)
    .get();

  if (!sitesSnapshot.empty) {
    siteId = sitesSnapshot.docs[0].id;
  }

  // Fetch listings for this owner
  const listingsSnapshot = await adminDb
    .collection("listings")
    .where("ownerId", "==", ownerId)
    .orderBy("createdAt", "desc")
    .get();

  const initialListings = listingsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Timestamps to ISO strings for client component
      createdAt: data.createdAt?.toDate().toISOString() || null,
      updatedAt: data.updatedAt?.toDate().toISOString() || null,
      deletedAt: data.deletedAt?.toDate().toISOString() || null,
    };
  });

  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <ListingsClient
          initialListings={initialListings}
          ownerId={ownerId}
          siteId={siteId}
        />
      </div>
    </div>
  );
}

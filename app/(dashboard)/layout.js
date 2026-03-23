import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import Sidebar from "@/components/dashboard/Sidebar";
import TenantProvider from "@/components/dashboard/TenantProvider";

export const metadata = {
  title: "Owner Dashboard | CentralTexas",
};

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let decodedClaims;
  try {
    decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error("Error verifying session cookie", error);
    redirect("/login");
  }

  const ownerId = decodedClaims.uid;
  let siteContext = null;

  // Retrieve site context for this user
  try {
    const sitesSnapshot = await adminDb
      .collection("sites")
      .where("ownerId", "==", ownerId)
      .limit(1)
      .get();

    if (!sitesSnapshot.empty) {
      const siteDoc = sitesSnapshot.docs[0];
      siteContext = { id: siteDoc.id, ...siteDoc.data() };
    }
  } catch (error) {
    console.error("Error fetching site for owner:", error);
  }

  const user = {
    uid: ownerId,
    email: decodedClaims.email,
  };

  return (
    <TenantProvider user={user} site={siteContext}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar className="w-64 flex-shrink-0 hidden md:block" />
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Mobile header can go here */}
          <main className="relative flex-1 overflow-y-auto focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}

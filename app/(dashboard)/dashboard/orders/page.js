import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { listOrdersBySite } from "@/lib/dbServices/ordersService";
import { getListingById } from "@/lib/dbServices/listingsService";

export const metadata = {
  title: "Orders | Owner Dashboard",
};

export default async function DashboardOrdersPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) redirect("/login");

  let ownerId;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    ownerId = decoded.uid;
  } catch (err) {
    redirect("/login");
  }

  // Get site ID
  const sitesSnapshot = await adminDb
    .collection("sites")
    .where("ownerId", "==", ownerId)
    .limit(1)
    .get();

  if (sitesSnapshot.empty) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900">No Site Found</h2>
      </div>
    );
  }

  const siteId = sitesSnapshot.docs[0].id;

  // Fetch orders
  const orders = await listOrdersBySite(adminDb, siteId, { limit: 100 });

  // Enrich with listing details
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      let title = "Unknown Item";
      if (order.listingId) {
        const listing = await getListingById(adminDb, order.listingId);
        if (listing) {
          title = listing.title;
          if (order.variantId) {
            const variantRef = adminDb.collection("variants").doc(order.variantId);
            const variantDoc = await variantRef.get();
            if (variantDoc.exists) {
               title = `${title} - ${variantDoc.data().name}`;
            }
          }
        }
      }
      return {
        ...order,
        itemTitle: title,
      };
    }),
  );

  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track sales and manage fulfillment
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Order ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Item
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrichedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                enrichedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt._seconds * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.buyerInfo?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 border-gray-100">
                      {order.itemTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(order.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

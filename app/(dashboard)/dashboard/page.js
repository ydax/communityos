import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { listOrdersBySite } from "@/lib/dbServices/ordersService";

export const metadata = {
  title: "Overview | Owner Dashboard",
};

export default async function DashboardOverview() {
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
        <h2 className="text-xl font-semibold text-gray-900">Welcome to your Dashboard</h2>
        <p className="mt-2 text-gray-600">Please finish setting up your website first.</p>
      </div>
    );
  }

  const siteId = sitesSnapshot.docs[0].id;
  
  // Fetch Analytics
  const analyticsDoc = await adminDb.collection("analytics").doc(siteId).get();
  const analytics = analyticsDoc.exists ? analyticsDoc.data() : { totalRevenue: 0, totalOrders: 0 };
  
  // Fetch recent orders
  const recentOrders = await listOrdersBySite(adminDb, siteId, { limit: 5 });

  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-600">Quick snapshot of your performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-4 sm:px-0">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-3xl font-semibold text-gray-900">${((analytics.totalRevenue || 0) / 100).toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{analytics.totalOrders || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-0">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
             {recentOrders.length === 0 ? (
                <li className="px-6 py-6 text-center text-gray-500 text-sm">No recent orders.</li>
             ) : (
                recentOrders.map(order => (
                  <li key={order.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-trade-primary truncate font-mono">
                          {order.id.slice(0,8)}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            ${(order.amount / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Placed on {order.createdAt ? new Date(order.createdAt._seconds * 1000).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
             )}
          </ul>
        </div>
      </div>
    </div>
  );
}

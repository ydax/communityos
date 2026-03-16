import Link from "next/link";

/**
 * Admin Dashboard (Placeholder)
 * Internal tools for managing sites, listings, and orders
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-trade-primary">
            CentralTexas.com Admin
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sites Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Sites</h2>
            <p className="text-gray-600 mb-4">
              Manage custom domain sites and configurations.
            </p>
            <Link
              href="/admin/sites"
              className="inline-block px-4 py-2 bg-trade-primary text-white rounded font-semibold hover:bg-trade-dark transition-colors"
            >
              Manage Sites
            </Link>
          </div>

          {/* Listings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Listings</h2>
            <p className="text-gray-600 mb-4">
              Manage inventory, services, and marketplace items.
            </p>
            <Link
              href="/admin/listings"
              className="inline-block px-4 py-2 bg-trade-primary text-white rounded font-semibold hover:bg-trade-dark transition-colors"
            >
              Manage Listings
            </Link>
          </div>

          {/* Orders Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Orders</h2>
            <p className="text-gray-600 mb-4">
              Track transactions and payment processing.
            </p>
            <Link
              href="/admin/orders"
              className="inline-block px-4 py-2 bg-trade-primary text-white rounded font-semibold hover:bg-trade-dark transition-colors"
            >
              View Orders
            </Link>
          </div>
          {/* Growth Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Growth</h2>
            <p className="text-gray-600 mb-4">
              Monitor acquisition pipelines and campaign leads.
            </p>
            <Link
              href="/admin/growth"
              className="inline-block px-4 py-2 bg-trade-primary text-white rounded font-semibold hover:bg-trade-dark transition-colors"
            >
              View Pipelines
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Stats</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-3xl font-bold text-trade-primary mb-1">
                0
              </div>
              <div className="text-sm text-gray-600">Active Sites</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-3xl font-bold text-trade-secondary mb-1">
                0
              </div>
              <div className="text-sm text-gray-600">Total Listings</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-3xl font-bold text-green-600 mb-1">$0</div>
              <div className="text-sm text-gray-600">Revenue (MTD)</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
              <div className="text-sm text-gray-600">Orders</div>
            </div>
          </div>
        </div>

        {/* Development Note */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            🚧 Under Development
          </h3>
          <p className="text-yellow-700">
            This admin panel is a placeholder. Full functionality will be
            implemented in Phase 2.
          </p>
        </div>
      </main>
    </div>
  );
}

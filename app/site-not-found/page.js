/**
 * Site Not Found Page
 * Shown when middleware detects a custom domain with no matching site
 */
export default function SiteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4 max-w-md">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">🔍</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Site Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          This domain is not connected to an active CentralTexas.com site.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          If you&apos;re the owner, check your domain configuration in the admin panel.
        </p>
        <a 
          href="https://centraltexas.com" 
          className="inline-block px-6 py-3 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors"
        >
          Visit CentralTexas.com
        </a>
      </div>
    </div>
  );
}

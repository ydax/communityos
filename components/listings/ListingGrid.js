import ListingCard from "./ListingCard";

/**
 * ListingGrid Component
 * Displays listings in a responsive grid layout
 *
 * @param {Object} props - Component props
 * @param {Array} props.listings - Array of listing objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onArchive - Archive handler
 * @param {Function} props.onDuplicate - Duplicate handler
 * @param {boolean} props.isLoading - Loading state
 */
export default function ListingGrid({
  listings,
  onEdit,
  onArchive,
  onDuplicate,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-300" />
            <div className="p-4">
              <div className="h-6 bg-gray-300 rounded mb-2" />
              <div className="h-4 bg-gray-300 rounded mb-2" />
              <div className="h-4 bg-gray-300 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No listings found
        </h3>
        <p className="text-gray-600 mb-6">
          Get started by creating your first listing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onEdit={onEdit}
          onArchive={onArchive}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
}

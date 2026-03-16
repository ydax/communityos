import clsx from "clsx";

/**
 * ListingCard Component
 * Displays a single listing item in a card format (Square-style)
 *
 * @param {Object} props - Component props
 * @param {Object} props.listing - Listing data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onArchive - Archive handler
 * @param {Function} props.onDuplicate - Duplicate handler
 */
export default function ListingCard({
  listing,
  onEdit,
  onArchive,
  onDuplicate,
}) {
  const isService = listing.type === "service";

  // Format price based on listing type
  const formatPrice = () => {
    if (isService) {
      if (listing.pricing?.model === "quote_required") {
        return "Quote Required";
      }
      if (listing.pricing?.basePrice) {
        const unit = listing.pricing.unit || "project";
        return `$${listing.pricing.basePrice.toFixed(2)}/${unit}`;
      }
      return "No price set";
    } else {
      if (listing.pricing?.basePrice) {
        return `Starting at $${listing.pricing.basePrice.toFixed(2)}`;
      }
      return "No price set";
    }
  };

  // Get first image or placeholder
  const imageUrl =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : "/placeholder-image.png";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
        />

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-semibold uppercase",
              isService ? "bg-blue-500 text-white" : "bg-green-500 text-white",
            )}
          >
            {listing.type}
          </span>
        </div>

        {/* Status Badge */}
        {listing.status !== "active" && (
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-gray-500 text-white">
              {listing.status}
            </span>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(listing);
              }}
              className="px-4 py-2 bg-white text-gray-800 rounded font-semibold hover:bg-gray-100 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(listing);
              }}
              className="px-4 py-2 bg-white text-gray-800 rounded font-semibold hover:bg-gray-100 transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(listing);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors"
            >
              Archive
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
          {listing.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {listing.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-trade-primary">
            {formatPrice()}
          </span>

          {/* Category */}
          {listing.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {listing.category}
            </span>
          )}
        </div>

        {/* Inventory indicator for goods */}
        {!isService && listing.inventory?.trackQuantity && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Inventory:</span>
              <span
                className={clsx(
                  "font-semibold",
                  listing.inventory.totalAvailable <=
                    (listing.inventory.lowStockThreshold || 10)
                    ? "text-red-600"
                    : "text-green-600",
                )}
              >
                {listing.inventory.totalAvailable || 0} units
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

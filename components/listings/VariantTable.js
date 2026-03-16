import { useState } from "react";
import clsx from "clsx";
import InventoryAdjuster from "./InventoryAdjuster";

/**
 * VariantTable Component
 * Table view of all variants for a listing
 *
 * @param {Object} props - Component props
 * @param {Array} props.variants - Array of variant objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onInventoryAdjust - Inventory adjustment handler
 * @param {boolean} props.isLoading - Loading state
 */
export default function VariantTable({
  variants,
  onEdit,
  onDelete,
  onInventoryAdjust,
  isLoading = false,
}) {
  const [adjustingVariantId, setAdjustingVariantId] = useState(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200" />
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 border-t border-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
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
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No variants yet
        </h3>
        <p className="text-gray-600 mb-6">
          Create your first variant to start tracking inventory.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Variant
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Inventory
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variants.map((variant) => (
              <tr key={variant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-800">
                    {variant.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Object.entries(variant.options || {}).map(
                      ([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {value}
                        </span>
                      ),
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {variant.sku}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-800">
                    ${variant.price.toFixed(2)}
                  </div>
                  {variant.compareAtPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      ${variant.compareAtPrice.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <InventoryAdjuster
                    currentQuantity={variant.inventory?.quantity || 0}
                    onAdjust={(variantId, adjustment, reason) => {
                      onInventoryAdjust(variantId, adjustment, reason);
                    }}
                    variantId={variant.id}
                  />
                  {variant.inventory?.quantity <=
                    (variant.inventory?.lowStockThreshold || 5) && (
                    <div className="text-xs text-red-600 font-semibold mt-1">
                      Low Stock
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={clsx(
                      "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                      variant.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800",
                    )}
                  >
                    {variant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => onEdit(variant)}
                    className="text-trade-primary hover:text-trade-dark font-semibold text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete variant "${variant.name}"?`,
                        )
                      ) {
                        onDelete(variant.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {variants.map((variant) => (
          <div key={variant.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{variant.name}</h3>
                <p className="text-sm text-gray-500">{variant.sku}</p>
              </div>
              <span
                className={clsx(
                  "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                  variant.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800",
                )}
              >
                {variant.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Price</div>
                <div className="font-semibold text-gray-800">
                  ${variant.price.toFixed(2)}
                </div>
                {variant.compareAtPrice && (
                  <div className="text-sm text-gray-500 line-through">
                    ${variant.compareAtPrice.toFixed(2)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Inventory</div>
                <div className="font-semibold text-gray-800">
                  {variant.inventory?.quantity || 0}
                </div>
                {variant.inventory?.quantity <=
                  (variant.inventory?.lowStockThreshold || 5) && (
                  <div className="text-xs text-red-600 font-semibold">
                    Low Stock
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => onEdit(variant)}
                className="flex-1 px-4 py-2 bg-trade-primary text-white rounded font-semibold hover:bg-trade-dark transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete variant "${variant.name}"?`,
                    )
                  ) {
                    onDelete(variant.id);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

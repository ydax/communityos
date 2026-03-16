import { useState } from "react";

/**
 * ListingFilters Component
 * Provides filtering and search controls for listings
 *
 * @param {Object} props - Component props
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Object} props.initialFilters - Initial filter values
 */
export default function ListingFilters({
  onFilterChange,
  initialFilters = {},
}) {
  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    type: initialFilters.type || "all",
    status: initialFilters.status || "all",
    category: initialFilters.category || "all",
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label
            htmlFor="search"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by title or description..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Type
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="service">Services</option>
            <option value="good">Goods</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.search ||
        filters.type !== "all" ||
        filters.status !== "all") && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 font-semibold">
            Active filters:
          </span>

          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-trade-primary text-white">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange("search", "")}
                className="ml-2 hover:text-gray-200"
              >
                ×
              </button>
            </span>
          )}

          {filters.type !== "all" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-trade-primary text-white">
              Type: {filters.type}
              <button
                onClick={() => handleFilterChange("type", "all")}
                className="ml-2 hover:text-gray-200"
              >
                ×
              </button>
            </span>
          )}

          {filters.status !== "all" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-trade-primary text-white">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange("status", "all")}
                className="ml-2 hover:text-gray-200"
              >
                ×
              </button>
            </span>
          )}

          <button
            onClick={() => {
              const clearedFilters = {
                search: "",
                type: "all",
                status: "all",
                category: "all",
              };
              setFilters(clearedFilters);
              onFilterChange(clearedFilters);
            }}
            className="text-sm text-trade-primary hover:text-trade-dark font-semibold"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

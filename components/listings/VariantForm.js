import { useState, useEffect } from "react";
import clsx from "clsx";

/**
 * VariantForm Component
 * Form for creating/editing a single variant
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether form is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} props.variant - Existing variant data (for editing)
 * @param {Object} props.listing - Parent listing data
 */
export default function VariantForm({
  isOpen,
  onClose,
  onSave,
  variant = null,
  listing,
}) {
  const isEditing = variant !== null;

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    options: {},
    price: "",
    compareAtPrice: "",
    inventory: {
      quantity: 0,
      lowStockThreshold: 5,
    },
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with variant data when editing
  useEffect(() => {
    if (variant) {
      setFormData({
        name: variant.name || "",
        sku: variant.sku || "",
        options: variant.options || {},
        price: variant.price || "",
        compareAtPrice: variant.compareAtPrice || "",
        inventory: variant.inventory || { quantity: 0, lowStockThreshold: 5 },
        status: variant.status || "active",
      });
    }
  }, [variant]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        sku: "",
        options: {},
        price: "",
        compareAtPrice: "",
        inventory: {
          quantity: 0,
          lowStockThreshold: 5,
        },
        status: "active",
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleInventoryChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      inventory: { ...prev.inventory, [field]: value },
    }));
  };

  const handleOptionChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      options: { ...prev.options, [key]: value },
    }));

    // Auto-generate name from options
    const updatedOptions = { ...formData.options, [key]: value };
    const optionValues = Object.values(updatedOptions).filter((v) => v);
    if (optionValues.length > 0) {
      setFormData((prev) => ({
        ...prev,
        name: optionValues.join(" / "),
      }));
    }

    // Auto-generate SKU from options
    if (listing?.title && optionValues.length > 0) {
      const titleSlug = listing.title
        .substring(0, 10)
        .toUpperCase()
        .replace(/\s+/g, "");
      const optionSlug = optionValues
        .join("_")
        .toUpperCase()
        .replace(/\s+/g, "");
      setFormData((prev) => ({
        ...prev,
        sku: `${titleSlug}_${optionSlug}`,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Variant name is required";
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (
      formData.compareAtPrice &&
      parseFloat(formData.compareAtPrice) <= parseFloat(formData.price)
    ) {
      newErrors.compareAtPrice =
        "Compare at price must be greater than the regular price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const variantData = {
        ...formData,
        listingId: listing.id,
        siteId: listing.siteId,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice
          ? parseFloat(formData.compareAtPrice)
          : null,
        inventory: {
          quantity: parseInt(formData.inventory.quantity, 10),
          reserved: 0,
          lowStockThreshold: parseInt(formData.inventory.lowStockThreshold, 10),
        },
      };

      await onSave(variantData);
      onClose();
    } catch (error) {
      console.error("Error saving variant:", error);
      setErrors({ submit: "Failed to save variant. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Edit Variant" : "Create New Variant"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Options */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">
              Variant Options
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Color
                </label>
                <input
                  id="color"
                  type="text"
                  value={formData.options.Color || ""}
                  onChange={(e) => handleOptionChange("Color", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                  placeholder="e.g., Red, Blue"
                />
              </div>

              <div>
                <label
                  htmlFor="size"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Size
                </label>
                <input
                  id="size"
                  type="text"
                  value={formData.options.Size || ""}
                  onChange={(e) => handleOptionChange("Size", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                  placeholder="e.g., Small, Large"
                />
              </div>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Add other options as needed. Name and SKU will be auto-generated.
            </p>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Variant Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={clsx(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                errors.name ? "border-red-500" : "border-gray-300",
              )}
              placeholder="e.g., Red / Large"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* SKU */}
          <div className="mb-4">
            <label
              htmlFor="sku"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              SKU *
            </label>
            <input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={(e) => handleInputChange("sku", e.target.value)}
              className={clsx(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                errors.sku ? "border-red-500" : "border-gray-300",
              )}
              placeholder="e.g., TSHIRT_RED_L"
            />
            {errors.sku && (
              <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Price * ($)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className={clsx(
                  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                  errors.price ? "border-red-500" : "border-gray-300",
                )}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="compareAtPrice"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Compare At Price ($)
              </label>
              <input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.compareAtPrice}
                onChange={(e) =>
                  handleInputChange("compareAtPrice", e.target.value)
                }
                className={clsx(
                  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                  errors.compareAtPrice ? "border-red-500" : "border-gray-300",
                )}
                placeholder="0.00"
              />
              {errors.compareAtPrice && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.compareAtPrice}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Original price before discount (optional)
              </p>
            </div>
          </div>

          {/* Inventory */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Inventory</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.inventory.quantity}
                  onChange={(e) =>
                    handleInventoryChange("quantity", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="lowStockThreshold"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Low Stock Alert
                </label>
                <input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.inventory.lowStockThreshold}
                  onChange={(e) =>
                    handleInventoryChange("lowStockThreshold", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label
              htmlFor="status"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Update Variant"
                  : "Create Variant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

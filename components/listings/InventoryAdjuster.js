import { useState } from "react";

/**
 * InventoryAdjuster Component
 * Quick inline inventory adjustment widget
 *
 * @param {Object} props - Component props
 * @param {number} props.currentQuantity - Current inventory quantity
 * @param {Function} props.onAdjust - Callback when adjustment is made
 * @param {string} props.variantId - Variant ID
 */
export default function InventoryAdjuster({
  currentQuantity,
  onAdjust,
  variantId,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const adjustmentValue = parseInt(adjustment, 10);
    if (isNaN(adjustmentValue) || adjustmentValue === 0) {
      alert("Please enter a valid adjustment amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdjust(variantId, adjustmentValue, reason || "Manual adjustment");
      setAdjustment("");
      setReason("");
      setIsEditing(false);
    } catch (error) {
      console.error("Error adjusting inventory:", error);
      alert("Failed to adjust inventory. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-trade-primary hover:text-trade-dark font-semibold transition-colors"
      >
        {currentQuantity}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Adjust Inventory
        </h3>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Current quantity:{" "}
            <span className="font-semibold">{currentQuantity}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="adjustment"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Adjustment Amount
            </label>
            <input
              id="adjustment"
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="e.g., +10 or -5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Use positive numbers to add, negative to subtract
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="reason"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Reason (optional)
            </label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Damaged goods, New shipment"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
            />
          </div>

          {adjustment && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                New quantity will be:{" "}
                <span className="font-bold">
                  {currentQuantity + parseInt(adjustment || 0, 10)}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setAdjustment("");
                setReason("");
                setIsEditing(false);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !adjustment}
              className="px-4 py-2 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Adjusting..." : "Adjust Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

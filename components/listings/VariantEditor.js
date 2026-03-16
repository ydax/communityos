import VariantTable from "./VariantTable";
import VariantForm from "./VariantForm";

/**
 * VariantEditor Component
 * Main variant editor with table and form dialog
 *
 * @param {Object} props - Component props
 * @param {Object} props.listing - Parent listing data
 * @param {Array} props.variants - Array of variants
 * @param {Function} props.onCreateVariant - Create variant handler
 * @param {Function} props.onUpdateVariant - Update variant handler
 * @param {Function} props.onDeleteVariant - Delete variant handler
 * @param {Function} props.onInventoryAdjust - Inventory adjustment handler
 * @param {boolean} props.isLoading - Loading state
 */
export default function VariantEditor({
  listing,
  variants,
  onCreateVariant,
  onUpdateVariant,
  onDeleteVariant,
  onInventoryAdjust,
  isLoading = false,
}) {
  return (
    <div>
      <VariantTable
        variants={variants}
        onEdit={onUpdateVariant}
        onDelete={onDeleteVariant}
        onInventoryAdjust={onInventoryAdjust}
        isLoading={isLoading}
      />
    </div>
  );
}

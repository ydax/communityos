/**
 * Cartesian Product — SKU Matrix Generator
 *
 * Given a set of option axes (e.g. Color: [Red, Blue], Size: [S, M, L]),
 * generates every combination as a flat array of option objects.
 *
 * This is a pure function with zero dependencies — easy to unit test.
 *
 * @module utils/cartesian
 *
 * @example
 * generateVariantMatrix({ Color: ['Red', 'Blue'], Size: ['S', 'L'] })
 * // Returns:
 * // [
 * //   { Color: 'Red',  Size: 'S' },
 * //   { Color: 'Red',  Size: 'L' },
 * //   { Color: 'Blue', Size: 'S' },
 * //   { Color: 'Blue', Size: 'L' },
 * // ]
 */

/**
 * Generate the Cartesian product of variant option axes.
 *
 * @param {Object<string, string[]>} options - Map of option names to value arrays
 * @returns {Object[]} Array of option combination objects
 */
export function generateVariantMatrix(options) {
  const keys = Object.keys(options);
  if (keys.length === 0) return [];

  // Remove any axes with empty value arrays
  const filteredKeys = keys.filter((k) => Array.isArray(options[k]) && options[k].length > 0);
  if (filteredKeys.length === 0) return [];

  const result = [];

  const helper = (depth, currentObj) => {
    if (depth === filteredKeys.length) {
      result.push({ ...currentObj });
      return;
    }
    const currentKey = filteredKeys[depth];
    for (const val of options[currentKey]) {
      currentObj[currentKey] = val;
      helper(depth + 1, currentObj);
    }
  };

  helper(0, {});
  return result;
}

/**
 * Generate SKU strings for each variant combination.
 *
 * @param {string} titlePrefix - Base prefix from the listing title
 * @param {Object[]} combinations - Array of option objects from generateVariantMatrix
 * @returns {string[]} Array of SKU strings
 *
 * @example
 * generateSKUs('TSHIRT', [{ Color: 'Red', Size: 'S' }])
 * // Returns: ['TSHIRT-RED-S']
 */
export function generateSKUs(titlePrefix, combinations) {
  const prefix = titlePrefix
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .join('-');

  return combinations.map((combo) => {
    const optionParts = Object.values(combo)
      .map((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
      .join('-');
    return `${prefix}-${optionParts}`;
  });
}

/**
 * Build complete variant data objects ready for Firestore.
 * Combines the Cartesian matrix with default pricing and stock.
 *
 * @param {string} title          - Listing title (for SKU generation)
 * @param {Object} optionAxes     - Option axes map
 * @param {number} [defaultStock] - Default initial stock per variant
 * @returns {Object[]} Array of variant data objects matching the Zod schema
 */
export function buildVariantData(title, optionAxes, defaultStock = 0) {
  const combinations = generateVariantMatrix(optionAxes);
  const skus = generateSKUs(title, combinations);

  return combinations.map((combo, i) => ({
    sku: skus[i],
    options: combo,
    priceOverride: null,
    initialStock: defaultStock,
  }));
}

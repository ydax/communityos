/**
 * VariantMatrix Component
 *
 * Dynamic SKU row generator UI for physical goods.
 * Users add option axes (e.g., Color, Size) and values,
 * and the Cartesian product auto-generates the full variant table.
 *
 * Each row shows the SKU, options, optional price override,
 * and initial stock count.
 *
 * @module components/listings/VariantMatrix
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateVariantMatrix, generateSKUs } from '@/utils/cartesian';

/**
 * @param {Object} props
 * @param {string}   props.title        - Parent listing title (for SKU generation)
 * @param {Object[]} props.variants     - Current variant data
 * @param {Function} props.onChange     - Called with updated variant array
 * @param {boolean}  props.disabled     - Disable all inputs
 */
export default function VariantMatrix({ title = '', variants = [], onChange, disabled = false }) {
  // Option axes state: [{ name: 'Color', values: ['Red', 'Blue'] }]
  const [axes, setAxes] = useState([]);
  const [defaultStock, setDefaultStock] = useState(0);

  /**
   * Rebuild variants whenever axes or default stock change.
   */
  const regenerateVariants = useCallback(() => {
    if (axes.length === 0 || axes.every((a) => a.values.length === 0)) {
      onChange([]);
      return;
    }

    // Build options map: { Color: ['Red', 'Blue'], Size: ['S', 'L'] }
    const optionsMap = {};
    axes.forEach((axis) => {
      if (axis.name.trim() && axis.values.length > 0) {
        optionsMap[axis.name.trim()] = axis.values.filter((v) => v.trim());
      }
    });

    const combinations = generateVariantMatrix(optionsMap);
    const skus = generateSKUs(title || 'ITEM', combinations);

    const newVariants = combinations.map((combo, i) => ({
      sku: skus[i],
      options: combo,
      priceOverride: null,
      initialStock: defaultStock,
    }));

    onChange(newVariants);
  }, [axes, defaultStock, title, onChange]);

  useEffect(() => {
    regenerateVariants();
  }, [regenerateVariants]);

  // ── Axis Management ──────────────────────────

  const addAxis = () => {
    setAxes((prev) => [...prev, { name: '', values: [] }]);
  };

  const removeAxis = (index) => {
    setAxes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAxisName = (index, name) => {
    setAxes((prev) => prev.map((a, i) => (i === index ? { ...a, name } : a)));
  };

  const addValue = (axisIndex, value) => {
    if (!value.trim()) return;
    setAxes((prev) =>
      prev.map((a, i) =>
        i === axisIndex ? { ...a, values: [...a.values, value.trim()] } : a
      )
    );
  };

  const removeValue = (axisIndex, valueIndex) => {
    setAxes((prev) =>
      prev.map((a, i) =>
        i === axisIndex
          ? { ...a, values: a.values.filter((_, vi) => vi !== valueIndex) }
          : a
      )
    );
  };

  // Track the input state per axis for adding new values
  const [newValueInputs, setNewValueInputs] = useState({});

  return (
    <div className="space-y-6">
      {/* Option Axes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            Product Options
          </label>
          <button
            type="button"
            onClick={addAxis}
            disabled={disabled || axes.length >= 3}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            + Add Option
          </button>
        </div>

        {axes.length === 0 && (
          <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-gray-500 text-sm mb-2">No options yet</p>
            <p className="text-gray-400 text-xs">
              Add options like <strong>Color</strong>, <strong>Size</strong>, or{' '}
              <strong>Material</strong> to generate SKU variants.
            </p>
            <button
              type="button"
              onClick={addAxis}
              disabled={disabled}
              className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              + Add First Option (e.g., Color)
            </button>
          </div>
        )}

        <div className="space-y-4">
          {axes.map((axis, axisIndex) => (
            <div
              key={axisIndex}
              className="p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  value={axis.name}
                  onChange={(e) => updateAxisName(axisIndex, e.target.value)}
                  placeholder="Option name (e.g., Color)"
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => removeAxis(axisIndex)}
                  disabled={disabled}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove option"
                >
                  ✕
                </button>
              </div>

              {/* Value chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {axis.values.map((val, valIndex) => (
                  <span
                    key={valIndex}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => removeValue(axisIndex, valIndex)}
                      disabled={disabled}
                      className="text-gray-400 hover:text-red-500 text-xs ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Add value input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newValueInputs[axisIndex] || ''}
                  onChange={(e) =>
                    setNewValueInputs((prev) => ({
                      ...prev,
                      [axisIndex]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addValue(axisIndex, newValueInputs[axisIndex] || '');
                      setNewValueInputs((prev) => ({ ...prev, [axisIndex]: '' }));
                    }
                  }}
                  placeholder={`Add ${axis.name || 'value'} (press Enter)`}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => {
                    addValue(axisIndex, newValueInputs[axisIndex] || '');
                    setNewValueInputs((prev) => ({ ...prev, [axisIndex]: '' }));
                  }}
                  disabled={disabled || !(newValueInputs[axisIndex] || '').trim()}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default Stock */}
      {axes.length > 0 && (
        <div>
          <label htmlFor="default-stock" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Default initial stock per variant
          </label>
          <input
            id="default-stock"
            type="number"
            value={defaultStock}
            onChange={(e) => setDefaultStock(parseInt(e.target.value) || 0)}
            className="w-32 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
            min="0"
          />
        </div>
      )}

      {/* Generated Variants Table */}
      {variants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              Generated Variants
            </label>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {variants.length} variant{variants.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">SKU</th>
                  {axes
                    .filter((a) => a.name.trim())
                    .map((axis) => (
                      <th key={axis.name} className="text-left px-4 py-2.5 font-semibold text-gray-600">
                        {axis.name}
                      </th>
                    ))}
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Stock</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{variant.sku}</td>
                    {axes
                      .filter((a) => a.name.trim())
                      .map((axis) => (
                        <td key={axis.name} className="px-4 py-2.5">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                            {variant.options[axis.name]}
                          </span>
                        </td>
                      ))}
                    <td className="px-4 py-2.5 text-right tabular-nums">{variant.initialStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

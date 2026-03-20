/**
 * GoodForm Component
 *
 * The "Anti-Design" form for listing a Physical Good.
 * Asks: Title, Description, Base Price, then optionally toggles
 * the Variant Matrix for size/color/etc. combinations.
 *
 * Uses React Hook Form + Zod resolver for validation.
 *
 * @module components/listings/GoodForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback, useEffect } from 'react';
import VariantMatrix from './VariantMatrix';

// Good-specific Zod schema
const goodSchema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(100),
  description: z.string().max(2000).optional().default(''),
  basePrice: z.number({ invalid_type_error: 'Enter a price' }).int().nonnegative(),
});

/**
 * @param {Object} props
 * @param {Function} props.onSubmit     - Called with validated good data (including variants)
 * @param {boolean}  props.isSubmitting  - External submission state
 * @param {string[]} props.mediaUrls    - Already-uploaded media URLs
 * @param {Object}   [props.prefill]    - AI-extracted prefill data from MagicBox
 */
export default function GoodForm({ onSubmit, isSubmitting = false, mediaUrls = [], prefill = null }) {
  const [priceDisplay, setPriceDisplay] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goodSchema),
    defaultValues: {
      title: '',
      description: '',
      basePrice: 0,
    },
  });

  const title = watch('title');

  const handlePriceChange = (e) => {
    const raw = e.target.value;
    setPriceDisplay(raw);
    const cents = Math.round(parseFloat(raw || '0') * 100);
    setValue('basePrice', isNaN(cents) ? 0 : cents, { shouldValidate: true });
  };

  const handleVariantsChange = useCallback((newVariants) => {
    setVariants(newVariants);
  }, []);

  // ── AI Prefill: hydrate form when MagicBox returns data ──
  useEffect(() => {
    if (!prefill) return;

    if (prefill.title) {
      setValue('title', prefill.title, { shouldValidate: true });
    }
    if (prefill.description) {
      setValue('description', prefill.description, { shouldValidate: true });
    }
    if (typeof prefill.basePrice === 'number' && prefill.basePrice > 0) {
      setValue('basePrice', prefill.basePrice, { shouldValidate: true });
      // Convert cents to dollar display
      setPriceDisplay((prefill.basePrice / 100).toFixed(2));
    }

    // If AI suggested variant axes, enable variants and pre-populate
    if (Array.isArray(prefill.suggestedVariants) && prefill.suggestedVariants.length > 0) {
      setHasVariants(true);
      // Note: VariantMatrix handles its own axes state.
      // The suggestedVariants data will be shown in a hint.
    }
  }, [prefill, setValue]);

  const onFormSubmit = (data) => {
    onSubmit({
      type: 'good',
      ...data,
      variants: hasVariants ? variants : [],
      mediaUrls,
      visibility: ['storefront', 'marketplace'],
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="good-title" className="block text-sm font-semibold text-gray-700 mb-1.5">
          What are you selling?
        </label>
        <input
          id="good-title"
          {...register('title')}
          placeholder="e.g., Branded T-Shirt, Homemade Salsa, Handmade Candle"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          disabled={isSubmitting}
          maxLength={100}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="good-desc" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Describe it
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        <textarea
          id="good-desc"
          {...register('description')}
          placeholder="Materials, dimensions, what makes it special?"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
          rows={3}
          disabled={isSubmitting}
          maxLength={2000}
        />
      </div>

      {/* Base Price */}
      <div>
        <label htmlFor="good-price" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Base Price
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
          <input
            id="good-price"
            type="number"
            value={priceDisplay}
            onChange={handlePriceChange}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            disabled={isSubmitting}
            min="0"
            step="0.01"
          />
        </div>
        {errors.basePrice && (
          <p className="mt-1 text-sm text-red-500">{errors.basePrice.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          This is the default price. Variants can override it.
        </p>
      </div>

      {/* Variant Toggle */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-700">Product Options</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Does this come in different sizes, colors, or variations?
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHasVariants(!hasVariants)}
            disabled={isSubmitting}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              hasVariants ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                hasVariants ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Variant Matrix */}
        {hasVariants && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* AI suggestion hint */}
            {prefill?.suggestedVariants?.length > 0 && (
              <div className="mb-4 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700">
                <span className="font-medium">✨ AI Suggestion:</span>{' '}
                Try adding{' '}
                {prefill.suggestedVariants.map((sv, i) => (
                  <span key={sv.axisName}>
                    <strong>{sv.axisName}</strong>
                    {sv.values.length > 0 && ` (${sv.values.join(', ')})`}
                    {i < prefill.suggestedVariants.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
            <VariantMatrix
              title={title}
              variants={variants}
              onChange={handleVariantsChange}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg transition-all hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Publishing Product...
          </span>
        ) : (
          '📦 Publish Product'
        )}
      </button>
    </form>
  );
}

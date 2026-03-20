/**
 * ServiceForm Component
 *
 * The "Anti-Design" form for listing a Service.
 * Asks only: Title, Description, Billing Model, Base Price, Service Radius.
 * Minimal cognitive load — each field flows naturally into the next.
 *
 * Uses React Hook Form + Zod resolver for validation.
 *
 * @module components/listings/ServiceForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

// Service-specific Zod schema
const serviceSchema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(100),
  description: z.string().max(2000).optional().default(''),
  billingModel: z.enum(['hourly', 'flat', 'quote'], {
    errorMap: () => ({ message: 'Pick a pricing model' }),
  }),
  basePrice: z.number({ invalid_type_error: 'Enter a price' }).int().nonnegative(),
  serviceRadiusMiles: z.number().nonnegative().nullable().optional(),
});

const BILLING_OPTIONS = [
  { value: 'hourly', label: '⏱️ Hourly Rate', desc: 'Charge per hour of work' },
  { value: 'flat', label: '💵 Flat Rate', desc: 'Fixed price per job' },
  { value: 'quote', label: '📋 Custom Quote', desc: 'Price varies — customers request a quote' },
];

/**
 * @param {Object} props
 * @param {Function} props.onSubmit  - Called with validated service data
 * @param {boolean}  props.isSubmitting - External submission state
 * @param {string[]} props.mediaUrls - Already-uploaded media URLs
 */
export default function ServiceForm({ onSubmit, isSubmitting = false, mediaUrls = [] }) {
  const [priceDisplay, setPriceDisplay] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      billingModel: null,
      basePrice: 0,
      serviceRadiusMiles: null,
    },
  });

  const selectedBilling = watch('billingModel');

  /**
   * Convert dollar input to cents for storage.
   * Display stays in dollars; Zod validates the integer cents.
   */
  const handlePriceChange = (e) => {
    const raw = e.target.value;
    setPriceDisplay(raw);
    const cents = Math.round(parseFloat(raw || '0') * 100);
    setValue('basePrice', isNaN(cents) ? 0 : cents, { shouldValidate: true });
  };

  const onFormSubmit = (data) => {
    onSubmit({
      type: 'service',
      ...data,
      mediaUrls,
      visibility: ['storefront', 'marketplace'],
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="svc-title" className="block text-sm font-semibold text-gray-700 mb-1.5">
          What do you offer?
        </label>
        <input
          id="svc-title"
          {...register('title')}
          placeholder="e.g., Cedar Fence Repair, Guitar Lessons, Event Catering"
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
        <label htmlFor="svc-desc" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Tell customers about it
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        <textarea
          id="svc-desc"
          {...register('description')}
          placeholder="What makes your service special? What should customers know before booking?"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
          rows={3}
          disabled={isSubmitting}
          maxLength={2000}
        />
      </div>

      {/* Billing Model — Card selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          How do you charge?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BILLING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue('billingModel', opt.value, { shouldValidate: true })}
              disabled={isSubmitting}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedBilling === opt.value
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
        {errors.billingModel && (
          <p className="mt-1 text-sm text-red-500">{errors.billingModel.message}</p>
        )}
      </div>

      {/* Price — shown only for hourly/flat */}
      {selectedBilling && selectedBilling !== 'quote' && (
        <div className="animate-fadeIn">
          <label htmlFor="svc-price" className="block text-sm font-semibold text-gray-700 mb-1.5">
            {selectedBilling === 'hourly' ? 'Hourly Rate' : 'Flat Rate Price'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              id="svc-price"
              type="number"
              value={priceDisplay}
              onChange={handlePriceChange}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              disabled={isSubmitting}
              min="0"
              step="0.01"
            />
            {selectedBilling === 'hourly' && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hr</span>
            )}
          </div>
          {errors.basePrice && (
            <p className="mt-1 text-sm text-red-500">{errors.basePrice.message}</p>
          )}
        </div>
      )}

      {/* Service Radius */}
      <div>
        <label htmlFor="svc-radius" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Service area radius
          <span className="font-normal text-gray-400 ml-1">(optional, in miles)</span>
        </label>
        <input
          id="svc-radius"
          type="number"
          {...register('serviceRadiusMiles', { valueAsNumber: true })}
          placeholder="e.g., 25"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          disabled={isSubmitting}
          min="0"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg transition-all hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Publishing Service...
          </span>
        ) : (
          '🚀 Publish Service'
        )}
      </button>
    </form>
  );
}

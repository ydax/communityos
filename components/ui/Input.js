import clsx from "clsx";
import { useState } from "react";

/**
 * Input Component - Modern floating label design
 * Shopify-inspired form input with enhanced UX
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {boolean} props.required - Required field
 * @param {string} props.className - Additional CSS classes
 */
export default function Input({
  label,
  type = "text",
  value,
  onChange,
  error,
  helperText,
  required = false,
  className,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={clsx("relative", className)}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={clsx(
          "w-full px-4 pt-6 pb-2 border rounded-lg transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-trade-accent focus:border-transparent",
          error
            ? "border-red-500 bg-red-50"
            : "border-gray-300 bg-white hover:border-gray-400",
        )}
        {...props}
      />
      <label
        className={clsx(
          "absolute left-4 transition-all duration-200 pointer-events-none",
          isFloating
            ? "top-2 text-xs text-trade-muted"
            : "top-1/2 -translate-y-1/2 text-base text-gray-500",
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-start gap-1">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-trade-muted">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Select Component - Dropdown with consistent styling
 */
export function Select({
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  className,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={clsx("relative", className)}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={clsx(
          "w-full px-4 pt-6 pb-2 border rounded-lg transition-all duration-200 appearance-none bg-white",
          "focus:outline-none focus:ring-2 focus:ring-trade-accent focus:border-transparent",
          error
            ? "border-red-500 bg-red-50"
            : "border-gray-300 hover:border-gray-400",
        )}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Dropdown arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      <label
        className={clsx(
          "absolute left-4 transition-all duration-200 pointer-events-none",
          isFloating
            ? "top-2 text-xs text-trade-muted"
            : "top-1/2 -translate-y-1/2 text-base text-gray-500",
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-start gap-1">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Textarea Component - Multi-line input
 */
export function Textarea({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  rows = 4,
  className,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={clsx("relative", className)}>
      <textarea
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={rows}
        className={clsx(
          "w-full px-4 pt-6 pb-2 border rounded-lg transition-all duration-200 resize-vertical",
          "focus:outline-none focus:ring-2 focus:ring-trade-accent focus:border-transparent",
          error
            ? "border-red-500 bg-red-50"
            : "border-gray-300 bg-white hover:border-gray-400",
        )}
        {...props}
      />
      <label
        className={clsx(
          "absolute left-4 transition-all duration-200 pointer-events-none",
          isFloating
            ? "top-2 text-xs text-trade-muted"
            : "top-6 text-base text-gray-500",
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-trade-muted">{helperText}</p>
      )}
    </div>
  );
}

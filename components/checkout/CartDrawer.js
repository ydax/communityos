"use client";

/**
 * CartDrawer — Slide-in cart panel
 *
 * Features:
 * - Slide-in animation from right
 * - Items grouped by vendor on marketplace
 * - Quantity adjustment
 * - Subtotal with platform fee preview
 * - Proceed to Checkout CTA
 * - Responsive mobile-first design
 */

import { useCart } from "./CartProvider";
import { useEffect, useRef } from "react";

export default function CartDrawer() {
  const {
    items,
    itemsByVendor,
    cartCount,
    subtotal,
    isOpen,
    setIsOpen,
    removeFromCart,
    updateQuantity,
    tenantId,
  } = useCart();

  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCheckout = () => {
    setIsOpen(false);
    // Navigate to checkout — the route differs by domain context
    if (tenantId === "marketplace") {
      window.location.href = "/marketplace/checkout";
    } else {
      window.location.href = "/checkout";
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black/40 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`
          fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Cart{" "}
            {cartCount > 0 && (
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                {cartCount}
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">
                Browse and add items to get started
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tenantId === "marketplace" ? (
                // Marketplace view: grouped by vendor
                itemsByVendor.map((group) => (
                  <div key={group.vendorSiteId}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        {group.vendorName}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <CartItem
                          key={item.id}
                          item={item}
                          onRemove={removeFromCart}
                          onUpdateQuantity={updateQuantity}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Standalone view: flat list
                <div className="space-y-3">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onRemove={removeFromCart}
                      onUpdateQuantity={updateQuantity}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with totals and CTA */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 space-y-4 bg-gray-50/80">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Taxes & shipping calculated at checkout</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="
                w-full py-3 px-6 rounded-xl font-semibold text-white
                bg-gray-900 hover:bg-gray-700
                transform transition-all duration-200
                hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]
                focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
              "
            >
              Proceed to Checkout — ${(subtotal / 100).toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Individual cart item row
 */
function CartItem({ item, onRemove, onUpdateQuantity }) {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Item image */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📦</span>
        </div>
      )}

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
        {item.variantName && (
          <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
        )}
        <p className="text-sm font-medium text-gray-700 mt-1">
          ${(item.unitPrice / 100).toFixed(2)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
              className="px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Decrease"
            >
              −
            </button>
            <span className="px-2 py-0.5 text-xs font-medium tabular-nums">
              {item.quantity || 1}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
              className="px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Increase"
            >
              +
            </button>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="ml-auto p-1 text-gray-300 hover:text-red-500 transition-colors"
            aria-label={`Remove ${item.title}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

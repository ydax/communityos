"use client";

/**
 * CartProvider — React Context implementing the "Asymmetric Cart Topology"
 *
 * PRE-AUTH: Cart state lives in localStorage, keyed by domain, mapped to
 *   a temporary UUID. Each domain gets its own isolated guest cart.
 *
 * POST-AUTH: Cart syncs to Firestore `users/{uid}/cart`. localStorage is
 *   flushed via mergeGuestCart() and the provider switches to remote state.
 *
 * DOMAIN SCOPING: On vendor domains (x-tenant-id !== 'marketplace'),
 *   CartProvider filters `visibleItems` to show only items from that vendor.
 *   On marketplace, all items are shown.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const CartContext = createContext(null);

const GUEST_CART_PREFIX = "civicos_cart_";

/**
 * Get the localStorage key scoped to the current domain
 * @returns {string}
 */
function getGuestCartKey() {
  if (typeof window === "undefined") return GUEST_CART_PREFIX + "ssr";
  return GUEST_CART_PREFIX + window.location.hostname;
}

/**
 * Read guest cart from localStorage
 * @returns {Array<Object>}
 */
function readGuestCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getGuestCartKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Write guest cart to localStorage
 * @param {Array<Object>} items
 */
function writeGuestCart(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getGuestCartKey(), JSON.stringify(items));
  } catch (err) {
    console.error("[CartProvider] Failed to write localStorage:", err);
  }
}

export function CartProvider({ children, tenantId = "marketplace" }) {
  const [items, setItems] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    const stored = readGuestCart();
    setItems(stored);
    setIsLoading(false);
  }, []);

  // Persist guest cart changes back to localStorage
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      writeGuestCart(items);
    }
  }, [items, isAuthenticated, isLoading]);

  /**
   * Add an item to the cart
   * @param {Object} item - { listingId, vendorSiteId, vendorName, title, unitPrice, variantId?, variantName?, imageUrl?, quantity? }
   */
  const addToCart = useCallback((item) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.listingId === item.listingId && (i.variantId || null) === (item.variantId || null)
      );

      if (existingIdx >= 0) {
        // Increment quantity
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 1) + (item.quantity || 1),
        };
        return updated;
      }

      return [
        ...prev,
        {
          ...item,
          quantity: item.quantity || 1,
          addedAt: new Date().toISOString(),
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      ];
    });

    // Open drawer on add
    setIsOpen(true);
  }, []);

  /**
   * Remove an item from the cart
   * @param {string} itemId - Cart item ID
   */
  const removeFromCart = useCallback((itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  /**
   * Update item quantity
   * @param {string} itemId
   * @param {number} quantity
   */
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }, []);

  /**
   * Clear all items from the cart
   */
  const clearAll = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(getGuestCartKey());
    }
  }, []);

  /**
   * Get items visible for the current domain context
   * On vendor domains: filter to that vendor only
   * On marketplace: show everything
   */
  const visibleItems = useMemo(() => {
    if (tenantId === "marketplace") {
      return items;
    }
    return items.filter((item) => item.vendorSiteId === tenantId);
  }, [items, tenantId]);

  /**
   * Calculate totals
   */
  const subtotal = useMemo(() => {
    return visibleItems.reduce((sum, item) => sum + item.unitPrice * (item.quantity || 1), 0);
  }, [visibleItems]);

  const cartCount = useMemo(() => {
    return visibleItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [visibleItems]);

  /**
   * Group visible items by vendor (for marketplace multi-vendor display)
   */
  const itemsByVendor = useMemo(() => {
    const grouped = {};
    for (const item of visibleItems) {
      const key = item.vendorSiteId || "unknown";
      if (!grouped[key]) {
        grouped[key] = {
          vendorName: item.vendorName || "Unknown Vendor",
          vendorSiteId: key,
          items: [],
        };
      }
      grouped[key].items.push(item);
    }
    return Object.values(grouped);
  }, [visibleItems]);

  /**
   * Set authenticated user — triggers Firestore sync
   * Called after successful OTP verification or account claim
   */
  const setAuthUser = useCallback((uid) => {
    setIsAuthenticated(true);
    setUserId(uid);
    // TODO: Sync local cart to Firestore via /api endpoint
    // For now, localStorage-backed cart works for MVP
  }, []);

  const value = useMemo(
    () => ({
      items: visibleItems,
      allItems: items,
      cartCount,
      subtotal,
      itemsByVendor,
      isOpen,
      isLoading,
      isAuthenticated,
      userId,
      tenantId,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearAll,
      setIsOpen,
      setAuthUser,
    }),
    [
      visibleItems,
      items,
      cartCount,
      subtotal,
      itemsByVendor,
      isOpen,
      isLoading,
      isAuthenticated,
      userId,
      tenantId,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearAll,
      setAuthUser,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to access cart context
 * @returns {Object} Cart context value
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a <CartProvider>");
  }
  return context;
}

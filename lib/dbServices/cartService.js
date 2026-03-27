/**
 * Cart Service - Firestore operations for authenticated user carts
 *
 * WHY: CivicOS uses an "Asymmetric Cart Topology." Pre-auth, cart state
 * lives in localStorage (domain-scoped). Post-auth, it syncs to Firestore
 * as a subcollection: `users/{userId}/cart/{itemId}`.
 *
 * Every cart item carries a `vendorId` tag so the frontend can filter
 * by vendor context — showing only Joe's items on joesfencing.com,
 * but the full multi-vendor cart on centraltexas.com/marketplace.
 */

/**
 * Get all cart items for an authenticated user
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID (Firestore, not Firebase Auth UID)
 * @returns {Promise<Array>} Array of cart item documents
 */
export async function getCart(db, userId) {
  try {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("cart")
      .orderBy("addedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[getCart] Error:", { userId, error: error.message });
    throw new Error("Failed to fetch cart");
  }
}

/**
 * Get cart items filtered by a specific vendor
 * Used on standalone vendor domains to scope the cart view.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @param {string} vendorSiteId - The vendor's site ID to filter by
 * @returns {Promise<Array>} Filtered array of cart items
 */
export async function getCartForVendor(db, userId, vendorSiteId) {
  try {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("cart")
      .where("vendorSiteId", "==", vendorSiteId)
      .orderBy("addedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[getCartForVendor] Error:", { userId, vendorSiteId, error: error.message });
    throw new Error("Failed to fetch vendor-scoped cart");
  }
}

/**
 * Add an item to the authenticated user's cart
 * If the same listing+variant already exists, increments quantity.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @param {Object} item - Cart item data
 * @param {string} item.listingId - Listing document ID
 * @param {string} item.vendorSiteId - The vendor's site ID (for scoped rendering)
 * @param {string} item.vendorName - Business name (for display)
 * @param {string} item.title - Item title
 * @param {number} item.unitPrice - Price in cents
 * @param {string} [item.variantId] - Variant ID if applicable
 * @param {string} [item.variantName] - Variant display name
 * @param {string} [item.imageUrl] - Product image URL
 * @param {number} [item.quantity=1] - Quantity to add
 * @returns {Promise<string>} Cart item document ID
 */
export async function addToCart(db, userId, item) {
  if (!item.listingId || !item.vendorSiteId || !item.title || item.unitPrice == null) {
    throw new Error("listingId, vendorSiteId, title, and unitPrice are required");
  }

  try {
    const cartRef = db.collection("users").doc(userId).collection("cart");

    // Check for existing item with same listing + variant
    let existingQuery = cartRef.where("listingId", "==", item.listingId);
    if (item.variantId) {
      existingQuery = existingQuery.where("variantId", "==", item.variantId);
    }

    const existingSnapshot = await existingQuery.limit(1).get();

    if (!existingSnapshot.empty) {
      // Increment quantity on existing item
      const existingDoc = existingSnapshot.docs[0];
      const currentQty = existingDoc.data().quantity || 1;
      const addQty = item.quantity || 1;

      await existingDoc.ref.update({
        quantity: currentQty + addQty,
        updatedAt: new Date(),
      });

      console.log(`[addToCart] Incremented quantity for ${existingDoc.id}: ${currentQty} → ${currentQty + addQty}`);
      return existingDoc.id;
    }

    // Create new cart item
    const docRef = await cartRef.add({
      listingId: item.listingId,
      variantId: item.variantId || null,
      variantName: item.variantName || null,
      vendorSiteId: item.vendorSiteId,
      vendorName: item.vendorName || "",
      title: item.title,
      unitPrice: item.unitPrice,
      quantity: item.quantity || 1,
      imageUrl: item.imageUrl || null,
      addedAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[addToCart] Added item ${docRef.id} to cart for user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error("[addToCart] Error:", { userId, item, error: error.message });
    throw new Error("Failed to add item to cart");
  }
}

/**
 * Update the quantity of a cart item
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @param {string} cartItemId - Cart item document ID
 * @param {number} quantity - New quantity (must be >= 1)
 * @returns {Promise<void>}
 */
export async function updateCartItemQuantity(db, userId, cartItemId, quantity) {
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1. Use removeFromCart to delete.");
  }

  try {
    await db
      .collection("users")
      .doc(userId)
      .collection("cart")
      .doc(cartItemId)
      .update({
        quantity,
        updatedAt: new Date(),
      });

    console.log(`[updateCartItemQuantity] Updated ${cartItemId} → qty ${quantity}`);
  } catch (error) {
    console.error("[updateCartItemQuantity] Error:", { userId, cartItemId, error: error.message });
    throw new Error("Failed to update cart item quantity");
  }
}

/**
 * Remove an item from the cart
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @param {string} cartItemId - Cart item document ID
 * @returns {Promise<void>}
 */
export async function removeFromCart(db, userId, cartItemId) {
  try {
    await db
      .collection("users")
      .doc(userId)
      .collection("cart")
      .doc(cartItemId)
      .delete();

    console.log(`[removeFromCart] Removed ${cartItemId} from cart for user ${userId}`);
  } catch (error) {
    console.error("[removeFromCart] Error:", { userId, cartItemId, error: error.message });
    throw new Error("Failed to remove item from cart");
  }
}

/**
 * Clear the entire cart (after successful checkout)
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @returns {Promise<void>}
 */
export async function clearCart(db, userId) {
  try {
    const cartRef = db.collection("users").doc(userId).collection("cart");
    const snapshot = await cartRef.get();

    if (snapshot.empty) {
      return;
    }

    // Batch delete for atomicity
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    console.log(`[clearCart] Cleared ${snapshot.size} items from cart for user ${userId}`);
  } catch (error) {
    console.error("[clearCart] Error:", { userId, error: error.message });
    throw new Error("Failed to clear cart");
  }
}

/**
 * Merge guest cart items (from localStorage) into the authenticated user's Firestore cart.
 * Called immediately after authentication (OTP verification or account claim).
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @param {Array<Object>} guestItems - Array of cart items from localStorage
 * @returns {Promise<number>} Number of items merged
 */
export async function mergeGuestCart(db, userId, guestItems) {
  if (!Array.isArray(guestItems) || guestItems.length === 0) {
    return 0;
  }

  try {
    let mergedCount = 0;
    for (const item of guestItems) {
      await addToCart(db, userId, item);
      mergedCount++;
    }

    console.log(`[mergeGuestCart] Merged ${mergedCount} guest items for user ${userId}`);
    return mergedCount;
  } catch (error) {
    console.error("[mergeGuestCart] Error:", { userId, error: error.message });
    throw new Error("Failed to merge guest cart");
  }
}

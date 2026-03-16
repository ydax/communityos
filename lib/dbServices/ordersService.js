/**
 * Orders Service - Firestore CRUD operations for orders collection
 * Manages transaction records linked to Stripe Payment Intents
 */

/**
 * Create a new order
 * @param {Object} db - Firestore instance
 * @param {Object} orderData - Order configuration
 * @param {string} orderData.siteId - Associated site ID
 * @param {string} orderData.listingId - Associated listing ID
 * @param {Object} orderData.buyerInfo - Buyer contact information
 * @param {number} orderData.amount - Total amount in cents
 * @param {number} orderData.platformFee - Platform fee amount in cents
 * @returns {Promise<string>} New order document ID
 */
export async function createOrder(db, orderData) {
  // Validate required fields
  if (!orderData.siteId || !orderData.listingId || !orderData.amount) {
    throw new Error('siteId, listingId, and amount are required fields');
  }

  try {
    const ordersRef = db.collection('orders');
    const docRef = await ordersRef.add({
      siteId: orderData.siteId,
      listingId: orderData.listingId,
      variantId: orderData.variantId || null,
      buyerInfo: orderData.buyerInfo || {},
      amount: orderData.amount,
      platformFee: orderData.platformFee || Math.floor(orderData.amount * 0.1), // Default 10%
      stripePaymentIntentId: null, // Set later when payment is initiated
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`[createOrder] Order created successfully: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[createOrder] Error creating order:', { orderData, error: error.message });
    throw new Error('Failed to create order');
  }
}

/**
 * Fetch an order by ID
 * @param {Object} db - Firestore instance
 * @param {string} orderId - Order document ID
 * @returns {Promise<Object|null>} Order document or null if not found
 */
export async function getOrderById(db, orderId) {
  try {
    const docRef = db.collection('orders').doc(orderId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`[getOrderById] No order found with ID: ${orderId}`);
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('[getOrderById] Error fetching order:', { orderId, error: error.message });
    throw new Error('Failed to fetch order by ID');
  }
}

/**
 * Update order status (typically called from Stripe webhook)
 * @param {Object} db - Firestore instance
 * @param {string} orderId - Order document ID
 * @param {string} status - New status ("pending", "completed", "failed", "refunded")
 * @param {Object} additionalData - Optional additional fields to update
 * @returns {Promise<void>}
 */
export async function updateOrderStatus(db, orderId, status, additionalData = {}) {
  const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    const docRef = db.collection('orders').doc(orderId);
    const updates = {
      status,
      updatedAt: new Date(),
      ...additionalData
    };

    // Add timestamp for specific status transitions
    if (status === 'completed') {
      updates.completedAt = new Date();
    } else if (status === 'failed') {
      updates.failedAt = new Date();
    } else if (status === 'refunded') {
      updates.refundedAt = new Date();
    }

    await docRef.update(updates);

    console.log(`[updateOrderStatus] Order status updated: ${orderId} → ${status}`);
  } catch (error) {
    console.error('[updateOrderStatus] Error updating order status:', { orderId, status, error: error.message });
    throw new Error('Failed to update order status');
  }
}

/**
 * Associate a Stripe Payment Intent with an order
 * @param {Object} db - Firestore instance
 * @param {string} orderId - Order document ID
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @returns {Promise<void>}
 */
export async function linkPaymentIntent(db, orderId, paymentIntentId) {
  try {
    const docRef = db.collection('orders').doc(orderId);
    await docRef.update({
      stripePaymentIntentId: paymentIntentId,
      updatedAt: new Date()
    });

    console.log(`[linkPaymentIntent] Payment Intent linked: ${orderId} → ${paymentIntentId}`);
  } catch (error) {
    console.error('[linkPaymentIntent] Error linking payment intent:', { orderId, paymentIntentId, error: error.message });
    throw new Error('Failed to link payment intent');
  }
}

/**
 * List all orders for a site
 * @param {Object} db - Firestore instance
 * @param {string} siteId - Site document ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of orders to return
 * @returns {Promise<Array>} Array of order documents
 */
export async function listOrdersBySite(db, siteId, options = {}) {
  try {
    const ordersRef = db.collection('orders');
    let query = ordersRef
      .where('siteId', '==', siteId)
      .orderBy('createdAt', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[listOrdersBySite] Error listing orders:', { siteId, error: error.message });
    throw new Error('Failed to list orders by site');
  }
}

/**
 * Get order by Stripe Payment Intent ID (for webhook processing)
 * @param {Object} db - Firestore instance
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @returns {Promise<Object|null>} Order document or null if not found
 */
export async function getOrderByPaymentIntent(db, paymentIntentId) {
  try {
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef
      .where('stripePaymentIntentId', '==', paymentIntentId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`[getOrderByPaymentIntent] No order found for Payment Intent: ${paymentIntentId}`);
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('[getOrderByPaymentIntent] Error fetching order:', { paymentIntentId, error: error.message });
    throw new Error('Failed to fetch order by payment intent');
  }
}

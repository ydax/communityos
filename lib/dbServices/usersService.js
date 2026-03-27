/**
 * Users Service - Firestore operations for the global buyers/users collection
 *
 * WHY: CivicOS uses a "Progressive Shadow Identity" model. Every buyer
 * eventually enters a single shared `users` collection so we can unify
 * cross-domain order history, pre-fill checkout, and power the
 * marketplace network effect — even if the buyer originally checked out
 * as a guest on a standalone vendor domain.
 *
 * Shadow accounts are created silently after a guest completes payment.
 * They can be "claimed" later via an email link on the order confirmation.
 */

/**
 * Find a user by email address across the global buyer pool
 * @param {Object} db - Firestore instance (admin or client)
 * @param {string} email - Email address to search (case-insensitive match)
 * @returns {Promise<Object|null>} User document or null
 */
export async function findUserByEmail(db, email) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const snapshot = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("[findUserByEmail] Error:", { email, error: error.message });
    throw new Error("Failed to find user by email");
  }
}

/**
 * Create a Shadow User after a guest completes payment
 * Shadow users have `accountStatus: 'shadow'` until they claim the account.
 *
 * @param {Object} db - Firestore instance
 * @param {Object} params
 * @param {string} params.email - Buyer email
 * @param {string} params.firebaseUid - Firebase Auth UID (created via admin SDK)
 * @param {string} [params.displayName] - Optional display name
 * @returns {Promise<string>} New user document ID
 */
export async function createShadowUser(db, { email, firebaseUid, displayName = "" }) {
  if (!email || !firebaseUid) {
    throw new Error("email and firebaseUid are required to create a shadow user");
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Prevent duplicates — check if user already exists
    const existing = await findUserByEmail(db, normalizedEmail);
    if (existing) {
      console.log(`[createShadowUser] User already exists for ${normalizedEmail}: ${existing.id}`);
      return existing.id;
    }

    const usersRef = db.collection("users");
    const docRef = await usersRef.add({
      email: normalizedEmail,
      firebaseUid,
      displayName,
      accountStatus: "shadow", // 'shadow' | 'claimed' | 'active'
      orderCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[createShadowUser] Shadow user created: ${docRef.id} for ${normalizedEmail}`);
    return docRef.id;
  } catch (error) {
    console.error("[createShadowUser] Error:", { email, error: error.message });
    throw new Error("Failed to create shadow user");
  }
}

/**
 * Fetch a user by their Firestore document ID
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @returns {Promise<Object|null>} User document or null
 */
export async function getUserById(db, userId) {
  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("[getUserById] Error:", { userId, error: error.message });
    throw new Error("Failed to fetch user by ID");
  }
}

/**
 * Find a user by their Firebase Auth UID
 * @param {Object} db - Firestore instance
 * @param {string} firebaseUid - Firebase Auth UID
 * @returns {Promise<Object|null>} User document or null
 */
export async function findUserByFirebaseUid(db, firebaseUid) {
  try {
    const snapshot = await db
      .collection("users")
      .where("firebaseUid", "==", firebaseUid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("[findUserByFirebaseUid] Error:", { firebaseUid, error: error.message });
    throw new Error("Failed to find user by Firebase UID");
  }
}

/**
 * Claim a shadow account — upgrades status from 'shadow' to 'claimed'
 * Called when a buyer clicks "Claim your account" from an order confirmation email.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - User document ID
 * @param {Object} [profileUpdates] - Optional profile fields to set
 * @returns {Promise<void>}
 */
export async function claimShadowAccount(db, userId, profileUpdates = {}) {
  try {
    await db.collection("users").doc(userId).update({
      accountStatus: "claimed",
      ...profileUpdates,
      claimedAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[claimShadowAccount] Account claimed: ${userId}`);
  } catch (error) {
    console.error("[claimShadowAccount] Error:", { userId, error: error.message });
    throw new Error("Failed to claim shadow account");
  }
}

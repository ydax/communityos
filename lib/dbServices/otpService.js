/**
 * OTP Service - One-Time Password lifecycle management
 *
 * WHY: Firebase Auth's standard Magic Links require an "Authorized Domains"
 * whitelist in the Firebase console. We cannot dynamically whitelist 10,000+
 * custom vendor domains. Instead, we generate our own Email OTP codes,
 * verify them server-side, and issue Firebase Custom Tokens — bypassing
 * the domain whitelist entirely.
 *
 * OTP codes are stored in `otpCodes/{normalizedEmail}` with a 10-minute TTL.
 * Codes are consumed on first successful verification.
 */

import { nanoid } from "nanoid";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 6;

/**
 * Generate a 6-digit numeric OTP code
 * Uses nanoid for randomness, then maps to digits only.
 * @returns {string} 6-digit code (e.g., "482917")
 */
function generateCode() {
  // Generate random digits — nanoid's alphabet doesn't have digits-only mode,
  // so we use Math.random for a clean numeric code.
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Generate and store an OTP code for the given email
 * Overwrites any existing code for that email (only one active code per email).
 *
 * @param {Object} db - Firestore instance (admin SDK)
 * @param {string} email - Buyer email address
 * @returns {Promise<string>} The generated OTP code (for dev logging / email sending)
 */
export async function generateAndStoreOTP(db, email) {
  if (!email) {
    throw new Error("Email is required to generate OTP");
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const code = generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    // Upsert — overwrite any existing code for this email
    await db.collection("otpCodes").doc(normalizedEmail).set({
      code,
      email: normalizedEmail,
      createdAt: now,
      expiresAt,
      consumed: false,
      attempts: 0,
    });

    console.log(`[generateAndStoreOTP] OTP generated for ${normalizedEmail}: ${code}`);
    return code;
  } catch (error) {
    console.error("[generateAndStoreOTP] Error:", { email, error: error.message });
    throw new Error("Failed to generate OTP");
  }
}

/**
 * Verify an OTP code for the given email
 * Marks the code as consumed on success. Rate-limits to 5 attempts.
 *
 * @param {Object} db - Firestore instance (admin SDK)
 * @param {string} email - Buyer email address
 * @param {string} code - The 6-digit code to verify
 * @returns {Promise<{ valid: boolean, reason?: string }>}
 */
export async function verifyOTP(db, email, code) {
  if (!email || !code) {
    return { valid: false, reason: "Email and code are required" };
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const docRef = db.collection("otpCodes").doc(normalizedEmail);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { valid: false, reason: "No OTP found for this email. Please request a new code." };
    }

    const otpData = doc.data();

    // Check if already consumed
    if (otpData.consumed) {
      return { valid: false, reason: "This code has already been used. Please request a new one." };
    }

    // Check expiration
    const expiresAt = otpData.expiresAt?.toDate ? otpData.expiresAt.toDate() : new Date(otpData.expiresAt);
    if (new Date() > expiresAt) {
      return { valid: false, reason: "This code has expired. Please request a new one." };
    }

    // Rate limit — max 5 attempts
    if (otpData.attempts >= 5) {
      return { valid: false, reason: "Too many attempts. Please request a new code." };
    }

    // Increment attempt counter
    await docRef.update({ attempts: (otpData.attempts || 0) + 1 });

    // Verify code
    if (otpData.code !== code) {
      return { valid: false, reason: "Invalid code. Please try again." };
    }

    // Mark as consumed
    await docRef.update({
      consumed: true,
      consumedAt: new Date(),
    });

    console.log(`[verifyOTP] OTP verified successfully for ${normalizedEmail}`);
    return { valid: true };
  } catch (error) {
    console.error("[verifyOTP] Error:", { email, error: error.message });
    throw new Error("Failed to verify OTP");
  }
}

/**
 * Clean up expired OTP documents
 * Utility function — can be called from a scheduled Cloud Function.
 *
 * @param {Object} db - Firestore instance (admin SDK)
 * @returns {Promise<number>} Number of expired documents deleted
 */
export async function cleanExpiredOTPs(db) {
  try {
    const now = new Date();
    const snapshot = await db
      .collection("otpCodes")
      .where("expiresAt", "<", now)
      .limit(100) // Batch limit to avoid timeout
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    console.log(`[cleanExpiredOTPs] Cleaned ${snapshot.size} expired OTP documents`);
    return snapshot.size;
  } catch (error) {
    console.error("[cleanExpiredOTPs] Error:", { error: error.message });
    throw new Error("Failed to clean expired OTPs");
  }
}

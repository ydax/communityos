import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * Initialize Firebase Admin SDK (Server-side only)
 * Uses singleton pattern to prevent multiple initializations
 */
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID?.replace(/\\n/g, "").trim(),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.replace(
          /\\n/g,
          "",
        ).trim(),
        // Handle escaped newlines in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    
    // Set Firestore settings for optimal performance right after initialization
    const db = getFirestore();
    db.settings({
      ignoreUndefinedProperties: true,
    });
    
    console.log("[Firebase Admin] Initialized successfully");
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

// Export singleton instances
export const adminDb = getFirestore();
export const adminAuth = getAuth();

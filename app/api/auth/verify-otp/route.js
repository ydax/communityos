import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { verifyOTP } from "@/lib/dbServices/otpService";
import { findUserByEmail } from "@/lib/dbServices/usersService";

/**
 * POST /api/auth/verify-otp
 *
 * Validates a 6-digit OTP code and issues a Firebase Custom Token.
 *
 * WHY Custom Tokens: Firebase Auth's standard flows (Magic Links, OAuth)
 * require domains to be whitelisted in the Firebase console. We can't
 * dynamically whitelist thousands of custom vendor domains. Instead, we
 * verify the OTP server-side and issue a Custom Token that the client
 * uses to call `signInWithCustomToken()` — this works on ANY domain.
 *
 * REQUEST: { email: string, code: string }
 * RESPONSE: { customToken: string, user: { id, email, accountStatus } }
 */
export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify the OTP
    const result = await verifyOTP(adminDb, normalizedEmail, code);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.reason, valid: false },
        { status: 401 }
      );
    }

    // 2. Find the user in our users collection
    const user = await findUserByEmail(adminDb, normalizedEmail);

    if (!user) {
      // Edge case: OTP existed but user was deleted in between
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Generate Firebase Custom Token using the user's Firebase UID
    //    This bypass the Authorized Domains requirement entirely.
    let firebaseUid = user.firebaseUid;

    // If the user has no Firebase Auth account yet (e.g., old shadow user),
    // create one now
    if (!firebaseUid) {
      try {
        const firebaseUser = await adminAuth.getUserByEmail(normalizedEmail);
        firebaseUid = firebaseUser.uid;
      } catch {
        // User doesn't exist in Firebase Auth — create them
        const newFirebaseUser = await adminAuth.createUser({
          email: normalizedEmail,
          emailVerified: true,
        });
        firebaseUid = newFirebaseUser.uid;

        // Update the Firestore user doc with the Firebase UID
        await adminDb.collection("users").doc(user.id).update({
          firebaseUid,
          updatedAt: new Date(),
        });
      }
    }

    const customToken = await adminAuth.createCustomToken(firebaseUid);

    return NextResponse.json({
      valid: true,
      customToken,
      user: {
        id: user.id,
        email: user.email,
        accountStatus: user.accountStatus,
        displayName: user.displayName || "",
      },
    });
  } catch (error) {
    console.error("[auth/verify-otp] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

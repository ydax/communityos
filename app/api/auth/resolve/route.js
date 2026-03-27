import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { findUserByEmail } from "@/lib/dbServices/usersService";
import { generateAndStoreOTP } from "@/lib/dbServices/otpService";

/**
 * POST /api/auth/resolve
 *
 * The "Email Bridge" endpoint — the first step of the Progressive Shadow
 * Identity flow. Called when a buyer enters their email at checkout.
 *
 * If the email matches an existing user → generate OTP and send it.
 * If not → signal that the buyer can proceed as a guest.
 *
 * REQUEST: { email: string }
 * RESPONSE: { status: 'otp_sent' | 'guest', isReturning: boolean }
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check the global users collection
    const existingUser = await findUserByEmail(adminDb, normalizedEmail);

    if (existingUser) {
      // Returning user — generate OTP
      const code = await generateAndStoreOTP(adminDb, normalizedEmail);

      // DEV: Log OTP to console. In production, send via email service.
      console.log(`[auth/resolve] 🔑 OTP for ${normalizedEmail}: ${code}`);

      // TODO: Send OTP via email (SendGrid / Resend / Firebase Extension)
      // await sendOTPEmail(normalizedEmail, code);

      return NextResponse.json({
        status: "otp_sent",
        isReturning: true,
        // Never expose the code in the response — it's logged server-side only
      });
    }

    // New buyer — proceed as guest
    return NextResponse.json({
      status: "guest",
      isReturning: false,
    });
  } catch (error) {
    console.error("[auth/resolve] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

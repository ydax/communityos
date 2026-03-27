"use client";

/**
 * EmailResolver — The entry point of the Progressive Shadow Identity flow
 *
 * Step 1: User enters email
 * Step 2: If returning user → show OTP input, verify, sign in with Custom Token
 * Step 3: If new user → proceed as guest (onResolved callback)
 *
 * This component handles the entire "Email Bridge" interaction in isolation.
 */

import { useState, useRef, useEffect } from "react";

export default function EmailResolver({ onResolved }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // 'email' | 'otp' | 'resolved'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const otpRefs = useRef([]);
  const emailRef = useRef(null);

  // Auto-focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  /**
   * Step 1: Submit email to /api/auth/resolve
   */
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.status === "otp_sent") {
        // Returning user — show OTP input
        setStep("otp");
        // Focus first OTP input after render
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        // New user — proceed as guest
        setStep("resolved");
        onResolved({ email, isReturning: false, customToken: null });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle OTP digit input with auto-advance
   */
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste — distribute digits across inputs
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtpDigits(newOtp);

      // Focus the next empty input or last input
      const nextEmpty = newOtp.findIndex((d, i) => i >= index && d === "");
      const focusIdx = nextEmpty >= 0 ? nextEmpty : 5;
      otpRefs.current[focusIdx]?.focus();

      // Auto-submit if all filled
      if (newOtp.every((d) => d !== "")) {
        verifyOtp(newOtp.join(""));
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && newOtp.every((d) => d !== "")) {
      verifyOtp(newOtp.join(""));
    }
  };

  /**
   * Handle backspace in OTP inputs
   */
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Step 2: Verify OTP and get Custom Token
   */
  const verifyOtp = async (code) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        throw new Error(data.error || "Invalid code");
      }

      // Sign in with Firebase Custom Token
      const { signInWithCustomToken } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase/client");
      await signInWithCustomToken(auth, data.customToken);

      setStep("resolved");
      onResolved({
        email,
        isReturning: true,
        customToken: data.customToken,
        user: data.user,
      });
    } catch (err) {
      setError(err.message);
      // Reset OTP inputs
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "resolved") {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium text-emerald-800">{email}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <label
            htmlFor="checkout-email"
            className="block text-sm font-semibold text-gray-700"
          >
            Email address
          </label>
          <div className="relative">
            <input
              ref={emailRef}
              id="checkout-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="
                w-full px-4 py-3 rounded-xl border border-gray-200
                text-gray-900 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                transition-all duration-200
              "
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !email}
            className="
              w-full py-3 px-6 rounded-xl font-semibold text-white
              bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300
              transition-all duration-200 disabled:cursor-not-allowed
            "
          >
            {isLoading ? "Checking..." : "Continue"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-gray-900">{email}</span>
            </p>
            <button
              onClick={() => { setStep("email"); setOtpDigits(["", "", "", "", "", ""]); }}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1 underline"
            >
              Change email
            </button>
          </div>

          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`
                  w-12 h-14 text-center text-xl font-bold rounded-xl border-2
                  focus:outline-none focus:ring-0 transition-all duration-200
                  ${digit
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                  }
                  ${error ? "border-red-400 shake" : ""}
                `}
                disabled={isLoading}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

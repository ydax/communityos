"use client";

/**
 * CheckoutForm — Native Checkout Page Component
 *
 * Orchestrates the full checkout flow:
 * 1. Email Input → Progressive Identity (EmailResolver)
 * 2. Contact/Shipping Info
 * 3. Stripe Payment Element (embedded, branded)
 * 4. Confirmation with "Claim your account" CTA
 *
 * Props:
 * - context: 'standalone' | 'marketplace'
 * - siteId: vendor site ID (standalone only)
 * - stripeAccountId: vendor's Stripe Connect ID (standalone only)
 * - siteName: vendor business name for branding
 */

import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe/client";
import { useCart } from "./CartProvider";
import EmailResolver from "./EmailResolver";

export default function CheckoutForm({
  context = "standalone",
  siteId = null,
  stripeAccountId = null,
  siteName = "Store",
}) {
  const { items, subtotal, clearAll, tenantId } = useCart();
  const [step, setStep] = useState("identity"); // 'identity' | 'info' | 'payment' | 'success'
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    phone: "",
  });

  // Redirect if cart is empty
  if (items.length === 0 && step !== "success") {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500">Add some items before checking out.</p>
      </div>
    );
  }

  /**
   * Called when EmailResolver completes
   */
  const handleIdentityResolved = (result) => {
    setBuyerEmail(result.email);
    setIsReturning(result.isReturning);

    if (result.user?.displayName) {
      setContactInfo((prev) => ({ ...prev, name: result.user.displayName }));
    }

    setStep("info");
  };

  /**
   * Called when contact info is submitted — creates PaymentIntent
   */
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            listingId: item.listingId,
            siteId: item.vendorSiteId,
            variantId: item.variantId,
            quantity: item.quantity || 1,
          })),
          context,
          buyerEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);

      // If the API returned a different stripeAccountId, use it
      // (for standalone, the API confirms the vendor's account)
      setStep("payment");
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Success screen with account claim CTA
   */
  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
            <p className="text-gray-500 mt-2">
              A confirmation has been sent to <strong>{buyerEmail}</strong>
            </p>
            {orderId && (
              <p className="text-xs text-gray-400 mt-1">Order #{orderId.slice(0, 8)}</p>
            )}
          </div>

          {/* Account Claim CTA — the "Network Accelerator" */}
          {!isReturning && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">
                Track your order & discover local businesses
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Claim your free CentralTexas.com account to manage orders and find more local services.
              </p>
              <button
                onClick={() => window.location.href = `/get-started?claim=true&email=${encodeURIComponent(buyerEmail)}`}
                className="
                  w-full py-3 px-6 rounded-xl font-semibold text-white
                  bg-gray-900 hover:bg-gray-700
                  transition-all duration-200
                  hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]
                "
              >
                Claim Your Account →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">
          {siteName} • {items.length} item{items.length !== 1 ? "s" : ""} • ${(subtotal / 100).toFixed(2)}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {["Identity", "Details", "Payment"].map((label, i) => {
          const stepIndex = { identity: 0, info: 1, payment: 2 }[step];
          const isActive = i === stepIndex;
          const isComplete = i < stepIndex;

          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${isComplete ? "bg-emerald-500 text-white" : ""}
                  ${isActive ? "bg-gray-900 text-white ring-4 ring-gray-900/10" : ""}
                  ${!isComplete && !isActive ? "bg-gray-200 text-gray-400" : ""}
                `}
              >
                {isComplete ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  isActive ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {i < 2 && (
                <div className={`flex-1 h-px ${isComplete ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Email Identity */}
      {step === "identity" && (
        <div className="space-y-6">
          <EmailResolver onResolved={handleIdentityResolved} />
        </div>
      )}

      {/* Step 2: Contact Info */}
      {step === "info" && (
        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div>
            <label htmlFor="checkout-name" className="block text-sm font-semibold text-gray-700 mb-1">
              Full name
            </label>
            <input
              id="checkout-name"
              type="text"
              required
              value={contactInfo.name}
              onChange={(e) => setContactInfo((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Jane Smith"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="checkout-phone" className="block text-sm font-semibold text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              id="checkout-phone"
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => setContactInfo((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="(512) 555-0123"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Order Summary</h3>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate max-w-[200px]">
                  {item.title} × {item.quantity || 1}
                </span>
                <span className="font-medium text-gray-900">
                  ${((item.unitPrice * (item.quantity || 1)) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">${(subtotal / 100).toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-all duration-200"
          >
            Continue to Payment
          </button>
        </form>
      )}

      {/* Step 3: Stripe Payment Element */}
      {step === "payment" && clientSecret && (
        <Elements
          stripe={getStripePromise(context === "standalone" ? stripeAccountId : null)}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#111827",
                colorBackground: "#ffffff",
                colorText: "#1f2937",
                colorDanger: "#ef4444",
                fontFamily: "system-ui, -apple-system, sans-serif",
                borderRadius: "12px",
                spacingUnit: "4px",
              },
              rules: {
                ".Input": {
                  border: "1px solid #e5e7eb",
                  padding: "12px 16px",
                  boxShadow: "none",
                },
                ".Input:focus": {
                  border: "2px solid #111827",
                  boxShadow: "0 0 0 3px rgba(17,24,39,0.08)",
                },
              },
            },
          }}
        >
          <PaymentStep
            orderId={orderId}
            onSuccess={() => {
              clearAll();
              setStep("success");
            }}
          />
        </Elements>
      )}
    </div>
  );
}

/**
 * Inner payment component — must be inside Elements provider
 */
function PaymentStep({ orderId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(error.message);
      setIsProcessing(false);
    } else {
      // Payment succeeded without redirect
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {paymentError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-white
          transition-all duration-200
          ${isProcessing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gray-900 hover:bg-gray-700 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          "Pay Now"
        )}
      </button>

      <p className="text-xs text-center text-gray-400">
        Secure payment powered by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

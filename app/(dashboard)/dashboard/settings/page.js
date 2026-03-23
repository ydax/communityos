"use client";

import { useTenant } from "@/components/dashboard/TenantProvider";
import { useState } from "react";

export default function SettingsPage() {
  const { site } = useTenant();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectStripe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/connect");
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
         console.error(error);
         alert("Failed to begin orientation.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect stripe.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/login");
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        console.error(error);
        alert("Could not load express dashboard.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!site) return null;

  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Payment processing
          </h3>
          <div className="mt-2 sm:flex sm:items-start sm:justify-between">
            <div className="max-w-xl text-sm text-gray-500">
              <p>
                Connect your bank account to start accepting payments and
                receive payouts. We partner with Stripe for secure payment
                processing.
              </p>
              {site.stripeAccountId ? (
                <div className="mt-4 p-4 rounded-md bg-gray-50 border border-gray-100">
                   <dl className="flex items-center gap-x-2 text-sm text-gray-500">
                     <dt className="font-semibold text-gray-900">Status:</dt>
                     <dd className="capitalize">{site.stripeAccountStatus || "Pending"}</dd>
                   </dl>
                </div>
              ) : null}
            </div>
            <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 sm:flex sm:items-center">
              {site.stripeAccountId ? (
                 <button
                 type="button"
                 onClick={handleStripeLogin}
                 disabled={isLoading}
                 className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trade-primary sm:text-sm"
               >
                 {isLoading ? "Loading..." : "View Stripe Dashboard"}
               </button>
              ) : (
                <button
                type="button"
                onClick={handleConnectStripe}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-trade-primary hover:bg-trade-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trade-primary sm:text-sm"
              >
                {isLoading ? "Loading..." : "Connect with Stripe"}
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

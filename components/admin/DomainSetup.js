"use client";

import { useState } from "react";

/**
 * DomainSetup Component
 *
 * Post-onboarding UI for upgrading from subdomain to custom domain.
 * Shows DNS instructions and verifies configuration.
 *
 * @param {Object} props
 * @param {string} props.siteId - Site ID to update
 * @param {string} props.currentDomain - Current domain (e.g. 'biz.centraltexas.com')
 */
export default function DomainSetup({ siteId, currentDomain }) {
  const [customDomain, setCustomDomain] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | verified | failed
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleVerify = async () => {
    if (!customDomain.trim()) {
      setError("Please enter a domain");
      return;
    }

    setStatus("checking");
    setError(null);

    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, domain: customDomain.trim() }),
      });

      const data = await res.json();

      if (data.verified) {
        setStatus("verified");
      } else {
        setStatus("failed");
        setError(
          data.message ||
            "DNS not configured yet. Please try again in a few minutes.",
        );
      }
    } catch (err) {
      setStatus("failed");
      setError("Verification failed. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-2">🌐 Custom Domain</h3>
      <p className="text-sm text-gray-500 mb-4">
        Your site is live at{" "}
        <span className="font-mono text-blue-600">{currentDomain}</span>. Want
        your own domain? (e.g.,{" "}
        <span className="font-mono">joesfencing.com</span>)
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="yourbusiness.com"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={status === "checking" || status === "verified"}
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={
            status === "checking" ||
            status === "verified" ||
            !customDomain.trim()
          }
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {status === "checking"
            ? "Checking..."
            : status === "verified"
              ? "✅ Verified"
              : "Verify"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {status === "verified" && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
          <p className="text-sm text-green-700 font-medium">
            ✅ Domain verified! Your site is now live at{" "}
            <span className="font-mono">{customDomain}</span>. It may take a few
            minutes for SSL to be provisioned.
          </p>
        </div>
      )}

      {/* DNS Instructions */}
      <button
        type="button"
        onClick={() => setShowInstructions(!showInstructions)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        {showInstructions ? "Hide" : "Show"} DNS setup instructions
      </button>

      {showInstructions && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium text-gray-800 mb-3">
            Set up your domain in 3 steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Go to your domain registrar (GoDaddy, Namecheap, etc.)</li>
            <li>
              Add a <strong>CNAME record</strong>:
              <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                Name: <strong>@</strong> or <strong>www</strong>
                <br />
                Type: <strong>CNAME</strong>
                <br />
                Value: <strong>cname.vercel-dns.com</strong>
              </div>
            </li>
            <li>
              Come back here and click &quot;Verify&quot; (DNS can take up to 48
              hours, but usually works in minutes)
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

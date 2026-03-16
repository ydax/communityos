"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// DNS PROPAGATION PANEL
// Full-featured UI for the "pending DNS" state with:
//   • Live pulse animation
//   • Elapsed time counter
//   • Animated wave / signal rings
//   • Step-by-step propagation checklist
//   • Last-checked timestamp + manual "Check Now" trigger
// ─────────────────────────────────────────────────────────────
function DnsPropagationPanel({
  domain,
  addedAt,
  onVerified,
  onCheckNow,
  lastChecked,
  isChecking,
}) {
  const [elapsed, setElapsed] = useState(0); // seconds since domain added

  // Tick elapsed time every second
  useEffect(() => {
    const base = addedAt ? new Date(addedAt).getTime() : Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - base) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [addedAt]);

  const formatElapsed = (s) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatLastChecked = (ts) => {
    if (!ts) return "Never";
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 10) return "Just now";
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  // Progress: 0–100% across a max of 48h (172800s), most resolve in <30m
  const progressPct = Math.min(100, (elapsed / 1800) * 100); // 30-min scale

  const steps = [
    { label: "Domain purchased", done: true },
    { label: "Added to Vercel project", done: true },
    { label: "Nameservers submitted", done: true },
    { label: "DNS propagating globally", done: false, active: true },
    { label: "SSL certificate issued", done: false },
    { label: "Site live at " + domain, done: false },
  ];

  return (
    <div className="space-y-5">
      {/* Hero card with animated rings */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white">
        {/* Animated signal rings */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/20"
              style={{
                width: `${80 + i * 48}px`,
                height: `${80 + i * 48}px`,
                top: `${-(40 + i * 24)}px`,
                left: `${-(40 + i * 24)}px`,
                animation: `ping 2s cubic-bezier(0,0,0.2,1) ${i * 0.6}s infinite`,
                opacity: 0.3 - i * 0.08,
              }}
            />
          ))}
          <div className="relative w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>
        </div>

        <div className="relative pr-24">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-yellow-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Propagating
            </span>
            <span className="text-white/40 text-xs">·</span>
            <span className="text-white/50 text-xs font-mono">
              {formatElapsed(elapsed)}
            </span>
          </div>

          <h4 className="text-xl font-bold text-white mb-0.5">{domain}</h4>
          <p className="text-indigo-200 text-xs">
            DNS changes are spreading across the global internet
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-indigo-300 mb-1.5">
              <span>Propagation progress</span>
              <span>typically 5–30 min</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-1000"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step checklist */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h5 className="text-sm font-semibold text-gray-700">
            Setup Progress
          </h5>
        </div>
        <ul className="divide-y divide-gray-50">
          {steps.map((step, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 px-4 py-3 ${step.active ? "bg-indigo-50" : ""}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  step.done
                    ? "bg-green-500"
                    : step.active
                      ? "bg-indigo-100 border-2 border-indigo-400"
                      : "bg-gray-100"
                }`}
              >
                {step.done ? (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : step.active ? (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </div>
              <span
                className={`text-sm ${
                  step.done
                    ? "text-gray-500 line-through"
                    : step.active
                      ? "text-indigo-700 font-semibold"
                      : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
              {step.active && (
                <span className="ml-auto text-xs text-indigo-400 font-medium">
                  In progress
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* DNS records configured */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          DNS Configuration
        </h5>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
            <span className="text-xs font-mono text-gray-500">NS1</span>
            <span className="text-xs font-mono font-medium text-gray-800">
              ns1.vercel-dns.com
            </span>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">
              Set ✓
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
            <span className="text-xs font-mono text-gray-500">NS2</span>
            <span className="text-xs font-mono font-medium text-gray-800">
              ns2.vercel-dns.com
            </span>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">
              Set ✓
            </span>
          </div>
        </div>
      </div>

      {/* Check now footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Last checked:{" "}
          <span className="font-medium text-gray-500">
            {formatLastChecked(lastChecked)}
          </span>
          <span className="mx-1.5 text-gray-300">·</span>
          auto-checking every 10s
        </p>
        <button
          id="dns-check-now-btn"
          onClick={onCheckNow}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {isChecking ? (
            <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.95-3M20 15a9 9 0 01-15.95 3"
              />
            </svg>
          )}
          Check now
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LIVE SUCCESS BANNER (shown when DNS resolves)
// ─────────────────────────────────────────────────────────────
function LiveBanner({ domain }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-green-200">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white">Your site is live! 🎉</p>
            <p className="text-green-100 text-xs">
              SSL secured · DNS verified · Globally accessible
            </p>
          </div>
        </div>
        <a
          href={`https://${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-between w-full bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <span className="font-mono">{domain}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS BADGE (shared between states)
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status, isVerifying }) {
  const cfg = {
    active: {
      bg: "bg-green-100 text-green-800",
      dot: "bg-green-500 animate-none",
      label: "Live",
    },
    pending: {
      bg: "bg-yellow-100 text-yellow-800",
      dot: "bg-yellow-500 animate-pulse",
      label: "Pending DNS",
    },
    errored: {
      bg: "bg-red-100 text-red-800",
      dot: "bg-red-500",
      label: "DNS Error",
    },
    unknown: {
      bg: "bg-gray-100 text-gray-600",
      dot: "bg-gray-400",
      label: "Checking…",
    },
  };
  const c = cfg[status] || cfg.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg}`}
    >
      {isVerifying ? (
        <span className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      )}
      {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// SUGGESTION CARD (used in Buy flow)
// ─────────────────────────────────────────────────────────────
function SuggestionCard({ suggestion, onSelect }) {
  return (
    <button
      onClick={() => onSelect(suggestion.domain)}
      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
    >
      <span className="font-medium text-gray-800 group-hover:text-indigo-700 text-sm">
        {suggestion.domain}
      </span>
      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        {suggestion.priceUsd}/yr
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function DomainSettings({ site, onUpdateSite }) {
  const { siteId } = useParams();
  const customDomain = site?.customDomain;

  // Flow: "ask" | "manual" | "search"
  const [flow, setFlow] = useState("ask");

  // Manual connect
  const [manualInput, setManualInput] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Buy flow
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [buying, setBuying] = useState(null);

  // Verification
  const [verifyStatus, setVerifyStatus] = useState("unknown");
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const [errorMsg, setErrorMsg] = useState(null);

  // ── Verification polling ─────────────────────────────────
  const checkVerification = useCallback(async () => {
    if (!customDomain) return;
    setIsVerifying(true);
    try {
      const res = await fetch(
        `/api/sites/${siteId}/domain/verify?domain=${customDomain}`,
      );
      if (res.ok) {
        const data = await res.json();
        setLastChecked(new Date().toISOString());
        if (data.verified) setVerifyStatus("active");
        else if (data.misconfigured) setVerifyStatus("errored");
        else setVerifyStatus("pending");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  }, [customDomain, siteId]);

  useEffect(() => {
    if (!customDomain) return;
    checkVerification();
    if (verifyStatus !== "active") {
      const id = setInterval(checkVerification, 10000);
      return () => clearInterval(id);
    }
  }, [customDomain, verifyStatus, checkVerification]);

  // ── Handlers ──────────────────────────────────────────────
  const handleManualConnect = async () => {
    if (!manualInput) return;
    setManualSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: manualInput.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add domain");
      onUpdateSite({
        ...site,
        customDomain: manualInput.trim().toLowerCase(),
        customDomainAddedAt: new Date().toISOString(),
      });
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleSearch = async (domain = searchInput) => {
    const q = domain.trim().toLowerCase();
    if (!q || !q.includes(".")) {
      setErrorMsg("Enter a full domain, e.g. davidsplumbing.com");
      return;
    }
    setSearchInput(q);
    setSearching(true);
    setSearchResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/domain/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSearchResult(data);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleBuy = async (domain) => {
    setBuying(domain);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/domain/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdateSite({
        ...site,
        customDomain: domain,
        customDomainAddedAt: new Date().toISOString(),
      });
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setBuying(null);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm(`Remove ${customDomain} from this site?`)) return;
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/sites/${siteId}/domain?domain=${customDomain}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove domain");
      onUpdateSite({ ...site, customDomain: null });
      setVerifyStatus("unknown");
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  // ────────────────────────────────────────────────────────────
  // RENDER: Domain already attached
  // ────────────────────────────────────────────────────────────
  if (customDomain) {
    return (
      <div className="p-5 h-full overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Custom Domain</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Subdomain <span className="font-mono">{site?.domain}</span> is
              also always active.
            </p>
          </div>
          <StatusBadge status={verifyStatus} isVerifying={isVerifying} />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {/* Propagation panel or live banner depending on status */}
        {verifyStatus === "active" ? (
          <LiveBanner domain={customDomain} />
        ) : (
          <DnsPropagationPanel
            domain={customDomain}
            addedAt={site?.customDomainAddedAt}
            onCheckNow={checkVerification}
            lastChecked={lastChecked}
            isChecking={isVerifying}
          />
        )}

        <button
          onClick={handleRemoveDomain}
          className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
        >
          Remove domain
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // RENDER: Initial ownership question
  // ────────────────────────────────────────────────────────────
  if (flow === "ask") {
    return (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Add a Custom Domain
          </h3>
          <p className="text-sm text-gray-500">
            Give this site its own branded address — like{" "}
            <span className="font-medium text-gray-700">davidsplumbing.us</span>
            .
          </p>
        </div>

        <div className="space-y-3">
          <button
            id="domain-own-yes-btn"
            onClick={() => setFlow("manual")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl shrink-0">
              🔗
            </div>
            <div>
              <p className="font-semibold text-gray-800 group-hover:text-indigo-800">
                I already own a domain
              </p>
              <p className="text-xs text-gray-500">
                Connect a domain from any registrar.
              </p>
            </div>
          </button>

          <button
            id="domain-buy-btn"
            onClick={() => setFlow("search")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl shrink-0">
              🛒
            </div>
            <div>
              <p className="font-semibold text-gray-800 group-hover:text-green-800">
                Buy it for me
              </p>
              <p className="text-xs text-gray-500">
                Search availability and register in one click — as low as $4/yr.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // RENDER: Manual connect
  // ────────────────────────────────────────────────────────────
  if (flow === "manual") {
    return (
      <div className="p-6 h-full overflow-y-auto space-y-4">
        <button
          onClick={() => setFlow("ask")}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          ← Back
        </button>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Connect Your Domain
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Enter the domain, then follow DNS instructions.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          <input
            id="manual-domain-input"
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualConnect()}
            placeholder="davidsplumbing.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none"
          />
          <button
            id="manual-connect-btn"
            onClick={handleManualConnect}
            disabled={!manualInput || manualSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {manualSubmitting ? "Connecting…" : "Connect Domain"}
          </button>
        </div>

        {/* Quick DNS reference for manual setup */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            DNS Setup (after connecting)
          </h5>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Option A — Nameservers
              </span>
              <code className="block bg-white border border-gray-200 p-2 rounded text-xs mt-1.5">
                ns1.vercel-dns.com
              </code>
              <code className="block bg-white border border-gray-200 p-2 rounded text-xs mt-1">
                ns2.vercel-dns.com
              </code>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                Option B — A-Record
              </span>
              <code className="block bg-white border border-gray-200 p-2 rounded text-xs mt-1.5">
                @ / A / 76.76.21.21
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // RENDER: Buy flow
  // ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 h-full overflow-y-auto space-y-4">
      <button
        onClick={() => {
          setFlow("ask");
          setSearchResult(null);
          setErrorMsg(null);
        }}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
      >
        ← Back
      </button>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Find a Domain</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Search availability — we register it instantly.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-2">
        <input
          id="domain-search-input"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="davidsplumbing.com"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none"
        />
        <button
          id="domain-search-btn"
          onClick={() => handleSearch()}
          disabled={searching}
          className="px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {searching ? "…" : "Check"}
        </button>
      </div>

      {searchResult && (
        <div className="space-y-3">
          {searchResult.available ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
                <div>
                  <p className="font-bold text-green-900 font-mono">
                    {searchResult.query}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Available · {searchResult.priceUsd}/yr
                    {searchResult.firstYearPromo && (
                      <span className="ml-1.5 line-through text-green-500">
                        {searchResult.regularPriceUsd}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  id="domain-buy-confirm-btn"
                  onClick={() => handleBuy(searchResult.query)}
                  disabled={!!buying}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60"
                >
                  {buying === searchResult.query ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Buying…
                    </span>
                  ) : (
                    "Buy it for me →"
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                One-time charge of {searchResult.priceUsd} to your Porkbun
                account. Auto-renewal applies.
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <strong>{searchResult.query}</strong> is already registered. Try
                one of these:
              </div>
              {searchResult.suggestions?.length > 0 ? (
                <div className="space-y-2">
                  {searchResult.suggestions.map((s) => (
                    <SuggestionCard
                      key={s.domain}
                      suggestion={s}
                      onSelect={(d) => {
                        setSearchInput(d);
                        handleSearch(d);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  No alternatives found. Try a different name.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

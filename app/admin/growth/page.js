"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Growth Dashboard Page
 * Internal UI for monitoring automated acquisition pipelines.
 * Includes a form to create campaigns and buttons to trigger pipeline runs.
 */
function GrowthPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignType, setNewCampaignType] = useState("DigitalRescue");
  const [runningCampaignId, setRunningCampaignId] = useState(null);
  const [runResult, setRunResult] = useState(null);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/growth/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError("Failed to load campaign data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const totalIdentified = campaigns.reduce(
    (acc, c) => acc + (c.metrics?.identified || 0),
    0,
  );
  const totalContacted = campaigns.reduce(
    (acc, c) => acc + (c.metrics?.contacted || 0),
    0,
  );
  const totalGenerated = campaigns.reduce(
    (acc, c) => acc + (c.metrics?.site_generated || 0),
    0,
  );
  const totalClaimed = campaigns.reduce(
    (acc, c) => acc + (c.metrics?.claimed || 0),
    0,
  );

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/growth/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCampaignName, type: newCampaignType }),
      });
      if (!response.ok) throw new Error("Failed to create campaign");
      setNewCampaignName("");
      await fetchCampaigns();
    } catch (err) {
      setError("Failed to create campaign: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunPipeline = async (campaignId, pipelineName) => {
    if (
      !confirm(
        `Run ${pipelineName} pipeline for this campaign? This will make live API calls.`,
      )
    )
      return;

    setRunningCampaignId(campaignId);
    setRunResult(null);
    try {
      const response = await fetch(
        `/api/pipelines/digital-rescue/run?campaignId=${campaignId}`,
        {
          method: "POST",
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pipeline run failed");
      setRunResult(data.summary);
      await fetchCampaigns();
    } catch (err) {
      setError("Pipeline run failed: " + err.message);
    } finally {
      setRunningCampaignId(null);
    }
  };

  const PIPELINE_TYPE_OPTIONS = [
    { value: "DigitalRescue", label: "Pipeline 3 — Digital Rescue" },
    { value: "DayZero", label: "Pipeline 2 — Day Zero" },
    { value: "LegalTech", label: "Pipeline 1 — Legal Tech" },
    { value: "SMSVision", label: "Pipeline 4 — SMS Vision" },
    { value: "TrojanHorse", label: "Pipeline 5 — Trojan Horse" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="text-sm text-gray-600 hover:text-gray-800 mb-1 block"
              >
                ← Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-trade-primary">
                Growth Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold text-lg ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Run Result Banner */}
        {runResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
            <p className="text-green-700">
              ✅ Pipeline run complete — <strong>{runResult.processed}</strong>{" "}
              processed, <strong>{runResult.staged}</strong> staged,{" "}
              <strong>{runResult.skipped}</strong> skipped,{" "}
              <strong>{runResult.errors}</strong> errors
            </p>
            <button
              onClick={() => setRunResult(null)}
              className="text-green-400 hover:text-green-600 font-bold text-lg ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Global Pipeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Identified",
              value: totalIdentified,
              color: "text-gray-700",
            },
            {
              label: "Total Contacted",
              value: totalContacted,
              color: "text-blue-600",
            },
            {
              label: "Staging Sites Built",
              value: totalGenerated,
              color: "text-purple-600",
            },
            {
              label: "Successfully Claimed",
              value: totalClaimed,
              color: "text-green-600",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-lg shadow-md p-4">
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Create Campaign */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">New Campaign</h2>
          <form
            onSubmit={handleCreateCampaign}
            className="flex flex-wrap gap-3 items-end"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Campaign Name
              </label>
              <input
                id="campaign-name-input"
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="e.g. San Marcos Digital Rescue Q1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-trade-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Pipeline Type
              </label>
              <select
                id="campaign-type-select"
                value={newCampaignType}
                onChange={(e) => setNewCampaignType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-trade-primary"
              >
                {PIPELINE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              id="create-campaign-btn"
              className="px-5 py-2 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "+ Create Campaign"}
            </button>
          </form>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">
              Acquisition Campaigns
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Loading campaign telemetry...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No campaigns yet. Create one above to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 border-b border-gray-200">
                      Campaign
                    </th>
                    <th className="px-6 py-3 border-b border-gray-200">Type</th>
                    <th className="px-6 py-3 border-b border-gray-200">
                      Status
                    </th>
                    <th className="px-6 py-3 border-b border-gray-200 text-right">
                      Identified
                    </th>
                    <th className="px-6 py-3 border-b border-gray-200 text-right">
                      Site Gen
                    </th>
                    <th className="px-6 py-3 border-b border-gray-200 text-right">
                      Claimed
                    </th>
                    <th className="px-6 py-3 border-b border-gray-200 text-right">
                      Conv %
                    </th>
                    <th className="px-6 py-3 border-b border-gray-200 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((camp) => {
                    const claimed = camp.metrics?.claimed || 0;
                    const identified = camp.metrics?.identified || 0;
                    const conv =
                      identified > 0
                        ? ((claimed / identified) * 100).toFixed(1) + "%"
                        : "—";
                    const isRunning = runningCampaignId === camp.id;

                    return (
                      <tr key={camp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {camp.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {camp.type}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              camp.status === "active"
                                ? "bg-green-100 text-green-800"
                                : camp.status === "paused"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 text-right">
                          {identified}
                        </td>
                        <td className="px-6 py-4 text-sm text-purple-600 text-right">
                          {camp.metrics?.site_generated || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-semibold text-right">
                          {claimed}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 font-semibold text-right">
                          {conv}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {camp.type === "DigitalRescue" && (
                            <button
                              onClick={() =>
                                handleRunPipeline(camp.id, "Digital Rescue")
                              }
                              disabled={isRunning}
                              className="px-3 py-1 text-xs bg-trade-primary text-white rounded font-semibold hover:bg-trade-dark transition-colors disabled:opacity-50"
                            >
                              {isRunning ? "Running..." : "▶ Run"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default GrowthPage;

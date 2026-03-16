"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SiteEditor from "@/components/editor/SiteEditor";

/**
 * Site Editor Page
 * Edit site sections, theme, and content
 */
export default function SiteEditorPage() {
  const params = useParams();
  const siteId = params.siteId;

  const [db, setDb] = useState(null);
  const [site, setSite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Firebase on client side
  useEffect(() => {
    const initFirebase = async () => {
      const { getFirestore } = await import("firebase/firestore");
      const { initializeApp, getApps } = await import("firebase/app");

      if (!getApps().length) {
        initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });
      }

      setDb(getFirestore());
    };

    initFirebase();
  }, []);

  // Fetch site data
  useEffect(() => {
    if (!db || !siteId) return;

    const fetchSite = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch via API route
        const response = await fetch(`/api/sites/${siteId}`);
        if (!response.ok) throw new Error("Failed to fetch site");

        const data = await response.json();
        if (!data.site) {
          setError("Site not found");
          return;
        }
        setSite(data.site);
      } catch (err) {
        console.error("Error fetching site:", err);
        setError("Failed to load site. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSite();
  }, [siteId, db]);

  // Save site changes
  const handleSave = async (updatedSite) => {
    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: updatedSite.theme,
          sections: updatedSite.sections,
          branding: updatedSite.branding,
        }),
      });

      if (!response.ok) throw new Error("Failed to update site");

      setSite(updatedSite);
      alert("Site saved successfully!");
    } catch (error) {
      console.error("Error saving site:", error);
      alert("Failed to save site. Please try again.");
      throw error;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin"
            className="text-trade-primary hover:text-trade-dark font-semibold"
          >
            ← Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Back Link (overlay) */}
      {!isLoading && site && (
        <div className="absolute top-4 left-4 z-50">
          <Link
            href="/admin"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow text-sm text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>
      )}

      {/* Editor */}
      {site && (
        <SiteEditor site={site} onSave={handleSave} isLoading={isLoading} />
      )}
    </div>
  );
}

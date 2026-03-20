"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import StoryInput from "../../components/onboarding/StoryInput.js";
import VibeSelector from "../../components/onboarding/VibeSelector.js";
import SitePreviewCarousel from "../../components/onboarding/SitePreviewCarousel.js";
import AddListingStep from "../../components/onboarding/AddListingStep.js";

/**
 * Get Started Page — "3-Minute Mobile Masterpiece" Onboarding Wizard
 *
 * Replaces the old form-only flow with an AI-powered multi-step wizard:
 *
 * Step 1: Business Name + Category
 * Step 2: Tell Your Story (speech-to-text or typed)
 * Step 3: Pick Your Vibe (visual preset selection)
 * Step 4: Magic Reveal (3 AI-generated site previews)
 * Step 5: Add First Listing (camera-first, marketplace hook)
 */

const CATEGORIES = [
  // Local Services
  { value: "general_contractor", label: "General Contractor" },
  { value: "plumbing", label: "Plumbing Services" },
  { value: "electrical", label: "Electrical Services" },
  { value: "hvac", label: "HVAC & Air Conditioning" },
  { value: "roofing", label: "Roofing & Siding" },
  { value: "fencing", label: "Fencing & Deck Installation" },
  { value: "landscaping", label: "Landscaping & Lawn Care" },
  { value: "cleaning", label: "Cleaning Services" },
  { value: "moving", label: "Moving & Hauling" },
  { value: "automotive", label: "Automotive Services" },
  // Local Business
  { value: "events", label: "Events & Entertainment" },
  { value: "catering", label: "Catering & Food" },
  { value: "retail", label: "Retail & Shopping" },
  { value: "beauty", label: "Beauty & Wellness" },
  { value: "fitness", label: "Fitness & Training" },
  { value: "photography", label: "Photography & Media" },
  { value: "education", label: "Education & Tutoring" },
  { value: "consulting", label: "Consulting & Professional" },
  { value: "pet_services", label: "Pet Services" },
  { value: "nonprofit", label: "Nonprofit & Community" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { id: "basics", label: "Your Business", icon: "🏠" },
  { id: "story", label: "Your Story", icon: "💬" },
  { id: "vibe", label: "Your Vibe", icon: "🎨" },
  { id: "preview", label: "Your Site", icon: "✨" },
  { id: "listing", label: "Go Live", icon: "🚀" },
];

export default function GetStartedPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    subdomain: "",
    email: "",
    phone: "",
    businessStory: "",
    vibePreset: null,
  });
  const [variations, setVariations] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [siteId, setSiteId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Generate subdomain slug from business name
  const generateSubdomain = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30);

  // ── Step navigation ──

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.businessName.trim() &&
          formData.category &&
          formData.email.trim()
        );
      case 1:
        return formData.businessStory.trim().length >= 20;
      case 2:
        return formData.vibePreset !== null;
      case 3:
        return selectedConfig !== null;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setError(null);

    // Special handling: Step 2 → 3 triggers AI generation
    if (currentStep === 2) {
      await generateSite();
      return;
    }

    // Special handling: Step 3 → 4 creates site in Firestore
    if (currentStep === 3 && selectedConfig) {
      await createSite();
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ── AI Site Generation ──

  const generateSite = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessStory: formData.businessStory,
          category: formData.category,
          vibePreset: formData.vibePreset,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations?.length > 0) {
        setVariations(data.variations);
        setCurrentStep(3); // Move to preview step
      } else {
        setError(
          data.error || "Failed to generate your site. Please try again.",
        );
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Site Creation ──

  const createSite = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const subdomain =
        formData.subdomain || generateSubdomain(formData.businessName);
      const domain = `${subdomain}.centraltexas.com`;

      const sitePayload = {
        ...selectedConfig,
        domain,
        subdomain,
        ownerId: formData.email,
        contact: {
          email: formData.email,
          phone: formData.phone || null,
        },
        status: "draft",
      };

      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sitePayload),
      });

      let data;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("[createSite] Non-JSON response from /api/sites:", text);
        throw new Error(
          `Server error (${res.status}): ${text.substring(0, 200)}`,
        );
      }

      if (data.success && data.site?.id) {
        setSiteId(data.site.id);
        setCurrentStep(4); // Move to listing step
      } else {
        setError(data.error || "Failed to create your site.");
      }
    } catch (err) {
      console.error("[createSite] Error:", err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Completion ──

  const handleComplete = () => {
    router.push(`/admin/sites/${siteId}/editor`);
  };

  const handleSkipListing = () => {
    router.push(`/admin/sites/${siteId}/editor`);
  };

  // ── Render ──

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      {/* Progress bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium group"
            >
              <Image
                src="/logo.png"
                alt="CentralTexas.com"
                width={24}
                height={24}
                className="group-hover:scale-105 transition-transform"
              />
              <span>← CentralTexas.com</span>
            </Link>
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── Step 0: Business Basics ── */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Get Your Free Website
              </h1>
              <p className="text-gray-500">
                Takes about 3 minutes • No credit card needed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((p) => ({
                    ...p,
                    businessName: name,
                    subdomain: p.subdomain || generateSubdomain(name),
                  }));
                }}
                placeholder="Maria's Catering"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you do? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base appearance-none bg-white"
              >
                <option value="">Select your business type...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="joe@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="(512) 555-1234"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            {/* Subdomain preview */}
            {formData.businessName && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">
                  Your site will be at:
                </p>
                <p className="font-mono font-medium text-blue-700">
                  {generateSubdomain(formData.businessName)}.centraltexas.com
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Tell Your Story ── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tell us about {formData.businessName}
              </h2>
              <p className="text-gray-500">
                Type it out or tap the mic to speak — our AI will write your
                website copy from this.
              </p>
            </div>

            <StoryInput
              value={formData.businessStory}
              onChange={(val) =>
                setFormData((p) => ({ ...p, businessStory: val }))
              }
            />

            {formData.businessStory.length > 0 &&
              formData.businessStory.length < 20 && (
                <p className="text-sm text-amber-600">
                  Tell us a bit more (at least 20 characters) so our AI can
                  write great copy for you.
                </p>
              )}
          </div>
        )}

        {/* ── Step 2: Pick Your Vibe ── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pick the vibe for {formData.businessName}
              </h2>
              <p className="text-gray-500">
                Choose the look that best represents your brand.
              </p>
            </div>

            <VibeSelector
              selected={formData.vibePreset}
              onSelect={(vibeId) =>
                setFormData((p) => ({ ...p, vibePreset: vibeId }))
              }
              disabled={isGenerating}
            />
          </div>
        )}

        {/* ── Step 3: Magic Reveal ── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <SitePreviewCarousel
              variations={variations}
              onSelect={(index, config) => {
                setSelectedConfig(config);
              }}
              disabled={isGenerating}
            />

            {selectedConfig && (
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-green-700 font-medium">
                  ✅ Design selected! Tap &quot;Next&quot; to create your site.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Add First Listing ── */}
        {currentStep === 4 && siteId && (
          <AddListingStep
            siteId={siteId}
            category={formData.category}
            onComplete={handleComplete}
            onSkip={handleSkipListing}
          />
        )}

        {/* ── Navigation ── */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isGenerating}
              className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isGenerating}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {currentStep === 2
                    ? "Designing Your Site..."
                    : "Creating Site..."}
                </>
              ) : (
                <>
                  {currentStep === 2
                    ? "✨ Generate My Site"
                    : currentStep === 3
                      ? "Create My Site →"
                      : "Next →"}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay for generation */}
      {isGenerating && currentStep === 2 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="text-5xl mb-4 animate-bounce">✨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Designing your site...
            </h3>
            <p className="text-gray-500 text-sm">
              Our AI is writing custom copy and picking the perfect layout for{" "}
              {formData.businessName}.
            </p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

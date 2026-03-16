import { describe, it, expect, vi } from "vitest";
import {
  generateSiteConfig,
  generateVariations,
  SYSTEM_PROMPT,
} from "../../../lib/aiServices/siteGenerator.js";

// Mock a valid Gemini response
const mockValidResponse = JSON.stringify({
  businessName: "Joe's Fencing",
  category: "fencing",
  theme: "the-trade",
  description: "Professional fencing services in Central Texas.",
  sections: [
    {
      type: "hero",
      visible: true,
      data: {
        headline: "Expert Fence Solutions for Central Texas",
        subtitle: "Quality craftsmanship, fair prices, 15 years of experience.",
        ctaText: "Get a Free Quote",
        ctaLink: "#contact",
        layout: "clean",
      },
    },
    {
      type: "services",
      visible: true,
      data: {
        title: "Our Services",
        items: [
          {
            title: "Fence Installation",
            description:
              "Full installation of wood, vinyl, and chain-link fences.",
          },
          {
            title: "Fence Repair",
            description: "Quick repairs for all fence types.",
          },
          {
            title: "Custom Gates",
            description: "Beautiful custom gates to complement your property.",
          },
        ],
      },
    },
    {
      type: "about",
      visible: true,
      data: {
        title: "Our Story",
        bio: "Joe started fencing in 2011 after a career in construction.\nWe serve Kyle, Buda, San Marcos, and the entire I-35 corridor.",
      },
    },
    {
      type: "contact",
      visible: true,
      data: {
        title: "Ready to Get Started?",
        subtitle: "Contact us for a free estimate",
      },
    },
  ],
});

describe("generateSiteConfig", () => {
  it("should generate a valid SiteConfig from business input", async () => {
    const mockCallGemini = vi.fn().mockResolvedValue(mockValidResponse);

    const result = await generateSiteConfig(
      {
        businessName: "Joe's Fencing",
        businessStory: "I've been building fences for 15 years in Kyle TX",
        category: "fencing",
        vibePreset: "rugged-pro",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(true);
    expect(result.config).toBeTruthy();
    expect(result.config.businessName).toBe("Joe's Fencing");
    expect(result.config.category).toBe("fencing");
    expect(result.config.theme).toBe("the-trade");
    expect(result.config.sections.length).toBeGreaterThan(0);

    // Verify Gemini was called with correct prompts
    expect(mockCallGemini).toHaveBeenCalledOnce();
    const [systemPrompt, userPrompt] = mockCallGemini.mock.calls[0];
    expect(systemPrompt).toContain("web copywriter");
    expect(userPrompt).toContain("Joe's Fencing");
    expect(userPrompt).toContain("fencing");
  });

  it("should inject vibe branding into the config", async () => {
    const mockCallGemini = vi.fn().mockResolvedValue(mockValidResponse);

    const result = await generateSiteConfig(
      {
        businessName: "Joe's Fencing",
        businessStory: "Building fences",
        category: "fencing",
        vibePreset: "rugged-pro",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(true);
    expect(result.config.branding.primaryColor).toBe("#2C3E50");
    expect(result.config.branding.accentColor).toBe("#E67E22");
  });

  it("should handle malformed JSON from Gemini", async () => {
    const mockCallGemini = vi.fn().mockResolvedValue("This is not JSON at all");

    const result = await generateSiteConfig(
      {
        businessName: "Test",
        businessStory: "Test",
        category: "plumbing",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to parse");
  });

  it("should handle Gemini API errors", async () => {
    const mockCallGemini = vi
      .fn()
      .mockRejectedValue(new Error("API key invalid"));

    const result = await generateSiteConfig(
      {
        businessName: "Test",
        businessStory: "Test",
        category: "plumbing",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("AI generation failed");
  });

  it("should strip markdown fences from Gemini response", async () => {
    const wrappedResponse = "```json\n" + mockValidResponse + "\n```";
    const mockCallGemini = vi.fn().mockResolvedValue(wrappedResponse);

    const result = await generateSiteConfig(
      {
        businessName: "Joe's Fencing",
        businessStory: "Test",
        category: "fencing",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(true);
    expect(result.config).toBeTruthy();
  });

  it("should use default theme when no vibePreset provided", async () => {
    const mockCallGemini = vi.fn().mockResolvedValue(mockValidResponse);

    const result = await generateSiteConfig(
      {
        businessName: "Test Biz",
        businessStory: "A great business",
        category: "plumbing",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(true);
    expect(result.config.theme).toBe("the-trade");
  });
});

describe("generateVariations", () => {
  it("should generate 3 variations from a single base config", async () => {
    const mockCallGemini = vi.fn().mockResolvedValue(mockValidResponse);

    const result = await generateVariations(
      {
        businessName: "Joe's Fencing",
        businessStory: "Building fences for 15 years",
        category: "fencing",
        vibePreset: "rugged-pro",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(true);
    expect(result.variations).toHaveLength(3);

    // All should have the same business name
    result.variations.forEach((v) => {
      expect(v.businessName).toBe("Joe's Fencing");
    });

    // Gemini should only be called ONCE (cost optimization)
    expect(mockCallGemini).toHaveBeenCalledOnce();
  });

  it("should have different hero layouts across variations", async () => {
    const mockCallGemini = vi.fn().mockResolvedValue(mockValidResponse);

    const result = await generateVariations(
      {
        businessName: "Joe's Fencing",
        businessStory: "Building fences",
        category: "fencing",
        vibePreset: "rugged-pro",
      },
      { callGemini: mockCallGemini },
    );

    const layouts = result.variations.map((v) => {
      const hero = v.sections.find((s) => s.type === "hero");
      return hero?.data?.layout;
    });

    // At least 2 different layouts
    const uniqueLayouts = new Set(layouts);
    expect(uniqueLayouts.size).toBeGreaterThanOrEqual(2);
  });

  it("should propagate errors from base generation", async () => {
    const mockCallGemini = vi.fn().mockRejectedValue(new Error("API down"));

    const result = await generateVariations(
      {
        businessName: "Test",
        businessStory: "Test",
        category: "plumbing",
      },
      { callGemini: mockCallGemini },
    );

    expect(result.success).toBe(false);
    expect(result.variations).toHaveLength(0);
    expect(result.error).toBeTruthy();
  });
});

describe("SYSTEM_PROMPT", () => {
  it("should include key instructions", () => {
    expect(SYSTEM_PROMPT).toContain("Central Texas");
    expect(SYSTEM_PROMPT).toContain("JSON");
    expect(SYSTEM_PROMPT).toContain("DO NOT invent contact info");
    expect(SYSTEM_PROMPT).toContain("hero");
    expect(SYSTEM_PROMPT).toContain("services");
    expect(SYSTEM_PROMPT).toContain("about");
    expect(SYSTEM_PROMPT).toContain("contact");
  });
});

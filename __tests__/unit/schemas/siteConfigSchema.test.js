import { describe, it, expect } from "vitest";
import {
  validateSiteConfig,
  validateSection,
  stripHtml,
  enforceMaxLength,
  isValidHexColor,
  VALID_THEMES,
  VALID_CATEGORIES,
  VALID_HERO_LAYOUTS,
} from "../../../lib/schemas/siteConfigSchema.js";

// ---------- Helpers ----------

describe("stripHtml", () => {
  it("should strip HTML tags from strings", () => {
    expect(stripHtml('<script>alert("xss")</script>Hello')).toBe(
      'alert("xss")Hello',
    );
    expect(stripHtml("<b>Bold</b> text")).toBe("Bold text");
    expect(stripHtml("No tags here")).toBe("No tags here");
  });

  it("should return non-string values unchanged", () => {
    expect(stripHtml(42)).toBe(42);
    expect(stripHtml(null)).toBe(null);
  });
});

describe("enforceMaxLength", () => {
  it("should truncate strings exceeding max length", () => {
    expect(enforceMaxLength("Hello", 3)).toBe("Hel");
    expect(enforceMaxLength("Hello", 10)).toBe("Hello");
  });

  it("should return non-string values unchanged", () => {
    expect(enforceMaxLength(123, 5)).toBe(123);
  });
});

describe("isValidHexColor", () => {
  it("should accept valid hex colors", () => {
    expect(isValidHexColor("#FF6B6B")).toBe(true);
    expect(isValidHexColor("#000")).toBe(true);
    expect(isValidHexColor("#abc")).toBe(true);
  });

  it("should reject invalid hex colors", () => {
    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("#ZZZZZZ")).toBe(false);
    expect(isValidHexColor("FF6B6B")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });
});

// ---------- validateSection ----------

describe("validateSection", () => {
  it("should validate a correct section", () => {
    const result = validateSection(
      {
        type: "hero",
        visible: true,
        data: { headline: "Welcome" },
      },
      "the-trade",
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid section types", () => {
    const result = validateSection(
      { type: "invalid", visible: true, data: {} },
      "the-trade",
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Invalid section type");
  });

  it("should default visible to true when missing", () => {
    const result = validateSection({ type: "hero", data: {} }, "the-trade");
    expect(result.sanitized.visible).toBe(true);
  });

  it("should strip HTML from data fields", () => {
    const result = validateSection(
      {
        type: "hero",
        visible: true,
        data: { headline: '<script>alert("xss")</script>Clean Title' },
      },
      "the-trade",
    );
    expect(result.sanitized.data.headline).toBe('alert("xss")Clean Title');
  });

  it("should enforce headline max length", () => {
    const longHeadline = "A".repeat(200);
    const result = validateSection(
      {
        type: "hero",
        visible: true,
        data: { headline: longHeadline },
      },
      "the-trade",
    );
    expect(result.sanitized.data.headline.length).toBe(120);
  });

  it("should validate hero layouts per theme", () => {
    const result = validateSection(
      {
        type: "hero",
        visible: true,
        data: { layout: "invalid-layout" },
      },
      "the-maker",
    );
    // Should default to first valid layout for that theme
    expect(result.sanitized.data.layout).toBe("grid");
    expect(result.errors[0]).toContain("Invalid hero layout");
  });

  it("should accept valid hero layouts", () => {
    const result = validateSection(
      {
        type: "hero",
        visible: true,
        data: { layout: "bold" },
      },
      "the-trade",
    );
    expect(result.sanitized.data.layout).toBe("bold");
    expect(result.valid).toBe(true);
  });

  it("should handle null/undefined section", () => {
    const result = validateSection(null, "the-trade");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Section must be an object");
  });
});

// ---------- validateSiteConfig ----------

describe("validateSiteConfig", () => {
  const validConfig = {
    businessName: "Joe's Fencing",
    category: "fencing",
    theme: "the-trade",
    sections: [
      {
        type: "hero",
        visible: true,
        data: { headline: "Expert Fence Solutions" },
      },
      { type: "services", visible: true, data: {} },
      { type: "contact", visible: true, data: { email: "joe@test.com" } },
    ],
  };

  it("should validate a correct SiteConfig", () => {
    const result = validateSiteConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitized).toBeTruthy();
    expect(result.sanitized.businessName).toBe("Joe's Fencing");
  });

  it("should reject null input", () => {
    const result = validateSiteConfig(null);
    expect(result.valid).toBe(false);
    expect(result.sanitized).toBeNull();
  });

  it("should require businessName", () => {
    const result = validateSiteConfig({ ...validConfig, businessName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("businessName"))).toBe(true);
  });

  it("should reject invalid categories", () => {
    const result = validateSiteConfig({
      ...validConfig,
      category: "restaurants",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("category"))).toBe(true);
  });

  it("should reject invalid themes and default to the-trade", () => {
    const result = validateSiteConfig({ ...validConfig, theme: "neon-glow" });
    expect(result.valid).toBe(false);
    expect(result.sanitized.theme).toBe("the-trade");
  });

  it("should require sections to be a non-empty array", () => {
    const result = validateSiteConfig({ ...validConfig, sections: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("sections"))).toBe(true);
  });

  it("should require at least one hero section", () => {
    const result = validateSiteConfig({
      ...validConfig,
      sections: [
        { type: "services", visible: true, data: {} },
        { type: "contact", visible: true, data: {} },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("hero"))).toBe(true);
  });

  it("should sanitize businessName from XSS", () => {
    const result = validateSiteConfig({
      ...validConfig,
      businessName: "<img src=x onerror=alert(1)>Joe Fencing",
    });
    expect(result.sanitized.businessName).not.toContain("<img");
    expect(result.sanitized.businessName).toContain("Joe Fencing");
  });

  it("should validate branding hex colors", () => {
    const result = validateSiteConfig({
      ...validConfig,
      branding: { primaryColor: "not-a-color", accentColor: "#FF6B6B" },
    });
    expect(result.valid).toBe(false);
    expect(result.sanitized.branding.accentColor).toBe("#FF6B6B");
    expect(result.sanitized.branding.primaryColor).toBeUndefined();
  });

  it("should default status to draft", () => {
    const result = validateSiteConfig(validConfig);
    expect(result.sanitized.status).toBe("draft");
  });

  it("should reject invalid statuses and default to draft", () => {
    const result = validateSiteConfig({ ...validConfig, status: "deleted" });
    expect(result.sanitized.status).toBe("draft");
  });

  it("should sanitize contact fields", () => {
    const result = validateSiteConfig({
      ...validConfig,
      contact: { email: "<b>joe@test.com</b>", phone: "555-1234" },
    });
    expect(result.sanitized.contact.email).toBe("joe@test.com");
  });

  it("should enforce description max length", () => {
    const longDesc = "A".repeat(600);
    const result = validateSiteConfig({
      ...validConfig,
      description: longDesc,
    });
    expect(result.sanitized.description.length).toBe(500);
  });
});

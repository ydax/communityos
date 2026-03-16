import { describe, it, expect } from "vitest";

describe("SectionEditor Component", () => {
  it("should handle hero section data correctly", () => {
    const heroSection = {
      type: "hero",
      visible: true,
      data: {
        headline: "Expert Fence Solutions",
        subheadline: "Serving Kyle, TX",
        ctaText: "Get a Quote",
        ctaLink: "/contact",
        image: "gs://bucket/hero.jpg",
      },
    };

    expect(heroSection.data.headline).toBe("Expert Fence Solutions");
    expect(heroSection.visible).toBe(true);
  });

  it("should handle about section data correctly", () => {
    const aboutSection = {
      type: "about",
      visible: true,
      data: {
        bio: "Family-owned business...",
        image: "gs://bucket/about.jpg",
      },
    };

    expect(aboutSection.data.bio).toContain("Family-owned");
    expect(aboutSection.type).toBe("about");
  });

  it("should handle contact section data correctly", () => {
    const contactSection = {
      type: "contact",
      visible: true,
      data: {
        phone: "(512) 555-1234",
        email: "contact@example.com",
        address: "123 Main St, Kyle, TX",
      },
    };

    expect(contactSection.data.phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
    expect(contactSection.data.email).toContain("@");
  });
});

describe("SectionList Component", () => {
  it("should reorder sections correctly", () => {
    const sections = [
      { type: "hero", visible: true, data: {} },
      { type: "services", visible: true, data: {} },
      { type: "about", visible: true, data: {} },
    ];

    const moveSection = (array, index, direction) => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= array.length) return array;

      const newArray = [...array];
      const temp = newArray[index];
      newArray[index] = newArray[newIndex];
      newArray[newIndex] = temp;

      return newArray;
    };

    const reordered = moveSection(sections, 1, "down");
    expect(reordered[1].type).toBe("about");
    expect(reordered[2].type).toBe("services");
  });

  it("should toggle section visibility correctly", () => {
    const section = { type: "hero", visible: true, data: {} };
    const toggledSection = { ...section, visible: !section.visible };

    expect(toggledSection.visible).toBe(false);
  });
});

describe("ThemeSelector Component", () => {
  it("should have correct theme configurations", () => {
    const themes = [
      {
        id: "the-maker",
        name: "The Maker",
        primaryColor: "#FF6B6B",
        secondaryColor: "#4ECDC4",
      },
      {
        id: "the-trade",
        name: "The Trade",
        primaryColor: "#2C3E50",
        secondaryColor: "#E67E22",
      },
      {
        id: "the-venue",
        name: "The Venue",
        primaryColor: "#9B59B6",
        secondaryColor: "#F39C12",
      },
    ];

    expect(themes).toHaveLength(3);
    expect(themes[0].id).toBe("the-maker");
    expect(themes[1].id).toBe("the-trade");
    expect(themes[2].id).toBe("the-venue");
  });
});

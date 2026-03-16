import { describe, it, expect } from "vitest";
import {
  VIBE_PRESETS,
  getAllVibePresets,
  getVibePreset,
  getVibesByTheme,
  resolveVibeToConfig,
} from "../../../lib/config/vibePresets.js";
import {
  VALID_THEMES,
  VALID_HERO_LAYOUTS,
} from "../../../lib/schemas/siteConfigSchema.js";

describe("VIBE_PRESETS", () => {
  it("should have at least 6 presets", () => {
    expect(Object.keys(VIBE_PRESETS).length).toBeGreaterThanOrEqual(6);
  });

  it("should have all presets map to valid themes", () => {
    for (const [id, preset] of Object.entries(VIBE_PRESETS)) {
      expect(VALID_THEMES).toContain(preset.theme);
    }
  });

  it("should have all presets with valid hex colors", () => {
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    for (const [id, preset] of Object.entries(VIBE_PRESETS)) {
      expect(preset.colors.primary).toMatch(hexRegex);
      expect(preset.colors.accent).toMatch(hexRegex);
      expect(preset.colors.background).toMatch(hexRegex);
    }
  });

  it("should have all presets with valid hero layouts for their theme", () => {
    for (const [id, preset] of Object.entries(VIBE_PRESETS)) {
      const validLayouts = VALID_HERO_LAYOUTS[preset.theme];
      expect(validLayouts).toContain(preset.heroLayout);
    }
  });

  it("should have required fields on every preset", () => {
    for (const [id, preset] of Object.entries(VIBE_PRESETS)) {
      expect(preset.id).toBe(id);
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.emoji).toBeTruthy();
      expect(preset.font).toBeTruthy();
    }
  });

  it("should cover all 3 themes", () => {
    const themes = new Set(Object.values(VIBE_PRESETS).map((v) => v.theme));
    expect(themes.has("the-maker")).toBe(true);
    expect(themes.has("the-trade")).toBe(true);
    expect(themes.has("the-venue")).toBe(true);
  });
});

describe("getAllVibePresets", () => {
  it("should return all presets as an array", () => {
    const presets = getAllVibePresets();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBe(Object.keys(VIBE_PRESETS).length);
  });
});

describe("getVibePreset", () => {
  it("should return a specific preset by ID", () => {
    const preset = getVibePreset("rugged-pro");
    expect(preset).toBeTruthy();
    expect(preset.id).toBe("rugged-pro");
  });

  it("should return null for unknown IDs", () => {
    expect(getVibePreset("nonexistent")).toBeNull();
  });
});

describe("getVibesByTheme", () => {
  it("should filter presets by theme", () => {
    const makerVibes = getVibesByTheme("the-maker");
    expect(makerVibes.length).toBeGreaterThan(0);
    makerVibes.forEach((v) => expect(v.theme).toBe("the-maker"));
  });

  it("should return empty array for unknown theme", () => {
    expect(getVibesByTheme("nonexistent")).toHaveLength(0);
  });
});

describe("resolveVibeToConfig", () => {
  it("should resolve a vibe ID to SiteConfig-compatible object", () => {
    const config = resolveVibeToConfig("rugged-pro");
    expect(config).toBeTruthy();
    expect(config.theme).toBe("the-trade");
    expect(config.branding.primaryColor).toBe("#2C3E50");
    expect(config.branding.accentColor).toBe("#E67E22");
    expect(config.heroLayout).toBe("bold");
    expect(config.font).toBeTruthy();
  });

  it("should return null for unknown vibe ID", () => {
    expect(resolveVibeToConfig("nonexistent")).toBeNull();
  });
});

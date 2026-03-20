/**
 * Unit Tests — AI Listing Parser (ai-parser.js)
 *
 * Tests the Gemini-powered media parsing Server Action.
 * Mocks the fetch call to Gemini API to test:
 *   - Successful image-to-listing extraction
 *   - Graceful handling of malformed AI JSON
 *   - Zod validation with partial data fallback
 *   - Missing API key handling
 *   - Missing fileUrl/mimeType handling
 *   - Multi-media parsing
 *
 * @module __tests__/unit/actions/ai-parser.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock dependencies ─────────────────────────────────────────

// Mock the AI config
vi.mock('@/lib/config/aiConfig', () => ({
  AI_MODELS: { flash: 'gemini-test-model', lite: 'gemini-lite', pro: 'gemini-pro' },
  getGeminiModelEndpoint: (model) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
}));

// Track original env
const originalEnv = { ...process.env };

// ── Test Setup ────────────────────────────────────────────────

describe('parseMediaWithGemini', () => {
  let parseMediaWithGemini;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENAI_API_KEY = 'test-api-key-123';

    // Dynamic import to pick up fresh mocks
    const module = await import('../../../app/actions/ai-parser.js');
    parseMediaWithGemini = module.parseMediaWithGemini;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // ── Helper: mock a Gemini response ──────────────────────────
  function mockGeminiResponse(jsonData, httpStatus = 200) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: httpStatus >= 200 && httpStatus < 300,
      status: httpStatus,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: JSON.stringify(jsonData) }],
          },
        }],
      }),
      text: async () => JSON.stringify({ error: 'test error' }),
    });
  }

  // ── Happy Path ──────────────────────────────────────────────

  it('should parse an image and return valid listing data', async () => {
    const aiResponse = {
      type: 'good',
      title: 'Handmade Beeswax Candle',
      description: 'Beautiful handcrafted beeswax candle from Central Texas.',
      basePrice: 1999,
      billingModel: null,
      serviceRadiusMiles: null,
      suggestedVariants: [
        { axisName: 'Scent', values: ['Lavender', 'Vanilla', 'Unscented'] },
      ],
      confidence: 0.85,
    };
    mockGeminiResponse(aiResponse);

    const result = await parseMediaWithGemini(
      'https://firebasestorage.example.com/candle.jpg',
      'image/jpeg'
    );

    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data.type).toBe('good');
    expect(result.data.title).toBe('Handmade Beeswax Candle');
    expect(result.data.basePrice).toBe(1999);
    expect(result.data.suggestedVariants).toHaveLength(1);
    expect(result.data.confidence).toBe(0.85);
    expect(result.error).toBeNull();
  });

  it('should parse a service listing correctly', async () => {
    const aiResponse = {
      type: 'service',
      title: 'Professional Fence Repair',
      description: 'Expert cedar fence repair throughout the I-35 corridor.',
      basePrice: 7500,
      billingModel: 'hourly',
      serviceRadiusMiles: 25,
      suggestedVariants: [],
      confidence: 0.9,
    };
    mockGeminiResponse(aiResponse);

    const result = await parseMediaWithGemini(
      'https://firebasestorage.example.com/fence.jpg',
      'image/png'
    );

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('service');
    expect(result.data.billingModel).toBe('hourly');
    expect(result.data.serviceRadiusMiles).toBe(25);
  });

  // ── Validation & Edge Cases ─────────────────────────────────

  it('should return error when API key is missing', async () => {
    delete process.env.GOOGLE_GENAI_API_KEY;

    const result = await parseMediaWithGemini(
      'https://example.com/image.jpg',
      'image/jpeg'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not configured');
  });

  it('should return error when fileUrl is missing', async () => {
    const result = await parseMediaWithGemini(null, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should return error when mimeType is missing', async () => {
    const result = await parseMediaWithGemini('https://example.com/img.jpg', null);

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should handle Gemini API HTTP errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await parseMediaWithGemini(
      'https://example.com/image.jpg',
      'image/jpeg'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('error');
  });

  it('should handle empty Gemini response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '' }] } }],
      }),
    });

    const result = await parseMediaWithGemini(
      'https://example.com/image.jpg',
      'image/jpeg'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should handle malformed JSON from Gemini', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'not json at all {{{' }] } }],
      }),
    });

    const result = await parseMediaWithGemini(
      'https://example.com/image.jpg',
      'image/jpeg'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('malformed');
  });

  it('should fallback gracefully on partial AI data with warnings', async () => {
    // AI returns some fields but with invalid values
    const partialResponse = {
      type: 'good',
      title: 'Some Product',
      description: 123, // Invalid: should be string
      basePrice: 'not a number', // Invalid
      confidence: 'high', // Invalid: should be number
    };
    mockGeminiResponse(partialResponse);

    const result = await parseMediaWithGemini(
      'https://example.com/image.jpg',
      'image/jpeg'
    );

    // Should succeed with warnings, not fail entirely
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data.title).toBe('Some Product');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should call Gemini API with correct parameters', async () => {
    mockGeminiResponse({
      type: 'good',
      title: 'Test',
      description: 'Test desc',
      basePrice: 100,
      confidence: 0.5,
    });

    await parseMediaWithGemini(
      'https://example.com/image.jpg',
      'image/jpeg'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];

    // Should use the centralized model config
    expect(url).toContain('gemini-test-model');
    expect(url).toContain('test-api-key-123');

    // Should send the image as fileData
    const body = JSON.parse(options.body);
    expect(body.contents[0].parts).toHaveLength(2); // text prompt + fileData
    expect(body.contents[0].parts[1].fileData.mimeType).toBe('image/jpeg');
    expect(body.contents[0].parts[1].fileData.fileUri).toBe('https://example.com/image.jpg');

    // Should use low temperature for factual extraction
    expect(body.generationConfig.temperature).toBe(0.3);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await parseMediaWithGemini(
      'https://example.com/image.jpg',
      'image/jpeg'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('unexpected error');
  });
});

describe('parseMultipleMedia', () => {
  let parseMultipleMedia;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENAI_API_KEY = 'test-api-key-123';

    const module = await import('../../../app/actions/ai-parser.js');
    parseMultipleMedia = module.parseMultipleMedia;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should return error for empty media array', async () => {
    const result = await parseMultipleMedia([]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No media');
  });

  it('should return error for null input', async () => {
    const result = await parseMultipleMedia(null);
    expect(result.success).toBe(false);
  });

  it('should analyze the first image and note additional ones', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                type: 'good',
                title: 'Test Product',
                description: 'A test product',
                basePrice: 2500,
                confidence: 0.8,
              }),
            }],
          },
        }],
      }),
    });

    const result = await parseMultipleMedia([
      { url: 'https://example.com/img1.jpg', mimeType: 'image/jpeg' },
      { url: 'https://example.com/img2.jpg', mimeType: 'image/jpeg' },
      { url: 'https://example.com/img3.jpg', mimeType: 'image/png' },
    ]);

    expect(result.success).toBe(true);
    expect(result.data.additionalMediaUrls).toHaveLength(2);
    // Should have a warning about additional images
    expect(result.warnings.some(w => w.includes('additional image'))).toBe(true);
  });
});

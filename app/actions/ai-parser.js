/**
 * AI Listing Parser — Server Action
 *
 * "use server" — Wraps the Gemini REST API to analyze uploaded media
 * (photos) and extract structured listing data: type, title, description,
 * price, billing model, and potential variant options.
 *
 * This is the core of the "Magic Fill" system. Users upload a photo of
 * their product or service, Gemini analyzes it, and the response auto-fills
 * the manual form fields for human review before publishing.
 *
 * Architecture Notes:
 *   - Uses the centralized AI model registry (aiConfig.js) — never hardcodes model strings
 *   - Forces `responseMimeType: "application/json"` for structured output
 *   - Zod-validates the AI response before returning to the client
 *   - Gracefully degrades on invalid AI output (returns partial data with warnings)
 *
 * Golden Rules Enforced:
 *   1. Upload Rule: Only receives string URLs, never File/Blob objects
 *   2. Money Rule: Extracts prices as integer cents
 *
 * @module actions/ai-parser
 */

'use server';

import { z } from 'zod';

// ───────────────────────────────────────────────
// AI Config (centralized model registry)
// ───────────────────────────────────────────────

import { AI_MODELS, getGeminiModelEndpoint } from '@/lib/config/aiConfig';

// ───────────────────────────────────────────────
// Response Schema (Zod validation for AI output)
// ───────────────────────────────────────────────

const aiListingResponseSchema = z.object({
  type: z.enum(['good', 'service']).default('good'),
  title: z.string().min(1).max(100).default('Untitled'),
  description: z.string().max(2000).default(''),
  basePrice: z.number().int().nonnegative().default(0),

  // Service-specific
  billingModel: z.enum(['hourly', 'flat', 'quote']).nullable().optional(),
  serviceRadiusMiles: z.number().nonnegative().nullable().optional(),

  // Good-specific
  suggestedVariants: z.array(z.object({
    axisName: z.string(),
    values: z.array(z.string()),
  })).optional().default([]),

  // Confidence metadata
  confidence: z.number().min(0).max(1).optional().default(0.5),
});

// ───────────────────────────────────────────────
// System Prompt
// ───────────────────────────────────────────────

const LISTING_PARSE_PROMPT = `You are an AI assistant for a Central Texas local marketplace called CentralTexas.com.

Your job: analyze the provided image and extract structured data for a marketplace listing.

RULES:
1. Determine if this is a PHYSICAL GOOD (product, merchandise, food) or a SERVICE (repair, lessons, consulting)
2. Write a compelling but honest title (under 80 characters)
3. Write a clear description (2-3 sentences) highlighting what makes it special
4. Estimate a realistic price in US CENTS (e.g., $25.00 = 2500, $149.99 = 14999)
5. For services: suggest a billingModel ("hourly", "flat", or "quote")
6. For goods: suggest logical variant axes if applicable (e.g., Color, Size, Flavor)
7. Rate your confidence from 0.0 to 1.0

PRICE GUIDE (ALWAYS in cents, NEVER dollars):
- A small handmade candle: 1200-2500 (i.e., $12-$25)
- A branded t-shirt: 1999-3499 (i.e., $19.99-$34.99)
- Hourly yard work: 4000-7500 (i.e., $40-$75/hr)
- A fence repair job: 15000-50000 (i.e., $150-$500)

CRITICAL: Output ONLY valid JSON matching this exact schema:
{
  "type": "good" | "service",
  "title": "string",
  "description": "string (2-3 sentences)",
  "basePrice": integer (IN CENTS, not dollars!),
  "billingModel": "hourly" | "flat" | "quote" | null,
  "serviceRadiusMiles": number | null,
  "suggestedVariants": [{ "axisName": "string", "values": ["string"] }],
  "confidence": number (0.0-1.0)
}`;

// ───────────────────────────────────────────────
// Main Parser Function
// ───────────────────────────────────────────────

/**
 * Parse an uploaded image with Gemini and extract structured listing data.
 *
 * @param {string} fileUrl  - The Firebase Storage download URL of the uploaded image
 * @param {string} mimeType - The MIME type of the file (e.g., 'image/jpeg')
 * @returns {Promise<{
 *   success: boolean,
 *   data: Object|null,
 *   warnings: string[],
 *   error: string|null
 * }>}
 */
export async function parseMediaWithGemini(fileUrl, mimeType) {
  const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error('[ai-parser] GOOGLE_GENAI_API_KEY is not configured');
    return {
      success: false,
      data: null,
      warnings: [],
      error: 'AI service is not configured. Please contact support.',
    };
  }

  if (!fileUrl || !mimeType) {
    return {
      success: false,
      data: null,
      warnings: [],
      error: 'File URL and MIME type are required.',
    };
  }

  const endpoint = `${getGeminiModelEndpoint(AI_MODELS.flash)}?key=${GEMINI_API_KEY}`;

  console.log('[ai-parser] Parsing media:', { mimeType, model: AI_MODELS.flash });

  try {
    // ── Step 1: Call Gemini with the image ──────────────────
    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: LISTING_PARSE_PROMPT },
          {
            fileData: {
              mimeType,
              fileUri: fileUrl,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.3,       // Low temperature for factual extraction
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[ai-parser] Gemini API error:', response.status, errorBody);
      return {
        success: false,
        data: null,
        warnings: [],
        error: `AI service returned an error (${response.status}). Please try again.`,
      };
    }

    const responseData = await response.json();
    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error('[ai-parser] Empty response from Gemini');
      return {
        success: false,
        data: null,
        warnings: [],
        error: 'AI returned an empty response. Please try a different image.',
      };
    }

    // ── Step 2: Parse and clean the JSON ──────────────────
    let parsed;
    try {
      const cleaned = rawText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('[ai-parser] Failed to parse AI JSON:', parseError.message, rawText);
      return {
        success: false,
        data: null,
        warnings: [],
        error: 'AI returned malformed data. Please try a different image.',
      };
    }

    // ── Step 3: Validate with Zod (graceful) ──────────────
    const warnings = [];
    const zodResult = aiListingResponseSchema.safeParse(parsed);

    let validatedData;
    if (zodResult.success) {
      validatedData = zodResult.data;
    } else {
      // Partial extraction — use defaults for invalid fields
      warnings.push(
        ...zodResult.error.issues.map(
          (issue) => `Field "${issue.path.join('.')}": ${issue.message}`
        )
      );

      // Attempt manual cleanup with safe defaults
      validatedData = {
        type: parsed.type === 'service' ? 'service' : 'good',
        title: (typeof parsed.title === 'string' && parsed.title.length > 0)
          ? parsed.title.slice(0, 100)
          : 'Untitled',
        description: (typeof parsed.description === 'string')
          ? parsed.description.slice(0, 2000)
          : '',
        basePrice: (typeof parsed.basePrice === 'number' && Number.isInteger(parsed.basePrice) && parsed.basePrice >= 0)
          ? parsed.basePrice
          : 0,
        billingModel: ['hourly', 'flat', 'quote'].includes(parsed.billingModel)
          ? parsed.billingModel
          : null,
        serviceRadiusMiles: (typeof parsed.serviceRadiusMiles === 'number')
          ? parsed.serviceRadiusMiles
          : null,
        suggestedVariants: Array.isArray(parsed.suggestedVariants)
          ? parsed.suggestedVariants
          : [],
        confidence: (typeof parsed.confidence === 'number')
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.5,
      };

      console.warn('[ai-parser] Partial validation — using safe defaults:', warnings);
    }

    console.log(
      `[ai-parser] ✅ Parsed: type=${validatedData.type}, title="${validatedData.title}", ` +
      `price=${validatedData.basePrice}¢, confidence=${validatedData.confidence}`
    );

    return {
      success: true,
      data: validatedData,
      warnings,
      error: null,
    };
  } catch (error) {
    console.error('[ai-parser] Unexpected error:', error);
    return {
      success: false,
      data: null,
      warnings: [],
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Parse multiple images to build a richer listing.
 * Passes the first image individually and uses the response as the base.
 *
 * @param {Array<{ url: string, mimeType: string }>} mediaItems - Array of uploaded media
 * @returns {Promise<{ success: boolean, data: Object|null, warnings: string[], error: string|null }>}
 */
export async function parseMultipleMedia(mediaItems) {
  if (!mediaItems || mediaItems.length === 0) {
    return {
      success: false,
      data: null,
      warnings: [],
      error: 'No media provided for analysis.',
    };
  }

  // Use the first image as the primary analysis source
  const primary = mediaItems[0];
  const result = await parseMediaWithGemini(primary.url, primary.mimeType);

  if (result.success && mediaItems.length > 1) {
    // Add remaining URLs as additional media
    result.data.additionalMediaUrls = mediaItems.slice(1).map((m) => m.url);
    result.warnings.push(
      `${mediaItems.length - 1} additional image(s) will be attached to the listing.`
    );
  }

  return result;
}

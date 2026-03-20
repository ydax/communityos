import { NextResponse } from "next/server";
import logger from "../../../../lib/logger.js";

export const maxDuration = 60;

const log = logger("api-generate-site");


/**
 * POST /api/ai/generate-site
 *
 * Generates 3 SiteConfig variations from raw business input via Gemini AI.
 *
 * Request body:
 *   - businessName (string, required)
 *   - businessStory (string, required) - from speech-to-text or typed input
 *   - category (string, required) - business category
 *   - vibePreset (string, optional) - selected vibe preset ID
 *
 * Response:
 *   - success (boolean)
 *   - variations (SiteConfig[]) - 3 generated site configurations
 *   - error (string|null)
 */

const {
  AI_MODELS,
  getGeminiModelEndpoint,
} = require("../../../../lib/config/aiConfig.js");

/**
 * Calls Gemini via the Google GenAI SDK (using the centrally configured model)
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>}
 */
async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not configured");
  }

  const endpoint = `${getGeminiModelEndpoint(AI_MODELS.flash)}?key=${apiKey}`;

  log.debug("[callGemini] Sending request", {
    model: AI_MODELS.flash,
    promptLength: userPrompt.length,
  });

  const timer = log.startTimer("gemini-api-call", { model: AI_MODELS.flash });

  // Use the REST API directly to avoid SDK import issues in edge/serverless
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    timer.end({ success: false, httpStatus: response.status });
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    timer.end({ success: false, reason: "empty-response" });
    throw new Error("No content in Gemini response");
  }

  timer.end({ success: true, responseLength: text.length });
  return text;
}

// Simple in-memory rate limiter (per IP, per hour)
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const requestTimer = log.startTimer("site-generation-request", { requestId });

  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      log.warn("Rate limit exceeded", { requestId, ip });
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          variations: [],
        },
        { status: 429 },
      );
    }

    // Parse and validate input
    const body = await request.json();
    const { businessName, businessStory, category, vibePreset } = body;

    log.info("Site generation started", {
      requestId,
      businessName: businessName?.substring(0, 50),
      category,
      vibePreset,
    });


    if (!businessName?.trim()) {
      return NextResponse.json(
        { success: false, error: "businessName is required", variations: [] },
        { status: 400 },
      );
    }

    if (!businessStory?.trim()) {
      return NextResponse.json(
        { success: false, error: "businessStory is required", variations: [] },
        { status: 400 },
      );
    }

    if (!category?.trim()) {
      return NextResponse.json(
        { success: false, error: "category is required", variations: [] },
        { status: 400 },
      );
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitizedInput = {
      businessName: businessName.trim().substring(0, 100),
      businessStory: businessStory.trim().substring(0, 5000),
      category: category.trim(),
      vibePreset: vibePreset || null,
    };

    // Import and run the generator
    const {
      generateVariations,
    } = require("../../../../lib/aiServices/siteGenerator.js");

    const result = await generateVariations(sanitizedInput, { callGemini });

    if (!result.success) {
      log.error("Site generation failed", new Error(result.error), { requestId });
      requestTimer.end({ success: false });
      return NextResponse.json(
        { success: false, error: result.error, variations: [] },
        { status: 500 },
      );
    }

    log.info("Site generation completed", {
      requestId,
      variationCount: result.variations.length,
      themes: result.variations.map((v) => v.theme),
    });
    requestTimer.end({ success: true, variationCount: result.variations.length });

    return NextResponse.json({
      success: true,
      variations: result.variations,
      error: null,
    });
  } catch (err) {
    log.error("Site generation unexpected error", err, { requestId });
    requestTimer.end({ success: false });
    return NextResponse.json(
      { success: false, error: "Internal server error", variations: [] },
      { status: 500 },
    );
  }
}

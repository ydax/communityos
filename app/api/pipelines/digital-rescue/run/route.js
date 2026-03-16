import { NextResponse } from "next/server";
import { runDigitalRescuePipeline } from "@/lib/pipelines/digital-rescue/index.js";

/**
 * POST /api/pipelines/digital-rescue/run
 *
 * Triggers a pipeline run for a given campaignId.
 * Admin-only — this route must be protected before any real outreach runs.
 *
 * Query Params:
 *   - campaignId (required): the Firestore campaigns/{id} to attribute leads to
 *
 * Response:
 *   { processed, staged, skipped, errors }
 */
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");

  if (!campaignId) {
    return NextResponse.json(
      { error: "campaignId query param is required" },
      { status: 400 },
    );
  }

  try {
    console.log(
      `[pipeline-api] Starting Digital Rescue run for campaign: ${campaignId}`,
    );
    const summary = await runDigitalRescuePipeline({ campaignId });

    return NextResponse.json({
      success: true,
      campaignId,
      summary,
    });
  } catch (err) {
    console.error("[pipeline-api] Digital Rescue pipeline error:", err.message);
    return NextResponse.json(
      { error: err.message || "Pipeline run failed" },
      { status: 500 },
    );
  }
}

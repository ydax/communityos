import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin.js";
import {
  createSite,
  getSiteById,
  updateSite,
  listSitesByOwner,
} from "../../../lib/dbServices/sitesService.js";

/**
 * Structured logging helper
 * @param {string} level - Log level: 'info', 'warn', 'error'
 * @param {string} message - Log message
 * @param {Object} metadata - Additional structured data
 */
function log(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    service: "api-sites",
    ...metadata,
  };

  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * GET /api/sites - List sites by owner
 * Query params: ownerId
 */
export async function GET(request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    log("info", "GET /api/sites request received", {
      requestId,
      ownerId,
    });

    if (!ownerId) {
      log("warn", "GET /api/sites validation failed", {
        requestId,
        error: "ownerId missing",
      });

      return NextResponse.json(
        { error: "ownerId query parameter is required" },
        {
          status: 400,
          headers: { "x-request-id": requestId },
        },
      );
    }

    const sites = await listSitesByOwner(adminDb, ownerId);

    const duration = Date.now() - startTime;
    log("info", "GET /api/sites successful", {
      requestId,
      ownerId,
      siteCount: sites.length,
      duration,
    });

    return NextResponse.json(
      {
        success: true,
        sites,
      },
      {
        headers: { "x-request-id": requestId },
      },
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    log("error", "GET /api/sites error", {
      requestId,
      error: error.message,
      stack: error.stack,
      duration,
    });

    return NextResponse.json(
      { error: "Failed to fetch sites" },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }
}

/**
 * POST /api/sites - Create a new site
 * Body: { domain, ownerId, businessName, theme, sections }
 */
export async function POST(request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Sanitize body for logging (remove sensitive data if any)
    const sanitizedBody = {
      domain: body.domain,
      ownerId: body.ownerId ? "***" : undefined,
      businessName: body.businessName,
      theme: body.theme,
      hasSections: !!body.sections,
    };

    log("info", "POST /api/sites request received", {
      requestId,
      body: sanitizedBody,
    });

    // Validate required fields
    if (!body.domain || !body.ownerId) {
      log("warn", "POST /api/sites validation failed", {
        requestId,
        error: "Missing required fields",
        missingFields: {
          domain: !body.domain,
          ownerId: !body.ownerId,
        },
      });

      return NextResponse.json(
        {
          error: "domain and ownerId are required",
          missingFields: {
            domain: !body.domain,
            ownerId: !body.ownerId,
          },
        },
        {
          status: 400,
          headers: { "x-request-id": requestId },
        },
      );
    }

    // Create site
    const siteId = await createSite(adminDb, body);

    const duration = Date.now() - startTime;
    log("info", "POST /api/sites successful", {
      requestId,
      siteId,
      domain: body.domain,
      duration,
    });

    // Return a serialization-safe response (no raw Firestore Timestamps)
    return NextResponse.json(
      {
        success: true,
        site: {
          id: siteId,
          domain: body.domain,
          businessName: body.businessName,
          theme: body.theme,
          status: "active",
        },
      },
      {
        status: 201,
        headers: { "x-request-id": requestId },
      },
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle domain already in use
    if (error.message.includes("already in use")) {
      log("warn", "POST /api/sites domain conflict", {
        requestId,
        error: error.message,
        duration,
      });

      return NextResponse.json(
        { error: error.message },
        {
          status: 409,
          headers: { "x-request-id": requestId },
        },
      );
    }

    // Generic error
    log("error", "POST /api/sites error", {
      requestId,
      error: error.message,
      stack: error.stack,
      duration,
    });

    return NextResponse.json(
      { error: "Failed to create site" },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }
}

/**
 * PATCH /api/sites/:id - Update a site
 * Body: { updates object }
 */
export async function PATCH(request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("id");

    log("info", "PATCH /api/sites request received", {
      requestId,
      siteId,
    });

    if (!siteId) {
      log("warn", "PATCH /api/sites validation failed", {
        requestId,
        error: "siteId missing",
      });

      return NextResponse.json(
        { error: "id query parameter is required" },
        {
          status: 400,
          headers: { "x-request-id": requestId },
        },
      );
    }

    const updates = await request.json();

    await updateSite(adminDb, siteId, updates);

    // Fetch updated site
    const site = await getSiteById(adminDb, siteId);

    const duration = Date.now() - startTime;
    log("info", "PATCH /api/sites successful", {
      requestId,
      siteId,
      duration,
    });

    return NextResponse.json(
      {
        success: true,
        site,
      },
      {
        headers: { "x-request-id": requestId },
      },
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    log("error", "PATCH /api/sites error", {
      requestId,
      error: error.message,
      stack: error.stack,
      duration,
    });

    return NextResponse.json(
      { error: "Failed to update site" },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }
}

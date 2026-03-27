import { NextResponse } from "next/server";

/**
 * Multi-Tenant Middleware for CentralTexas.com
 * Intercepts requests and routes based on custom domain with caching and structured logging
 *
 * Features:
 * - Domain caching (5-minute TTL to reduce Firestore reads)
 * - Structured logging for observability
 * - Comprehensive error handling
 * - Subdomain support (*.centraltexas.com)
 */

// Domain cache (in-memory, resets on deployment)
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    service: "middleware",
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
 * Check if domain is cached and still valid
 * @param {string} hostname - Domain to check
 * @returns {Object|null} Cached domain data or null
 */
function getCachedDomain(hostname) {
  const cached = domainCache.get(hostname);

  if (!cached) {
    return null;
  }

  const now = Date.now();
  const age = now - cached.timestamp;

  if (age > CACHE_TTL) {
    // Cache expired
    domainCache.delete(hostname);
    log("info", "Domain cache expired", { hostname, age });
    return null;
  }

  log("info", "Domain cache hit", { hostname, age });
  return cached.data;
}

/**
 * Cache domain data
 * @param {string} hostname - Domain to cache
 * @param {Object} data - Domain data to cache
 */
function cacheDomain(hostname, data) {
  domainCache.set(hostname, {
    data,
    timestamp: Date.now(),
  });

  log("info", "Domain cached", { hostname, cacheSize: domainCache.size });
}

/**
 * Extract subdomain from hostname
 * @param {string} hostname - Full hostname
 * @returns {string|null} Subdomain or null
 */
function extractSubdomain(hostname) {
  // Remove port if present
  const cleanHostname = hostname.split(":")[0];

  // Check if it's a centraltexas.com subdomain
  if (cleanHostname.endsWith(".centraltexas.com")) {
    const parts = cleanHostname.split(".");
    if (parts.length >= 3) {
      // Return subdomain (everything before .centraltexas.com)
      return parts.slice(0, -2).join(".");
    }
  }

  return null;
}

/**
 * Determine if hostname is main CentralTexas.com domain
 * @param {string} hostname - Hostname to check
 * @returns {boolean}
 */
function isMainDomain(hostname) {
  const cleanHostname = hostname.split(":")[0];

  return (
    cleanHostname === "centraltexas.com" ||
    cleanHostname === "www.centraltexas.com" ||
    cleanHostname.endsWith(".vercel.app") || // Vercel preview domains
    cleanHostname === "localhost" ||
    cleanHostname === "127.0.0.1"
  );
}

export async function middleware(request) {
  const startTime = Date.now();
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;
  const requestId = crypto.randomUUID();
  const isDevelopment = process.env.NODE_ENV === "development";

  try {
    // Skip middleware for certain paths (applies to ALL domains)
    if (
      pathname.startsWith("/_next") || // Next.js internals
      pathname.startsWith("/api") || // API routes (handle their own logic)
      pathname.startsWith("/static") || // Static files
      pathname.includes(".") // Files with extensions (images, etc.)
    ) {
      const response = NextResponse.next();

      // Add debug headers in development
      if (isDevelopment) {
        response.headers.set("x-debug-middleware-decision", "skip");
        response.headers.set("x-debug-pathname", pathname);
        response.headers.set("x-request-id", requestId);
      }

      return response;
    }

    // Check if this is the main CentralTexas.com domain
    if (isMainDomain(hostname)) {
      log("info", "Main domain request", {
        requestId,
        hostname,
        pathname,
      });

      // Protect /dashboard routes
      if (pathname.startsWith("/dashboard")) {
        const session = request.cookies.get("session")?.value;
        if (!session) {
          log("warn", "Unauthenticated attempt to access dashboard", { pathname });
          const loginUrl = new URL("/login", request.url);
          return NextResponse.redirect(loginUrl);
        }
      }

      const response = NextResponse.next();

      // Tenant context for cart scoping: main domain = marketplace
      response.headers.set("x-tenant-id", "marketplace");

      // Add debug headers in development
      if (isDevelopment) {
        response.headers.set("x-debug-middleware-decision", "main_domain");
        response.headers.set("x-debug-hostname", hostname);
        response.headers.set("x-request-id", requestId);
      }

      return response;
    }

    // Check for subdomain
    const subdomain = extractSubdomain(hostname);
    if (subdomain) {
      log("info", "Subdomain detected", {
        requestId,
        hostname,
        subdomain,
        pathname,
      });

      // Check cache for subdomain
      const cached = getCachedDomain(subdomain);
      if (cached) {
        const rewriteUrl = new URL(`/${subdomain}${pathname}`, request.url);
        const response = NextResponse.rewrite(rewriteUrl);
        response.headers.set("x-custom-domain", subdomain);
        response.headers.set("x-domain-type", "subdomain");
        response.headers.set("x-tenant-id", subdomain);
        response.headers.set("x-cache-hit", "true");

        // Add debug headers in development
        if (isDevelopment) {
          response.headers.set("x-debug-middleware-decision", "subdomain");
          response.headers.set(
            "x-debug-rewrite-target",
            `/${subdomain}${pathname}`,
          );
          response.headers.set("x-debug-cache-status", "hit");
          response.headers.set("x-debug-domain-type", "subdomain");
          response.headers.set("x-request-id", requestId);
        }

        const duration = Date.now() - startTime;
        log("info", "Subdomain routed (cached)", {
          requestId,
          subdomain,
          pathname,
          duration,
        });

        return response;
      }

      // Subdomain not in cache - pass to route for Firestore lookup
      const rewriteUrl = new URL(`/${subdomain}${pathname}`, request.url);
      const response = NextResponse.rewrite(rewriteUrl);
      response.headers.set("x-custom-domain", subdomain);
      response.headers.set("x-domain-type", "subdomain");
      response.headers.set("x-tenant-id", subdomain);
      response.headers.set("x-cache-hit", "false");

      // Add debug headers in development
      if (isDevelopment) {
        response.headers.set("x-debug-middleware-decision", "subdomain");
        response.headers.set(
          "x-debug-rewrite-target",
          `/${subdomain}${pathname}`,
        );
        response.headers.set("x-debug-cache-status", "miss");
        response.headers.set("x-debug-domain-type", "subdomain");
        response.headers.set("x-request-id", requestId);
      }

      // Cache the subdomain for future requests
      cacheDomain(subdomain, { type: "subdomain", domain: subdomain });

      const duration = Date.now() - startTime;
      log("info", "Subdomain routed (new)", {
        requestId,
        subdomain,
        pathname,
        duration,
      });

      return response;
    }

    // Custom domain detected
    log("info", "Custom domain detected", {
      requestId,
      hostname,
      pathname,
    });

    // Check cache for custom domain
    const cleanHostname = hostname.split(":")[0];
    const cached = getCachedDomain(hostname);
    if (cached) {
      const rewriteUrl = new URL(`/${cleanHostname}${pathname}`, request.url);
      const response = NextResponse.rewrite(rewriteUrl);
      response.headers.set("x-custom-domain", hostname);
      response.headers.set("x-domain-type", "custom");
      response.headers.set("x-tenant-id", cleanHostname);
      response.headers.set("x-cache-hit", "true");

      // Add debug headers in development
      if (isDevelopment) {
        response.headers.set("x-debug-middleware-decision", "custom_domain");
        response.headers.set(
          "x-debug-rewrite-target",
          `/${cleanHostname}${pathname}`,
        );
        response.headers.set("x-debug-cache-status", "hit");
        response.headers.set("x-debug-domain-type", "custom");
        response.headers.set("x-request-id", requestId);
      }

      const duration = Date.now() - startTime;
      log("info", "Custom domain routed (cached)", {
        requestId,
        hostname,
        pathname,
        duration,
      });

      return response;
    }

    // Custom domain not in cache - pass to route for Firestore lookup
    const rewriteUrl = new URL(`/${cleanHostname}${pathname}`, request.url);
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-custom-domain", hostname);
    response.headers.set("x-domain-type", "custom");
    response.headers.set("x-tenant-id", cleanHostname);
    response.headers.set("x-cache-hit", "false");
    response.headers.set("x-request-id", requestId);

    // Add debug headers in development
    if (isDevelopment) {
      response.headers.set("x-debug-middleware-decision", "custom_domain");
      response.headers.set(
        "x-debug-rewrite-target",
        `/${cleanHostname}${pathname}`,
      );
      response.headers.set("x-debug-cache-status", "miss");
      response.headers.set("x-debug-domain-type", "custom");
    }

    // Cache the custom domain for future requests
    cacheDomain(hostname, { type: "custom", domain: hostname });

    const duration = Date.now() - startTime;
    log("info", "Custom domain routed (new)", {
      requestId,
      hostname,
      pathname,
      duration,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    log("error", "Middleware error", {
      requestId,
      hostname,
      pathname,
      error: error.message,
      stack: error.stack,
      duration,
    });

    // Return 500 error response
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to process request",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
      },
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

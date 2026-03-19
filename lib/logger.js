/**
 * lib/logger.js
 *
 * Centralized structured logger backed by Google Cloud Logging.
 *
 * - In production (NODE_ENV=production or GOOGLE_CLOUD_PROJECT is set),
 *   logs are shipped to Cloud Logging via the @google-cloud/logging SDK.
 * - In development, logs are pretty-printed as structured JSON to stdout/stderr
 *   so Vercel, local console, and Cloud Logging all read them identically.
 *
 * Usage:
 *   import logger from '@/lib/logger';
 *   const log = logger('api-sites');          // creates a child logger with a service label
 *
 *   log.info('Site created', { siteId, ownerId, durationMs });
 *   log.warn('Rate limit approaching', { ip, remaining });
 *   log.error('Unexpected failure', err, { requestId });
 *
 * The log level follows the Google Cloud Logging severity enum:
 *   DEBUG < INFO < NOTICE < WARNING < ERROR < CRITICAL
 */

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  null;

const LOG_NAME = process.env.GOOGLE_CLOUD_LOG_NAME || "communityos";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Lazy singleton — only initialized on first write in a Cloud-enabled env.
// We use a dynamic require() (not a top-level ESM import) so that webpack
// does NOT try to bundle @google-cloud/logging at build time. The package
// relies on native Node APIs and will only ever be loaded at runtime on
// a real Node.js server (Vercel serverless runtime).
let cloudLog = null;

function getCloudLog() {
  if (cloudLog) return cloudLog;
  if (!PROJECT_ID) return null;

  try {
    // Dynamic require keeps this out of the webpack bundle
    const { Logging } = require("@google-cloud/logging");
    const logging = new Logging({ projectId: PROJECT_ID });
    cloudLog = logging.log(LOG_NAME);
    return cloudLog;
  } catch {
    // Credentials not available — fall back to console
    return null;
  }
}

// --------------------------------------------------------------------------
// Core write function
// --------------------------------------------------------------------------
async function write(service, severity, message, data = {}) {
  const timestamp = new Date().toISOString();

  // Flatten any Error objects into serialisable fields
  const serialisedData = { ...data };
  if (data instanceof Error) {
    serialisedData.errorMessage = data.message;
    serialisedData.stack = data.stack;
  } else if (data.error instanceof Error) {
    serialisedData.error = {
      message: data.error.message,
      stack: data.error.stack,
    };
  }

  const payload = {
    timestamp,
    severity,
    service,
    message,
    ...serialisedData,
  };

  // Always print to stdout so Vercel captures it
  const consoleFn =
    severity === "ERROR" || severity === "CRITICAL"
      ? console.error
      : severity === "WARNING"
        ? console.warn
        : console.log;

  consoleFn(JSON.stringify(payload));

  // Ship to Cloud Logging in production (or when GOOGLE_CLOUD_PROJECT is set)
  if (IS_PRODUCTION || PROJECT_ID) {
    const log = getCloudLog();
    if (log) {
      try {
        const metadata = {
          severity,
          resource: { type: "global" },
          labels: { service },
        };
        const entry = log.entry(metadata, payload);
        // Fire-and-forget — don't await to avoid blocking the response
        log.write(entry).catch(() => {
          // Silently ignore Cloud Logging write errors to prevent cascading failures
        });
      } catch {
        // Cloud Logging unavailable — already logged to console above
      }
    }
  }
}

// --------------------------------------------------------------------------
// Child logger factory
// --------------------------------------------------------------------------
/**
 * Creates a child logger scoped to a specific service/component.
 *
 * @param {string} service - e.g. 'api-sites', 'api-generate-site', 'siteGenerator'
 * @returns {{ debug, info, warn, error, critical, startTimer }}
 */
function logger(service) {
  return {
    /** Development-only diagnostic information */
    debug: (msg, data) => {
      if (!IS_PRODUCTION) write(service, "DEBUG", msg, data);
    },

    /** Normal operational events (site created, request received, etc.) */
    info: (msg, data) => write(service, "INFO", msg, data),

    /** Something unexpected but recoverable */
    warn: (msg, data) => write(service, "WARNING", msg, data),

    /**
     * A recoverable error that should be investigated.
     * @param {string} msg
     * @param {Error|Object} errOrData - Pass an Error as second arg for automatic stack capture.
     * @param {Object} [extra] - Additional metadata
     */
    error: (msg, errOrData, extra = {}) => {
      const data =
        errOrData instanceof Error
          ? { error: { message: errOrData.message, stack: errOrData.stack }, ...extra }
          : { ...errOrData, ...extra };
      write(service, "ERROR", msg, data);
    },

    /** Unrecoverable / requires immediate attention */
    critical: (msg, data) => write(service, "CRITICAL", msg, data),

    /**
     * Convenience: start a timer, call the returned `end()` to log duration.
     *
     * @example
     *   const timer = log.startTimer('gemini-call', { requestId });
     *   const result = await callGemini(...);
     *   timer.end({ tokensUsed: result.tokens });
     *
     * @param {string} operationName
     * @param {Object} [startData]
     * @returns {{ end: (endData?: Object) => void }}
     */
    startTimer: (operationName, startData = {}) => {
      const start = Date.now();
      write(service, "INFO", `[START] ${operationName}`, startData);
      return {
        end: (endData = {}) => {
          const durationMs = Date.now() - start;
          write(service, "INFO", `[END] ${operationName}`, {
            ...endData,
            durationMs,
          });
        },
      };
    },
  };
}

export default logger;

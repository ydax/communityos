/**
 * Safe Fetch API Client Wrapper
 * Provides robust error handling for API calls with structured responses
 */

/**
 * Generate a unique request ID for tracking
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
    service: "api-client",
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
 * Safe fetch wrapper with comprehensive error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} Structured response: { success, data, error, requestId }
 */
export async function safeFetch(url, options = {}) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Ensure headers object exists
  const headers = {
    "Content-Type": "application/json",
    "X-Request-Id": requestId,
    ...options.headers,
  };

  const fetchOptions = {
    ...options,
    headers,
  };

  log("info", "API request started", {
    requestId,
    url,
    method: options.method || "GET",
  });

  try {
    // Attempt the fetch request
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    // Try to parse JSON response
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      log("error", "Failed to parse JSON response", {
        requestId,
        url,
        status: response.status,
        parseError: parseError.message,
        duration,
      });

      return {
        success: false,
        error: "Invalid response format from server",
        requestId,
        statusCode: response.status,
      };
    }

    // Check if response is successful
    if (!response.ok) {
      log("warn", "API request failed", {
        requestId,
        url,
        status: response.status,
        error: data.error || "Request failed",
        duration,
      });

      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
        requestId,
        statusCode: response.status,
        data,
      };
    }

    // Success
    log("info", "API request successful", {
      requestId,
      url,
      status: response.status,
      duration,
    });

    return {
      success: true,
      data,
      requestId,
      statusCode: response.status,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle network errors (offline, timeout, DNS failure, etc.)
    const isNetworkError =
      error.name === "TypeError" ||
      error.message.includes("fetch") ||
      error.message.includes("network");

    log("error", isNetworkError ? "Network error" : "API request error", {
      requestId,
      url,
      error: error.message,
      errorType: error.name,
      duration,
    });

    return {
      success: false,
      error: isNetworkError
        ? "Network error. Please check your internet connection and try again."
        : error.message,
      requestId,
      isNetworkError,
    };
  }
}

/**
 * GET request helper
 * @param {string} url - API endpoint URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Structured response
 */
export async function get(url, options = {}) {
  return safeFetch(url, {
    ...options,
    method: "GET",
  });
}

/**
 * POST request helper
 * @param {string} url - API endpoint URL
 * @param {Object} body - Request body (will be JSON stringified)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Structured response
 */
export async function post(url, body, options = {}) {
  return safeFetch(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request helper
 * @param {string} url - API endpoint URL
 * @param {Object} body - Request body (will be JSON stringified)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Structured response
 */
export async function patch(url, body, options = {}) {
  return safeFetch(url, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 * @param {string} url - API endpoint URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Structured response
 */
export async function del(url, options = {}) {
  return safeFetch(url, {
    ...options,
    method: "DELETE",
  });
}

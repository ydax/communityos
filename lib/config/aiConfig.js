/**
 * Centralized AI Model Configuration
 *
 * Defines the models used throughout the CentralTexas.com application.
 * Change the model strings here to upgrade the app infrastructure globally.
 *
 * Note: When upgrading a model, ensure its specific prompt schemas,
 * token limits, or REST API endpoints haven't changed.
 */

const AI_MODELS = {
  // For fastest response time at lower cost
  lite: "gemini-2.5-flash-lite",

  // Primary model for generation (site builder, text generation, etc.)
  flash: "gemini-3-flash-preview",

  // For operations that require higher reasoning (if added later)
  pro: "gemini-2.5-pro",
};

/**
 * Helper to build the REST API endpoint for Google GenAI
 * @param {string} modelName - e.g. AI_MODELS.flash
 * @returns {string} The /v1beta/models/... URL path
 */
function getGeminiModelEndpoint(modelName) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
}

module.exports = {
  AI_MODELS,
  getGeminiModelEndpoint,
};

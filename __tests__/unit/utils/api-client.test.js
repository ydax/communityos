/**
 * Unit tests for SafeFetch API Client Wrapper
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { safeFetch, get, post, patch, del } from "../../../lib/api-client";

// Mock global fetch
global.fetch = vi.fn();

describe("api-client", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("safeFetch", () => {
    it("should successfully fetch data with 200 response", async () => {
      const mockData = { message: "Success", data: { id: "123" } };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockData),
      });

      const result = await safeFetch("/api/test", { method: "GET" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.statusCode).toBe(200);
      expect(result.requestId).toBeDefined();
    });

    it("should handle 404 not found error", async () => {
      const mockError = { error: "Not found" };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify(mockError),
      });

      const result = await safeFetch("/api/test", { method: "GET" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not found");
      expect(result.statusCode).toBe(404);
    });

    it("should handle 500 server error", async () => {
      const mockError = { error: "Internal server error" };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify(mockError),
      });

      const result = await safeFetch("/api/test", { method: "GET" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Internal server error");
      expect(result.statusCode).toBe(500);
    });

    it("should handle network errors gracefully", async () => {
      global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const result = await safeFetch("/api/test", { method: "GET" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
      expect(result.isNetworkError).toBe(true);
    });

    it("should handle invalid JSON response", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "Not valid JSON",
      });

      const result = await safeFetch("/api/test", { method: "GET" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid response format from server");
      expect(result.statusCode).toBe(200);
    });

    it("should handle empty response body", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => "",
      });

      const result = await safeFetch("/api/test", { method: "DELETE" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it("should include request ID in headers", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true }),
      });

      await safeFetch("/api/test", { method: "GET" });

      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[1].headers["X-Request-Id"]).toBeDefined();
      expect(callArgs[1].headers["X-Request-Id"]).toMatch(/^req_/);
    });

    it("should preserve custom headers", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true }),
      });

      await safeFetch("/api/test", {
        method: "GET",
        headers: {
          Authorization: "Bearer token123",
          "X-Custom-Header": "custom-value",
        },
      });

      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[1].headers["Authorization"]).toBe("Bearer token123");
      expect(callArgs[1].headers["X-Custom-Header"]).toBe("custom-value");
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
    });

    it("should handle 409 conflict error", async () => {
      const mockError = { error: "Domain already in use" };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => JSON.stringify(mockError),
      });

      const result = await safeFetch("/api/sites", { method: "POST" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Domain already in use");
      expect(result.statusCode).toBe(409);
    });
  });

  describe("Helper functions", () => {
    it("get() should make GET request", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: "test" }),
      });

      const result = await get("/api/test");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("post() should make POST request with body", async () => {
      const postData = { name: "Test", value: 123 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ success: true }),
      });

      const result = await post("/api/test", postData);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(postData),
        }),
      );
    });

    it("patch() should make PATCH request with body", async () => {
      const patchData = { status: "updated" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true }),
      });

      const result = await patch("/api/test/123", patchData);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test/123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(patchData),
        }),
      );
    });

    it("del() should make DELETE request", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => "",
      });

      const result = await del("/api/test/123");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test/123",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("Error scenarios", () => {
    it("should handle timeout errors", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Request timeout"));

      const result = await safeFetch("/api/test");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Request timeout");
    });

    it("should handle DNS resolution errors", async () => {
      global.fetch.mockRejectedValueOnce(
        new TypeError("network request failed"),
      );

      const result = await safeFetch("/api/test");

      expect(result.success).toBe(false);
      expect(result.isNetworkError).toBe(true);
      expect(result.error).toContain("Network error");
    });

    it("should handle malformed URL errors", async () => {
      global.fetch.mockRejectedValueOnce(new TypeError("Invalid URL"));

      const result = await safeFetch("not-a-valid-url");

      expect(result.success).toBe(false);
      expect(result.isNetworkError).toBe(true);
    });

    it("should handle CORS errors", async () => {
      global.fetch.mockRejectedValueOnce(new TypeError("CORS policy error"));

      const result = await safeFetch("/api/test");

      expect(result.success).toBe(false);
      expect(result.isNetworkError).toBe(true);
    });
  });

  describe("Response parsing", () => {
    it("should handle response with error field but 200 status", async () => {
      const mockResponse = {
        error: "Business logic error",
        code: "VALIDATION_FAILED",
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await safeFetch("/api/test");

      // Should still be success: true because HTTP status is 200
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it("should handle response without error field on failure", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: "Bad request" }),
      });

      const result = await safeFetch("/api/test");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Request failed with status 400");
    });
  });
});

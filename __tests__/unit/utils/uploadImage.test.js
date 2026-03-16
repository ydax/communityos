import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadImage,
  uploadMultipleImages,
  generateImagePath,
} from "@/lib/utils/uploadImage";

// Mock Firebase Storage
vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn((storage, path) => ({ path })),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve("https://example.com/image.jpg")),
}));

describe("uploadImage utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload a valid image file", async () => {
    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const path = "sites/abc123/test.jpg";

    const url = await uploadImage(mockFile, path);

    expect(url).toBe("https://example.com/image.jpg");
  });

  it("should reject invalid file type", async () => {
    const mockFile = new File(["test"], "test.pdf", {
      type: "application/pdf",
    });
    const path = "sites/abc123/test.pdf";

    await expect(uploadImage(mockFile, path)).rejects.toThrow(
      "Invalid file type",
    );
  });

  it("should reject oversized files", async () => {
    const largeContent = new Array(6 * 1024 * 1024).fill("x").join("");
    const mockFile = new File([largeContent], "large.jpg", {
      type: "image/jpeg",
    });
    const path = "sites/abc123/large.jpg";

    await expect(uploadImage(mockFile, path)).rejects.toThrow(
      "exceeds 5MB limit",
    );
  });

  it("should upload multiple files", async () => {
    const mockFiles = [
      new File(["test1"], "test1.jpg", { type: "image/jpeg" }),
      new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
    ];

    const urls = await uploadMultipleImages(mockFiles, "sites/abc123");

    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe("https://example.com/image.jpg");
  });

  it("should generate correct image paths", () => {
    const sitePath = generateImagePath("site", "abc123", "hero.jpg");
    expect(sitePath).toMatch(/^sites\/abc123\/\d+_hero\.jpg$/);

    const listingPath = generateImagePath("listing", "def456", "product.png");
    expect(listingPath).toMatch(/^listings\/def456\/\d+_product\.png$/);

    const variantPath = generateImagePath("variant", "ghi789", "variant.jpg");
    expect(variantPath).toMatch(/^variants\/ghi789\/\d+_variant\.jpg$/);
  });
});

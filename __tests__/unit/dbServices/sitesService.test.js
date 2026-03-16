/**
 * Unit Tests for sitesService
 * Tests CRUD operations for sites collection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSiteByDomain,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  listSitesByOwner,
} from "@/lib/dbServices/sitesService.js";

describe("sitesService", () => {
  let mockDb;
  let mockCollectionRef;
  let mockDocRef;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockDb = global.createMockDb();
    mockCollectionRef = global.createMockCollectionRef("sites");
    mockDocRef = global.createMockDocRef("sites/site123");
  });

  describe("getSiteByDomain", () => {
    it("should fetch site by domain successfully", async () => {
      const mockSiteData = {
        domain: "joesfencing.com",
        businessName: "Joe's Fencing",
        status: "active",
      };

      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.limit = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        empty: false,
        docs: [
          {
            id: "site123",
            data: () => mockSiteData,
          },
        ],
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await getSiteByDomain(mockDb, "joesfencing.com");

      expect(result).toEqual({ id: "site123", ...mockSiteData });
      expect(mockDb.collection).toHaveBeenCalledWith("sites");
      expect(mockCollectionRef.where).toHaveBeenCalledWith(
        "domain",
        "==",
        "joesfencing.com",
      );
      // No longer queries by status - filtered in application code
    });

    it("should return null for non-existent domain", async () => {
      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.limit = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        empty: true,
        docs: [],
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await getSiteByDomain(mockDb, "nonexistent.com");

      expect(result).toBeNull();
    });

    it("should return site even if inactive", async () => {
      const mockSiteData = {
        domain: "inactive.com",
        businessName: "Inactive Business",
        status: "archived",
      };

      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.limit = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        empty: false,
        docs: [
          {
            id: "site456",
            data: () => mockSiteData,
          },
        ],
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await getSiteByDomain(mockDb, "inactive.com");

      expect(result).toEqual({ id: "site456", ...mockSiteData });
    });

    it("should throw error on database failure", async () => {
      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.limit = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => {
        throw new Error("Database connection error");
      });

      mockDb.collection = vi.fn(() => mockCollectionRef);

      await expect(getSiteByDomain(mockDb, "test.com")).rejects.toThrow(
        "Failed to fetch site by domain",
      );
    });
  });

  describe("getSiteById", () => {
    it("should fetch site by ID successfully", async () => {
      const mockSiteData = {
        domain: "joesfencing.com",
        businessName: "Joe's Fencing",
      };

      mockDocRef.get = vi.fn(async () => ({
        exists: true,
        id: "site123",
        data: () => mockSiteData,
      }));

      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await getSiteById(mockDb, "site123");

      expect(result).toEqual({ id: "site123", ...mockSiteData });
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("site123");
    });

    it("should return null for non-existent site ID", async () => {
      mockDocRef.get = vi.fn(async () => ({
        exists: false,
      }));

      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await getSiteById(mockDb, "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("createSite", () => {
    it("should create site successfully", async () => {
      const siteData = {
        domain: "newsite.com",
        ownerId: "user123",
        businessName: "New Business",
      };

      // Mock getSiteByDomain to return null (domain available)
      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.limit = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        empty: true,
        docs: [],
      }));

      mockCollectionRef.add = vi.fn(async () => ({
        id: "new_site_123",
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await createSite(mockDb, siteData);

      expect(result).toBe("new_site_123");
      expect(mockCollectionRef.add).toHaveBeenCalled();
    });

    it("should throw error if domain is missing", async () => {
      const siteData = {
        ownerId: "user123",
        businessName: "New Business",
      };

      await expect(createSite(mockDb, siteData)).rejects.toThrow(
        "Domain and ownerId are required fields",
      );
    });

    it("should throw error if domain is already taken", async () => {
      const siteData = {
        domain: "existing.com",
        ownerId: "user123",
        businessName: "New Business",
      };

      // Mock getSiteByDomain to return existing active site
      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.limit = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        empty: false,
        docs: [
          {
            id: "existing_site",
            data: () => ({
              domain: "existing.com",
              status: "active", // Required for getSiteByDomain to return the site
            }),
          },
        ],
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      await expect(createSite(mockDb, siteData)).rejects.toThrow(
        "Domain existing.com is already in use",
      );
    });
  });

  describe("updateSite", () => {
    it("should update site successfully", async () => {
      const updates = {
        businessName: "Updated Business Name",
      };

      mockDocRef.update = vi.fn(async () => ({}));
      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      await updateSite(mockDb, "site123", updates);

      expect(mockDocRef.update).toHaveBeenCalled();
      const updateCall = mockDocRef.update.mock.calls[0][0];
      expect(updateCall.businessName).toBe("Updated Business Name");
      expect(updateCall.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("deleteSite", () => {
    it("should soft delete site successfully", async () => {
      mockDocRef.update = vi.fn(async () => ({}));
      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      await deleteSite(mockDb, "site123");

      expect(mockDocRef.update).toHaveBeenCalled();
      const updateCall = mockDocRef.update.mock.calls[0][0];
      expect(updateCall.status).toBe("deleted");
      expect(updateCall.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe("listSitesByOwner", () => {
    it("should list sites by owner successfully", async () => {
      const mockSites = [
        { domain: "site1.com", businessName: "Site 1" },
        { domain: "site2.com", businessName: "Site 2" },
      ];

      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.orderBy = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        docs: mockSites.map((site, index) => ({
          id: `site${index + 1}`,
          data: () => site,
        })),
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await listSitesByOwner(mockDb, "user123");

      expect(result).toHaveLength(2);
      expect(result[0].domain).toBe("site1.com");
      expect(result[1].domain).toBe("site2.com");
      expect(mockCollectionRef.where).toHaveBeenCalledWith(
        "ownerId",
        "==",
        "user123",
      );
    });

    it("should return empty array for owner with no sites", async () => {
      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.orderBy = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        docs: [],
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await listSitesByOwner(mockDb, "user_no_sites");

      expect(result).toEqual([]);
    });
  });
});

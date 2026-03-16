/**
 * Unit Tests for growthService
 * Tests CRUD operations for campaigns and leads collections
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  createLead,
  getLeadsByCampaign,
  updateLeadStatus,
  LEAD_STATUS,
  CAMPAIGN_STATUS,
} from "@/lib/dbServices/growthService.js";

// Mock Firebase
vi.mock("firebase/firestore", () => {
  return {
    getFirestore: vi.fn(),
    doc: vi.fn((db, path, id) => ({ id: id || "generated-id", path })),
    collection: vi.fn((db, path) => ({ path })),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    writeBatch: vi.fn(),
    serverTimestamp: vi.fn(() => "mock-timestamp"),
    runTransaction: vi.fn(async (db, callback) => {
      const transaction = {
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
      };
      return await callback(transaction);
    }),
  };
});

import {
  getFirestore,
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

import { getFirebaseApp } from "@/lib/firebase/config";

vi.mock("@/lib/firebase/config", () => ({
  getFirebaseApp: vi.fn(),
}));

describe("growthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFirestore.mockReturnValue({});
  });

  describe("createCampaign", () => {
    it("should create campaign successfully", async () => {
      const campaignData = {
        name: "Test Campaign",
        type: "LegalTech",
      };

      const result = await createCampaign(campaignData);

      expect(result).toBe("generated-id");
      expect(setDoc).toHaveBeenCalled();

      const setDocCall = setDoc.mock.calls[0][1];
      expect(setDocCall.name).toBe("Test Campaign");
      expect(setDocCall.status).toBe(CAMPAIGN_STATUS.ACTIVE);
      expect(setDocCall.metrics).toEqual({
        identified: 0,
        contacted: 0,
        site_generated: 0,
        claimed: 0,
        rejected: 0,
      });
      expect(setDocCall.createdAt).toBe("mock-timestamp");
    });
  });

  describe("getCampaigns", () => {
    it("should fetch all campaigns and format dates", async () => {
      const mockDocs = [
        {
          data: () => ({
            id: "camp1",
            name: "Camp 1",
            createdAt: { toDate: () => new Date("2026-01-01T00:00:00Z") },
          }),
        },
      ];

      getDocs.mockResolvedValue({ docs: mockDocs });

      const result = await getCampaigns();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("camp1");
      expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
      expect(collection).toHaveBeenCalledWith({}, "campaigns");
      expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
    });
  });

  describe("getCampaign", () => {
    it("should fetch a specific campaign by id", async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: "camp1",
          name: "Camp 1",
          createdAt: { toDate: () => new Date("2026-01-01T00:00:00Z") },
        }),
      });

      const result = await getCampaign("camp1");

      expect(result.id).toBe("camp1");
      expect(result.name).toBe("Camp 1");
      expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
      expect(doc).toHaveBeenCalledWith({}, "campaigns", "camp1");
    });

    it("should return null if campaign id is not provided", async () => {
      const result = await getCampaign(null);
      expect(result).toBeNull();
    });

    it("should return null if campaign does not exist", async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getCampaign("camp1");
      expect(result).toBeNull();
    });
  });

  describe("createLead", () => {
    it("should create lead and increment campaign metric in a transaction", async () => {
      const campaignId = "camp_123";
      const leadData = {
        businessName: "Test Business",
        status: LEAD_STATUS.IDENTIFIED,
      };

      // Mock the transaction
      runTransaction.mockImplementation(async (db, callback) => {
        const transaction = {
          get: vi.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({
              metrics: { identified: 0, contacted: 0 },
            }),
          }),
          set: vi.fn(),
          update: vi.fn(),
        };
        await callback(transaction);

        // Assertions inside the simulated transaction
        expect(transaction.set).toHaveBeenCalled();
        const setCall = transaction.set.mock.calls[0][1];
        expect(setCall.businessName).toBe("Test Business");
        expect(setCall.status).toBe(LEAD_STATUS.IDENTIFIED);

        expect(transaction.update).toHaveBeenCalled();
        const updateCall = transaction.update.mock.calls[0][1];
        expect(updateCall.metrics.identified).toBe(1); // Incremented

        return "generated-id"; // Assuming lead id is returned
      });

      const result = await createLead(campaignId, leadData);
      expect(result).toBe("generated-id");
      expect(runTransaction).toHaveBeenCalled();
    });

    it("should throw error if campaign doesn't exist", async () => {
      runTransaction.mockImplementation(async (db, callback) => {
        const transaction = {
          get: vi.fn().mockResolvedValue({
            exists: () => false,
          }),
        };
        await callback(transaction);
      });

      await expect(
        createLead("camp_123", { businessName: "Test" }),
      ).rejects.toThrow("Campaign camp_123 does not exist");
    });
  });

  describe("updateLeadStatus", () => {
    it("should update lead status and adjust campaign metrics if status changed", async () => {
      runTransaction.mockImplementation(async (db, callback) => {
        const transaction = {
          get: vi.fn((ref) => {
            if (ref.path === "leads") {
              return {
                exists: () => true,
                data: () => ({
                  status: LEAD_STATUS.IDENTIFIED,
                  campaignId: "camp_123",
                }),
              };
            }
            if (ref.path === "campaigns") {
              return {
                exists: () => true,
                data: () => ({
                  metrics: {
                    identified: 1,
                    contacted: 0,
                  },
                }),
              };
            }
          }),
          update: vi.fn(),
        };

        await callback(transaction);

        expect(transaction.update).toHaveBeenCalledTimes(2);

        // Lead update first
        const leadUpdateCall = transaction.update.mock.calls[0];
        expect(leadUpdateCall[1].status).toBe(LEAD_STATUS.CONTACTED);

        // Campaign update second
        const campUpdateCall = transaction.update.mock.calls[1];
        expect(campUpdateCall[1].metrics).toEqual({
          identified: 0,
          contacted: 1,
        });

        return true;
      });

      const result = await updateLeadStatus("lead_123", LEAD_STATUS.CONTACTED);
      expect(result).toBe(true);
    });

    it("should only update lead if status didn't change", async () => {
      runTransaction.mockImplementation(async (db, callback) => {
        const transaction = {
          get: vi.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({
              status: LEAD_STATUS.IDENTIFIED,
              campaignId: "camp_123",
            }),
          }),
          update: vi.fn(),
        };

        await callback(transaction);

        expect(transaction.update).toHaveBeenCalledTimes(1);
        expect(transaction.update.mock.calls[0][1].status).toBeUndefined(); // Didn't change

        return true;
      });

      const result = await updateLeadStatus(
        "lead_123",
        LEAD_STATUS.IDENTIFIED,
        { siteId: "site_456" },
      );
      expect(result).toBe(true);
    });
  });
});

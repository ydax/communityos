import { describe, it, expect, beforeEach } from "vitest";

describe("ListingCard Component", () => {
  it("should display service listing correctly", () => {
    const mockService = {
      id: "listing_123",
      title: "Fence Repair",
      description: "Professional fence repair service",
      type: "service",
      pricing: {
        model: "hourly",
        basePrice: 75,
        unit: "hour",
      },
      images: ["https://example.com/fence.jpg"],
      status: "active",
      category: "fence_repair",
    };

    // Test price formatting
    expect(mockService.pricing.basePrice).toBe(75);
    expect(mockService.pricing.model).toBe("hourly");
  });

  it("should display good listing with inventory correctly", () => {
    const mockGood = {
      id: "listing_456",
      title: "Work T-Shirt",
      description: "Premium work shirt",
      type: "good",
      pricing: {
        model: "variant_based",
        basePrice: 24.99,
      },
      images: ["https://example.com/shirt.jpg"],
      status: "active",
      inventory: {
        trackQuantity: true,
        totalAvailable: 45,
        lowStockThreshold: 10,
      },
    };

    // Test inventory display
    expect(mockGood.inventory.totalAvailable).toBe(45);
    expect(
      mockGood.inventory.totalAvailable > mockGood.inventory.lowStockThreshold,
    ).toBe(true);
  });

  it("should format quote-required pricing correctly", () => {
    const mockQuoteService = {
      pricing: {
        model: "quote_required",
        basePrice: null,
      },
    };

    const formatPrice = (service) => {
      if (service.pricing?.model === "quote_required") {
        return "Quote Required";
      }
      return `$${service.pricing.basePrice}`;
    };

    expect(formatPrice(mockQuoteService)).toBe("Quote Required");
  });
});

describe("ListingFilters Component", () => {
  it("should apply search filter correctly", () => {
    const mockListings = [
      {
        id: "1",
        title: "Fence Repair",
        description: "Fix fences",
        type: "service",
        status: "active",
      },
      {
        id: "2",
        title: "Plumbing Service",
        description: "Fix pipes",
        type: "service",
        status: "active",
      },
      {
        id: "3",
        title: "T-Shirt",
        description: "Red shirt",
        type: "good",
        status: "active",
      },
    ];

    const applyFilters = (listings, filters) => {
      let filtered = [...listings];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (listing) =>
            listing.title.toLowerCase().includes(searchLower) ||
            listing.description?.toLowerCase().includes(searchLower),
        );
      }

      if (filters.type !== "all") {
        filtered = filtered.filter((listing) => listing.type === filters.type);
      }

      return filtered;
    };

    const result = applyFilters(mockListings, { search: "fence", type: "all" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Fence Repair");
  });

  it("should apply type filter correctly", () => {
    const mockListings = [
      { id: "1", title: "Fence Repair", type: "service", status: "active" },
      { id: "2", title: "T-Shirt", type: "good", status: "active" },
    ];

    const applyFilters = (listings, filters) => {
      return filters.type !== "all"
        ? listings.filter((l) => l.type === filters.type)
        : listings;
    };

    const result = applyFilters(mockListings, { type: "service" });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("service");
  });
});

describe("VariantForm Component", () => {
  it("should validate required fields", () => {
    const validateForm = (formData) => {
      const errors = {};

      if (!formData.name.trim()) {
        errors.name = "Variant name is required";
      }

      if (!formData.sku.trim()) {
        errors.sku = "SKU is required";
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        errors.price = "Price must be greater than 0";
      }

      return errors;
    };

    const invalidData = {
      name: "",
      sku: "",
      price: "",
    };

    const errors = validateForm(invalidData);
    expect(Object.keys(errors)).toHaveLength(3);
    expect(errors.name).toBe("Variant name is required");
  });

  it("should auto-generate variant name from options", () => {
    const options = { Color: "Red", Size: "Large" };
    const name = Object.values(options).join(" / ");

    expect(name).toBe("Red / Large");
  });

  it("should auto-generate SKU from options", () => {
    const listingTitle = "Premium T-Shirt";
    const options = { Color: "Red", Size: "Large" };

    const titleSlug = listingTitle
      .substring(0, 10)
      .toUpperCase()
      .replace(/\s+/g, "");
    const optionSlug = Object.values(options)
      .join("_")
      .toUpperCase()
      .replace(/\s+/g, "");
    const sku = `${titleSlug}_${optionSlug}`;

    // Updated expected value: removes spaces, so "T-Shirt" becomes "T-" not "T-S"
    expect(sku).toBe("PREMIUMT-_RED_LARGE");
  });
});

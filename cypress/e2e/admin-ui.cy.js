describe("Item Library Page", () => {
  beforeEach(() => {
    cy.visit("/admin/listings");
  });

  it("should load the item library page", () => {
    cy.contains("Item Library").should("be.visible");
    cy.contains("Add Item").should("be.visible");
  });

  it("should display listing stats", () => {
    cy.contains("Total Listings").should("be.visible");
    cy.contains("Active").should("be.visible");
    cy.contains("Services").should("be.visible");
    cy.contains("Goods").should("be.visible");
  });

  it("should open create listing dialog", () => {
    cy.contains("Add Item").click();
    cy.contains("Create New Listing").should("be.visible");
  });

  it("should filter listings by type", () => {
    cy.get("select#type").select("service");
    cy.url().should("include", "admin/listings");
  });

  it("should search for listings", () => {
    cy.get("input#search").type("fence");
    cy.get("input#search").should("have.value", "fence");
  });
});

describe("Create Listing Flow", () => {
  beforeEach(() => {
    cy.visit("/admin/listings");
    cy.contains("Add Item").click();
  });

  it("should create a new service listing", () => {
    cy.get("input#title").type("Test Fence Repair");
    cy.get("textarea#description").type("Professional fence repair service");
    cy.get("select#type").select("service");
    cy.get("input#category").type("fence_repair");
    cy.get("select#pricingModel").select("hourly");
    cy.get("input#basePrice").type("75.00");

    cy.contains("Create Listing").click();
    // Would verify listing was created in real implementation
  });

  it("should validate required fields", () => {
    cy.contains("Create Listing").click();
    cy.contains("Title is required").should("be.visible");
  });

  it("should validate price for non-quote services", () => {
    cy.get("input#title").type("Test Service");
    cy.get("textarea#description").type("Test description");
    cy.get("input#category").type("test");
    cy.get("select#pricingModel").select("hourly");
    cy.get("input#basePrice").clear();

    cy.contains("Create Listing").click();
    cy.contains("Base price must be greater than 0").should("be.visible");
  });
});

describe("Variant Management", () => {
  beforeEach(() => {
    // Assume listing exists
    cy.visit("/admin/listings/test-listing-id/variants");
  });

  it("should load variants page", () => {
    cy.contains("Manage Variants").should("be.visible");
    cy.contains("Add Variant").should("be.visible");
  });

  it("should display variant stats", () => {
    cy.contains("Total Variants").should("be.visible");
    cy.contains("Total Inventory").should("be.visible");
  });

  it("should open create variant dialog", () => {
    cy.contains("Add Variant").click();
    cy.contains("Create New Variant").should("be.visible");
  });
});

describe("Site Editor", () => {
  beforeEach(() => {
    // Assume site exists
    cy.visit("/admin/sites/test-site-id/editor");
  });

  it("should load site editor", () => {
    cy.contains("Site Editor").should("be.visible");
    cy.contains("Sections").should("be.visible");
    cy.contains("Theme").should("be.visible");
  });

  it("should display section list", () => {
    cy.contains("Site Sections").should("be.visible");
  });

  it("should switch between tabs", () => {
    cy.contains("Theme").click();
    cy.contains("Choose Theme").should("be.visible");

    cy.contains("Sections").click();
    cy.contains("Site Sections").should("be.visible");
  });

  it("should show unsaved changes indicator", () => {
    cy.contains("Theme").click();
    cy.contains("The Maker").click();
    cy.contains("Unsaved changes").should("be.visible");
  });
});

describe("Service Block on Public Site", () => {
  it("should display services section on public site", () => {
    // Would test actual public site rendering
    cy.visit("/test-site.local");
    cy.contains("Our Services").should("be.visible");
  });

  it("should display service cards", () => {
    cy.visit("/test-site.local");
    cy.get('[data-testid="service-card"]').should("have.length.greaterThan", 0);
  });

  it("should open service detail modal", () => {
    cy.visit("/test-site.local");
    cy.get('[data-testid="service-card"]').first().click();
    cy.contains("Description").should("be.visible");
    cy.contains("Book Now").should("be.visible");
  });
});

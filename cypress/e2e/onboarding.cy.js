/**
 * E2E Test: Tenant Onboarding Flow
 * Tests the complete Get Started → Create Site → Redirect flow
 */

describe("Tenant Onboarding Flow", () => {
  const testSite = {
    businessName: "Test Fencing Co",
    category: "fencing",
    subdomain: `test-fencing-${Date.now()}`,
    email: "test@example.com",
    phone: "(512) 555-1234",
  };

  beforeEach(() => {
    // Visit get started page
    cy.visit("/get-started");
  });

  afterEach(() => {
    // Cleanup: Delete test site from Firestore if created
    // This would require a custom Cypress command with Firebase Admin SDK access
    // For now, we'll rely on manual cleanup or a separate cleanup script
  });

  describe("Form Rendering", () => {
    it("should render all form fields", () => {
      cy.get('input[name="businessName"]').should("be.visible");
      cy.get('select[name="category"]').should("be.visible");
      cy.get('input[name="subdomain"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");
      cy.get('input[name="phone"]').should("be.visible");
      cy.get('button[type="submit"]')
        .should("be.visible")
        .should("contain", "Create My Free Site");
    });

    it("should show required field indicators", () => {
      cy.contains("Business Name").parent().should("contain", "*");
      cy.contains("Service Category").parent().should("contain", "*");
      cy.contains("Your Website Address").parent().should("contain", "*");
      cy.contains("Email Address").parent().should("contain", "*");
    });

    it("should have all service categories in dropdown", () => {
      cy.get('select[name="category"]')
        .find("option")
        .should("have.length.greaterThan", 1);
      cy.get('select[name="category"]').should(
        "contain",
        "Fencing & Deck Installation",
      );
      cy.get('select[name="category"]').should("contain", "Plumbing Services");
      cy.get('select[name="category"]').should(
        "contain",
        "Landscaping & Lawn Care",
      );
    });
  });

  describe("Form Validation", () => {
    it("should show error when submitting empty form", () => {
      cy.get('button[type="submit"]').click();
      cy.contains("Business name is required").should("be.visible");
    });

    it("should show error for missing category", () => {
      cy.get('input[name="businessName"]').type("Test Business");
      cy.get('button[type="submit"]').click();
      cy.contains("Please select a service category").should("be.visible");
    });

    it("should show error for missing subdomain", () => {
      cy.get('input[name="businessName"]').type("Test Business");
      cy.get('select[name="category"]').select("fencing");
      cy.get('input[name="subdomain"]').clear();
      cy.get('button[type="submit"]').click();
      cy.contains("Subdomain is required").should("be.visible");
    });

    it("should show error for missing email", () => {
      cy.get('input[name="businessName"]').type("Test Business");
      cy.get('select[name="category"]').select("fencing");
      cy.get('input[name="subdomain"]').type("test-business");
      cy.get('button[type="submit"]').click();
      cy.contains("Email is required").should("be.visible");
    });

    it("should show error for invalid email format", () => {
      cy.get('input[name="businessName"]').type("Test Business");
      cy.get('select[name="category"]').select("fencing");
      cy.get('input[name="subdomain"]').type("test-business");
      cy.get('input[name="email"]').type("not-an-email");
      cy.get('button[type="submit"]').click();
      cy.contains("Please enter a valid email address").should("be.visible");
    });
  });

  describe("Auto-generation Features", () => {
    it("should auto-generate subdomain from business name", () => {
      cy.get('input[name="businessName"]').type("Joe's Fencing & Repair");
      cy.get('input[name="subdomain"]').should(
        "have.value",
        "joes-fencing-repair",
      );
    });

    it("should handle special characters in business name", () => {
      cy.get('input[name="businessName"]').type("ABC Plumbing, LLC (Austin)");
      cy.get('input[name="subdomain"]').should(
        "have.value",
        "abc-plumbing-llc-austin",
      );
    });

    it("should allow manual subdomain override", () => {
      cy.get('input[name="businessName"]').type("Test Business");
      cy.get('input[name="subdomain"]').clear().type("my-custom-subdomain");
      cy.get('input[name="subdomain"]').should(
        "have.value",
        "my-custom-subdomain",
      );
    });
  });

  describe("Successful Submission - Happy Path", () => {
    it("should successfully create site and redirect to editor", () => {
      // Fill out the form
      cy.get('input[name="businessName"]').type(testSite.businessName);
      cy.get('select[name="category"]').select(testSite.category);
      cy.get('input[name="subdomain"]').clear().type(testSite.subdomain);
      cy.get('input[name="email"]').type(testSite.email);
      cy.get('input[name="phone"]').type(testSite.phone);

      // Intercept API call
      cy.intercept("POST", "/api/sites").as("createSite");

      // Submit form
      cy.get('button[type="submit"]').click();

      // Button should show loading state
      cy.get('button[type="submit"]').should("contain", "Creating Site...");
      cy.get('button[type="submit"]').should("be.disabled");

      // Wait for API call
      cy.wait("@createSite").then((interception) => {
        // Verify request payload
        expect(interception.request.body).to.have.property(
          "domain",
          `${testSite.subdomain}.centraltexas.com`,
        );
        expect(interception.request.body).to.have.property(
          "businessName",
          testSite.businessName,
        );
        expect(interception.request.body).to.have.property(
          "category",
          testSite.category,
        );

        // Verify response
        expect(interception.response.statusCode).to.equal(201);
        expect(interception.response.body).to.have.property("success", true);
        expect(interception.response.body.site).to.have.property("id");
      });

      // Should show success message
      cy.contains("Site Created Successfully!").should("be.visible");
      cy.contains("Redirecting to the editor...").should("be.visible");

      // Should redirect to site editor
      cy.url({ timeout: 10000 }).should("include", "/admin/sites/");
      cy.url().should("include", "/editor");
    });
  });

  describe("Error Handling", () => {
    it("should handle duplicate domain error", () => {
      // Fill out the form
      cy.get('input[name="businessName"]').type(testSite.businessName);
      cy.get('select[name="category"]').select(testSite.category);
      cy.get('input[name="subdomain"]').clear().type(testSite.subdomain);
      cy.get('input[name="email"]').type(testSite.email);

      // Mock API to return 409 conflict
      cy.intercept("POST", "/api/sites", {
        statusCode: 409,
        body: {
          error: `Domain ${testSite.subdomain}.centraltexas.com is already in use`,
        },
      }).as("createSite");

      // Submit form
      cy.get('button[type="submit"]').click();

      // Wait for API call
      cy.wait("@createSite");

      // Should show error message
      cy.contains("is already in use").should("be.visible");

      // Form should be re-enabled
      cy.get('button[type="submit"]').should("not.be.disabled");
    });

    it("should handle network error gracefully", () => {
      // Fill out the form
      cy.get('input[name="businessName"]').type(testSite.businessName);
      cy.get('select[name="category"]').select(testSite.category);
      cy.get('input[name="subdomain"]').clear().type(testSite.subdomain);
      cy.get('input[name="email"]').type(testSite.email);

      // Mock network failure
      cy.intercept("POST", "/api/sites", {
        forceNetworkError: true,
      }).as("createSite");

      // Submit form
      cy.get('button[type="submit"]').click();

      // Wait for API call
      cy.wait("@createSite");

      // Should show network error message
      cy.contains("Network error").should("be.visible");

      // Form should be re-enabled
      cy.get('button[type="submit"]').should("not.be.disabled");
    });

    it("should handle 500 server error", () => {
      // Fill out the form
      cy.get('input[name="businessName"]').type(testSite.businessName);
      cy.get('select[name="category"]').select(testSite.category);
      cy.get('input[name="subdomain"]').clear().type(testSite.subdomain);
      cy.get('input[name="email"]').type(testSite.email);

      // Mock server error
      cy.intercept("POST", "/api/sites", {
        statusCode: 500,
        body: {
          error: "Failed to create site",
        },
      }).as("createSite");

      // Submit form
      cy.get('button[type="submit"]').click();

      // Wait for API call
      cy.wait("@createSite");

      // Should show error message
      cy.contains("Failed to create site").should("be.visible");

      // Form should be re-enabled
      cy.get('button[type="submit"]').should("not.be.disabled");
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all inputs", () => {
      cy.get('label[for="businessName"]').should("exist");
      cy.get('label[for="category"]').should("exist");
      cy.get('label[for="subdomain"]').should("exist");
      cy.get('label[for="email"]').should("exist");
      cy.get('label[for="phone"]').should("exist");
    });

    it("should show error alerts with proper ARIA attributes", () => {
      cy.get('button[type="submit"]').click();
      cy.get('[role="alert"]').should("exist");
    });

    it("should be keyboard navigable", () => {
      cy.get('input[name="businessName"]').focus().should("have.focus");
      cy.get('input[name="businessName"]').tab();
      cy.get('select[name="category"]').should("have.focus");
    });
  });

  describe("Mobile Responsiveness", () => {
    it("should be usable on mobile viewport", () => {
      cy.viewport("iphone-x");
      cy.visit("/get-started");

      // All form elements should be visible
      cy.get('input[name="businessName"]').should("be.visible");
      cy.get('select[name="category"]').should("be.visible");
      cy.get('input[name="subdomain"]').should("be.visible");
      cy.get('button[type="submit"]').should("be.visible");

      // Form should be scrollable
      cy.scrollTo("bottom");
      cy.get('button[type="submit"]').should("be.visible");
    });
  });
});

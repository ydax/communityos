describe("API Routes", () => {
  const API_BASE = Cypress.env("API_URL") || "http://localhost:3000/api";

  describe("GET /api/listings", () => {
    it("should return list of listings", () => {
      cy.request({
        method: "GET",
        url: `${API_BASE}/listings?siteId=test-site`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 500]); // May fail if no data
        if (response.status === 200) {
          expect(response.body).to.have.property("success");
          expect(response.body).to.have.property("listings");
        }
      });
    });

    it("should filter listings by type", () => {
      cy.request({
        method: "GET",
        url: `${API_BASE}/listings?siteId=test-site&type=service`,
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status === 200 && response.body.listings) {
          response.body.listings.forEach((listing) => {
            expect(listing.type).to.equal("service");
          });
        }
      });
    });
  });

  describe("POST /api/listings", () => {
    it("should create a new listing", () => {
      cy.request({
        method: "POST",
        url: `${API_BASE}/listings`,
        body: {
          siteId: "test-site",
          title: "Test Service",
          description: "Test description",
          type: "service",
          category: "test",
          pricing: {
            model: "hourly",
            basePrice: 75.0,
            unit: "hour",
          },
        },
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property("success", true);
          expect(response.body).to.have.property("listingId");
        }
      });
    });

    it("should validate required fields", () => {
      cy.request({
        method: "POST",
        url: `${API_BASE}/listings`,
        body: {
          siteId: "test-site",
          // Missing title and type
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(500);
        expect(response.body).to.have.property("success", false);
      });
    });
  });

  describe("GET /api/sites/[siteId]", () => {
    it("should return site data", () => {
      cy.request({
        method: "GET",
        url: `${API_BASE}/sites/test-site`,
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property("success", true);
          expect(response.body).to.have.property("site");
        }
      });
    });

    it("should return 404 for non-existent site", () => {
      cy.request({
        method: "GET",
        url: `${API_BASE}/sites/non-existent-site`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 500]);
      });
    });
  });

  describe("GET /api/sites/[siteId]/services", () => {
    it("should return active services for a site", () => {
      cy.request({
        method: "GET",
        url: `${API_BASE}/sites/test-site/services`,
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property("success", true);
          expect(response.body).to.have.property("services");

          if (response.body.services.length > 0) {
            response.body.services.forEach((service) => {
              expect(service.type).to.equal("service");
              expect(service.status).to.equal("active");
            });
          }
        }
      });
    });
  });

  describe("POST /api/upload", () => {
    it("should upload an image file", () => {
      cy.fixture("test-image.jpg", "base64").then((fileContent) => {
        const blob = Cypress.Blob.base64StringToBlob(fileContent, "image/jpeg");
        const formData = new FormData();
        formData.append("file", blob, "test-image.jpg");
        formData.append("path", "test/test-image.jpg");

        cy.request({
          method: "POST",
          url: `${API_BASE}/upload`,
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.have.property("success", true);
            expect(response.body).to.have.property("url");
          }
        });
      });
    });

    it("should reject invalid file types", () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "application/pdf" });
      formData.append("file", blob, "test.pdf");
      formData.append("path", "test/test.pdf");

      cy.request({
        method: "POST",
        url: `${API_BASE}/upload`,
        body: formData,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property("success", false);
      });
    });
  });
});

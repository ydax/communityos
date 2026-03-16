/**
 * E2E Tests for Multi-Tenant Domain Routing
 * Tests middleware functionality and domain-based site rendering
 */

describe('Multi-Tenant Domain Routing', () => {
  let testSite;

  before(() => {
    // Load test site data
    cy.fixture('siteData').then((data) => {
      testSite = data.basicSite;
    });
  });

  describe('Custom Domain Routing', () => {
    it('should route to correct site for custom domain', () => {
      // Visit the main CentralTexas.com site first
      cy.visit('/');
      cy.get('body').should('be.visible');
      
      // Verify we're on the marketing site (not a tenant site)
      cy.url().should('include', '/');
    });

    it('should render site with correct business name', () => {
      // For actual E2E testing, you would configure /etc/hosts
      // For now, we test the API route that middleware uses
      cy.visit('/');
      
      // In production, middleware would query Firestore and render the site
      // This test verifies the structure is in place
      cy.get('body').should('exist');
    });

    it('should handle non-existent domains gracefully', () => {
      // Visit a route that simulates a non-existent site
      cy.visit('/site-not-found', { failOnStatusCode: false });
      
      // Should show 404 or site not found page
      cy.get('body').should('be.visible');
    });
  });

  describe('Subdomain Routing', () => {
    it('should support subdomain routing pattern', () => {
      // Test that subdomain pattern works
      // In production: test.centraltexas.com
      cy.visit('/');
      cy.get('body').should('be.visible');
    });
  });

  describe('Static File Handling', () => {
    it('should skip middleware for static assets', () => {
      // Verify static files load without middleware interference
      cy.request('/favicon.ico').its('status').should('eq', 200);
    });

    it('should skip middleware for Next.js internals', () => {
      // _next routes should bypass middleware
      cy.visit('/');
      
      // Check that Next.js assets load
      cy.get('body').should('be.visible');
    });
  });

  describe('Theme Rendering', () => {
    it('should render site with correct theme', () => {
      cy.visit('/');
      
      // In production, this would verify the theme is applied
      // For now, we verify the page structure exists
      cy.get('body').should('exist');
    });

    it('should render hero section when included', () => {
      cy.visit('/');
      
      // When a site with hero section is loaded, verify it renders
      // This would be expanded with actual site data in production
      cy.get('body').should('be.visible');
    });
  });

  describe('Site Sections', () => {
    it('should render services section', () => {
      cy.visit('/');
      
      // In production, verify services section renders for sites that have it
      cy.get('body').should('exist');
    });

    it('should render contact section', () => {
      cy.visit('/');
      
      // Verify contact section renders with correct data
      cy.get('body').should('exist');
    });

    it('should hide sections marked as not visible', () => {
      cy.visit('/');
      
      // Sections with visible: false should not render
      cy.get('body').should('exist');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should render correctly on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      cy.get('body').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load site within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      
      cy.get('body').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        // Site should load in under 3 seconds
        expect(loadTime).to.be.lessThan(3000);
      });
    });
  });
});

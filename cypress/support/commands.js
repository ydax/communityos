// ***********************************************
// Custom Cypress commands for Central Texas testing
// ***********************************************

/**
 * Create a test site via API
 * @example cy.createTestSite({ domain: 'test.com', businessName: 'Test Business' })
 */
Cypress.Commands.add('createTestSite', (siteData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('API_BASE_URL')}/sites`,
    body: {
      domain: siteData.domain || 'test-site.com',
      ownerId: siteData.ownerId || 'test_user_123',
      businessName: siteData.businessName || 'Test Business',
      theme: siteData.theme || 'the-trade',
      sections: siteData.sections || [],
      status: 'active'
    },
    failOnStatusCode: false
  });
});

/**
 * Delete a test site via API
 * @example cy.deleteTestSite('site123')
 */
Cypress.Commands.add('deleteTestSite', (siteId) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('API_BASE_URL')}/sites/${siteId}`,
    failOnStatusCode: false
  });
});

/**
 * Visit a site by domain (handles local testing)
 * @example cy.visitSite('joesfencing.com')
 */
Cypress.Commands.add('visitSite', (domain, path = '/') => {
  // For local testing, we'll visit localhost with custom headers
  // In real E2E tests, you'd configure /etc/hosts
  cy.visit(path, {
    headers: {
      'Host': domain
    }
  });
});

/**
 * Wait for site to be fully rendered
 */
Cypress.Commands.add('waitForSiteRender', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-testid="site-content"]', { timeout: 10000 }).should('exist');
});

/**
 * Check if element contains text (case-insensitive)
 */
Cypress.Commands.add('containsText', { prevSubject: true }, (subject, text) => {
  cy.wrap(subject).should(($el) => {
    const elementText = $el.text().toLowerCase();
    expect(elementText).to.include(text.toLowerCase());
  });
});

/**
 * Stub Firebase API calls for isolated testing
 */
Cypress.Commands.add('stubFirebase', () => {
  cy.intercept('POST', '**/firestore.googleapis.com/**', {
    statusCode: 200,
    body: { documents: [] }
  }).as('firestoreQuery');
});

/**
 * Login as test user (mock authentication)
 */
Cypress.Commands.add('loginAsTestUser', (userId = 'test_user_123') => {
  // Set mock auth token in localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('mockAuthToken', JSON.stringify({
      uid: userId,
      email: 'test@example.com',
      displayName: 'Test User'
    }));
  });
});

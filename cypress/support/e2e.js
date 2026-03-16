// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // You can customize this to only ignore specific errors
  if (err.message.includes('Firebase') || err.message.includes('hydration')) {
    return false;
  }
  
  // returning false here prevents Cypress from failing the test
  return true;
});

// Add global before hook for all tests
beforeEach(() => {
  // Clear any session data between tests
  cy.clearCookies();
  cy.clearLocalStorage();
});

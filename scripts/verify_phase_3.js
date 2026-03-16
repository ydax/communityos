#!/usr/bin/env node

/**
 * Phase 3 Verification Script
 *
 * This script provides "Hybrid Integration Proof" by testing the full stack:
 * 1. HTTP request to local API (proves network/middleware working)
 * 2. Firestore query via Admin SDK (proves persistence)
 * 3. Data consistency check (proves end-to-end flow)
 *
 * Run this script with the dev server running:
 * node scripts/verify_phase_3.js
 */

import fetch from "node-fetch";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");
dotenv.config({ path: envPath });

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Initialize Firebase Admin
let adminDb;
try {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  adminDb = getFirestore();
  console.log(
    `${colors.green}✓${colors.reset} Firebase Admin SDK initialized\n`,
  );
} catch (error) {
  console.error(
    `${colors.red}✗${colors.reset} Failed to initialize Firebase Admin SDK:`,
    error.message,
  );
  process.exit(1);
}

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const TEST_SITE_DATA = {
  domain: `verify-test-${Date.now()}.centraltexas.com`,
  ownerId: "test-owner-verification",
  businessName: "Verification Test Business",
  category: "fencing",
  theme: "the-trade",
  sections: [
    { type: "hero", visible: true, data: { headline: "Test Site" } },
    { type: "services", visible: true, data: {} },
  ],
};

/**
 * Print section header
 */
function printHeader(text) {
  console.log(`\n${colors.cyan}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${text}${colors.reset}`);
  console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}\n`);
}

/**
 * Print test result
 */
function printResult(passed, message, details = null) {
  const symbol = passed
    ? `${colors.green}✓${colors.reset}`
    : `${colors.red}✗${colors.reset}`;
  console.log(`${symbol} ${message}`);
  if (details) {
    console.log(`  ${colors.blue}${details}${colors.reset}`);
  }
}

/**
 * Test 1: HTTP Request to API
 */
async function testHttpRequest() {
  printHeader("TEST 1: HTTP Request (Network/Middleware Proof)");

  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/api/sites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(TEST_SITE_DATA),
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    // Check response status
    const statusPassed = response.status === 201;
    printResult(
      statusPassed,
      `Status Code: ${response.status}`,
      `Expected: 201, Duration: ${duration}ms`,
    );

    // Check debug headers (development only)
    const debugHeaders = {
      "x-request-id": response.headers.get("x-request-id"),
      "x-debug-middleware-decision": response.headers.get(
        "x-debug-middleware-decision",
      ),
    };

    const hasRequestId = !!debugHeaders["x-request-id"];
    printResult(
      hasRequestId,
      `Request ID Present: ${debugHeaders["x-request-id"]}`,
      "Tracking header set",
    );

    if (
      process.env.NODE_ENV === "development" &&
      debugHeaders["x-debug-middleware-decision"]
    ) {
      printResult(
        true,
        `Debug Headers Present`,
        `Middleware Decision: ${debugHeaders["x-debug-middleware-decision"]}`,
      );
    } else {
      console.log(
        `  ${colors.yellow}ℹ${colors.reset} Debug headers only in development mode`,
      );
    }

    // Check response body
    const hasSuccess = data.success === true;
    printResult(hasSuccess, `Response Structure`, `success: ${data.success}`);

    const hasSiteData = data.site && data.site.id;
    printResult(
      hasSiteData,
      `Site Data Returned`,
      hasSiteData ? `Site ID: ${data.site.id}` : "No site data",
    );

    if (!statusPassed || !hasSuccess || !hasSiteData) {
      console.error(`\n${colors.red}HTTP Test Failed${colors.reset}`);
      console.error("Response:", JSON.stringify(data, null, 2));
      return null;
    }

    console.log(`\n${colors.green}✓ HTTP Test Passed${colors.reset}`);
    return data.site;
  } catch (error) {
    printResult(false, "Network Request Failed", error.message);
    console.error(
      `\n${colors.red}HTTP Test Failed - Network Error${colors.reset}`,
    );
    return null;
  }
}

/**
 * Test 2: Firestore Query
 */
async function testFirestoreQuery(siteId, expectedDomain) {
  printHeader("TEST 2: Firestore Query (Persistence Proof)");

  try {
    const startTime = Date.now();
    const docRef = adminDb.collection("sites").doc(siteId);
    const doc = await docRef.get();
    const duration = Date.now() - startTime;

    // Check if document exists
    const exists = doc.exists;
    printResult(exists, `Document Exists`, `Query Duration: ${duration}ms`);

    if (!exists) {
      console.error(
        `\n${colors.red}Firestore Test Failed - Document Not Found${colors.reset}`,
      );
      return null;
    }

    const data = doc.data();

    // Check key fields
    const hasDomain = data.domain === expectedDomain;
    printResult(
      hasDomain,
      `Domain Match`,
      `Expected: ${expectedDomain}, Got: ${data.domain}`,
    );

    const hasOwnerId = data.ownerId === TEST_SITE_DATA.ownerId;
    printResult(
      hasOwnerId,
      `Owner ID Match`,
      `Expected: ${TEST_SITE_DATA.ownerId}, Got: ${data.ownerId}`,
    );

    const hasBusinessName = data.businessName === TEST_SITE_DATA.businessName;
    printResult(
      hasBusinessName,
      `Business Name Match`,
      `Expected: ${TEST_SITE_DATA.businessName}, Got: ${data.businessName}`,
    );

    const hasStatus = data.status === "active";
    printResult(hasStatus, `Status`, `${data.status}`);

    const hasTimestamps = data.createdAt && data.updatedAt;
    printResult(
      hasTimestamps,
      `Timestamps Present`,
      hasTimestamps ? "createdAt and updatedAt set" : "Missing timestamps",
    );

    if (!hasDomain || !hasOwnerId || !hasBusinessName) {
      console.error(
        `\n${colors.red}Firestore Test Failed - Data Mismatch${colors.reset}`,
      );
      return null;
    }

    console.log(`\n${colors.green}✓ Firestore Test Passed${colors.reset}`);
    return data;
  } catch (error) {
    printResult(false, "Firestore Query Failed", error.message);
    console.error(`\n${colors.red}Firestore Test Failed${colors.reset}`);
    return null;
  }
}

/**
 * Test 3: Data Consistency
 */
function testDataConsistency(httpSite, firestoreSite) {
  printHeader("TEST 3: Data Consistency (End-to-End Proof)");

  // Compare HTTP response with Firestore data
  const domainMatch = httpSite.domain === firestoreSite.domain;
  printResult(domainMatch, `Domain Consistency`, `${httpSite.domain}`);

  const ownerMatch = httpSite.ownerId === firestoreSite.ownerId;
  printResult(ownerMatch, `Owner ID Consistency`, `${httpSite.ownerId}`);

  const nameMatch = httpSite.businessName === firestoreSite.businessName;
  printResult(
    nameMatch,
    `Business Name Consistency`,
    `${httpSite.businessName}`,
  );

  const statusMatch = httpSite.status === firestoreSite.status;
  printResult(statusMatch, `Status Consistency`, `${httpSite.status}`);

  const allMatch = domainMatch && ownerMatch && nameMatch && statusMatch;

  if (allMatch) {
    console.log(
      `\n${colors.green}✓ Data Consistency Test Passed${colors.reset}`,
    );
    console.log(
      `${colors.green}✓ HTTP Response matches Firestore data perfectly${colors.reset}`,
    );
  } else {
    console.error(`\n${colors.red}Data Consistency Test Failed${colors.reset}`);
  }

  return allMatch;
}

/**
 * Cleanup: Delete test site
 */
async function cleanup(siteId) {
  printHeader("CLEANUP: Removing Test Data");

  try {
    await adminDb.collection("sites").doc(siteId).delete();
    printResult(true, "Test site deleted", `Site ID: ${siteId}`);
  } catch (error) {
    printResult(false, "Cleanup failed", error.message);
  }
}

/**
 * Main verification flow
 */
async function runVerification() {
  console.log(`\n${colors.cyan}╔${"═".repeat(58)}╗${colors.reset}`);
  console.log(
    `${colors.cyan}║  Phase 3 Verification - Hybrid Integration Test          ║${colors.reset}`,
  );
  console.log(`${colors.cyan}╚${"═".repeat(58)}╝${colors.reset}`);

  console.log(
    `\nAPI Endpoint: ${colors.blue}${API_BASE_URL}/api/sites${colors.reset}`,
  );
  console.log(
    `Test Domain: ${colors.blue}${TEST_SITE_DATA.domain}${colors.reset}`,
  );

  let httpSite = null;
  let firestoreSite = null;
  let allTestsPassed = false;

  try {
    // Test 1: HTTP Request
    httpSite = await testHttpRequest();
    if (!httpSite) {
      throw new Error("HTTP test failed");
    }

    // Test 2: Firestore Query
    firestoreSite = await testFirestoreQuery(
      httpSite.id,
      TEST_SITE_DATA.domain,
    );
    if (!firestoreSite) {
      throw new Error("Firestore test failed");
    }

    // Test 3: Data Consistency
    const consistencyPassed = testDataConsistency(httpSite, firestoreSite);
    if (!consistencyPassed) {
      throw new Error("Data consistency test failed");
    }

    allTestsPassed = true;
  } catch (error) {
    console.error(
      `\n${colors.red}Verification Failed: ${error.message}${colors.reset}`,
    );
  } finally {
    // Cleanup
    if (httpSite && httpSite.id) {
      await cleanup(httpSite.id);
    }
  }

  // Final Summary
  printHeader("VERIFICATION SUMMARY");

  if (allTestsPassed) {
    console.log(`${colors.green}✓✓✓ ALL TESTS PASSED ✓✓✓${colors.reset}\n`);
    console.log(`${colors.green}Phase 3 Verification Complete:${colors.reset}`);
    console.log(
      `  • HTTP Request → API → Firestore: ${colors.green}✓${colors.reset}`,
    );
    console.log(
      `  • Middleware routing working: ${colors.green}✓${colors.reset}`,
    );
    console.log(
      `  • Data persistence working: ${colors.green}✓${colors.reset}`,
    );
    console.log(`  • End-to-end consistency: ${colors.green}✓${colors.reset}`);
    console.log(
      `\n${colors.cyan}Ready for Phase 4: Ghost Agency Operations${colors.reset}\n`,
    );
    process.exit(0);
  } else {
    console.log(`${colors.red}✗✗✗ VERIFICATION FAILED ✗✗✗${colors.reset}\n`);
    console.log(
      `${colors.red}Please review the errors above and fix before proceeding.${colors.reset}\n`,
    );
    process.exit(1);
  }
}

// Run verification
runVerification().catch((error) => {
  console.error(`\n${colors.red}Fatal Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

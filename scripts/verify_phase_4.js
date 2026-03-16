#!/usr/bin/env node

/**
 * Phase 4 Verification Script
 * Validates that all demo sites and marketplace functionality are working correctly
 * 
 * Usage: node scripts/verify_phase_4.js
 * 
 * Requires .env.local with Firebase credentials
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID?.replace(/\\n/g, '').trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.replace(/\\n/g, '').trim(),
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Expected demo sites
const expectedSites = [
  { domain: 'ctx.us', businessName: 'CTX Roofing', theme: 'the-maker' },
  { domain: 'bluebonnet-plumbing.centraltexas.com', businessName: 'Bluebonnet Rapid Plumbing', theme: 'the-trade' },
  { domain: 'river-city-scapes.centraltexas.com', businessName: 'River City Scapes', theme: 'the-venue' },
];

let passed = 0;
let failed = 0;

function success(message) {
  console.log(`✅ ${message}`);
  passed++;
}

function fail(message) {
  console.log(`❌ ${message}`);
  failed++;
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

async function verifySites() {
  console.log('\n📦 Verifying Demo Sites...\n');

  for (const expected of expectedSites) {
    console.log(`\nChecking: ${expected.businessName} (${expected.domain})`);

    try {
      // Check if site exists
      const sitesSnapshot = await db
        .collection('sites')
        .where('domain', '==', expected.domain)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (sitesSnapshot.empty) {
        fail(`Site not found: ${expected.domain}`);
        continue;
      }

      const siteDoc = sitesSnapshot.docs[0];
      const siteData = siteDoc.data();

      // Verify business name
      if (siteData.businessName === expected.businessName) {
        success(`Business name matches: ${siteData.businessName}`);
      } else {
        fail(`Business name mismatch. Expected: ${expected.businessName}, Got: ${siteData.businessName}`);
      }

      // Verify theme
      if (siteData.theme === expected.theme) {
        success(`Theme matches: ${siteData.theme}`);
      } else {
        fail(`Theme mismatch. Expected: ${expected.theme}, Got: ${siteData.theme}`);
      }

      // Verify sections exist
      if (siteData.sections && siteData.sections.length > 0) {
        success(`Has ${siteData.sections.length} sections configured`);
      } else {
        fail('No sections configured');
      }

      // Verify listings exist
      const listingsSnapshot = await db
        .collection('listings')
        .where('siteId', '==', siteDoc.id)
        .where('status', '==', 'active')
        .get();

      const listingsCount = listingsSnapshot.size;
      if (listingsCount === 3) {
        success(`Has 3 demo listings`);
      } else if (listingsCount > 0) {
        fail(`Has ${listingsCount} listings (expected 3)`);
      } else {
        fail('No listings found');
      }

      // Verify [Demo] prefix on listings
      let allHaveDemoPrefix = true;
      listingsSnapshot.docs.forEach(doc => {
        if (!doc.data().title?.startsWith('[Demo]')) {
          allHaveDemoPrefix = false;
        }
      });

      if (allHaveDemoPrefix && listingsCount > 0) {
        success('All listings have [Demo] prefix');
      } else if (listingsCount > 0) {
        fail('Some listings missing [Demo] prefix');
      }

      // Check for Stripe test mode
      if (siteData.stripeTestMode === true) {
        success('Stripe test mode enabled');
      } else {
        fail('Stripe test mode not enabled');
      }

    } catch (error) {
      fail(`Error checking site: ${error.message}`);
    }
  }
}

async function verifyMarketplace() {
  console.log('\n\n🛒 Verifying Marketplace Aggregation...\n');

  try {
    // Get all active listings
    const listingsSnapshot = await db
      .collection('listings')
      .where('status', '==', 'active')
      .get();

    const totalListings = listingsSnapshot.size;
    info(`Total active listings in database: ${totalListings}`);

    // Count demo listings
    let demoListings = 0;
    listingsSnapshot.docs.forEach(doc => {
      if (doc.data().title?.startsWith('[Demo]')) {
        demoListings++;
      }
    });

    if (demoListings >= 9) {
      success(`Found ${demoListings} demo listings (expected at least 9)`);
    } else {
      fail(`Found only ${demoListings} demo listings (expected at least 9)`);
    }

    // Check for cross-category listings
    const categories = new Set();
    listingsSnapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        categories.add(category);
      }
    });

    info(`Categories found: ${Array.from(categories).join(', ')}`);

    if (categories.has('roofing') && categories.has('plumbing') && categories.has('landscaping')) {
      success('All expected categories present (roofing, plumbing, landscaping)');
    } else {
      fail('Missing some expected categories');
    }

    // Test "Repair" search
    const repairListings = listingsSnapshot.docs.filter(doc => {
      const title = doc.data().title?.toLowerCase() || '';
      const description = doc.data().description?.toLowerCase() || '';
      return title.includes('repair') || description.includes('repair');
    });

    if (repairListings.length >= 2) {
      success(`"Repair" search would return ${repairListings.length} results (expected at least 2)`);
      repairListings.forEach(doc => {
        info(`  - ${doc.data().title}`);
      });
    } else {
      fail(`"Repair" search would only return ${repairListings.length} results (expected at least 2)`);
    }

  } catch (error) {
    fail(`Error verifying marketplace: ${error.message}`);
  }
}

async function verifyThemes() {
  console.log('\n\n🎨 Verifying Theme Implementation...\n');

  try {
    const themes = ['the-maker', 'the-trade', 'the-venue'];

    for (const theme of themes) {
      const sitesWithTheme = await db
        .collection('sites')
        .where('theme', '==', theme)
        .where('status', '==', 'active')
        .get();

      if (sitesWithTheme.size > 0) {
        success(`Theme "${theme}" is in use (${sitesWithTheme.size} site(s))`);
      } else {
        fail(`Theme "${theme}" not being used by any sites`);
      }
    }
  } catch (error) {
    fail(`Error verifying themes: ${error.message}`);
  }
}

async function verifyDomainResolution() {
  console.log('\n\n🌐 Domain Resolution Checks...\n');

  info('Custom domain (ctx.us):');
  info('  Manual verification required:');
  info('  1. Run: vercel domains ls');
  info('  2. Confirm ctx.us is listed');
  info('  3. Visit https://ctx.us in browser');
  info('  4. Confirm site loads correctly');

  info('\nSubdomains:');
  info('  Manual verification required:');
  info('  1. Visit https://bluebonnet-plumbing.centraltexas.com');
  info('  2. Visit https://river-city-scapes.centraltexas.com');
  info('  3. Confirm both sites load correctly');

  info('\nMarketplace:');
  info('  Manual verification required:');
  info('  1. Visit https://centraltexas.com/marketplace');
  info('  2. Confirm listings appear from all 3 sites');
  info('  3. Test search for "Repair"');
  info('  4. Test category filters');
}

async function runVerification() {
  console.log('🔍 Phase 4 Verification Script');
  console.log('================================\n');

  await verifySites();
  await verifyMarketplace();
  await verifyThemes();
  await verifyDomainResolution();

  console.log('\n\n📊 Verification Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 All automated checks passed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Complete manual domain verification (see above)');
    console.log('   2. Test marketplace search and filters in browser');
    console.log('   3. Verify all 3 themes render correctly');
    console.log('   4. Add images to listings via admin UI');
    console.log('   5. Test mobile responsiveness');
  } else {
    console.log('\n⚠️  Some checks failed. Please review and fix issues above.');
    process.exit(1);
  }

  process.exit(0);
}

// Run verification
runVerification();

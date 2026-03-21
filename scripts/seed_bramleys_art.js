#!/usr/bin/env node

/**
 * Bramley's Art — Mock Data Seed Script
 *
 * Creates a test site and three listings for a fictional art gallery
 * called "Bramley's Art" in Lockhart, TX.
 *
 * The three listings cover every listing type the schema supports:
 *   1. Event   → modeled as service / flat-rate (gallery opening ticket)
 *   2. Product → modeled as good with color/size variants (art prints)
 *   3. Service → modeled as service / hourly (private painting lessons)
 *
 * All documents are tagged with:
 *   - Title prefix:   "[Mock]"
 *   - isMockData:     true
 *   - mockBatch:      "bramleys-art-20260320"
 *
 * To clean up later:
 *   db.collectionGroup('*').where('mockBatch', '==', 'bramleys-art-20260320')
 *
 * Usage:
 *   node scripts/seed_bramleys_art.js
 *
 * Requires .env.local with Firebase Admin credentials.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const admin = require('firebase-admin');

// ── Firebase Admin initialization ────────────────────────────
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

// ── Constants ────────────────────────────────────────────────
const MOCK_BATCH = 'bramleys-art-20260320';
const TENANT_ID = 'bramleys-art-lockhart';
const NOW = Date.now();

/**
 * Shared metadata stamped onto every document for easy identification
 * and cleanup of mock data.
 */
const mockMeta = {
  isMockData: true,
  mockBatch: MOCK_BATCH,
};

// ── Site Configuration ───────────────────────────────────────
const siteConfig = {
  domain: 'bramleys-art.centraltexas.com',
  businessName: "[Mock] Bramley's Art",
  theme: 'the-venue', // Gallery → visual/experiential theme
  category: 'art-gallery',
  location: 'Lockhart, TX',
  ownerId: 'mock@centraltexas.com',
  description:
    "Bramley's Art is a community-focused art gallery in the heart of Lockhart, TX, " +
    'showcasing local and regional artists. We host monthly gallery openings, ' +
    'sell original works and prints, and offer private painting lessons.',
  sections: [
    {
      type: 'hero',
      visible: true,
      content: {
        headline: 'Art Lives Here',
        subheadline:
          'Original works by Central Texas artists — gallery openings, prints, and private lessons in historic Lockhart.',
        ctaText: 'Browse the Gallery',
        ctaLink: '#gallery',
        image: '',
      },
    },
    {
      type: 'services',
      visible: true,
      content: {},
    },
    {
      type: 'about',
      visible: true,
      content: {
        bio:
          "Bramley's Art was founded to give Central Texas artists a brick-and-mortar home. " +
          'Located on the Lockhart square, our gallery features rotating exhibitions, ' +
          'a curated print shop, and a cozy studio space for workshops and private lessons. ' +
          "Whether you're a collector, a curious visitor, or a budding painter, Bramley's welcomes you.",
        image: '',
      },
    },
    {
      type: 'gallery',
      visible: true,
      content: { images: [] },
    },
    {
      type: 'contact',
      visible: true,
      content: {
        phone: '(512) 555-2787',
        email: 'hello@bramleys-art.centraltexas.com',
        address: '100 S Main St, Lockhart, TX 78644',
      },
    },
  ],
  status: 'active',
  stripeTestMode: true,
  ...mockMeta,
};

// ──────────────────────────────────────────────────────────────
// Main Seed Function
// ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('🎨 Seeding Bramley\'s Art mock data...\n');

  // ── 1. Create Site ─────────────────────────────────────────
  console.log('📦 Creating site: Bramley\'s Art (Lockhart, TX)');

  const existingSites = await db
    .collection('sites')
    .where('domain', '==', siteConfig.domain)
    .get();

  let siteId;

  if (!existingSites.empty) {
    siteId = existingSites.docs[0].id;
    console.log(`   ⚠️  Site already exists (${siteId}), reusing.`);
  } else {
    const siteRef = await db.collection('sites').add({
      ...siteConfig,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    siteId = siteRef.id;
    console.log(`   ✅ Site created: ${siteId}`);
  }

  // ── 2. Create Listings ────────────────────────────────────

  // ── 2A: EVENT — "Spring Gallery Opening" ──────────────────
  console.log('\n🎫 Creating listing #1: Event (Gallery Opening)');

  const eventRef = await createListingIfNotExists(siteId, {
    type: 'service',
    title: '[Mock] Spring Gallery Opening — First Friday',
    description:
      'Join us for the unveiling of our Spring Collection featuring five Central Texas artists. ' +
      'Live acoustic music from local bluegrass duo, complimentary Lockhart BBQ bites, and ' +
      'Texas wines. Doors open at 6 PM. Admission includes one drink ticket.',
    basePrice: 1500, // $15.00 in cents
    billingModel: 'flat',
    serviceRadiusMiles: null,
    mediaUrls: [],
    visibility: ['storefront', 'marketplace'],
    status: 'active',
    // Extra metadata for this being an event
    eventMeta: {
      eventDate: '2026-04-03T18:00:00-05:00',
      eventEndDate: '2026-04-03T21:00:00-05:00',
      venue: "Bramley's Art Gallery",
      address: '100 S Main St, Lockhart, TX 78644',
      capacity: 75,
    },
  });

  // ── 2B: PRODUCT — "Limited Edition Art Print" ─────────────
  console.log('\n📦 Creating listing #2: Good (Art Print with Variants)');

  const goodRef = await createListingIfNotExists(siteId, {
    type: 'good',
    title: '[Mock] Hill Country Sunset — Limited Edition Print',
    description:
      'Archival giclée print on heavyweight cotton rag paper. Each print is signed ' +
      'and numbered by the artist (edition of 100). Vibrant depiction of a Lockhart ' +
      'sunset over rolling Hill Country terrain.',
    basePrice: 4500, // $45.00 in cents
    billingModel: null,
    serviceRadiusMiles: null,
    mediaUrls: [],
    visibility: ['storefront', 'marketplace'],
    status: 'active',
  });

  // Create variants for the print (Size × Frame option)
  if (goodRef) {
    console.log('   📐 Creating variants...');

    const variants = [
      { options: { Size: '8×10', Frame: 'Unframed' }, priceOverride: null, initialStock: 25 },
      { options: { Size: '8×10', Frame: 'Black Frame' }, priceOverride: 7500, initialStock: 10 },
      { options: { Size: '16×20', Frame: 'Unframed' }, priceOverride: 8500, initialStock: 15 },
      { options: { Size: '16×20', Frame: 'Black Frame' }, priceOverride: 12500, initialStock: 8 },
      { options: { Size: '24×36', Frame: 'Unframed' }, priceOverride: 14000, initialStock: 5 },
      { options: { Size: '24×36', Frame: 'Black Frame' }, priceOverride: 22000, initialStock: 3 },
    ];

    for (const v of variants) {
      const sku = generateSKU('[Mock] Hill Country Sunset', v.options);
      const variantRef = db.collection('variants').doc();

      await variantRef.set({
        id: variantRef.id,
        listingId: goodRef,
        tenantId: TENANT_ID,
        sku,
        options: v.options,
        priceOverride: v.priceOverride,
        currentStock: v.initialStock,
        status: 'active',
        createdAt: NOW,
        ...mockMeta,
      });

      // Inventory ledger entry
      if (v.initialStock > 0) {
        const invRef = db.collection('inventory').doc();
        await invRef.set({
          id: invRef.id,
          variantId: variantRef.id,
          listingId: goodRef,
          tenantId: TENANT_ID,
          quantityDelta: v.initialStock,
          reason: 'initial_stock',
          timestamp: NOW,
          ...mockMeta,
        });
      }

      console.log(`      ✅ ${v.options.Size} / ${v.options.Frame} — SKU: ${sku} (stock: ${v.initialStock})`);
    }
  }

  // ── 2C: SERVICE — "Private Painting Lesson" ───────────────
  console.log('\n🎨 Creating listing #3: Service (Private Painting Lesson)');

  await createListingIfNotExists(siteId, {
    type: 'service',
    title: '[Mock] Private Painting Lesson',
    description:
      'One-on-one painting instruction in our Lockhart studio. All skill levels welcome — ' +
      'from first-time painters to experienced artists looking to refine technique. ' +
      'Supplies (canvas, acrylics, brushes) included. Sessions are 90 minutes.',
    basePrice: 7500, // $75.00 per hour in cents
    billingModel: 'hourly',
    serviceRadiusMiles: 0, // In-studio only
    mediaUrls: [],
    visibility: ['storefront', 'marketplace'],
    status: 'active',
  });

  // ── Done ───────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Bramley\'s Art mock data seeded successfully!');
  console.log('═'.repeat(60));
  console.log(`\n📝 Cleanup tag: mockBatch = "${MOCK_BATCH}"`);
  console.log(`📍 Site domain: ${siteConfig.domain}`);
  console.log(`🆔 Site ID: ${siteId}`);
  console.log(`🆔 Tenant ID: ${TENANT_ID}`);
  console.log('\nListings created:');
  console.log('  1. 🎫 [Mock] Spring Gallery Opening — First Friday      (service/flat, $15)');
  console.log('  2. 📦 [Mock] Hill Country Sunset — Limited Edition Print (good, $45–$220, 6 variants)');
  console.log('  3. 🎨 [Mock] Private Painting Lesson                    (service/hourly, $75/hr)');
  console.log('\n🔗 View at: https://bramleys-art.centraltexas.com');
  console.log('🔗 Marketplace: https://centraltexas.com/marketplace\n');

  process.exit(0);
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Create a listing only if one with the same title + siteId doesn't
 * already exist (idempotent for re-runs).
 */
async function createListingIfNotExists(siteId, listingData) {
  const existing = await db
    .collection('listings')
    .where('siteId', '==', siteId)
    .where('title', '==', listingData.title)
    .get();

  if (!existing.empty) {
    const id = existing.docs[0].id;
    console.log(`   ⚠️  Already exists (${id}), skipping.`);
    return id;
  }

  const ref = db.collection('listings').doc();
  await ref.set({
    id: ref.id,
    tenantId: TENANT_ID,
    siteId,
    ...listingData,
    createdAt: NOW,
    updatedAt: NOW,
    ...mockMeta,
  });

  console.log(`   ✅ Created: ${ref.id}`);
  return ref.id;
}

/**
 * Mirror of the SKU generator in app/actions/listings.js
 */
function generateSKU(title, options) {
  const prefix = title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .join('-');

  const optionParts = Object.values(options)
    .map((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
    .join('-');

  return `${prefix}-${optionParts}`;
}

// ── Run ──────────────────────────────────────────────────────
seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

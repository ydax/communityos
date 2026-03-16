#!/usr/bin/env node

/**
 * Demo Sites Creation Script
 * Creates the 3 demo sites for Phase 4 directly in Firestore
 * 
 * Usage: node scripts/create_demo_sites.js
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

// Demo site configurations
const demoSites = [
  {
    domain: 'ctx.us',
    businessName: 'CTX Roofing',
    theme: 'the-maker',
    category: 'roofing',
    location: 'New Braunfels, TX',
    ownerId: 'demo@centraltexas.com',
    sections: [
      {
        type: 'hero',
        visible: true,
        content: {
          headline: 'Protecting Central Texas Homes Since 2015',
          subheadline: 'Expert roofing solutions built to withstand the Texas climate',
          ctaText: 'Request a Quote',
          ctaLink: '#contact',
          image: '', // Will be added manually
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
          bio: "CTX Roofing has been Central Texas's trusted roofing partner for over a decade. Our team of certified professionals specializes in residential and commercial roofing solutions built to withstand the Texas climate. From minor repairs to complete re-roofs, we deliver quality craftsmanship backed by industry-leading warranties.",
          image: '', // Will be added manually
        },
      },
      {
        type: 'contact',
        visible: true,
        content: {
          phone: '(830) 555-ROOF',
          email: 'info@ctx.us',
          address: 'New Braunfels, TX',
        },
      },
    ],
    status: 'active',
    stripeTestMode: true,
  },
  {
    domain: 'bluebonnet-plumbing.centraltexas.com',
    businessName: 'Bluebonnet Rapid Plumbing',
    theme: 'the-trade',
    category: 'plumbing',
    location: 'North Austin / Round Rock, TX',
    ownerId: 'demo@centraltexas.com',
    sections: [
      {
        type: 'hero',
        visible: true,
        content: {
          headline: 'Fast, Fair, Fixed Right',
          subheadline: '24/7 emergency plumbing services you can trust',
          ctaText: 'Call Now',
          ctaLink: 'tel:5125551234',
          image: '', // Will be added manually
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
          bio: "Bluebonnet Rapid Plumbing serves the North Austin and Round Rock communities with honest, transparent plumbing services. Our licensed technicians arrive on time, diagnose issues quickly, and provide upfront pricing before we start any work. No surprises, no hidden fees—just quality plumbing you can trust.",
          image: '', // Will be added manually
        },
      },
      {
        type: 'contact',
        visible: true,
        content: {
          phone: '(512) 555-1234',
          email: 'service@bluebonnet-plumbing.centraltexas.com',
          address: 'Round Rock, TX',
        },
      },
    ],
    status: 'active',
    stripeTestMode: true,
  },
  {
    domain: 'river-city-scapes.centraltexas.com',
    businessName: 'River City Scapes',
    theme: 'the-venue',
    category: 'landscaping',
    location: 'San Antonio (Stone Oak), TX',
    ownerId: 'demo@centraltexas.com',
    sections: [
      {
        type: 'hero',
        visible: true,
        content: {
          headline: 'Artisan Landscapes for Modern Living',
          subheadline: 'Water-smart xeriscape designs celebrating Texas beauty',
          ctaText: 'View Our Work',
          ctaLink: '#gallery',
          image: '', // Will be added manually
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
          bio: "River City Scapes brings artisan craftsmanship to San Antonio landscaping. We specialize in water-smart xeriscape designs that celebrate Texas's native beauty while creating stunning outdoor living spaces. From consultation to installation to ongoing maintenance, we partner with homeowners to create landscapes that thrive in our unique Hill Country climate.",
          image: '', // Will be added manually
        },
      },
      {
        type: 'gallery',
        visible: true,
        content: {
          images: [], // Will be added manually
        },
      },
      {
        type: 'contact',
        visible: true,
        content: {
          phone: '(210) 555-7227',
          email: 'hello@river-city-scapes.centraltexas.com',
          address: 'Stone Oak, San Antonio, TX',
        },
      },
    ],
    status: 'active',
    stripeTestMode: true,
  },
];

// Demo listings for each site
const demoListings = {
  'ctx.us': [
    {
      title: '[Demo] Residential Re-Roof',
      description: 'Complete tear-off and replacement with 25-year warranty',
      type: 'service',
      category: 'roofing',
      pricing: {
        model: 'quote',
        unit: 'square foot',
      },
      images: [],
      status: 'active',
      // Variants will be added after listing creation:
      // - Architectural Shingles ($350/sq)
      // - Premium Metal Roof ($750/sq)
    },
    {
      title: '[Demo] Emergency Leak Repair',
      description: 'Same-day emergency response for active leaks',
      type: 'service',
      category: 'roofing',
      pricing: {
        model: 'fixed',
        amount: 299,
        unit: 'service',
      },
      images: [],
      status: 'active',
    },
    {
      title: '[Demo] Roof Inspection',
      description: 'Comprehensive 20-point inspection with photo report',
      type: 'service',
      category: 'roofing',
      pricing: {
        model: 'fixed',
        amount: 150,
        unit: 'inspection',
      },
      images: [],
      status: 'active',
    },
  ],
  'bluebonnet-plumbing.centraltexas.com': [
    {
      title: '[Demo] Emergency Leak Detection',
      description: '24/7 emergency response with advanced leak detection equipment',
      type: 'service',
      category: 'plumbing',
      pricing: {
        model: 'fixed',
        amount: 89,
        unit: 'dispatch',
      },
      images: [],
      status: 'active',
    },
    {
      title: '[Demo] Water Heater Flush',
      description: "Extend your water heater's life with professional maintenance",
      type: 'service',
      category: 'plumbing',
      pricing: {
        model: 'fixed',
        amount: 199,
        unit: 'service',
      },
      images: [],
      status: 'active',
    },
    {
      title: '[Demo] Drain Cleaning',
      description: 'Professional hydro-jetting for stubborn clogs',
      type: 'service',
      category: 'plumbing',
      pricing: {
        model: 'fixed',
        amount: 149,
        unit: 'service',
      },
      images: [],
      status: 'active',
    },
  ],
  'river-city-scapes.centraltexas.com': [
    {
      title: '[Demo] Xeriscape Design Consultation',
      description: 'Custom drought-tolerant landscape design for Texas gardens',
      type: 'service',
      category: 'landscaping',
      pricing: {
        model: 'fixed',
        amount: 150,
        unit: 'consultation',
      },
      images: [],
      status: 'active',
    },
    {
      title: '[Demo] Seasonal Bed Maintenance',
      description: 'Monthly maintenance package: pruning, mulching, seasonal color rotation (Recurring: $99/month)',
      type: 'service',
      category: 'landscaping',
      pricing: {
        model: 'fixed',
        amount: 99,
        unit: 'month',
      },
      images: [],
      status: 'active',
    },
    {
      title: '[Demo] Outdoor Living Installation',
      description: 'Custom patios, fire pits, and outdoor kitchens in limestone and native stone',
      type: 'service',
      category: 'landscaping',
      pricing: {
        model: 'quote',
        unit: 'project',
      },
      images: [],
      status: 'active',
    },
  ],
};

async function createDemoSites() {
  console.log('🚀 Starting demo site creation...\n');

  try {
    for (const siteConfig of demoSites) {
      console.log(`📦 Creating site: ${siteConfig.businessName} (${siteConfig.domain})`);

      // Check if site already exists
      const existingSites = await db
        .collection('sites')
        .where('domain', '==', siteConfig.domain)
        .where('status', '==', 'active')
        .get();

      let siteId;

      if (!existingSites.empty) {
        console.log(`   ⚠️  Site already exists, using existing ID`);
        siteId = existingSites.docs[0].id;
      } else {
        // Create new site
        const siteRef = await db.collection('sites').add({
          ...siteConfig,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        siteId = siteRef.id;
        console.log(`   ✅ Site created with ID: ${siteId}`);
      }

      // Create listings for this site
      const listings = demoListings[siteConfig.domain];
      console.log(`   📋 Creating ${listings.length} listings...`);

      for (const listing of listings) {
        // Check if listing already exists
        const existingListings = await db
          .collection('listings')
          .where('siteId', '==', siteId)
          .where('title', '==', listing.title)
          .where('status', '==', 'active')
          .get();

        if (!existingListings.empty) {
          console.log(`      ⚠️  Listing "${listing.title}" already exists, skipping`);
          continue;
        }

        // Create listing
        const listingRef = await db.collection('listings').add({
          ...listing,
          siteId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`      ✅ Created: ${listing.title}`);

        // If this is the Re-Roof listing, create variants
        if (listing.title === '[Demo] Residential Re-Roof') {
          console.log(`         📐 Creating variants...`);

          const variants = [
            {
              listingId: listingRef.id,
              name: 'Architectural Shingles',
              sku: 'ROOF-ARCH-SQ',
              price: 350,
              inventory: 0, // Services don't track inventory
              status: 'active',
            },
            {
              listingId: listingRef.id,
              name: 'Premium Metal Roof',
              sku: 'ROOF-METAL-SQ',
              price: 750,
              inventory: 0,
              status: 'active',
            },
          ];

          for (const variant of variants) {
            await db.collection('variants').add({
              ...variant,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`            ✅ Variant: ${variant.name}`);
          }
        }
      }

      console.log(`   ✅ ${siteConfig.businessName} setup complete\n`);
    }

    console.log('🎉 All demo sites created successfully!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Add images to listings via admin UI');
    console.log('   2. Configure DNS for ctx.us domain:');
    console.log('      - Add ctx.us to Vercel via CLI: vercel domains add ctx.us');
    console.log('      - Configure DNS A/AAAA records to point to Vercel');
    console.log('   3. Visit sites to verify they load correctly:');
    console.log('      - https://ctx.us');
    console.log('      - https://bluebonnet-plumbing.centraltexas.com');
    console.log('      - https://river-city-scapes.centraltexas.com');
    console.log('   4. Visit marketplace: https://centraltexas.com/marketplace');
  } catch (error) {
    console.error('❌ Error creating demo sites:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
createDemoSites();

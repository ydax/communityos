const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID?.replace(/\\n/g, "").trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.replace(/\\n/g, "").trim(),
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

async function migrateOwnerId() {
  console.log("Starting ownerId migration...");
  let countListings = 0;
  let countVariants = 0;

  try {
    const sitesSnapshot = await db.collection("sites").get();
    const siteOwners = {};

    sitesSnapshot.forEach((doc) => {
      const site = doc.data();
      if (site.ownerId) {
        siteOwners[doc.id] = site.ownerId;
      }
    });

    console.log(`Found ${Object.keys(siteOwners).length} sites with ownerIds`);

    // Migrate listings
    const listingsSnapshot = await db.collection("listings").get();
    const listingBatches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const doc of listingsSnapshot.docs) {
      const data = doc.data();
      if (data.siteId && siteOwners[data.siteId]) {
        currentBatch.update(doc.ref, { ownerId: siteOwners[data.siteId] });
        batchCount++;
        countListings++;

        if (batchCount === 500) {
          listingBatches.push(currentBatch.commit());
          currentBatch = db.batch();
          batchCount = 0;
        }
      }
    }
    
    if (batchCount > 0) {
      listingBatches.push(currentBatch.commit());
    }

    await Promise.all(listingBatches);
    console.log(`Migrated ${countListings} listings.`);

    // Migrate variants
    const variantsSnapshot = await db.collection("variants").get();
    const variantBatches = [];
    currentBatch = db.batch();
    batchCount = 0;

    for (const doc of variantsSnapshot.docs) {
      const data = doc.data();
      // Wait, variants typically have siteId conceptually but check what it is actually
      // Wait, do variants have siteId? Typically yes, or we can look up via listingId.
      let ownerId = null;
      if (data.siteId && siteOwners[data.siteId]) {
         ownerId = siteOwners[data.siteId];
      } else if (data.listingId) {
         // Expensive but necessary if siteId isn't directly on variant
         const listingDoc = await db.collection("listings").doc(data.listingId).get();
         const listingInfo = listingDoc.data();
         if (listingInfo?.siteId && siteOwners[listingInfo.siteId]) {
             ownerId = siteOwners[listingInfo.siteId];
         }
      }

      if (ownerId) {
        currentBatch.update(doc.ref, { ownerId });
        batchCount++;
        countVariants++;

        if (batchCount === 500) {
          variantBatches.push(currentBatch.commit());
          currentBatch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      variantBatches.push(currentBatch.commit());
    }

    await Promise.all(variantBatches);
    console.log(`Migrated ${countVariants} variants.`);
    console.log("Migration complete!");

  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrateOwnerId();

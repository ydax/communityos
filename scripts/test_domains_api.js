require("dotenv").config({ path: ".env.local" });
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Minimal script to test local API endpoints for adding/verifying/removing custom domains.
// Usage:
// 1. Ensure `npm run dev` is running in another terminal.
// 2. node scripts/test_domains_api.js my-test-domain.com

const DOMAIN = process.argv[2] || "test-domain-api-sync.com";
const LOCAL_API_URL = "http://localhost:3000/api/sites";

async function getFirstActiveSite() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log("No FIREBASE_SERVICE_ACCOUNT_KEY found in .env.local");
      process.exit(1);
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({ credential: cert(serviceAccount) });
  }
  const db = getFirestore();
  const snapshot = await db
    .collection("sites")
    .where("status", "==", "active")
    .limit(1)
    .get();
  if (snapshot.empty) {
    throw new Error("No active sites found in Firestore to test with.");
  }
  return snapshot.docs[0].id;
}

async function runCheck() {
  console.log(`\n--- Vercel <-> Firestore Domain Synchronization Test ---\n`);

  if (!process.env.VERCEL_API_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    console.error(
      "❌ Need VERCEL_API_TOKEN and VERCEL_PROJECT_ID in .env.local",
    );
    process.exit(1);
  }

  let siteId;
  try {
    console.log("Fetching a sample site ID from Firestore...");
    siteId = await getFirstActiveSite();
    console.log(`✅ Using site ID: ${siteId}\n`);
  } catch (err) {
    console.error(`❌ Failed to fetch site:`, err.message);
    process.exit(1);
  }

  console.log(`➡️  Step 1: Adding domain [${DOMAIN}] to site...`);
  const addRes = await fetch(`${LOCAL_API_URL}/${siteId}/domain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain: DOMAIN }),
  });

  const addData = await addRes.json();
  if (!addRes.ok) {
    console.error(`❌ Add Domain Failed:`, addData);
    process.exit(1);
  }
  console.log(`✅ Added to Vercel. Firestore 'customDomain' updated.`);
  console.log(`   Response details:`, Object.keys(addData.vercel));

  console.log(`\n➡️  Step 2: Verifying domain [${DOMAIN}] configuration...`);
  const verifyRes = await fetch(
    `${LOCAL_API_URL}/${siteId}/domain/verify?domain=${DOMAIN}`,
  );
  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) {
    console.error(`❌ Verification Failed:`, verifyData);
    process.exit(1);
  }
  console.log(`✅ Verification query successful.`);
  console.log(`   Verified: ${verifyData.verified}`);
  console.log(`   Misconfigured: ${verifyData.misconfigured}`);
  console.log(`   Status: ${verifyData.status}`);

  console.log(`\n➡️  Step 3: Removing domain [${DOMAIN}] from site...`);
  const removeRes = await fetch(
    `${LOCAL_API_URL}/${siteId}/domain?domain=${DOMAIN}`,
    {
      method: "DELETE",
    },
  );
  const removeData = await removeRes.json();
  if (!removeRes.ok) {
    console.error(`❌ Remove Domain Failed:`, removeData);
    process.exit(1);
  }
  console.log(
    `✅ Removed from Vercel. Firestore 'customDomain' explicitly nulled.`,
  );

  console.log(`\n✅🎉 All Checks Passed successfully.\n`);
  process.exit(0);
}

runCheck();

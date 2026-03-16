#!/usr/bin/env node

/**
 * Domain Provisioning Script
 *
 * Connects a custom TLD to a CentralTexas.com site by:
 * 1. Adding the domain to the Vercel project
 * 2. Updating the Firestore site document with customDomain metadata
 * 3. Showing the DNS records the domain registrar needs to point to
 *
 * Usage:
 *   node scripts/provision_domain.js <siteId> <domain>
 *   node scripts/provision_domain.js Mh9M7mgNYcWJaFHAo78l davidsplumbing.com
 *
 * Prerequisites:
 * - Vercel CLI authenticated (`npx vercel whoami`)
 * - Firebase credentials in .env.local
 */

const { execSync } = require("child_process");
const path = require("path");

// Load .env.local for Firebase credentials
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// ─── Args ─────────────────────────────────────────────────
const SITE_ID = process.argv[2];
const DOMAIN = process.argv[3];

if (!SITE_ID || !DOMAIN) {
  console.error("Usage: node scripts/provision_domain.js <siteId> <domain>");
  console.error(
    "Example: node scripts/provision_domain.js Mh9M7mgNYcWJaFHAo78l davidsplumbing.com",
  );
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────
function run(cmd) {
  try {
    const output = execSync(cmd, {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf-8",
      timeout: 30000,
    });
    return { ok: true, output: output.trim() };
  } catch (err) {
    return {
      ok: false,
      output: (err.stderr || err.stdout || err.message).trim(),
    };
  }
}

function success(msg) {
  console.log(`  ✅ ${msg}`);
}
function fail(msg) {
  console.error(`  ❌ ${msg}`);
}
function info(msg) {
  console.log(`  ℹ️  ${msg}`);
}
function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
}

// ─── Firebase Init ────────────────────────────────────────
function initFirebase() {
  if (getApps().length) return getFirestore();

  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/\\n/g, "").trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(
    /\\n/g,
    "",
  ).trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    fail("Missing Firebase credentials in .env.local");
    process.exit(1);
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  Custom Domain Provisioning");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Site ID: ${SITE_ID}`);
  console.log(`  Domain:  ${DOMAIN}`);
  console.log("");

  // ── Verify Vercel CLI ──
  const whoami = run("npx vercel whoami 2>&1");
  if (!whoami.ok) {
    fail("Vercel CLI not authenticated. Run `npx vercel login` first.");
    process.exit(1);
  }
  success(
    `Vercel CLI authenticated as: ${whoami.output.split("\n").pop().replace("> ", "")}`,
  );

  // ── Verify Firestore Site Exists ──
  const db = initFirebase();
  const siteRef = db.collection("sites").doc(SITE_ID);
  const siteDoc = await siteRef.get();

  if (!siteDoc.exists) {
    fail(`Site ${SITE_ID} not found in Firestore.`);
    process.exit(1);
  }

  const siteData = siteDoc.data();
  success(
    `Found site: "${siteData.businessName}" (subdomain: ${siteData.domain})`,
  );

  if (siteData.customDomain) {
    warn(`Site already has customDomain: ${siteData.customDomain}`);
    warn("This will be overwritten.");
  }

  // ── Step 1: Add Domain to Vercel ──
  console.log("");
  console.log("  Step 1: Adding domain to Vercel project...");
  const addRes = run(`npx vercel domains add ${DOMAIN} 2>&1`);

  if (
    addRes.ok ||
    addRes.output.includes("already") ||
    addRes.output.includes("verification")
  ) {
    success("Domain registered with Vercel");
    // Extract useful info from output
    const lines = addRes.output.split("\n");
    lines.forEach((l) => {
      if (l.trim() && !l.includes("Vercel CLI")) info(l.trim());
    });
  } else {
    fail(`Failed to add domain: ${addRes.output}`);
    process.exit(1);
  }

  // ── Step 2: Add www subdomain (if apex domain) ──
  const isApex = DOMAIN.split(".").length === 2;
  if (isApex) {
    console.log("");
    console.log(`  Step 2: Adding www.${DOMAIN} redirect...`);
    const wwwRes = run(`npx vercel domains add www.${DOMAIN} 2>&1`);
    if (wwwRes.ok || wwwRes.output.includes("already")) {
      success(`www.${DOMAIN} added (will redirect to ${DOMAIN})`);
    } else {
      warn(`Could not add www subdomain: ${wwwRes.output.split("\n").pop()}`);
    }
  }

  // ── Step 3: Update Firestore ──
  console.log("");
  console.log("  Step 3: Updating Firestore site document...");
  await siteRef.update({
    customDomain: DOMAIN,
    customDomainStatus: "pending_dns",
    customDomainAddedAt: new Date(),
    updatedAt: new Date(),
  });
  success(`Firestore updated: customDomain = ${DOMAIN}`);

  // ── Step 4: Inspect and show DNS config ──
  console.log("");
  console.log("  Step 4: Retrieving DNS configuration...");
  const inspectRes = run(`npx vercel domains inspect ${DOMAIN} 2>&1`);

  if (inspectRes.ok) {
    const lines = inspectRes.output.split("\n");
    const nsSection = lines.some((l) => l.includes("Intended Nameservers"));
    lines.forEach((l) => {
      if (
        l.includes("Nameserver") ||
        l.includes("ns1") ||
        l.includes("ns2") ||
        l.includes("Project")
      ) {
        info(l.trim());
      }
    });
  }

  // ── Summary & DNS Instructions ──
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  ✅ Domain Provisioned Successfully!");
  console.log("═══════════════════════════════════════════════════");
  console.log("");
  console.log("  📋 DNS CONFIGURATION REQUIRED:");
  console.log("");
  console.log("  Option A: Point Nameservers to Vercel (Recommended)");
  console.log("    NS1: ns1.vercel-dns.com");
  console.log("    NS2: ns2.vercel-dns.com");
  console.log("");
  console.log("  Option B: Add DNS Records at Your Registrar");
  console.log(`    A Record:     ${DOMAIN} → 76.76.21.21`);
  if (isApex) {
    console.log(`    CNAME Record: www.${DOMAIN} → cname.vercel-dns.com`);
  }
  console.log("");
  console.log("  🔄 After DNS is configured, verify with:");
  console.log(`    node scripts/verify_domain.js ${SITE_ID} ${DOMAIN}`);
  console.log("");
  console.log("  🌐 Once DNS propagates, your site will be live at:");
  console.log(`    https://${DOMAIN}`);
  if (isApex) {
    console.log(`    https://www.${DOMAIN} (redirects to above)`);
  }
  console.log("");
  console.log("  📊 Current Status:");
  console.log(`    Vercel: Domain added, awaiting DNS verification`);
  console.log(`    Firestore: customDomain = ${DOMAIN}, status = pending_dns`);
  console.log(`    Subdomain: ${siteData.domain} (still active as fallback)`);
  console.log("");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

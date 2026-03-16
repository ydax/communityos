#!/usr/bin/env node

/**
 * Domain Verification Script
 *
 * Checks if a provisioned custom domain has been properly configured:
 * 1. Vercel domain status (nameservers, SSL)
 * 2. DNS resolution check
 * 3. Firestore customDomain status update
 *
 * Usage:
 *   node scripts/verify_domain.js <siteId> <domain>
 *   node scripts/verify_domain.js Mh9M7mgNYcWJaFHAo78l davidsplumbing.com
 */

const { execSync } = require("child_process");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const SITE_ID = process.argv[2];
const DOMAIN = process.argv[3];

if (!SITE_ID || !DOMAIN) {
  console.error("Usage: node scripts/verify_domain.js <siteId> <domain>");
  process.exit(1);
}

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

function initFirebase() {
  if (getApps().length) return getFirestore();
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/\\n/g, "").trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(
    /\\n/g,
    "",
  ).trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  Custom Domain Verification");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Site ID: ${SITE_ID}`);
  console.log(`  Domain:  ${DOMAIN}`);
  console.log("");

  let allPassed = true;

  // ── Check 1: Vercel Domain Status ──
  console.log("  Check 1: Vercel Domain Status");
  const inspectRes = run(`npx vercel domains inspect ${DOMAIN} 2>&1`);

  let vercelConfigured = false;
  if (inspectRes.ok) {
    const lines = inspectRes.output.split("\n");
    const hasCorrectNS = lines.some(
      (l) => l.includes("ns1.vercel-dns.com") && l.includes("✔"),
    );
    const hasProject = lines.some((l) => l.includes("centraltexas"));

    if (hasCorrectNS) {
      success("Nameservers correctly pointing to Vercel");
      vercelConfigured = true;
    } else {
      // Check for A record configuration instead
      warn(
        "Nameservers not pointing to Vercel (may be using A-record instead)",
      );
    }

    if (hasProject) {
      success("Domain is attached to the centraltexas project");
    } else {
      fail("Domain is NOT attached to the centraltexas project");
      allPassed = false;
    }
  } else {
    fail(`Domain not found on Vercel: ${inspectRes.output.split("\n").pop()}`);
    allPassed = false;
  }

  // ── Check 2: DNS Resolution ──
  console.log("");
  console.log("  Check 2: DNS Resolution");

  const digRes = run(`dig +short A ${DOMAIN} 2>&1`);
  if (digRes.ok && digRes.output) {
    const ips = digRes.output.split("\n").filter((l) => l.match(/^\d/));
    if (ips.includes("76.76.21.21")) {
      success(`A record resolves to Vercel (76.76.21.21)`);
      vercelConfigured = true;
    } else if (ips.length > 0) {
      warn(`A record resolves to ${ips.join(", ")} (expected 76.76.21.21)`);
    } else {
      info("No A record found yet (DNS may still be propagating)");
    }
  } else {
    info(
      `DNS lookup returned no results (domain may not be registered or DNS not propagated)`,
    );
  }

  // Check CNAME for www
  const isApex = DOMAIN.split(".").length === 2;
  if (isApex) {
    const cnameRes = run(`dig +short CNAME www.${DOMAIN} 2>&1`);
    if (cnameRes.ok && cnameRes.output.includes("vercel")) {
      success(`www.${DOMAIN} CNAME points to Vercel`);
    } else {
      info(`www.${DOMAIN} CNAME not configured yet`);
    }
  }

  // ── Check 3: HTTP Reachability ──
  console.log("");
  console.log("  Check 3: HTTP Reachability");

  const curlRes = run(
    `curl -sI -o /dev/null -w "%{http_code}" --max-time 10 https://${DOMAIN} 2>&1`,
  );
  if (curlRes.ok) {
    const statusCode = curlRes.output.trim();
    if (statusCode === "200") {
      success(`https://${DOMAIN} returns 200 OK`);
    } else if (statusCode === "308" || statusCode === "301") {
      success(
        `https://${DOMAIN} returns ${statusCode} redirect (likely www redirect)`,
      );
    } else if (statusCode === "000") {
      info("Site not reachable yet (DNS not propagated or SSL pending)");
    } else {
      warn(`https://${DOMAIN} returns HTTP ${statusCode}`);
    }
  } else {
    info("Site not reachable yet");
  }

  // ── Check 4: Firestore Status ──
  console.log("");
  console.log("  Check 4: Firestore Status");

  const db = initFirebase();
  const siteDoc = await db.collection("sites").doc(SITE_ID).get();

  if (!siteDoc.exists) {
    fail(`Site ${SITE_ID} not found in Firestore`);
    allPassed = false;
  } else {
    const data = siteDoc.data();
    if (data.customDomain === DOMAIN) {
      success(`Firestore customDomain matches: ${data.customDomain}`);
    } else {
      fail(
        `Firestore customDomain mismatch: expected ${DOMAIN}, got ${data.customDomain || "null"}`,
      );
      allPassed = false;
    }
    info(`customDomainStatus: ${data.customDomainStatus || "not set"}`);
    info(`subdomain: ${data.domain}`);

    // Update status if DNS is verified
    if (vercelConfigured && data.customDomainStatus !== "active") {
      await db.collection("sites").doc(SITE_ID).update({
        customDomainStatus: "active",
        customDomainVerifiedAt: new Date(),
        updatedAt: new Date(),
      });
      success('Updated Firestore customDomainStatus to "active"');
    }
  }

  // ── Summary ──
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  if (allPassed && vercelConfigured) {
    console.log("  ✅ Domain is FULLY CONFIGURED and LIVE");
  } else if (allPassed) {
    console.log("  ⏳ Domain is provisioned, awaiting DNS propagation");
    console.log("");
    console.log("  Configure DNS at your domain registrar:");
    console.log(`    A Record:     ${DOMAIN} → 76.76.21.21`);
    if (isApex) {
      console.log(`    CNAME Record: www.${DOMAIN} → cname.vercel-dns.com`);
    }
    console.log("");
    console.log("  Or point nameservers to:");
    console.log("    ns1.vercel-dns.com");
    console.log("    ns2.vercel-dns.com");
  } else {
    console.log("  ❌ Domain has configuration issues (see above)");
  }
  console.log("═══════════════════════════════════════════════════");
  console.log("");

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

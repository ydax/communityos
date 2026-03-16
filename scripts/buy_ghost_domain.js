#!/usr/bin/env node
/**
 * buy_ghost_domain.js
 *
 * CLI version of the "Buy it For Me" pipeline for Ghost Agency provisioning.
 *
 * Usage:
 *   node scripts/buy_ghost_domain.js <siteId> <domain>
 *   node scripts/buy_ghost_domain.js Mh9M7mgNYcWJaFHAo78l davidsplumbing.com
 */
const { execSync } = require("child_process");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const SITE_ID = process.argv[2];
const DOMAIN = process.argv[3];

if (!SITE_ID || !DOMAIN) {
  console.error("Usage: node scripts/buy_ghost_domain.js <siteId> <domain>");
  process.exit(1);
}

const API_KEY = process.env.PORKBUN_API_KEY;
const SECRET_KEY = process.env.PORKBUN_SECRET_KEY;
const BASE = "https://api.porkbun.com/api/json/v3";

if (!API_KEY || !SECRET_KEY) {
  console.error("❌  PORKBUN_API_KEY and PORKBUN_SECRET_KEY are required.");
  console.error("   Run ./scripts/setup_porkbun_env.sh to configure them.");
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────
const ok = (m) => console.log(`  ✅  ${m}`);
const err = (m) => console.error(`  ❌  ${m}`);
const inf = (m) => console.log(`  ℹ️   ${m}`);
const hdr = (m) => {
  console.log("");
  console.log(`  ${m}`);
};

function run(cmd) {
  try {
    return {
      ok: true,
      out: execSync(cmd, {
        cwd: path.resolve(__dirname, ".."),
        encoding: "utf-8",
        timeout: 30000,
      }).trim(),
    };
  } catch (e) {
    return { ok: false, out: (e.stderr || e.stdout || e.message).trim() };
  }
}

async function porkbun(endpoint, body = {}) {
  const r = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: API_KEY,
      secretapikey: SECRET_KEY,
      ...body,
    }),
  });
  return r.json();
}

async function suggestAlternatives(domain) {
  const [name, ext] = domain.split(".");
  const candidates = [
    ...["co", "net", "us", "io"].map((t) => `${name}.${t}`),
    `${name}tx.com`,
    `${name}pro.com`,
    `get${name}.com`,
    `${name}services.com`,
  ];
  const results = [];
  for (const c of candidates) {
    const data = await porkbun(`domain/checkDomain/${c}`);
    if (data.status === "SUCCESS" && data.response?.avail !== "no") {
      const cost = Math.round(
        parseFloat(data.response.price) * data.response.minDuration * 100,
      );
      results.push({
        domain: c,
        priceUsd: `$${(cost / 100).toFixed(2)}`,
        cost,
      });
      if (results.length >= 5) break;
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Ghost Agency — Domain Registration Pipeline");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Domain:  ${DOMAIN}`);
  console.log(`  Site ID: ${SITE_ID}`);

  // Step 0: Auth check
  hdr("Step 0: Verifying Porkbun credentials…");
  const ping = await porkbun("ping");
  if (ping.status !== "SUCCESS") {
    err(`Authentication failed: ${ping.message}`);
    process.exit(1);
  }
  ok(`Porkbun API authenticated (IP: ${ping.yourIp})`);

  // Step 1: Check availability
  hdr("Step 1: Checking availability of " + DOMAIN + "…");
  const check = await porkbun(`domain/checkDomain/${DOMAIN}`);
  if (check.status !== "SUCCESS") {
    err(`Check failed: ${check.message}`);
    process.exit(1);
  }

  const resp = check.response;
  const available = resp.avail !== "no";
  const costPennies = Math.round(
    parseFloat(resp.price) * resp.minDuration * 100,
  );
  const costUsd = `$${(costPennies / 100).toFixed(2)}`;

  if (!available) {
    err(`${DOMAIN} is already registered and unavailable.`);
    console.log("");
    console.log("  🔍 Searching for alternatives…");

    const alts = await suggestAlternatives(DOMAIN);
    if (alts.length) {
      console.log("");
      console.log("  Available alternatives:");
      alts.forEach((a) => inf(`${a.domain}  —  ${a.priceUsd}/yr`));
      console.log("");
      console.log(
        "  To purchase an alternative, re-run with one of the above domains:",
      );
      console.log(
        `  node scripts/buy_ghost_domain.js ${SITE_ID} ${alts[0].domain}`,
      );
    } else {
      inf("No alternatives found. Try a different base name.");
    }
    process.exit(1);
  }

  ok(
    `${DOMAIN} is available — ${costUsd}/yr${resp.firstYearPromo === "yes" ? " (promo, normally $" + parseFloat(resp.regularPrice).toFixed(2) + ")" : ""}`,
  );

  // Step 2: Purchase
  hdr(`Step 2: Purchasing ${DOMAIN} (${costUsd})…`);
  const purchase = await porkbun(`domain/create/${DOMAIN}`, {
    cost: costPennies,
    agreeToTerms: "yes",
  });

  if (purchase.status !== "SUCCESS") {
    err(`Purchase failed: ${purchase.message}`);
    process.exit(1);
  }
  ok(
    `Purchased! Order #${purchase.orderId} — account balance: $${(purchase.balance / 100).toFixed(2)}`,
  );

  // Step 3: Set nameservers → Vercel
  hdr("Step 3: Pointing nameservers to Vercel…");
  await new Promise((r) => setTimeout(r, 2000)); // brief settle time
  const ns = await porkbun(`domain/updateNs/${DOMAIN}`, {
    ns: ["ns1.vercel-dns.com", "ns2.vercel-dns.com"],
  });
  if (ns.status === "SUCCESS") {
    ok("Nameservers set to ns1.vercel-dns.com + ns2.vercel-dns.com");
  } else {
    console.warn(
      `  ⚠️   NS update returned: ${ns.message} — you may need to do this manually.`,
    );
  }

  // Step 4: Add to Vercel project via CLI
  hdr("Step 4: Registering domain in Vercel project…");
  const addVercel = run(`npx vercel domains add ${DOMAIN} 2>&1`);
  if (addVercel.ok || addVercel.out.includes("already")) {
    ok("Domain linked to Vercel project");
    // Print the last useful line of output
    const useful = addVercel.out
      .split("\n")
      .filter((l) => l.trim() && !l.includes("Vercel CLI"))
      .slice(-2);
    useful.forEach((l) => inf(l.trim()));
  } else {
    console.warn(
      `  ⚠️   Vercel add: ${addVercel.out.split("\n").slice(-1)[0]}`,
    );
  }

  // Step 5: Firestore update
  hdr("Step 5: Updating Firestore with customDomain…");
  const { initializeApp, getApps, cert } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");

  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID?.replace(
      /\\n/g,
      "",
    ).trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(
      /\\n/g,
      "",
    ).trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  await db.collection("sites").doc(SITE_ID).update({
    customDomain: DOMAIN,
    customDomainStatus: "pending_dns",
    customDomainSource: "purchased",
    customDomainAddedAt: new Date(),
    updatedAt: new Date(),
  });
  ok(`Firestore updated: sites/${SITE_ID}/customDomain = ${DOMAIN}`);

  // Summary
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  🎉 Done! ${DOMAIN} is registered and linked.`);
  console.log("═══════════════════════════════════════════════════");
  console.log("");
  console.log("  DNS propagation typically takes 5–30 minutes.");
  console.log("  Track status with:");
  console.log(`    node scripts/verify_domain.js ${SITE_ID} ${DOMAIN}`);
  console.log("");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

/**
 * Porkbun Domain Registrar Service
 *
 * Wraps Porkbun V3 API calls for:
 *  - Domain availability check
 *  - Domain purchase / registration
 *  - Nameserver update (to point at Vercel)
 *
 * All costs are in PENNIES (Porkbun's native unit).
 * API Docs: https://porkbun.com/api/json/v3/documentation
 */

const PORKBUN_BASE = "https://api.porkbun.com/api/json/v3";

/**
 * Make an authenticated POST request to the Porkbun API.
 * @param {string} endpoint - e.g. "domain/checkDomain/example.com"
 * @param {Object} body - Additional payload fields (merged with auth)
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function porkbunPost(endpoint, body = {}) {
  const apikey = process.env.PORKBUN_API_KEY;
  const secretapikey = process.env.PORKBUN_SECRET_KEY;

  if (!apikey || !secretapikey) {
    throw new Error(
      "Missing PORKBUN_API_KEY or PORKBUN_SECRET_KEY in environment.",
    );
  }

  const res = await fetch(`${PORKBUN_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey, secretapikey, ...body }),
  });

  const data = await res.json();

  // Surface API-level errors clearly
  if (data.status === "ERROR") {
    const err = new Error(data.message || "Porkbun API error");
    err.porkbunCode = data.status;
    err.porkbunData = data;
    throw err;
  }

  return data;
}

/**
 * Check availability and price for a domain.
 *
 * @param {string} domain - e.g. "davidsplumbing.com"
 * @returns {Promise<{
 *   available: boolean,
 *   price: number,          // price in pennies (1 year)
 *   priceUsd: string,       // formatted "$X.XX"
 *   premium: boolean,
 *   firstYearPromo: boolean
 * }>}
 */
export async function checkDomainAvailability(domain) {
  const data = await porkbunPost(`domain/checkDomain/${domain}`);
  const resp = data.response;

  const available = resp.avail !== "no";
  const priceInPennies = Math.round(
    parseFloat(resp.price) * resp.minDuration * 100,
  );

  return {
    available,
    price: priceInPennies,
    priceUsd: `$${(priceInPennies / 100).toFixed(2)}`,
    premium: resp.premium === "yes",
    firstYearPromo: resp.firstYearPromo === "yes",
    regularPriceUsd: `$${parseFloat(resp.regularPrice).toFixed(2)}`,
    raw: resp,
  };
}

/**
 * Register / purchase a domain.
 *
 * IMPORTANT: cost must exactly match the price returned by checkDomainAvailability.
 * Porkbun v3 requires this as a purchase confirmation guard.
 *
 * @param {string} domain
 * @param {number} cost - Price in pennies (from checkDomainAvailability)
 * @returns {Promise<{ domain: string, orderId: number, cost: number, balanceUsd: string }>}
 */
export async function purchaseDomain(domain, cost) {
  const data = await porkbunPost(`domain/create/${domain}`, {
    cost,
    agreeToTerms: "yes",
  });

  return {
    domain: data.domain,
    orderId: data.orderId,
    cost: data.cost,
    balanceUsd: `$${(data.balance / 100).toFixed(2)}`,
  };
}

/**
 * Update nameservers for a domain to point at Vercel.
 *
 * @param {string} domain
 * @param {string[]} nameservers - defaults to Vercel NS
 * @returns {Promise<void>}
 */
export async function setVercelNameservers(
  domain,
  nameservers = ["ns1.vercel-dns.com", "ns2.vercel-dns.com"],
) {
  await porkbunPost(`domain/updateNs/${domain}`, { ns: nameservers });
}

/**
 * Generate smart domain alternative suggestions when the target is taken.
 * Porkbun does NOT return alternatives — we generate them and check each for availability.
 *
 * @param {string} domain - Original domain e.g. "davidsplumbing.com"
 * @param {number} maxSuggestions - How many variations to return
 * @returns {Promise<Array<{ domain: string, priceUsd: string, available: boolean }>>}
 */
export async function suggestAlternatives(domain, maxSuggestions = 6) {
  const [name, ext] = domain.split(".");
  const tldAlts = ["com", "co", "net", "io", "us", "biz"];
  const nameAlts = [
    name,
    `${name}tx`,
    `${name}pro`,
    `get${name}`,
    `${name}services`,
    `${name}atx`,
  ];

  // Build candidate list: different TLDs for same name + different name variations on .com
  const candidates = [
    ...tldAlts.filter((t) => t !== ext).map((t) => `${name}.${t}`),
    ...nameAlts.filter((n) => n !== name).map((n) => `${n}.com`),
  ].slice(0, maxSuggestions * 2); // fetch extra to filter unavailable ones

  const results = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const check = await checkDomainAvailability(candidate);
      return { domain: candidate, ...check };
    }),
  );

  return results
    .filter((r) => r.status === "fulfilled" && r.value.available)
    .map((r) => r.value)
    .slice(0, maxSuggestions);
}

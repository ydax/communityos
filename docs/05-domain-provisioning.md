# Domain Provisioning Architecture

**Date:** March 27, 2026
**Status:** Implemented via Stripe & Porkbun API

## Overview
Because Domain Registrar APIs (like Porkbun) operate on a prepaid ledger model and do not allow passing end-user credit cards through, we use a decentralized architecture to provision custom domains securely and asynchronously. 

This is known as the **"Two-Sided Ledger Decoupling"** or **Asynchronous Webhook Pipeline with Auto-Replenishment**. 

### 1. Consumer Payment (Stripe Ingress)
1. **Initiation:** The end-user selects an available domain (e.g., `davidsplumbing.com`) in the CivicOS Site Manager and clicks "Buy Custom Domain."
2. **Checkout Session:** Our backend configures a Stripe Checkout Session for $15 (`app/api/sites/[siteId]/domain/checkout/route.js`).
3. **Payment Completed:** The user submits their credit card. Stripe handles all PCI compliance, fraud risk, and deposits the money into our Stripe Account.

### 2. Auto-Replenishment Liquidity Pool (Porkbun Auto Top-Up)
Our internal Porkbun API requires available funds to execute an order. Over relying on manual top-offs introduces the risk of out-of-funds SLA breaks. 
- **Configuration Required:** The system owner must configure **Auto-Reload** in the Porkbun account settings:
  > *"When my account balance drops below $20, automatically charge my business credit card for $50."*
- **The Financial Flow:** We collect $15 from the customer immediately via Stripe. Our script deducts ~$11.08 from our Porkbun Balance. The remaining difference represents margin.

### 3. The Provisioning Event (Asynchronous)
We strictly avoid blocking the UI flow connecting external checkout APIs with heavy DNS propagation pipelines. Instead:
1. Stripe fires the `checkout.session.completed` event to `app/api/stripe/webhook/route.js`.
2. The webhook logic inspects the metadata to ensure `type === "domain_purchase"`.
3. The server asynchronously executing `handleDomainPurchase()`:
   - Re-checks live domain availability (`checkDomainAvailability`).
   - Issues the buy order from the pre-funded Porkbun Balance (`purchaseDomain`).
   - Dispatches a Vercel DNS switch to the domain nameservers (`setVercelNameservers`).
   - Links the domain mathematically to the associated Vercel project via REST API.
   - Updates Firestore (`sites/{siteId}`) to `customDomainStatus === "pending_dns"`.

### 4. Graceful Degradation & Refund Loop (Egress Handling)
If any step in the webhook fails (e.g., Domain API is down, or someone beat the customer by milliseconds in buying the domain), we catch the `porkbunPost` generated errors string.
- The catch block dynamically accesses the payment ID linked via `session.payment_intent`.
- It executes `stripe.refunds.create({ payment_intent })` out of Stripe automatically.
- Firestore `customDomainStatus` is updated to `failed_refunded` with a clear explanation passed as `customDomainLastError`.

## Manual Setup Requirements
1. **Stripe API Keys:** Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.local` / Vercel Environment variables.
2. **Porkbun Auto-Reload:** Login to Porkbun and ensure a credit card is wired up to keep the account adequately leveled to sustain concurrent API transactions.
3. **Register Webhook in Stripe:** Add `https://centraltexas.com/api/stripe/webhook` to your Stripe Dashboard's Webhooks list and enable the `checkout.session.completed` event listener.

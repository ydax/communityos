# CommunityOS

**Open-source civic infrastructure for local communities.**

CommunityOS is a franchisable SaaS-enabled marketplace platform. Give local businesses free custom-domain websites, and capture structured inventory for a community marketplace — automatically.

## Node 1: [CentralTexas.com](https://centraltexas.com)

The first deployment targets the I-35 Innovation Corridor (Austin ↔ San Antonio), focused on Home Services (Fencing, Plumbing, Landscaping, Roofing).

### What It Does

1. **AI Website Builder** — Business owners get a beautiful, mobile-perfect website on their own domain in under 3 minutes. Free.
2. **Marketplace** — When a business publishes their site, structured service/product inventory flows to the community marketplace at `centraltexas.com/marketplace`.
3. **Multi-Tenant Routing** — Custom domains and `*.centraltexas.com` subdomains are resolved via middleware to individual tenant sites.

### Live

- **Platform:** https://centraltexas.com
- **Marketplace:** https://centraltexas.com/marketplace
- **Demo Sites:**
  - [Bluebonnet Rapid Plumbing](https://bluebonnet-plumbing.centraltexas.com)
  - [River City Scapes](https://river-city-scapes.centraltexas.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Backend | Firebase (Firestore + Auth + Cloud Storage) |
| AI | Google Gemini 3 Flash (via REST API) |
| Payments | Stripe Connect Express |
| Hosting | Vercel |
| CI/CD | GitHub Actions |
| Testing | Vitest (unit) + Cypress (e2e) |

**Language:** JavaScript only (no TypeScript).

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Firebase project with Firestore, Auth, and Cloud Storage
- Stripe account (test mode for development)
- Google AI Studio API key

### Setup

```bash
# Clone the repo
git clone https://github.com/ydax/communityos.git
cd communityos

# Install dependencies
npm install

# Copy environment template and fill in your keys
cp .env.example .env.local

# Start the development server
npm run dev
```

### Environment Variables

See [`.env.example`](./.env.example) for the full list. Key variables:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase client SDK config
- `FIREBASE_*` — Firebase Admin SDK (server-side)
- `STRIPE_*` — Stripe payment processing
- `GOOGLE_GENAI_API_KEY` — AI website generation

### Testing

```bash
# Unit tests
npm run test:unit

# E2E tests (requires running dev server)
npm run test:e2e

# Linting
npm run lint
```

---

## Architecture

```
communityos/
├── app/                    # Next.js App Router
│   ├── (sites)/[domain]/   # Multi-tenant site rendering
│   ├── admin/              # Admin dashboard (listings, editor, growth)
│   ├── api/                # REST API routes
│   ├── get-started/        # AI onboarding wizard
│   └── marketplace/        # Community marketplace feed
├── components/             # React components
│   ├── editor/             # Site editor (section-based, no drag-and-drop)
│   ├── listings/           # Listing management (Square-style)
│   ├── onboarding/         # AI wizard steps
│   ├── sites/              # Public site rendering + 3 themes
│   └── ui/                 # Shared primitives
├── lib/                    # Core logic
│   ├── aiServices/         # AI content generation pipeline
│   ├── config/             # Central AI model registry + vibe presets
│   ├── dbServices/         # Firestore CRUD services
│   ├── firebase/           # Firebase SDK initialization
│   ├── pipelines/          # Growth experiment engines
│   └── schemas/            # Runtime JSON validation
├── middleware.js            # Multi-tenant domain routing with caching
├── docs/                   # System context & schema documentation
└── scripts/                # Automation & verification tools
```

### Themes

Three rigid Tailwind themes with 8 aesthetic "Vibe Presets":

- **The Maker** — Grid-based, craftsman aesthetic
- **The Trade** — Professional services, clean corporate lines
- **The Venue** — Visual/experiential, full-screen hero

---

## CivicOS Vision

CentralTexas.com is **Node 1**. The long-term goal is that any community can deploy their own node of CommunityOS — a "Sovereignty-in-a-Box" civic operating system.

**Roadmap:**

1. ✅ Ship Product (AI Website Builder + Marketplace)
2. 🔲 Grow Community (50 real vendor sites)
3. 🔲 Extract Framework (monorepo with `packages/core` + `apps/template`)
4. 🔲 Enable Resilience (Offline-first PWA, Karma Mutual Credit Ledger)

---

## Documentation

| Document | Description |
|---|---|
| [`docs/CENTRAL_TEXAS_CONTEXT.md`](./docs/CENTRAL_TEXAS_CONTEXT.md) | Full system context (AI entry point) |
| [`docs/01-technical.md`](./docs/01-technical.md) | Technical architecture & Firestore schema |
| [`docs/02-listings.md`](./docs/02-listings.md) | Inventory data model |
| [`docs/03-acquisition.md`](./docs/03-acquisition.md) | Growth campaign schema |
| [`docs/growth-experiments.md`](./docs/growth-experiments.md) | Acquisition pipeline designs |

---

## Contributing

CommunityOS aims to become fully open-source as the codebase matures. Contribution guidelines and `good-first-issue` labeling will be set up during Phase 6.

In the meantime, if you're interested in deploying a CommunityOS node for your own community, [open an issue](https://github.com/ydax/communityos/issues).

---

## License

[MIT](./LICENSE)

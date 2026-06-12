<div align="center">

<h1>☕ BLENDIFY</h1>
<p><strong>The Art of Coffee — Premium E-Commerce Platform</strong></p>

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Overview

Blendify is a **full-stack, production-grade coffee e-commerce platform** built with Next.js 16 (App Router), TypeScript, and PostgreSQL. It features a stateless JWT authentication system, multi-region currency support, a full shopping cart, wishlist, subscription model, and a rich product catalogue.

The platform is engineered for performance, developer experience, and extensibility — built to support real-world commercial coffee brands from day one.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (Turbopack, App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Vanilla CSS Modules + Framer Motion |
| **Authentication** | Jose JWT (stateless httpOnly cookies) |
| **ORM** | Prisma 7 + PostgreSQL 15+ |
| **State Management** | Zustand (client-side cart, wishlist, region) |
| **Validation** | Zod v4 |
| **Icons** | Lucide React |
| **Package Manager** | npm |

---

## Features

- **JWT Authentication** — Stateless session management with `jose`. bcrypt password hashing. No external auth service required.
- **Multi-Region Commerce** — INR / USD / EUR / GBP currency switching with localStorage persistence and SSR-safe hydration.
- **Product Catalogue** — 11 products with variants (size/grind), flavour notes, brew guides, and rich metadata.
- **Shopping Cart** — Persistent Zustand store with product/variant/bundle support and quantity management.
- **Wishlist** — Persistent Zustand store with add/remove and notification toasts.
- **Subscription Model** — Prisma-backed subscription plans with configurable billing frequency.
- **Loyalty Programme** — Points earn/redeem system with Bronze/Silver/Gold/Platinum tiers.
- **Admin-ready Schema** — Full Prisma schema with orders, shipments, returns, inventory logs, coupons, and tax rules.
- **SEO-optimised** — `<Metadata>` per page, Open Graph, Twitter card, robots.

---

## Project Structure

```
blendify/
├── app/                        # Next.js App Router
│   ├── (shop)/
│   │   ├── page.tsx            # Homepage
│   │   ├── shop/               # Product listing + detail
│   │   └── account/            # User dashboard
│   ├── sign-in/                # Login page (custom JWT form)
│   ├── sign-up/                # Register page (custom JWT form)
│   └── api/                    # API routes (contact, newsletter)
├── components/
│   ├── layout/                 # Navbar, Footer, CartDrawer
│   ├── home/                   # Hero, ProductSpotlight, BundleOffers
│   └── shop/                   # ProductCard, filters
├── lib/
│   ├── actions/auth.ts         # Server Actions: signIn, signUp, signOut
│   ├── session.ts              # Jose JWT: encrypt, decrypt, createSession
│   ├── auth.ts                 # Server helpers: getCurrentUser, requireAuth
│   ├── data/products.ts        # Static product catalogue
│   ├── store/                  # Zustand stores (cart, wishlist, region)
│   └── hooks/                  # useMounted, useCurrency (SSR-safe)
├── prisma/
│   └── schema.prisma           # PostgreSQL schema v2.0.0
├── public/images/products/     # Product photography assets
├── proxy.ts                    # Route protection middleware (Next.js 16)
└── types/                      # Shared TypeScript types
```

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **PostgreSQL** 15+ (optional — app runs in demo mode without it)
- **openssl** (for JWT secret generation)

---

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/your-org/blendify.git
cd blendify
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Generate a JWT secret:

```bash
openssl rand -base64 32
# Paste the output as JWT_SECRET in .env.local
```

Minimum `.env.local` for local development (no DB required):

```env
JWT_SECRET=your_generated_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup (optional)

If you have PostgreSQL running:

```bash
# Add your connection string to .env.local
# DATABASE_URL=postgresql://user:password@localhost:5432/blendify

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

> **Note:** Without `DATABASE_URL`, the app runs in **demo mode** — authentication works with in-memory sessions, no real data is persisted.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Authentication

Blendify uses **Jose JWT** for stateless, self-hosted authentication.

### How It Works

```
User submits credentials
        ↓
Server Action validates with Zod
        ↓
bcrypt.compare() against DB hash
        ↓
SignJWT() → HS256 signed token (30-day expiry)
        ↓
Set as httpOnly cookie "blendify-session"
        ↓
proxy.ts verifies JWT on every protected request
        ↓
Server Components call getSession() / requireAuth()
```

### Protected Routes

| Prefix | Protection |
|---|---|
| `/account` | Requires valid JWT |
| `/checkout` | Requires valid JWT |
| `/admin` | Requires valid JWT + ADMIN role |
| `/sign-in` | Public |
| `/sign-up` | Public |
| `/api/auth` | Public |

### Key Files

| File | Purpose |
|---|---|
| `lib/session.ts` | JWT encrypt/decrypt, cookie management |
| `lib/actions/auth.ts` | Server Actions: signIn, signUp, signOut |
| `lib/auth.ts` | `getCurrentUser()`, `requireAuth()`, `requireAdmin()` |
| `proxy.ts` | Edge-compatible route protection middleware |

---

## Database Scripts

```bash
npm run db:generate      # Generate Prisma client from schema
npm run db:push          # Push schema changes (dev)
npm run db:migrate       # Create a migration file
npm run db:migrate:prod  # Apply migrations (production)
npm run db:seed          # Seed with sample data
npm run db:studio        # Open Prisma Studio GUI
npm run db:reset         # Reset and re-seed database
npm run db:format        # Format schema.prisma
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | 32-byte base64 secret for JWT signing. Generate: `openssl rand -base64 32` |
| `DATABASE_URL` | ❌ | PostgreSQL connection string. App runs in demo mode if absent. |
| `NEXT_PUBLIC_APP_URL` | ❌ | Full URL for the app (default: `http://localhost:3000`) |

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# JWT_SECRET, DATABASE_URL, NEXT_PUBLIC_APP_URL
```

### Self-Hosted (Docker)

```bash
docker build -t blendify .
docker run -p 3000:3000 \
  -e JWT_SECRET="your_secret" \
  -e DATABASE_URL="postgresql://..." \
  blendify
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Formatting, no logic change
refactor: Code restructure, no feature change
perf:     Performance improvement
chore:    Build process, tooling
```

---

## License

MIT © 2025 BLENDIFY

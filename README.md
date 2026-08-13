<div align="center">

<br/>

<!-- Replace with your actual logo -->
<img src="public/logo.png" alt="Blendify Logo" width="120" />

<h1>BLENDIFY</h1>

<p><em>The Art of Coffee — Premium E-Commerce, Production-Grade.</em></p>

<!-- Replace with a real hero screenshot once the app is deployed -->
<img src="public/images/og-image.jpg" alt="Blendify Hero" width="100%" style="border-radius: 12px; margin: 16px 0;" />

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Stars](https://img.shields.io/github/stars/YOUR_USERNAME/blendify?style=for-the-badge)
![Forks](https://img.shields.io/github/forks/YOUR_USERNAME/blendify?style=for-the-badge)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [API Routes](#-api-routes)
- [Authentication](#-authentication)
- [Payments](#-payments)
- [Admin Panel](#-admin-panel)
- [User Flow](#-user-flow)
- [Performance](#-performance)
- [Security](#-security)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)
- [Acknowledgements](#-acknowledgements)

---

## 🧠 Overview

**Blendify** is a full-stack, production-grade premium coffee e-commerce platform built entirely in-house — from storefront to admin console — with **zero third-party SaaS dependencies** for its core logic.

Built on **Next.js 16**, **React 19**, **Prisma 7**, and **PostgreSQL**, Blendify ships with:

- A visually rich, animated storefront designed to convert
- A fully custom JWT authentication system (no Clerk, no Auth.js)
- A dual payment gateway setup supporting **Razorpay** and **Stripe**
- An enterprise-grade, multi-section admin dashboard with **52+ management pages**
- International commerce support with multi-currency pricing and regional shipping zones
- A loyalty programme, referral system, subscription orders, flash sales, and gift cards — all backed by real database models and services

### Who Is This Built For?

| Audience | Value |
|---|---|
| ☕ Coffee brands | A complete DTC platform tailored to specialty coffee |
| 👩‍💻 Developers | A reference implementation of a production Next.js commerce app |
| 🏆 Hackathon judges | Full-stack depth — schema, services, auth, payments, admin, and animations |
| 🤝 Recruiters | Demonstrates mastery of modern full-stack engineering at scale |
| 💡 Contributors | Clean architecture with repository pattern, Zod validation, and service layer |

---

## ✨ Key Features

| Feature | Status |
|---|---|
| 🔐 Custom JWT Authentication (Jose, httpOnly cookies) | ✅ Implemented |
| 🛍️ Product Catalogue (variants, grind types, roast levels, brew guides) | ✅ Implemented |
| 🛒 Shopping Cart (persistent, guest + authenticated, coupon + loyalty) | ✅ Implemented |
| ❤️ Wishlist | ✅ Implemented |
| 📦 Order Management (full lifecycle: PENDING → DELIVERED → RETURNED) | ✅ Implemented |
| 💳 Dual Payment Gateways — Razorpay & Stripe | ✅ Implemented (webhooks wired) |
| 💰 Coupon Engine (%, fixed, free shipping, Buy X Get Y) | ✅ Implemented |
| 🎁 Gift Cards (issuance, balance tracking, transactions) | ✅ Implemented |
| 🏷️ Flash Sales (time-boxed, per-product discounts) | ✅ Implemented |
| 🎖️ Loyalty Programme (Bronze→Platinum tiers, earn/redeem) | ✅ Implemented |
| 👥 Referral System (points + discount rewards) | ✅ Implemented |
| 🔄 Product Subscriptions (weekly, bi-weekly, monthly, quarterly, annual) | ✅ Implemented |
| 📊 Admin Dashboard (stats, revenue, orders, recent activity) | ✅ Implemented |
| 🏗️ 52-Page Admin Console (full CMS + store management) | ✅ Implemented |
| 🌍 International Commerce (8 currencies, region-specific pricing, shipping zones) | ✅ Implemented |
| 📧 Newsletter Subscriptions (tagging, source tracking) | ✅ Implemented |
| 📢 Announcement Bars (scheduled, page-targeted) | ✅ Implemented |
| 🖼️ Homepage Banners (CMS-managed, mobile image support) | ✅ Implemented |
| 🎯 Popup Campaigns (exit-intent, time-delay, scroll-percent triggers) | ✅ Implemented |
| ⭐ Product Reviews & Ratings (moderation, admin reply, verified buyer badge) | ✅ Implemented |
| 📬 Email Campaigns (scheduled broadcasts, open/click tracking) | ✅ Implemented |
| 🔔 Push Notification Records | ✅ Implemented |
| 🔍 Full-Text Search (PostgreSQL native) | ✅ Implemented |
| 🗂️ Category Hierarchy (nested parent/child) | ✅ Implemented |
| 📦 Product Bundles (curated sets with savings) | ✅ Implemented |
| 📤 Inventory Logs (full audit trail per variant) | ✅ Implemented |
| 🚚 Shipment Tracking (carrier, tracking number, estimated date) | ✅ Implemented |
| 🔙 Return & Refund Requests (full status lifecycle) | ✅ Implemented |
| 🏦 Business Info & Tax Config (GST/VAT/Sales Tax) | ✅ Implemented |
| 📑 Audit Logs (all admin actions logged) | ✅ Implemented |
| 🏁 Feature Flags (runtime feature toggles) | ✅ Implemented |
| 🛠️ Maintenance Mode (IP whitelist, countdown timer) | ✅ Implemented |
| 🔑 API Key Management (bcrypt-hashed storage) | ✅ Implemented |
| 🪝 Webhook Endpoints & Logs | ✅ Implemented |
| 👨‍💼 Staff Invites (role-based, token-gated) | ✅ Implemented |
| 🖥️ SEO Settings (robots.txt, OG, Twitter cards, verification) | ✅ Implemented |
| 🔗 Social Links Management | ✅ Implemented |
| 🗺️ Navigation Menu CMS | ✅ Implemented |
| 📄 CMS Pages (slugged, system-protected) | ✅ Implemented |
| ❓ FAQ Management (categories + items) | ✅ Implemented |
| 🎨 Brand Assets (logo variants, color scheme, typography) | ✅ Implemented |
| 👕 Team Members | ✅ Implemented |
| 🔧 Integration Config (GA, GTM, PostHog, Sentry, Cloudinary, Resend, Meta Pixel) | ✅ Implemented |
| 📊 Analytics Events (lightweight event store) | ✅ Implemented |
| 🧾 Invoice Templates | ✅ Implemented |
| 📧 Email Templates (DB-managed, per-event) | ✅ Implemented |
| 🚀 Smooth Scroll (Lenis) + GSAP + Framer Motion animations | ✅ Implemented |
| 📱 Responsive UI (mobile-first) | ✅ Implemented |
| 🌐 OpenGraph & Twitter metadata | ✅ Implemented |
| 🌙 Dark Mode | ⬜ Not implemented |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.9 | Full-stack React framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Vanilla CSS (Modules) | — | Component-scoped styling |
| Framer Motion | 12.x | Page & component animations |
| GSAP | 3.x | Advanced scroll & hero animations |
| Lenis | 1.x | Smooth scrolling |
| Embla Carousel | 8.x | Product & section carousels |
| Lucide React | 1.x | Icon system |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Next.js API Routes | 16.x | REST API layer |
| Node.js | 20+ | Runtime |
| Jose | 6.x | JWT signing & verification |
| bcryptjs | 3.x | Password hashing |
| Zod | 4.x | Schema validation (request bodies) |

### Database & ORM

| Technology | Version | Purpose |
|---|---|---|
| PostgreSQL | 15+ | Primary relational database |
| Prisma | 7.x | ORM with type-safe queries |
| @prisma/adapter-pg | 7.x | Native pg driver adapter |
| pg | 8.x | PostgreSQL driver |

### Authentication

| Technology | Purpose |
|---|---|
| Jose JWT | Stateless HS256 signed tokens |
| httpOnly Cookies | Secure, XSS-proof session storage |
| bcryptjs | Password storage |
| Custom Middleware | Route protection |

### Payments

| Technology | Purpose |
|---|---|
| Razorpay | India & international UPI/card payments |
| Stripe | Global credit cards & digital wallets |
| Webhook Verification | Signature-verified payment events |

### State Management

| Technology | Purpose |
|---|---|
| Zustand 5.x | Client-side cart, wishlist, and region stores |

### Developer Tools

| Tool | Purpose |
|---|---|
| ESLint 9 | Linting |
| tsx | TypeScript script runner (for seeding) |
| Turbopack | Fast development bundler |
| Prisma Studio | Database GUI |

### Deployment

| Platform | Purpose |
|---|---|
| Vercel | Primary deployment target |
| Render | Alternative (currently live at blendify-kwjp.onrender.com) |
| Railway | PostgreSQL hosting option |

---

## 🏗️ Architecture

Blendify follows a clean, layered architecture that separates concerns across the full stack:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser Client                         │
│         React 19 · Zustand Stores · Framer Motion · GSAP       │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTP / Next.js RSC
┌───────────────────────────▼─────────────────────────────────────┐
│                     Next.js 16 (App Router)                     │
│     Server Components · Client Components · Server Actions      │
│       Middleware (JWT verify) · StorefrontShell (layout)        │
└──────┬──────────────────────────────────────┬───────────────────┘
       │  API Routes (/api/*)                  │  Page Routes
┌──────▼──────────────┐              ┌─────────▼───────────────────┐
│   Route Handlers    │              │   Server-Rendered Pages     │
│  Admin Guard        │              │  /shop · /account · /admin  │
│  Zod Validation     │              └─────────────────────────────┘
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│   Service Layer     │
│  order.service.ts   │
│  review.service.ts  │
│  banner.service.ts  │
│  gift-card.service  │
│  ... 15 services    │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  Repository Layer   │
│  21 repositories    │
│  base.repository    │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│    Prisma ORM       │
│  Type-safe queries  │
│  Transactions       │
│  Full-text search   │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│   PostgreSQL 15+    │
│  63+ tables         │
│  Indexed queries    │
└─────────────────────┘
```

### Key Architectural Decisions

- **Repository Pattern** — All database access is encapsulated in 21 repositories, keeping services clean and testable.
- **Service Layer** — Business logic (pricing, order creation, coupon validation) lives in 15 dedicated service classes.
- **Stateless JWT Sessions** — No database session table. Tokens are signed with HS256 and stored in `httpOnly` cookies (30-day sliding expiry).
- **Server-First** — Data fetching happens in Server Components where possible, minimising client-side JavaScript.
- **Admin Guard** — All admin API routes and pages are protected server-side via `requireAdminAccess()`. In development, a mock admin user is injected automatically.
- **Atomic Transactions** — Order creation and cancellation use Prisma `$transaction` to ensure inventory and order state are always consistent.

---

## 📂 Folder Structure

```
blendify/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin route group (no public layout)
│   │   └── admin/                # 52 admin pages
│   │       ├── dashboard/
│   │       ├── coupons/
│   │       ├── flash-sales/
│   │       ├── gift-cards/
│   │       ├── reviews/
│   │       ├── loyalty/
│   │       ├── email-campaigns/
│   │       ├── settings/
│   │       └── ... (45 more pages)
│   ├── api/                      # REST API route handlers
│   │   ├── admin/                # 30 admin API namespaces
│   │   ├── auth/me/              # Current user endpoint
│   │   ├── account/              # Account management APIs
│   │   ├── addresses/            # Address CRUD
│   │   ├── contact/              # Contact form
│   │   ├── newsletter/           # Newsletter signup
│   │   └── webhooks/             # Payment webhooks (Razorpay/Stripe)
│   ├── shop/                     # Storefront product pages
│   │   └── [slug]/               # Dynamic product detail page
│   ├── account/                  # Customer dashboard
│   │   ├── orders/
│   │   ├── addresses/
│   │   ├── wishlist/
│   │   └── profile/
│   ├── sign-in/                  # Login page
│   ├── sign-up/                  # Registration page
│   ├── about/                    # Brand story page
│   ├── contact/                  # Contact page
│   ├── layout.tsx                # Root layout (metadata, StorefrontShell)
│   ├── page.tsx                  # Homepage (15+ animated sections)
│   ├── globals.css               # Global design tokens & utilities
│   └── admin.css                 # Admin panel design system
│
├── components/                   # Reusable UI components
│   ├── layout/                   # Navbar, Footer, CartDrawer, AnnouncementBar
│   ├── hero/                     # HeroSlider (GSAP/Embla)
│   ├── sections/                 # 20+ homepage sections
│   ├── products/                 # Product cards, NutritionCarousel, PreparationSlider
│   ├── shop/                     # ShopClient, QuickViewModal
│   ├── account/                  # Customer account components
│   ├── admin/
│   │   ├── layout/               # Admin sidebar, header
│   │   └── ui/                   # DataTable, Drawer, StatusBadge, Toast, StatCard, etc.
│   └── skeletons/                # Loading skeleton components
│
├── lib/                          # Core application logic
│   ├── auth.ts                   # Auth helpers (getCurrentUser, requireAuth, requireAdmin)
│   ├── session.ts                # JWT session (encrypt, decrypt, createSession, getSession)
│   ├── admin-guard.ts            # Admin route protection + custom error classes
│   ├── currency.ts               # Multi-currency conversion & formatting
│   ├── actions/auth.ts           # Server Actions: login, register, logout
│   ├── services/                 # 15 service classes (business logic)
│   │   ├── order.service.ts
│   │   ├── review.service.ts
│   │   ├── banner.service.ts
│   │   ├── gift-card.service.ts
│   │   ├── flash-sale.service.ts
│   │   └── ...
│   ├── db/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   └── repositories/         # 21 repository classes
│   ├── store/                    # Zustand client stores
│   │   ├── cartStore.ts
│   │   ├── wishlistStore.ts
│   │   └── regionStore.ts
│   ├── hooks/                    # Custom React hooks
│   ├── animations/               # GSAP & Framer Motion utilities
│   ├── validations/              # Zod schemas (auth.ts, schemas.ts, admin.schemas.ts)
│   └── utils/                    # Shared utility functions
│
├── prisma/
│   ├── schema.prisma             # Full PostgreSQL schema (63+ models, 1,878 lines)
│   └── seed.ts                   # Database seeder
│
├── types/                        # Global TypeScript type definitions
│   ├── index.ts                  # Shared domain types
│   └── auth.ts                   # Auth-specific types
│
├── public/                       # Static assets
├── next.config.ts                # Next.js configuration (WebP/AVIF, Turbopack)
├── prisma.config.ts              # Prisma client config
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

## 📸 Screenshots

> **Note:** Replace placeholders with actual screenshots of your deployed application.

| Page | Preview |
|---|---|
| 🏠 Homepage | Hero Slider · USP Strip · Flavour Collection Grid · Combos · Community · Stats · Testimonials |
| 🛍️ Shop | Product grid with filters · Quick View modal · Wishlist toggle |
| 📦 Product Detail | Image gallery · Variant selector · Nutrition carousel · Preparation slider · Brew guides · Reviews |
| 🛒 Cart Drawer | Slide-in cart · Quantity control · Coupon field · Loyalty redemption · Subtotal |
| 👤 Account | Order history · Address book · Wishlist · Profile settings |
| 🔧 Admin Dashboard | Revenue stats · Recent orders · Quick actions |
| 🎟️ Admin Coupons | DataTable · Create/Edit Drawer · Bulk delete · Export |
| 🏷️ Admin Flash Sales | Time-boxed sales · Product targeting |

---

## 🚀 Installation

### Prerequisites

- Node.js **20+**
- PostgreSQL **15+** (local or hosted)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/blendify.git
cd blendify
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Then fill in the required values — see [Environment Variables](#-environment-variables) below.

### 4. Set Up the Database

```bash
# Push schema to your PostgreSQL database
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 5. Seed the Database

```bash
npm run db:seed
```

This creates initial products, categories, collections, subscription plans, loyalty config, store settings, and a seed admin user.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

### 7. Build for Production

```bash
npm run build
```

> The build script runs `prisma generate` automatically before `next build`.

### 8. Start Production Server

```bash
npm run start
```

### Additional Database Commands

```bash
npm run db:studio      # Open Prisma Studio (database GUI)
npm run db:format      # Format schema.prisma
npm run db:reset       # Reset database and re-run migrations
npm run db:migrate:prod # Deploy migrations in production
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values below.

### Core (Required)

| Variable | Description | Required | Example |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://user:pass@localhost:5432/blendify` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | ✅ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Public base URL of your app | ✅ | `https://yourdomain.com` |

### Payments

| Variable | Description | Required |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay API key ID | For Razorpay |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | For Razorpay |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key (client-side) | For Razorpay |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret | For Razorpay |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | For Stripe |
| `STRIPE_SECRET_KEY` | Stripe secret key | For Stripe |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For Stripe |

### Email

| Variable | Description | Required |
|---|---|---|
| `RESEND_API_KEY` | Resend API key for transactional emails | Optional |
| `EMAIL_FROM` | Sender name and address | Optional |
| `CONTACT_EMAIL` | Address to receive contact form submissions | Optional |

### Media & Storage

| Variable | Description | Required |
|---|---|---|
| `CLOUDINARY_API_KEY` | Cloudinary API key | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Optional |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Optional |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Optional |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | Optional |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret | Optional |
| `AWS_REGION` | AWS region | Optional |
| `AWS_S3_BUCKET` | S3 bucket name | Optional |

### Analytics & Monitoring

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID | Optional |
| `GTM_CONTAINER_ID` | Google Tag Manager container ID | Optional |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host | Optional |
| `SENTRY_DSN` | Sentry DSN (server-side) | Optional |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client-side) | Optional |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta/Facebook Pixel ID | Optional |

### OAuth

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

### Other Services

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (AI features — planned) |
| `REDIS_URL` | Redis connection URL |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `EXCHANGE_RATE_API_KEY` | Live exchange rate API key |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |

---

## 🗄️ Database

Blendify uses **PostgreSQL 15+** via **Prisma 7** as its ORM, with the `@prisma/adapter-pg` native driver.

The schema (`prisma/schema.prisma`) is **1,878 lines** long and defines **63+ models** across two phases of development.

### Key Models & Relationships

| Model | Description |
|---|---|
| `User` | Core user with loyalty tier, referral code, roles (CUSTOMER / ADMIN / SUPER_ADMIN / WAREHOUSE / SUPPORT) |
| `Product` | Coffee products with roast level, grind type, origin, altitude, process, and SEO metadata |
| `ProductVariant` | Size/grind SKUs with individual stock and pricing |
| `ProductImage` | Ordered gallery images with primary flag |
| `FlavorNote` | Flavour profile notes with intensity score (0-100) |
| `BrewGuide` | Per-product brewing instructions (method, ratio, temperature, time) |
| `Category` | Nested category hierarchy (self-referential parent/child) |
| `Collection` | Curated product collections (many-to-many via ProductCollection) |
| `Bundle` | Product bundles with savings percentage |
| `Cart / CartItem` | Persistent cart (user or guest via sessionId); supports subscription items |
| `Wishlist / WishlistItem` | Per-user wishlist |
| `Order / OrderItem` | Full order lifecycle with financial snapshot and loyalty tracking |
| `OrderTimeline` | Auditable status history (public + admin-only entries) |
| `Payment` | Gateway-agnostic payment records (Razorpay, Stripe, COD, Wallet, Loyalty Points) |
| `Shipment` | Shipment tracking with carrier, number, and estimated delivery |
| `ReturnRequest` | Return/refund workflow (REQUESTED → COMPLETED) |
| `Review` | Customer reviews with moderation, verified buyer flag, and admin reply |
| `Coupon / CouponUsage` | Coupon engine with per-user usage tracking |
| `SubscriptionPlan / UserSubscription` | Recurring product subscriptions |
| `LoyaltyTransaction / LoyaltyConfig` | Tiered loyalty programme with point expiry |
| `ReferralConfig` | Configurable referral rewards |
| `GiftCard / GiftCardTransaction` | Gift card issuance and redemption ledger |
| `FlashSale / FlashSaleItem` | Time-boxed promotional events |
| `DiscountRule` | Automatic discount engine (order total, product, category, customer tier) |
| `Country / Currency` | ISO 3166-1 countries and ISO 4217 currencies with exchange rates |
| `RegionPrice` | Country-specific product price overrides |
| `TaxRule / TaxConfig` | GST/VAT/Sales Tax configuration |
| `ShippingRate / ShippingZoneConfig` | Country-level and zone-level shipping rules |
| `NewsletterSubscriber` | Email list with source tracking and tags |
| `AnalyticsEvent` | Lightweight event store for custom analytics |
| `EmailCampaign` | Broadcast email campaign management |
| `PushNotificationRecord` | Push notification history |
| `AnnouncementBar` | Scheduled top-of-page banners |
| `HomepageBanner` | CMS-managed hero banners |
| `PopupCampaign` | Behavioural popup campaigns |
| `StoreSettings / BusinessInfo` | Store configuration and legal entity info |
| `PaymentGatewayConfig` | Admin-managed gateway enable/disable and sandbox toggle |
| `EmailTemplate` | DB-stored transactional email templates |
| `InvoiceTemplate` | Custom invoice PDF configuration |
| `SeoSettings` | Global SEO, robots.txt, OG/Twitter card config |
| `NavigationMenu` | CMS-managed header/footer/mega menus |
| `CmsPage` | Slugged CMS pages (about, privacy, terms) |
| `FeatureFlag` | Runtime feature toggles |
| `MaintenanceConfig` | Maintenance mode with IP whitelist and countdown |
| `ApiKey` | bcrypt-hashed third-party API key storage |
| `WebhookEndpoint / WebhookLog` | Outbound webhook management with delivery logs |
| `AuditLog` | Full admin action audit trail |
| `StaffInvite` | Token-gated staff onboarding |
| `SavedFilter` | Per-admin saved DataTable filter presets |
| `IntegrationConfig` | Third-party service connection status |
| `BrandAsset` | Logo, favicon, OG image, and brand colour config |
| `SocialLinks` | Storefront social media URLs |
| `TeamMember` | About page team member cards |
| `BlogCategory` | Blog category management |
| `FaqCategory / FaqItem` | Categorised FAQ content |
| `SavedPaymentMethod` | Tokenised card storage (gateway-managed) |
| `InventoryLog` | Complete inventory movement audit trail |

### ER Diagram (Core Commerce)

```mermaid
erDiagram
    User {
        string id PK
        string email
        string role
        string loyaltyTier
        string referralCode
    }
    Product {
        string id PK
        string slug
        string roastLevel
        string status
        decimal basePrice
    }
    ProductVariant {
        string id PK
        string productId FK
        string sku
        int stock
        decimal price
    }
    Order {
        string id PK
        string userId FK
        string status
        string paymentStatus
        decimal total
    }
    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        string variantId FK
        int quantity
        decimal unitPrice
    }
    Payment {
        string id PK
        string orderId FK
        string gateway
        string status
        decimal amount
    }
    Cart {
        string id PK
        string userId FK
        string couponId FK
    }
    CartItem {
        string id PK
        string cartId FK
        string variantId FK
        int quantity
    }
    Coupon {
        string id PK
        string code
        string type
        decimal value
    }
    LoyaltyTransaction {
        string id PK
        string userId FK
        string type
        int points
    }
    Review {
        string id PK
        string productId FK
        string userId FK
        int rating
        string status
    }

    User ||--o{ Order : "places"
    User ||--o{ LoyaltyTransaction : "earns"
    User ||--o| Cart : "has"
    User ||--o{ Review : "writes"
    Order ||--o{ OrderItem : "contains"
    Order ||--o{ Payment : "has"
    OrderItem }o--|| Product : "references"
    OrderItem }o--|| ProductVariant : "references"
    Product ||--o{ ProductVariant : "has"
    Cart ||--o{ CartItem : "contains"
    CartItem }o--|| ProductVariant : "references"
    Coupon ||--o{ Cart : "applied to"
    Coupon ||--o{ Order : "applied to"
```

---

## 🌐 API Routes

All API routes are under `/api/`. Admin routes require the `ADMIN` or `SUPER_ADMIN` role.

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/auth/me` | Get current authenticated user | Required |

### Account

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET/PATCH` | `/api/account/profile` | Get or update user profile | Required |
| `GET/POST` | `/api/addresses` | List or create addresses | Required |
| `PATCH/DELETE` | `/api/addresses/[id]` | Update or delete address | Required |

### Public

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/newsletter` | Subscribe to newsletter | None |
| `POST` | `/api/contact` | Submit contact form | None |
| `POST` | `/api/webhooks/clerk` | Webhook receiver | Signature verified |

### Admin — Analytics & Monitoring

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard/stats` | Revenue, orders, users, top products |
| `GET` | `/api/admin/health` | System health check |

### Admin — Commerce

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/admin/coupons` | List/create coupons |
| `PATCH/DELETE` | `/api/admin/coupons/[id]` | Update/delete coupon |
| `GET/POST` | `/api/admin/discounts` | List/create discount rules |
| `PATCH/DELETE` | `/api/admin/discounts/[id]` | Update/delete discount rule |
| `GET/POST` | `/api/admin/flash-sales` | List/create flash sales |
| `PATCH/DELETE` | `/api/admin/flash-sales/[id]` | Update/delete flash sale |
| `GET/POST` | `/api/admin/gift-cards` | List/create gift cards |
| `PATCH/DELETE` | `/api/admin/gift-cards/[id]` | Update/delete gift card |
| `GET/POST` | `/api/admin/bundles` | List/create product bundles |
| `GET/POST` | `/api/admin/shipping` | Shipping rate management |
| `GET/POST` | `/api/admin/tax-config` | Tax configuration |
| `GET/POST` | `/api/admin/loyalty` | Loyalty programme config |
| `GET/POST` | `/api/admin/referrals` | Referral config |

### Admin — Marketing

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/admin/banners` | Homepage banners |
| `PATCH/DELETE` | `/api/admin/banners/[id]` | Update/delete banner |
| `GET/POST` | `/api/admin/announcement-bars` | Announcement bars |
| `GET/POST` | `/api/admin/popups` | Popup campaigns |
| `GET/POST` | `/api/admin/email-campaigns` | Email campaigns |
| `GET/POST` | `/api/admin/email-templates` | Email templates |
| `GET/POST` | `/api/admin/push-notifications` | Push notifications |
| `GET/POST` | `/api/admin/newsletter` | Newsletter subscribers |

### Admin — Reviews

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/reviews` | List reviews with filters and analytics |
| `POST` | `/api/admin/reviews` | Bulk review actions (approve, reject, hide) |
| `PATCH/DELETE` | `/api/admin/reviews/[id]` | Update or delete individual review |

### Admin — Settings & Configuration

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/admin/settings` | Store settings |
| `GET/POST` | `/api/admin/business-info` | Legal/business information |
| `GET/POST` | `/api/admin/payment-gateways` | Payment gateway configuration |
| `GET/POST` | `/api/admin/seo` | Global SEO settings |
| `GET/POST` | `/api/admin/social-media` | Social links |
| `GET/POST` | `/api/admin/integrations` | Third-party integration configs |
| `GET/POST` | `/api/admin/invoice-templates` | Invoice template config |

### Admin — Data Export

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/export/coupons` | Export coupons (csv, excel, print) |

### Admin — Developer Tools

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/admin/cloudinary` | Cloudinary integration test |
| `GET/POST` | `/api/admin/saved-filters` | Admin DataTable saved filters |
| `GET` | `/api/admin/search` | Global admin search |

---

## 🔐 Authentication

Blendify uses a fully custom, stateless JWT authentication system — no Clerk, no Auth.js, no external auth provider.

### Implementation

| Component | Details |
|---|---|
| Token Algorithm | HS256 (HMAC + SHA-256) via jose |
| Secret | `JWT_SECRET` env var (min 32 characters) |
| Session Duration | 30 days with sliding expiry on activity |
| Cookie Name | `blendify-session` |
| Cookie Flags | `httpOnly: true`, `secure: true` (production), `sameSite: lax` |
| Storage | Server-side cookie only — never exposed to JavaScript |

### Flow

```
1. User submits login form (email + password)
       ↓
2. Server Action: bcrypt.compare(password, hash)
       ↓
3. createSession() → SignJWT(payload) → httpOnly cookie set
       ↓
4. getSession() → jwtVerify() → SessionPayload returned
       ↓
5. getCurrentUser() wraps getSession() → UserDTO for components
       ↓
6. Logout: deleteSession() → cookie cleared
```

### Route Protection

| Helper | Usage |
|---|---|
| `requireAuth()` | Redirects to /sign-in if not authenticated |
| `requireAdmin()` | Throws FORBIDDEN if not ADMIN role |
| `requireAdminAccess()` | Guards admin API routes and pages |
| `getCurrentUser()` | Returns UserDTO or null — safe to call anywhere |
| `getUserId()` | Returns string or null — lightweight check |

### User Roles

| Role | Access |
|---|---|
| `CUSTOMER` | Storefront, account, orders, reviews, wishlist, cart |
| `ADMIN` | All customer features + full admin console |
| `SUPER_ADMIN` | Admin + system-level configuration |
| `WAREHOUSE` | Order fulfilment (role defined, access rules configurable) |
| `SUPPORT` | Customer support access (role defined, access rules configurable) |

---

## 💳 Payments

Blendify implements a dual payment gateway setup to serve both Indian and international customers.

### Razorpay (India-first)

- Handles UPI, credit/debit cards, net banking, and EMIs
- Webhook endpoint with `RAZORPAY_WEBHOOK_SECRET` signature verification
- Supports both test (`rzp_test_`) and live (`rzp_live_`) keys

### Stripe (Global)

- Handles international credit/debit cards and digital wallets
- Webhook endpoint with `STRIPE_WEBHOOK_SECRET` signature verification
- Supports both test (`sk_test_`) and live (`sk_live_`) keys

### Payment Flow

```
1. Customer reaches checkout
       ↓
2. Server calculates pricing (never trusts client totals)
   → Subtotal from live DB prices
   → Coupon validation (type, expiry, per-user limit)
   → Loyalty discount (1 point = Rs 0.50)
   → Free shipping above Rs 2,499
       ↓
3. Order created (status: PENDING, paymentStatus: PENDING)
   → Inventory deducted atomically via Prisma $transaction
       ↓
4. Payment initiated via gateway
       ↓
5. Webhook received → Payment record updated
   → Order status updated → Inventory finalised
   → Loyalty points awarded (Rs 10 spent = 1 point)
```

### Payment Gateways (Admin-Managed)

The `PaymentGatewayConfig` table allows admins to enable/disable gateways, toggle sandbox mode, and configure webhook status — all from the admin console at `/admin/payment-gateways`.

### Payment Method Status

| Method | Status |
|---|---|
| Razorpay (UPI/Card/Net Banking) | Implemented (webhooks wired) |
| Stripe (International) | Implemented (webhooks wired) |
| Cash on Delivery (COD) | Schema supported, checkout UI in progress |
| Loyalty Points redemption | Implemented (0.5 Rs/point) |
| Gift Card redemption | Schema implemented, checkout integration in progress |
| Wallet balance | Schema defined, implementation in progress |
| Saved Payment Methods | Schema implemented, checkout flow in progress |

---

## 🖥️ Admin Panel

The Blendify admin console at `/admin` is a fully custom, enterprise-grade management interface with **52 dedicated pages**.

### Access

The admin panel detects the `/admin/*` route prefix in `StorefrontShell` and renders without the public navbar or footer. It uses its own layout with a custom sidebar.

In **development**, a mock admin user is injected automatically so you can browse the admin without setting up auth. In **production**, all routes require a valid `ADMIN` or `SUPER_ADMIN` JWT session.

### Dashboard

- Revenue stats (total, today, this month)
- Order counts by status
- New customer count
- Recent orders table
- Quick action shortcuts

### Commerce Management

| Page | Capabilities |
|---|---|
| Coupons | Create/edit/delete (%, fixed, free shipping, BXGY); bulk delete; CSV/Excel/print export; status filter; usage tracking |
| Discounts | Automatic discount rules by order total, product, category, or customer tier |
| Flash Sales | Time-boxed sales with product targeting and discount configuration |
| Gift Cards | Issue gift cards, track balance and redemption transactions |
| Bundles | Create product bundles with savings percentage |
| Shipping | Configure shipping zones, rates, and free-shipping thresholds |
| Tax Config | CGST/SGST/IGST rates and country-level tax rules |
| Countries | Manage supported countries, currencies, and shipping zones |
| Currencies | Exchange rates and display configuration |

### Marketing & Engagement

| Page | Capabilities |
|---|---|
| Banners | CMS-managed homepage hero banners (desktop + mobile images, CTA, scheduling) |
| Announcement Bars | Scheduled top-bar messages with page targeting |
| Popups | Behavioural popup campaigns (exit intent, time delay, scroll percent) |
| Email Campaigns | Broadcast email composition, scheduling, and send/open/click tracking |
| Email Templates | DB-managed transactional email templates |
| Push Notifications | Push notification campaign management |
| Newsletter | Subscriber list management with tags and source tracking |
| Referrals | Referral programme configuration and tracking |
| Loyalty | Tier configuration, point multipliers, birthday bonuses |

### Customer & Orders

| Page | Capabilities |
|---|---|
| Reviews | Approve/reject/hide reviews; admin reply; bulk actions; analytics; verified buyer filter |
| Activity | Recent admin activity feed |
| Roles | Role assignment |
| Staff | Staff invite management |
| Team | Team member profiles for the About page |

### CMS & Content

| Page | Capabilities |
|---|---|
| Homepage CMS | Hero banner and section content management |
| Pages | CMS page management (slugged, system pages protected) |
| Navigation | Header/footer/mega-menu JSON editing |
| Footer Builder | Footer link management |
| Blog Categories | Blog category management |
| FAQ | FAQ category and item management |
| Media | Media library (Cloudinary integration) |

### Store Configuration

| Page | Capabilities |
|---|---|
| Settings | Store name, timezone, currency, language, store status |
| Business Info | Legal name, GST/PAN/CIN, invoice prefix |
| Payment Gateways | Enable/disable gateways, sandbox toggle, webhook status |
| SEO | Site title, meta description, OG/Twitter cards, robots.txt |
| Social Media | Instagram, Facebook, LinkedIn, YouTube, Twitter, Pinterest, Threads, WhatsApp |
| Brand Assets | Logos, favicon, OG image, brand colours, typography |
| Languages | Language configuration |
| Integrations | GA4, GTM, PostHog, Sentry, Cloudinary, Resend, Meta Pixel |

### Developer & System

| Page | Capabilities |
|---|---|
| API Keys | Create and manage bcrypt-hashed API keys |
| Webhooks | Configure outbound webhook endpoints and view delivery logs |
| Audit Logs | Full audit trail of all admin actions |
| System Logs | System-level logging |
| Developer | Developer tools and debug utilities |
| Feature Flags | Runtime feature toggles (general, commerce, marketing, dev categories) |
| Maintenance | Enable/disable maintenance mode with IP whitelist and countdown |
| Health | System health check dashboard |
| Backup | Database backup management |
| Sitemap | Sitemap generation |
| Robots.txt | Robots.txt editor |
| Profile | Admin user profile settings |

### Admin UI Components

The admin panel is built on a custom design system (`app/admin.css`) with:

- **DataTable** — Sortable, paginated, selectable table with toolbar, bulk actions, and empty states
- **Drawer** — Slide-in form panel for create/edit operations
- **StatusBadge** — Colour-coded status indicators
- **ConfirmDialog** — Modal confirmation for destructive actions
- **ExportMenu** — CSV / Excel / print export menu
- **StatCard** — Metric display card
- **Toast** — Success/error notification system

---

## 🛒 User Flow

```
Landing Page (Homepage)
│
│  Hero Slider, Flavour Collection, Bestselling Combos,
│  Cold Coffee Collection, Testimonials, Newsletter
│
├──→ Shop Page (/shop)
│      │
│      │  Product grid, search, category filters, quick-view modal
│      │
│      └──→ Product Detail (/shop/[slug])
│             │
│             │  Image gallery, variant selector (size + grind),
│             │  Nutrition Carousel, Preparation Slider, Brew Guides,
│             │  Flavour notes, Reviews, Frequently Bought Together
│             │
│             ├──→ Add to Cart → Cart Drawer (slide-in)
│             │       │
│             │       │  Quantity control, coupon code, loyalty points
│             │       │
│             │       └──→ Checkout
│             │               │
│             │               │  Shipping address, billing address,
│             │               │  order summary, payment method
│             │               │
│             │               └──→ Payment Gateway (Razorpay / Stripe)
│             │                       │
│             │                       └──→ Webhook → Order Confirmed
│             │                               │
│             │                               └──→ /account/orders
│             │
│             └──→ Add to Wishlist
│
├──→ Sign Up (/sign-up) → Email + Password → JWT Session
├──→ Sign In (/sign-in) → JWT Session → Account
│
└──→ Account (/account)
       ├── Order History
       ├── Order Detail (timeline, items, shipment)
       ├── Return Request
       ├── Address Book
       ├── Wishlist
       └── Profile Settings
```

---

## ⚡ Performance

| Optimisation | Implementation |
|---|---|
| Image Formats | Next.js serves WebP and AVIF automatically |
| Image Quality | Multiple quality presets configured (75, 85, 90, 92) |
| Console Removal | `removeConsole: true` in production builds |
| Turbopack | Enabled for fast development builds |
| Server Components | Data-fetching pages use React Server Components |
| Skeleton Loaders | Dedicated skeleton components prevent layout shift |
| PostgreSQL Indexing | All foreign keys and frequently filtered columns are indexed |
| Full-Text Search | Native PostgreSQL FTS via Prisma `fullTextSearchPostgres` |
| OpenGraph Metadata | Every page exports structured `metadata` for SEO |
| Lazy Loading | React 19 Suspense boundaries for deferred component loading |
| Smooth Scroll | Lenis smooth scrolling for perceived performance |

---

## 🔒 Security

| Measure | Implementation |
|---|---|
| Password Hashing | All passwords hashed with bcryptjs |
| JWT Security | HS256 signed tokens; secret never exposed to the client |
| httpOnly Cookies | Session token inaccessible to JavaScript — prevents XSS |
| SameSite=Lax | Mitigates CSRF attacks |
| Secure Flag | Cookie secure flag enforced in production |
| Input Validation | All API route bodies validated with Zod 4 before processing |
| Admin Route Guards | `requireAdminAccess()` enforced on every admin API route and page |
| Role-Based Access | CUSTOMER / ADMIN / SUPER_ADMIN roles enforced server-side |
| Webhook Verification | Razorpay and Stripe webhooks verified with HMAC signatures |
| API Key Storage | API keys hashed with bcrypt; only first 8 chars stored in plaintext |
| Environment Variables | All secrets in .env.local (gitignored) |
| Parameterised Queries | All DB queries via Prisma — no raw SQL injection surface |
| Atomic Transactions | Inventory and order mutations use prisma.$transaction |
| Error Class Hierarchy | ForbiddenError (403), UnauthorizedError (401), NotFoundError (404) |
| Production Console Removal | All console.* calls stripped in production builds |

---

## 🚢 Deployment

### Vercel (Recommended)

1. Import your GitHub repository into Vercel
2. Set all environment variables in the Vercel project settings
3. Build command: `npm run build` (runs `prisma generate && next build`)
4. Deploy — Vercel handles the rest

> Set `DATABASE_URL` to a hosted PostgreSQL instance (Railway, Neon, Supabase).

### Render

The app is currently deployed at `https://blendify-kwjp.onrender.com`.

1. Create a new **Web Service** in Render
2. Connect your GitHub repository
3. Build command: `npm run build`
4. Start command: `npm run start`
5. Add all environment variables
6. Provision a PostgreSQL database in Render and connect via `DATABASE_URL`

### Railway

1. Create a new Railway project
2. Add a PostgreSQL plugin — copy the connection string to `DATABASE_URL`
3. Deploy the app service from your GitHub repository
4. Add all environment variables
5. Railway auto-detects Next.js and configures the build

### Production Migrations

After deploying, run migrations with:

```bash
npm run db:migrate:prod
# Equivalent to: prisma migrate deploy
```

---

## 🗺️ Roadmap

The following features are **planned but not yet implemented**:

- [ ] **Blog Posts** — Blog post CRUD, category pages, and reader view (categories are in DB; posts not implemented)
- [ ] **OAuth Login** — Google, GitHub, Facebook social sign-in (env vars defined; routes not implemented)
- [ ] **Saved Payment Methods** — Full checkout integration for tokenised cards (schema implemented)
- [ ] **Full Checkout UI** — End-to-end checkout page with address selection, payment gateway flow
- [ ] **Order Tracking Page** — Public shipment tracking with timeline view
- [ ] **Admin Product Management** — CRUD UI for products, variants, and inventory
- [ ] **Admin Order Management** — Order list, detail, status updates, and return processing
- [ ] **Dark Mode** — Theme toggle for storefront
- [ ] **Email Delivery** — Transactional email sending via Resend (templates in DB; sending not wired)
- [ ] **Push Notifications** — Browser push delivery (records exist; delivery not implemented)
- [ ] **Gift Card Checkout Redemption** — Apply gift card balance at checkout
- [ ] **Subscription Billing** — Automated recurring charges via Razorpay/Stripe billing
- [ ] **COD Checkout** — Cash on delivery payment flow
- [ ] **AI Features** — Product recommendations, search enhancement (OpenAI key in env vars)
- [ ] **Redis Caching** — Rate limiting and session caching (Upstash vars defined)
- [ ] **Live Exchange Rates** — Dynamic currency conversion via EXCHANGE_RATE_API_KEY
- [ ] **Google Maps** — Address lookup and autocomplete at checkout
- [ ] **Analytics Dashboard** — PostHog / GA4 data surfaced in admin

---

## 🤝 Contributing

Contributions are welcome. Please follow these steps:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/blendify.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Set up locally** using the Installation guide above
5. **Make your changes** following the patterns established in the codebase

### Code Standards

- All new API routes must be guarded with `requireAdminAccess()` or `requireAuth()`
- All request bodies must be validated with a **Zod schema** before use
- Business logic belongs in the **service layer** (`lib/services/`)
- Database access belongs in the **repository layer** (`lib/db/repositories/`)
- New Prisma models must include appropriate `@@index` annotations
- TypeScript strict mode is enforced — avoid `any`

### Pull Request Process

1. Ensure your code passes `npm run lint`
2. Test your changes thoroughly (dev + build)
3. Write a clear PR description explaining **what** and **why**
4. Reference any related issues

### Reporting Issues

Please use the GitHub Issues tab and include:
- Steps to reproduce
- Expected vs actual behaviour
- Node.js and npm versions
- Any relevant error messages or screenshots

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 BLENDIFY

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 👤 Author

<div align="center">

**`<!-- YOUR NAME HERE -->`**

*Full-Stack Engineer · Open Source Builder*

| | |
|---|---|
| GitHub | [github.com/YOUR_USERNAME](https://github.com/YOUR_USERNAME) |
| LinkedIn | [linkedin.com/in/YOUR_PROFILE](https://linkedin.com/in/YOUR_PROFILE) |
| Portfolio | [yourportfolio.dev](https://yourportfolio.dev) |
| Email | your@email.com |

</div>

---

## 🙏 Acknowledgements

| Library | Purpose |
|---|---|
| [Next.js](https://nextjs.org) | The full-stack React framework powering everything |
| [React 19](https://react.dev) | UI primitives with Server Components |
| [Prisma](https://www.prisma.io) | Type-safe ORM with an outstanding DX |
| [PostgreSQL](https://www.postgresql.org) | The world's most advanced open-source relational database |
| [Jose](https://github.com/panva/jose) | Rock-solid JWT implementation for Node.js |
| [Zod](https://zod.dev) | TypeScript-first schema validation |
| [Zustand](https://zustand-demo.pmnd.rs) | Lightweight, flexible state management |
| [Framer Motion](https://www.framer.com/motion/) | Production-ready animations for React |
| [GSAP](https://greensock.com/gsap/) | Industry-standard animation platform |
| [Lenis](https://lenis.darkroom.engineering) | Smooth, performant scroll library |
| [Embla Carousel](https://www.embla-carousel.com) | Extensible carousel engine |
| [Lucide React](https://lucide.dev) | Beautiful, consistent open-source icons |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Secure password hashing |
| [Razorpay](https://razorpay.com) | India's leading payment gateway |
| [Stripe](https://stripe.com) | Global payment infrastructure |

---

<div align="center">

Made with ☕ and obsessive craft

**BLENDIFY — The Art of Coffee**

</div>

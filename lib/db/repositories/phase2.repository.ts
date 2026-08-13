// ============================================================
// BLENDIFY — Phase 2 Repository Manager
// High-performance data access for Store Management, CMS,
// System Configuration, and Integrations with safe in-memory fallback.
// ============================================================
import { prisma, getIsDbConfigured } from '@/lib/db/prisma';

type SafePrisma = Record<string, {
  findFirst: (args?: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown[]>;
  upsert: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
}>;

function getDb(): SafePrisma | null {
  if (!getIsDbConfigured() || !prisma) return null;
  return prisma as unknown as SafePrisma;
}

// ── In-Memory Store Fallbacks ──────────────────────────────────
const memoryStore = {
  storeSettings: {
    id: 1,
    storeName: 'BLENDIFY',
    brandName: 'BLENDIFY Coffee Co.',
    tagline: 'Craft Roasted Speciality Coffee',
    storeEmail: 'hello@blendify.coffee',
    supportEmail: 'support@blendify.coffee',
    phone: '+91 (800) 123-4567',
    address: '123 Roastery Lane, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560038',
    timezone: 'Asia/Kolkata',
    defaultCurrency: 'INR',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN',
    logoUrl: '/images/logo.svg',
    faviconUrl: '/favicon.ico',
    storeStatus: 'live',
    updatedAt: new Date().toISOString(),
  },
  businessInfo: {
    id: 1,
    companyName: 'Blendify Specialty Coffee Private Limited',
    legalName: 'Blendify Specialty Coffee Pvt Ltd',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    cinNumber: 'U15490KA2024PTC188888',
    regNumber: 'REG-2024-88991',
    invoicePrefix: 'BLND-INV',
    invoiceNote: 'Thank you for choosing Blendify Specialty Coffee.',
    address: '123 Roastery Lane, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    country: 'India',
    updatedAt: new Date().toISOString(),
  },
  taxConfig: {
    id: 1,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    gstRates: [5, 12, 18, 28],
    taxIncluded: true,
    applyOnShipping: true,
    rules: [
      { id: '1', name: 'Standard GST Coffee Beans', rate: 5, category: 'Coffee' },
      { id: '2', name: 'Brewing Equipment Tax', rate: 18, category: 'Equipment' },
    ],
    updatedAt: new Date().toISOString(),
  },
  shippingZones: [
    {
      id: 'sz_1',
      name: 'Pan India Express',
      description: 'Standard air delivery across all Indian pincodes',
      countries: ['India'],
      states: ['All States'],
      baseRate: 99,
      perKgRate: 20,
      freeAbove: 999,
      minDays: 2,
      maxDays: 4,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sz_2',
      name: 'International Air Courier',
      description: 'DHL Express worldwide shipping',
      countries: ['United States', 'United Kingdom', 'UAE', 'Singapore'],
      states: ['All Regions'],
      baseRate: 1499,
      perKgRate: 350,
      freeAbove: 5000,
      minDays: 5,
      maxDays: 8,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  paymentGateways: [
    {
      id: 'pg_razorpay',
      gateway: 'razorpay',
      displayName: 'Razorpay (UPI, Cards, NetBanking)',
      isEnabled: true,
      isSandbox: true,
      config: { keyId: 'rzp_test_demo123', webhookSecret: 'whsec_demo' },
      webhookUrl: 'https://blendify.coffee/api/webhooks/razorpay',
      webhookStatus: 'active',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pg_stripe',
      gateway: 'stripe',
      displayName: 'Stripe Global Payments',
      isEnabled: false,
      isSandbox: true,
      config: { publishableKey: 'pk_test_demo', webhookSecret: 'whsec_stripe' },
      webhookUrl: 'https://blendify.coffee/api/webhooks/stripe',
      webhookStatus: 'unconfigured',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pg_cod',
      gateway: 'cod',
      displayName: 'Cash on Delivery (COD)',
      isEnabled: true,
      isSandbox: false,
      config: { codFee: 50, maxAmount: 5000 },
      webhookUrl: '',
      webhookStatus: 'active',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pg_wallet',
      gateway: 'wallet',
      displayName: 'Blendify Coffee Wallet & Store Credit',
      isEnabled: true,
      isSandbox: false,
      config: { allowAutoTopup: true, cashbackPercent: 5 },
      webhookUrl: '',
      webhookStatus: 'active',
      updatedAt: new Date().toISOString(),
    },
  ],
  emailTemplates: [
    {
      id: 'et_1',
      slug: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to Blendify Coffee Co., {{firstName}}! ☕',
      body: `<h1>Welcome to the Blendify Family, {{firstName}}!</h1><p>We are thrilled to have you here. Your journey to exceptional coffee starts today.</p><p><a href="{{shopUrl}}">Explore Fresh Roasts</a></p>`,
      variables: ['firstName', 'lastName', 'email', 'shopUrl'],
      isActive: true,
      lastTestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'et_2',
      slug: 'order_confirmation',
      name: 'Order Confirmation',
      subject: 'Order Confirmed! #{{orderNumber}} - Blendify Coffee',
      body: `<h2>Thank you for your order, {{customerName}}!</h2><p>Order ID: <strong>#{{orderNumber}}</strong></p><p>Total Paid: {{orderTotal}}</p><p>We are preparing your fresh roast package now.</p>`,
      variables: ['customerName', 'orderNumber', 'orderTotal', 'itemCount', 'trackingUrl'],
      isActive: true,
      lastTestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'et_3',
      slug: 'shipment',
      name: 'Shipment Dispatch',
      subject: 'Your Coffee is On The Way! 🚀 Order #{{orderNumber}}',
      body: `<h2>Good news! Your order #{{orderNumber}} has shipped.</h2><p>Courier: {{courierName}}</p><p>Tracking AWB: {{trackingNumber}}</p><p><a href="{{trackingUrl}}">Track Package</a></p>`,
      variables: ['orderNumber', 'courierName', 'trackingNumber', 'trackingUrl', 'estimatedDelivery'],
      isActive: true,
      lastTestedAt: null,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'et_4',
      slug: 'refund',
      name: 'Refund Notification',
      subject: 'Refund Processed for Order #{{orderNumber}}',
      body: `<h2>Refund Update</h2><p>Dear {{customerName}}, a refund of {{refundAmount}} has been processed to your original payment method.</p><p>Transaction ID: {{refundId}}</p>`,
      variables: ['customerName', 'orderNumber', 'refundAmount', 'refundId'],
      isActive: true,
      lastTestedAt: null,
      updatedAt: new Date().toISOString(),
    },
  ],
  invoiceTemplate: {
    id: 1,
    companyName: 'Blendify Specialty Coffee Pvt Ltd',
    logoUrl: '/images/logo.svg',
    address: '123 Roastery Lane, Indiranagar, Bengaluru, KA 560038',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    footer: 'Computers generated tax invoice. No signature required. For support, write to support@blendify.coffee',
    showQrCode: true,
    showSignature: false,
    colorScheme: 'default',
    notes: 'Coffee beans are exempt under GST HSN 0901 when unroasted; roasted beans charged at 5% GST.',
    updatedAt: new Date().toISOString(),
  },
  seoSettings: {
    id: 1,
    siteTitle: 'Blendify — Specialty Artisanal Coffee Roasters',
    titleSuffix: '| Blendify Coffee Co.',
    metaDescription: 'Shop freshly roasted artisanal coffee beans, single-origin pour-overs, and specialty espresso blends delivered direct to your door.',
    ogTitle: 'Blendify — The Art of Specialty Coffee',
    ogDescription: 'Experience freshly roasted single-origin coffees and custom espresso blends.',
    ogImageUrl: 'https://blendify.coffee/og-image.jpg',
    twitterHandle: '@blendifycoffee',
    twitterCardType: 'summary_large_image',
    robotsTxt: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://blendify.coffee/sitemap.xml`,
    googleVerify: 'google-site-verification-token-12345',
    bingVerify: 'bing-site-verification-67890',
    updatedAt: new Date().toISOString(),
  },
  socialLinks: {
    id: 1,
    instagram: 'https://instagram.com/blendifycoffee',
    facebook: 'https://facebook.com/blendifycoffee',
    linkedin: 'https://linkedin.com/company/blendifycoffee',
    youtube: 'https://youtube.com/@blendifycoffee',
    twitter: 'https://twitter.com/blendifycoffee',
    pinterest: 'https://pinterest.com/blendifycoffee',
    threads: 'https://threads.net/@blendifycoffee',
    whatsapp: '+919876543210',
    updatedAt: new Date().toISOString(),
  },
  navigationMenus: [
    {
      id: 'nav_header',
      location: 'header',
      name: 'Header Main Menu',
      items: [
        { label: 'Shop Coffee', url: '/shop', type: 'category' },
        { label: 'Single Origin', url: '/shop/single-origin', type: 'custom' },
        { label: 'Subscriptions', url: '/subscriptions', type: 'page' },
        { label: 'Brew Guides', url: '/brew-guides', type: 'page' },
        { label: 'About Us', url: '/about', type: 'page' },
      ],
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'nav_footer',
      location: 'footer',
      name: 'Footer Quick Links',
      items: [
        { label: 'Contact Us', url: '/contact' },
        { label: 'Shipping & Delivery', url: '/shipping' },
        { label: 'Refund Policy', url: '/refund-policy' },
        { label: 'Terms of Service', url: '/terms' },
        { label: 'Privacy Policy', url: '/privacy' },
      ],
      updatedAt: new Date().toISOString(),
    },
  ],
  cmsPages: [
    {
      id: 'page_about',
      slug: 'about',
      title: 'Our Story & Philosophy',
      content: `# Crafting Coffee Excellence\n\nBlendify was born from a simple passion: sourcing ethically grown, high-altitude Arabica beans and roasting them to perfection.\n\nEvery batch is cupped and scored by certified Q-graders.`,
      metaTitle: 'About Us | Blendify Coffee Co.',
      metaDesc: 'Discover the story behind Blendify specialty coffee roasters.',
      isPublished: true,
      isSystem: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'page_contact',
      slug: 'contact',
      title: 'Contact Us',
      content: `# We would love to hear from you!\n\nEmail: hello@blendify.coffee\nPhone: +91 800 123 4567\nAddress: 123 Roastery Lane, Indiranagar, Bengaluru, KA 560038`,
      metaTitle: 'Contact Us | Blendify Coffee',
      metaDesc: 'Get in touch with the Blendify roastery team.',
      isPublished: true,
      isSystem: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'page_terms',
      slug: 'terms',
      title: 'Terms & Conditions',
      content: `# Terms of Service\n\nWelcome to Blendify. By accessing or using our website, you agree to comply with and be bound by the following terms.`,
      metaTitle: 'Terms of Service | Blendify',
      metaDesc: 'Blendify terms and conditions of purchase.',
      isPublished: true,
      isSystem: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  blogCategories: [
    {
      id: 'bc_1',
      name: 'Brewing Guides',
      slug: 'brewing-guides',
      description: 'Master V60, Aeropress, French Press, and Espresso at home',
      imageUrl: '/images/blog-brew.jpg',
      isActive: true,
      postCount: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bc_2',
      name: 'Origin Stories',
      slug: 'origin-stories',
      description: 'Deep dives into coffee farms of Coorg, Chikmagalur & Wayanad',
      imageUrl: '/images/blog-origin.jpg',
      isActive: true,
      postCount: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  faqCategories: [
    {
      id: 'faq_cat_1',
      name: 'Orders & Shipping',
      slug: 'orders-shipping',
      order: 1,
      items: [
        {
          id: 'faq_1',
          question: 'How fresh is the coffee when it arrives?',
          answer: 'All coffee is roasted within 48 hours of dispatch and sealed in valve bags to lock in peak aroma.',
          order: 1,
          isActive: true,
          categoryId: 'faq_cat_1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'faq_2',
          question: 'Do you offer free shipping?',
          answer: 'Yes! All domestic orders above ₹999 qualify for free express shipping.',
          order: 2,
          isActive: true,
          categoryId: 'faq_cat_1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  ],
  teamMembers: [
    {
      id: 'tm_1',
      name: 'Aarav Sharma',
      designation: 'Head Roaster & Q-Grader',
      bio: 'Aarav has spent 12 years studying coffee agronomy across Karnataka estates.',
      photoUrl: '/images/team-aarav.jpg',
      instagram: 'https://instagram.com/aarav_coffee',
      linkedin: 'https://linkedin.com/in/aaravsharma',
      twitter: '',
      order: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tm_2',
      name: 'Riya Sen',
      designation: 'Master Blender & Sensory Lead',
      bio: 'Riya curates our seasonal signature blends and cupping profiles.',
      photoUrl: '/images/team-riya.jpg',
      instagram: 'https://instagram.com/riya_roastery',
      linkedin: 'https://linkedin.com/in/riyasen',
      twitter: '',
      order: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  brandAssets: {
    id: 1,
    logoUrl: '/images/logo-dark.png',
    logoDarkUrl: '/images/logo-dark.png',
    logoLightUrl: '/images/logo-light.png',
    faviconUrl: '/favicon.ico',
    ogImageUrl: '/images/og-share.png',
    primaryColor: '#581312',
    secondaryColor: '#C47C0A',
    accentColor: '#2C1008',
    fontDisplay: 'Playfair Display',
    fontBody: 'Inter',
    updatedAt: new Date().toISOString(),
  },
  integrations: [
    { id: 'int_ga', service: 'ga', displayName: 'Google Analytics 4', isEnabled: true, config: { measurementId: 'G-BLENDIFY123' }, status: 'connected', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'int_gtm', service: 'gtm', displayName: 'Google Tag Manager', isEnabled: true, config: { containerId: 'GTM-BLND89' }, status: 'connected', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'int_posthog', service: 'posthog', displayName: 'PostHog Analytics', isEnabled: false, config: { apiKey: '' }, status: 'disconnected', lastSyncAt: null, updatedAt: new Date().toISOString() },
    { id: 'int_sentry', service: 'sentry', displayName: 'Sentry Error Tracking', isEnabled: true, config: { dsn: 'https://key@sentry.io/123' }, status: 'connected', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'int_cloudinary', service: 'cloudinary', displayName: 'Cloudinary CDN', isEnabled: true, config: { cloudName: 'blendify', apiKey: '8891' }, status: 'connected', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'int_resend', service: 'resend', displayName: 'Resend Transactional Email', isEnabled: true, config: { apiKey: 're_live_key' }, status: 'connected', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'int_meta', service: 'meta_pixel', displayName: 'Meta Pixel (Facebook)', isEnabled: true, config: { pixelId: '9988776655' }, status: 'connected', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'int_gsc', service: 'gsc', displayName: 'Google Search Console', isEnabled: true, config: { verificationToken: 'gsc_token_123' }, status: 'connected', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  featureFlags: [
    { id: 'ff_1', key: 'subscriptions_v2', label: 'Recurring Subscriptions V2', description: 'Enable custom delivery schedules and roast preference quiz', isEnabled: true, isExperimental: false, category: 'commerce', updatedAt: new Date().toISOString() },
    { id: 'ff_2', key: 'ai_coffee_recommendations', label: 'AI Bean Recommender', description: 'Personalized coffee beans match based on brewing method', isEnabled: true, isExperimental: true, category: 'marketing', updatedAt: new Date().toISOString() },
    { id: 'ff_3', key: 'multi_currency_checkout', label: 'Multi-Currency Checkout', description: 'Display prices in USD, EUR, GBP, and AED automatically', isEnabled: true, isExperimental: false, category: 'commerce', updatedAt: new Date().toISOString() },
    { id: 'ff_4', key: 'instant_whatsapp_notifications', label: 'WhatsApp Order Dispatch Alerts', description: 'Send real-time tracking links on WhatsApp', isEnabled: false, isExperimental: true, category: 'general', updatedAt: new Date().toISOString() },
  ],
  maintenanceConfig: {
    id: 1,
    isEnabled: false,
    message: 'We are currently roasting new batches! Site back online shortly.',
    whitelistIps: ['127.0.0.1', '192.168.1.1'],
    countdownTo: null,
    updatedAt: new Date().toISOString(),
  },
  apiKeys: [
    { id: 'ak_1', name: 'Mobile App Read Key', service: 'storefront_api', keyHash: 'hashed_key_1', keyPreview: 'bld_live_99a8b7c6...', isActive: true, lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ak_2', name: 'Zapier Order Webhook Secret', service: 'zapier_integration', keyHash: 'hashed_key_2', keyPreview: 'bld_sec_11x22y33...', isActive: true, lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  webhooks: [
    { id: 'wh_1', name: 'Order Created Webhook', url: 'https://api.blendify.coffee/webhooks/orders', secret: 'whsec_991827', events: ['order.created', 'order.paid'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  auditLogs: [
    { id: 'al_1', userId: 'user_admin', userEmail: 'admin@blendify.coffee', action: 'UPDATE', module: 'settings', entityId: 'store_1', entityLabel: 'Store Settings', before: { storeStatus: 'maintenance' }, after: { storeStatus: 'live' }, ip: '127.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh)', createdAt: new Date().toISOString() },
    { id: 'al_2', userId: 'user_admin', userEmail: 'admin@blendify.coffee', action: 'CREATE', module: 'coupons', entityId: 'cp_101', entityLabel: 'ROAST15', before: null, after: { code: 'ROAST15', discount: 15 }, ip: '127.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh)', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  staffInvites: [
    { id: 'si_1', email: 'barista.lead@blendify.coffee', role: 'WAREHOUSE', invitedBy: 'admin@blendify.coffee', status: 'PENDING', token: 'token_inv_101', expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), acceptedAt: null, createdAt: new Date().toISOString() },
  ],
};

// ── Generic Safe DB Reader & Writer Helper ────────────────────

export async function getStoreSettings() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.storeSettings.findFirst();
      if (res) return res;
    } catch { /* fallback to memory */ }
  }
  return memoryStore.storeSettings;
}

export async function updateStoreSettings(data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.storeSettings.upsert({
        where: { id: 1 },
        create: data,
        update: data,
      });
    } catch { /* fallback */ }
  }
  memoryStore.storeSettings = { ...memoryStore.storeSettings, ...data, updatedAt: new Date().toISOString() };
  return memoryStore.storeSettings;
}

export async function getBusinessInfo() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.businessInfo.findFirst();
      if (res) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.businessInfo;
}

export async function updateBusinessInfo(data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.businessInfo.upsert({
        where: { id: 1 },
        create: data,
        update: data,
      });
    } catch { /* fallback */ }
  }
  memoryStore.businessInfo = { ...memoryStore.businessInfo, ...data, updatedAt: new Date().toISOString() };
  return memoryStore.businessInfo;
}

export async function getTaxConfig() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.taxConfig.findFirst();
      if (res) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.taxConfig;
}

export async function updateTaxConfig(data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.taxConfig.upsert({
        where: { id: 1 },
        create: data,
        update: data,
      });
    } catch { /* fallback */ }
  }
  memoryStore.taxConfig = { ...memoryStore.taxConfig, ...data, updatedAt: new Date().toISOString() };
  return memoryStore.taxConfig;
}

export async function getShippingZones() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.shippingZoneConfig.findMany({ orderBy: { createdAt: 'desc' } });
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.shippingZones;
}

export async function updateShippingZone(id: string, data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.shippingZoneConfig.update({ where: { id }, data });
    } catch { /* fallback */ }
  }
  const idx = memoryStore.shippingZones.findIndex(z => z.id === id);
  if (idx !== -1) {
    memoryStore.shippingZones[idx] = { ...memoryStore.shippingZones[idx], ...data, updatedAt: new Date().toISOString() };
    return memoryStore.shippingZones[idx];
  }
  return null;
}

export async function createShippingZone(data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.shippingZoneConfig.create({ data });
    } catch { /* fallback */ }
  }
  const newZone = { id: `sz_${Date.now()}`, ...data, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  memoryStore.shippingZones.unshift(newZone as unknown as (typeof memoryStore.shippingZones)[number]);
  return newZone;
}

export async function getPaymentGateways() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.paymentGatewayConfig.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.paymentGateways;
}

export async function updatePaymentGateway(id: string, data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.paymentGatewayConfig.update({ where: { id }, data });
    } catch { /* fallback */ }
  }
  const idx = memoryStore.paymentGateways.findIndex(p => p.id === id);
  if (idx !== -1) {
    memoryStore.paymentGateways[idx] = { ...memoryStore.paymentGateways[idx], ...data, updatedAt: new Date().toISOString() };
    return memoryStore.paymentGateways[idx];
  }
  return null;
}

export async function getEmailTemplates() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.emailTemplate.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.emailTemplates;
}

export async function updateEmailTemplate(id: string, data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.emailTemplate.update({ where: { id }, data });
    } catch { /* fallback */ }
  }
  const idx = memoryStore.emailTemplates.findIndex(e => e.id === id);
  if (idx !== -1) {
    memoryStore.emailTemplates[idx] = { ...memoryStore.emailTemplates[idx], ...data, updatedAt: new Date().toISOString() };
    return memoryStore.emailTemplates[idx];
  }
  return null;
}

export async function getInvoiceTemplate() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.invoiceTemplate.findFirst();
      if (res) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.invoiceTemplate;
}

export async function updateInvoiceTemplate(data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.invoiceTemplate.upsert({ where: { id: 1 }, create: data, update: data });
    } catch { /* fallback */ }
  }
  memoryStore.invoiceTemplate = { ...memoryStore.invoiceTemplate, ...data, updatedAt: new Date().toISOString() };
  return memoryStore.invoiceTemplate;
}

export async function getSeoSettings() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.seoSettings.findFirst();
      if (res) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.seoSettings;
}

export async function updateSeoSettings(data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.seoSettings.upsert({ where: { id: 1 }, create: data, update: data });
    } catch { /* fallback */ }
  }
  memoryStore.seoSettings = { ...memoryStore.seoSettings, ...data, updatedAt: new Date().toISOString() };
  return memoryStore.seoSettings;
}

export async function getSocialLinks() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.socialLinks.findFirst();
      if (res) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.socialLinks;
}

export async function updateSocialLinks(data: Record<string, unknown>) {
  const db = getDb();
  if (db) {
    try {
      return await db.socialLinks.upsert({ where: { id: 1 }, create: data, update: data });
    } catch { /* fallback */ }
  }
  memoryStore.socialLinks = { ...memoryStore.socialLinks, ...data, updatedAt: new Date().toISOString() };
  return memoryStore.socialLinks;
}

export async function getNavigationMenus() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.navigationMenu.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.navigationMenus;
}

export async function getCmsPages() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.cmsPage.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.cmsPages;
}

export async function getBlogCategories() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.blogCategory.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.blogCategories;
}

export async function getFaqCategories() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.faqCategory.findMany({ include: { items: true } });
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.faqCategories;
}

export async function getTeamMembers() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.teamMember.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.teamMembers;
}

export async function getBrandAssets() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.brandAsset.findFirst();
      if (res) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.brandAssets;
}

export async function getIntegrations() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.integrationConfig.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.integrations;
}

export async function getFeatureFlags() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.featureFlag.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.featureFlags;
}

export async function getMaintenanceConfig() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.maintenanceConfig.findFirst();
      if (res) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.maintenanceConfig;
}

export async function getApiKeys() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.apiKey.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.apiKeys;
}

export async function getWebhooks() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.webhookEndpoint.findMany({ include: { logs: true } });
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.webhooks;
}

export async function getAuditLogs() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.auditLogs;
}

export async function getStaffInvites() {
  const db = getDb();
  if (db) {
    try {
      const res = await db.staffInvite.findMany();
      if (res && res.length > 0) return res;
    } catch { /* fallback */ }
  }
  return memoryStore.staffInvites;
}

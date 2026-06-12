// ============================================================
// BLENDIFY — Prisma Seed
// Populates the database with initial data for development.
// Run: npx prisma db seed
// ============================================================
import 'dotenv/config';
import { PrismaClient, RoastLevel, ProductFormat, ProductStatus, GrindType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function main() {
  console.log('🌱 Starting BLENDIFY seed...\n');

  // ─── Currencies ─────────────────────────────────────────────
  console.log('💱 Seeding currencies...');
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'INR' },
      update: {},
      create: { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.5, decimalDigits: 2 },
    }),
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, decimalDigits: 2 },
    }),
    prisma.currency.upsert({
      where: { code: 'EUR' },
      update: {},
      create: { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, decimalDigits: 2 },
    }),
    prisma.currency.upsert({
      where: { code: 'GBP' },
      update: {},
      create: { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79, decimalDigits: 2 },
    }),
    prisma.currency.upsert({
      where: { code: 'AED' },
      update: {},
      create: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 3.67, decimalDigits: 2 },
    }),
    prisma.currency.upsert({
      where: { code: 'SGD' },
      update: {},
      create: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exchangeRate: 1.34, decimalDigits: 2 },
    }),
    prisma.currency.upsert({
      where: { code: 'JPY' },
      update: {},
      create: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 149.5, decimalDigits: 0 },
    }),
    prisma.currency.upsert({
      where: { code: 'CAD' },
      update: {},
      create: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', exchangeRate: 1.36, decimalDigits: 2 },
    }),
    prisma.currency.upsert({
      where: { code: 'AUD' },
      update: {},
      create: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.52, decimalDigits: 2 },
    }),
  ]);
  console.log(`  ✓ ${currencies.length} currencies seeded`);

  // ─── Countries ──────────────────────────────────────────────
  console.log('🌍 Seeding countries...');
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: 'IN' },
      update: {},
      create: { name: 'India', code: 'IN', currencyCode: 'INR', phonePrefix: '+91', flag: '🇮🇳', shippingZone: 'DOMESTIC', taxType: 'GST', taxRate: 0.18 },
    }),
    prisma.country.upsert({
      where: { code: 'US' },
      update: {},
      create: { name: 'United States', code: 'US', currencyCode: 'USD', phonePrefix: '+1', flag: '🇺🇸', shippingZone: 'ZONE_2', taxType: 'SALES_TAX', taxRate: 0 },
    }),
    prisma.country.upsert({
      where: { code: 'GB' },
      update: {},
      create: { name: 'United Kingdom', code: 'GB', currencyCode: 'GBP', phonePrefix: '+44', flag: '🇬🇧', shippingZone: 'ZONE_2', taxType: 'VAT', taxRate: 0.2 },
    }),
    prisma.country.upsert({
      where: { code: 'AE' },
      update: {},
      create: { name: 'UAE', code: 'AE', currencyCode: 'AED', phonePrefix: '+971', flag: '🇦🇪', shippingZone: 'ZONE_1', taxType: 'VAT', taxRate: 0.05 },
    }),
    prisma.country.upsert({
      where: { code: 'SG' },
      update: {},
      create: { name: 'Singapore', code: 'SG', currencyCode: 'SGD', phonePrefix: '+65', flag: '🇸🇬', shippingZone: 'ZONE_1', taxType: 'SALES_TAX', taxRate: 0.09 },
    }),
    prisma.country.upsert({
      where: { code: 'AU' },
      update: {},
      create: { name: 'Australia', code: 'AU', currencyCode: 'AUD', phonePrefix: '+61', flag: '🇦🇺', shippingZone: 'ZONE_2', taxType: 'VAT', taxRate: 0.1 },
    }),
    prisma.country.upsert({
      where: { code: 'CA' },
      update: {},
      create: { name: 'Canada', code: 'CA', currencyCode: 'CAD', phonePrefix: '+1', flag: '🇨🇦', shippingZone: 'ZONE_2', taxType: 'SALES_TAX', taxRate: 0.05 },
    }),
    prisma.country.upsert({
      where: { code: 'JP' },
      update: {},
      create: { name: 'Japan', code: 'JP', currencyCode: 'JPY', phonePrefix: '+81', flag: '🇯🇵', shippingZone: 'ZONE_2', taxType: 'VAT', taxRate: 0.1 },
    }),
  ]);
  console.log(`  ✓ ${countries.length} countries seeded`);

  // ─── Categories ─────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'coffee' },
      update: {},
      create: { slug: 'coffee', name: 'Coffee', description: 'All coffee products', sortOrder: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'espresso' },
      update: {},
      create: { slug: 'espresso', name: 'Espresso', description: 'Espresso coffees', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'single-origin' },
      update: {},
      create: { slug: 'single-origin', name: 'Single Origin', description: 'Single origin coffees', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'blends' },
      update: {},
      create: { slug: 'blends', name: 'Blends', description: 'Signature coffee blends', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'cold-brew' },
      update: {},
      create: { slug: 'cold-brew', name: 'Cold Brew', description: 'Cold brew & ready-to-drink', sortOrder: 4 },
    }),
  ]);
  console.log(`  ✓ ${categories.length} categories seeded`);

  // ─── Collections ────────────────────────────────────────────
  console.log('🗂️  Seeding collections...');
  const collections = await Promise.all([
    prisma.collection.upsert({
      where: { slug: 'espresso' },
      update: {},
      create: { slug: 'espresso', name: 'Espresso', description: 'Bold, concentrated, essential.', isFeatured: true, sortOrder: 0 },
    }),
    prisma.collection.upsert({
      where: { slug: 'single-origin' },
      update: {},
      create: { slug: 'single-origin', name: 'Single Origin', description: 'From one farm, one story.', isFeatured: true, sortOrder: 1 },
    }),
    prisma.collection.upsert({
      where: { slug: 'blends' },
      update: {},
      create: { slug: 'blends', name: 'Signature Blends', description: 'Crafted for consistency.', isFeatured: true, sortOrder: 2 },
    }),
    prisma.collection.upsert({
      where: { slug: 'cold-brew' },
      update: {},
      create: { slug: 'cold-brew', name: 'Cold Brew', description: 'Slow. Cold. Perfect.', isFeatured: true, sortOrder: 3 },
    }),
    prisma.collection.upsert({
      where: { slug: 'best-sellers' },
      update: {},
      create: { slug: 'best-sellers', name: 'Best Sellers', description: 'Most loved by our customers.', sortOrder: 4 },
    }),
  ]);
  console.log(`  ✓ ${collections.length} collections seeded`);

  const espressoCollection = collections[0];
  const singleOriginCollection = collections[1];
  const blendsCollection = collections[2];
  const coldBrewCollection = collections[3];
  const bestSellersCollection = collections[4];

  // ─── Products ───────────────────────────────────────────────
  console.log('☕ Seeding products...');

  const PRODUCTS = [
    {
      slug: 'obsidian-espresso',
      name: 'Obsidian Espresso',
      tagline: 'Dark, bold, unapologetic.',
      description: 'A powerfully complex espresso that opens with deep cocoa, transitions through stone fruit, and finishes with a lingering sweetness.',
      origin: 'Ethiopia & Brazil',
      region: 'Yirgacheffe & Cerrado',
      altitude: '1,800–2,000m',
      process: 'Washed & Natural',
      roastLevel: 'DARK' as RoastLevel,
      format: 'BAG' as ProductFormat,
      status: 'ACTIVE' as ProductStatus,
      isNew: false,
      isBestSeller: true,
      isFeatured: true,
      isLimited: false,
      sortOrder: 0,
      basePrice: 18.99,
      compareAtPrice: 22.99,
      subscriptionPrice: 15.99,
      tags: ['espresso', 'dark-roast', 'best-seller'],
      variants: [
        { name: '250g — Whole Bean', sku: 'OBS-250-WB', size: '250g', grind: 'WHOLE_BEAN' as GrindType, price: 18.99, stock: 120, isDefault: true, sortOrder: 0 },
        { name: '250g — Espresso Grind', sku: 'OBS-250-EG', size: '250g', grind: 'ESPRESSO' as GrindType, price: 18.99, stock: 80, sortOrder: 1 },
        { name: '500g — Whole Bean', sku: 'OBS-500-WB', size: '500g', grind: 'WHOLE_BEAN' as GrindType, price: 34.99, stock: 60, sortOrder: 2 },
        { name: '1kg — Whole Bean', sku: 'OBS-1KG-WB', size: '1kg', grind: 'WHOLE_BEAN' as GrindType, price: 62.99, stock: 40, sortOrder: 3 },
      ],
      flavorNotes: [
        { label: 'Dark Chocolate', intensity: 90 },
        { label: 'Stone Fruit', intensity: 65 },
        { label: 'Smoky Caramel', intensity: 75 },
      ],
      collections: [espressoCollection.id, bestSellersCollection.id],
    },
    {
      slug: 'amber-sunrise',
      name: 'Amber Sunrise',
      tagline: 'Light, floral, extraordinary.',
      description: 'An Ethiopian natural process that delivers a luminous cup bursting with jasmine florals, ripe berry, and sun-dried citrus. The first sip feels like morning light.',
      origin: 'Ethiopia',
      region: 'Guji Zone',
      altitude: '2,000–2,300m',
      process: 'Natural',
      roastLevel: 'LIGHT' as RoastLevel,
      format: 'BAG' as ProductFormat,
      status: 'ACTIVE' as ProductStatus,
      isNew: true,
      isBestSeller: false,
      isFeatured: true,
      isLimited: true,
      sortOrder: 1,
      basePrice: 24.99,
      compareAtPrice: 29.99,
      subscriptionPrice: 20.99,
      tags: ['single-origin', 'light-roast', 'ethiopia', 'limited'],
      variants: [
        { name: '200g — Whole Bean', sku: 'AMB-200-WB', size: '200g', grind: 'WHOLE_BEAN' as GrindType, price: 24.99, stock: 45, isDefault: true, sortOrder: 0 },
        { name: '200g — Medium Grind', sku: 'AMB-200-MG', size: '200g', grind: 'MEDIUM' as GrindType, price: 24.99, stock: 30, sortOrder: 1 },
      ],
      flavorNotes: [
        { label: 'Jasmine', intensity: 85 },
        { label: 'Blueberry', intensity: 80 },
        { label: 'Peach', intensity: 70 },
      ],
      collections: [singleOriginCollection.id],
    },
    {
      slug: 'midnight-blend',
      name: 'Midnight Blend',
      tagline: 'The perfect night ritual.',
      description: 'A meticulously balanced medium-dark blend from Colombia and Guatemala designed for the evening hour. Rich, warming, and endlessly sippable.',
      origin: 'Colombia & Guatemala',
      region: 'Huila & Antigua',
      altitude: '1,500–2,000m',
      process: 'Fully Washed',
      roastLevel: 'MEDIUM_DARK' as RoastLevel,
      format: 'BAG' as ProductFormat,
      status: 'ACTIVE' as ProductStatus,
      isNew: false,
      isBestSeller: true,
      isFeatured: false,
      isLimited: false,
      sortOrder: 2,
      basePrice: 19.99,
      subscriptionPrice: 16.99,
      tags: ['blend', 'medium-dark', 'best-seller'],
      variants: [
        { name: '250g — Whole Bean', sku: 'MID-250-WB', size: '250g', grind: 'WHOLE_BEAN' as GrindType, price: 19.99, stock: 200, isDefault: true, sortOrder: 0 },
        { name: '500g — Whole Bean', sku: 'MID-500-WB', size: '500g', grind: 'WHOLE_BEAN' as GrindType, price: 36.99, stock: 100, sortOrder: 1 },
      ],
      flavorNotes: [
        { label: 'Milk Chocolate', intensity: 80 },
        { label: 'Walnut', intensity: 60 },
        { label: 'Brown Sugar', intensity: 70 },
      ],
      collections: [blendsCollection.id, bestSellersCollection.id],
    },
    {
      slug: 'golden-hour',
      name: 'Golden Hour',
      tagline: 'Panama Geisha. 200 bags only.',
      description: 'A once-a-year privilege. Our Panama Geisha from La Esmeralda farm delivers an unparalleled sensory experience — bergamot, tropical florals, and peach nectar in perfect clarity.',
      origin: 'Panama',
      region: 'Boquete',
      altitude: '1,700–2,000m',
      process: 'Washed',
      roastLevel: 'LIGHT' as RoastLevel,
      format: 'BAG' as ProductFormat,
      status: 'ACTIVE' as ProductStatus,
      isNew: true,
      isBestSeller: false,
      isFeatured: false,
      isLimited: true,
      sortOrder: 3,
      basePrice: 49.99,
      compareAtPrice: 59.99,
      tags: ['single-origin', 'geisha', 'panama', 'limited', 'rare'],
      variants: [
        { name: '100g — Whole Bean', sku: 'GOL-100-WB', size: '100g', grind: 'WHOLE_BEAN' as GrindType, price: 49.99, stock: 200, isDefault: true, sortOrder: 0 },
      ],
      flavorNotes: [
        { label: 'Bergamot', intensity: 90 },
        { label: 'Peach Nectar', intensity: 85 },
        { label: 'White Florals', intensity: 95 },
      ],
      collections: [singleOriginCollection.id],
    },
    {
      slug: 'dark-ritual',
      name: 'Dark Ritual',
      tagline: 'Ceremonial darkness, daily.',
      description: 'An intensely roasted single-origin Sumatra that rewards the bold with deep, earthy complexity — aged tobacco, dark cocoa, and cedar.',
      origin: 'Indonesia',
      region: 'Sumatra Mandheling',
      altitude: '1,000–1,500m',
      process: 'Wet-Hulled',
      roastLevel: 'EXTRA_DARK' as RoastLevel,
      format: 'BAG' as ProductFormat,
      status: 'ACTIVE' as ProductStatus,
      isNew: false,
      isBestSeller: true,
      isFeatured: false,
      isLimited: false,
      sortOrder: 4,
      basePrice: 17.99,
      subscriptionPrice: 14.99,
      tags: ['single-origin', 'dark-roast', 'sumatra'],
      variants: [
        { name: '250g — Whole Bean', sku: 'DRK-250-WB', size: '250g', grind: 'WHOLE_BEAN' as GrindType, price: 17.99, stock: 150, isDefault: true, sortOrder: 0 },
        { name: '500g — Whole Bean', sku: 'DRK-500-WB', size: '500g', grind: 'WHOLE_BEAN' as GrindType, price: 32.99, stock: 80, sortOrder: 1 },
      ],
      flavorNotes: [
        { label: 'Dark Cocoa', intensity: 85 },
        { label: 'Aged Tobacco', intensity: 70 },
        { label: 'Cedar', intensity: 65 },
      ],
      collections: [singleOriginCollection.id, bestSellersCollection.id],
    },
    {
      slug: 'cold-cascade',
      name: 'Cold Cascade',
      tagline: 'Ready to pour. Ready to impress.',
      description: 'Cold-brewed for 20 hours with our signature Midnight Blend. Silky, concentrated, and perfect over ice — or straight from the bottle.',
      origin: 'Colombia & Guatemala',
      region: 'Huila & Antigua',
      altitude: null,
      process: 'Cold Brew',
      roastLevel: 'MEDIUM_DARK' as RoastLevel,
      format: 'BOTTLE' as ProductFormat,
      status: 'ACTIVE' as ProductStatus,
      isNew: true,
      isBestSeller: false,
      isFeatured: false,
      isLimited: false,
      sortOrder: 5,
      basePrice: 8.99,
      subscriptionPrice: 7.49,
      tags: ['cold-brew', 'ready-to-drink'],
      variants: [
        { name: '350ml Bottle', sku: 'CCB-350-BTL', size: '350ml', grind: 'WHOLE_BEAN' as GrindType, price: 8.99, stock: 300, isDefault: true, sortOrder: 0 },
        { name: '4-Pack (350ml × 4)', sku: 'CCB-4PK-BTL', size: '4 × 350ml', grind: 'WHOLE_BEAN' as GrindType, price: 31.99, stock: 80, sortOrder: 1 },
      ],
      flavorNotes: [
        { label: 'Chocolate', intensity: 75 },
        { label: 'Caramel', intensity: 70 },
        { label: 'Vanilla', intensity: 55 },
      ],
      collections: [coldBrewCollection.id],
    },
  ];

  let productCount = 0;
  for (const prod of PRODUCTS) {
    const { variants, flavorNotes, collections: collIds, altitude, ...productData } = prod;

    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        altitude: altitude ?? undefined,
        publishedAt: new Date(),
        variants: {
          create: variants.map((v) => ({ ...v, weight: null })),
        },
        flavorNotes: {
          create: flavorNotes,
        },
        collections: {
          create: collIds.map((collectionId, i) => ({ collectionId, sortOrder: i })),
        },
      },
    });
    productCount++;
  }
  console.log(`  ✓ ${productCount} products seeded`);

  // ─── Subscription Plans ─────────────────────────────────────
  console.log('📦 Seeding subscription plans...');
  await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { id: 'plan-monthly' },
      update: {},
      create: {
        id: 'plan-monthly',
        name: 'Monthly',
        frequency: 'MONTHLY',
        discount: 12,
        description: 'Delivered fresh every month.',
        perks: ['12% off every order', 'Free standard shipping', 'Priority roast scheduling', 'Cancel anytime'],
        sortOrder: 0,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { id: 'plan-biweekly' },
      update: {},
      create: {
        id: 'plan-biweekly',
        name: 'Bi-Weekly',
        frequency: 'BIWEEKLY',
        discount: 15,
        description: 'Fresh coffee every two weeks.',
        perks: ['15% off every order', 'Free express shipping', 'Early access to new releases', 'Cancel anytime'],
        sortOrder: 1,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { id: 'plan-quarterly' },
      update: {},
      create: {
        id: 'plan-quarterly',
        name: 'Quarterly',
        frequency: 'QUARTERLY',
        discount: 18,
        description: 'The grand quarterly ritual.',
        perks: ['18% off every order', 'Free express shipping', 'Exclusive subscriber box', 'Dedicated account manager'],
        sortOrder: 2,
      },
    }),
  ]);
  console.log('  ✓ 3 subscription plans seeded');

  // ─── Coupons ────────────────────────────────────────────────
  console.log('🎟️  Seeding coupons...');
  await Promise.all([
    prisma.coupon.upsert({
      where: { code: 'BLENDIFY10' },
      update: {},
      create: {
        code: 'BLENDIFY10',
        type: 'PERCENTAGE',
        value: 10,
        description: 'Welcome discount — 10% off your first order',
        maxUsesPerUser: 1,
        isActive: true,
        applicableToAll: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'FREESHIP' },
      update: {},
      create: {
        code: 'FREESHIP',
        type: 'FREE_SHIPPING',
        value: 99,
        description: 'Free shipping on any order',
        maxUses: 1000,
        isActive: true,
        applicableToAll: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'WELCOME20' },
      update: {},
      create: {
        code: 'WELCOME20',
        type: 'FIXED_AMOUNT',
        value: 20,
        description: '₹20 off on orders above ₹999',
        minOrderAmount: 999,
        maxUsesPerUser: 1,
        isActive: true,
        applicableToAll: true,
      },
    }),
  ]);
  console.log('  ✓ 3 coupons seeded');

  // ─── Admin User ─────────────────────────────────────────────
  console.log('👤 Seeding admin user...');
  // In production, use bcrypt — this is just for dev seed
  await prisma.user.upsert({
    where: { email: 'admin@blendify.coffee' },
    update: {},
    create: {
      email: 'admin@blendify.coffee',
      firstName: 'BLENDIFY',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      // Note: In production, passwordHash would be a proper bcrypt hash
      // e.g., await bcrypt.hash('admin123', 12)
      passwordHash: '$2b$12$placeholder_replace_with_real_hash',
    },
  });
  console.log('  ✓ Admin user seeded');

  console.log('\n✅ BLENDIFY seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Database URL:   Check DATABASE_URL in .env');
  console.log('  Admin login:    admin@blendify.coffee');
  console.log('  Coupon codes:   BLENDIFY10 | FREESHIP | WELCOME20');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

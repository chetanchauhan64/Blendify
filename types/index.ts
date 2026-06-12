// ============================================================
// BLENDIFY — Core Type Definitions
// Structured for future PostgreSQL + Prisma integration
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type RoastLevel = 'light' | 'medium' | 'medium-dark' | 'dark' | 'extra-dark';
export type GrindType = 'whole-bean' | 'coarse' | 'medium-coarse' | 'medium' | 'fine' | 'espresso' | 'instant';
export type ProductFormat = 'bag' | 'bottle' | 'capsule' | 'kit' | 'jar';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'razorpay' | 'stripe' | 'cod' | 'wallet';
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type Region = 'IN' | 'US' | 'EU' | 'GB' | 'CA' | 'AU' | 'AE' | 'JP' | 'GLOBAL';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'JPY';

// ── Currency & Region ─────────────────────────────────────────

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // relative to USD
  locale: string;
}

export interface RegionConfig {
  code: Region;
  name: string;
  currency: CurrencyCode;
  flag: string;
  shippingZone: 'domestic' | 'zone1' | 'zone2' | 'zone3';
  taxRate: number;
}

// ── User ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  referralCode: string;
  createdAt: Date;
}

// ── Product ───────────────────────────────────────────────────

export interface FlavorNote {
  label: string;
  intensity: number; // 0-100
}

export interface BrewGuide {
  method: string;
  ratio: string;
  temperature: string;
  time: string;
  instructions: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string; // e.g. "250g", "500g", "1kg"
  grind: GrindType;
  price: number; // in USD
  compareAtPrice?: number;
  inventory: number;
  sku: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  origin: string;
  region: string;
  altitude: string;
  process: string;
  roastLevel: RoastLevel;
  flavorNotes: FlavorNote[];
  collections: string[];
  category: string;
  format: ProductFormat;
  images: string[];
  variants: ProductVariant[];
  basePrice: number; // in USD
  compareAtPrice?: number;
  subscriptionPrice?: number;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isLimited: boolean;
  rating: number;
  reviewCount: number;
  brewGuides: BrewGuide[];
  tags: string[];
  createdAt: Date;
}

// ── Collection ────────────────────────────────────────────────

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

// ── Cart ──────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  isSubscription: boolean;
  subscriptionFrequency?: SubscriptionFrequency;
  addedAt: Date;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  couponDiscount?: number;
  loyaltyPointsUsed?: number;
}

// ── Wishlist ──────────────────────────────────────────────────

export interface WishlistItem {
  productId: string;
  variantId: string;
  addedAt: Date;
}

// ── Address ───────────────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  label: string; // "Home", "Work", etc.
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// ── Order ─────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Omit<Address, 'id' | 'userId' | 'isDefault'>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  currency: CurrencyCode;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Review ────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  helpful: number;
  createdAt: Date;
}

// ── Coupon ────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
}

// ── Subscription ──────────────────────────────────────────────

export interface Subscription {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  frequency: SubscriptionFrequency;
  status: 'active' | 'paused' | 'cancelled';
  nextBillingDate: Date;
  price: number;
  discount: number; // percent off
}

// ── Bundle ────────────────────────────────────────────────────

export interface Bundle {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  products: Array<{ productId: string; variantId: string; quantity: number }>;
  originalPrice: number;
  bundlePrice: number;
  savings: number;
  savingsPercent: number;
}

// ── Newsletter ────────────────────────────────────────────────

export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  source: string;
  tags: string[];
  subscribedAt: Date;
}

// ── Loyalty ───────────────────────────────────────────────────

export interface LoyaltyTierConfig {
  tier: LoyaltyTier;
  minPoints: number;
  multiplier: number;
  perks: string[];
  color: string;
}

// ── Shipping ──────────────────────────────────────────────────

export interface ShippingRate {
  zone: string;
  name: string;
  price: number;
  estimatedDays: string;
  freeThreshold?: number;
}

// ── Inventory ─────────────────────────────────────────────────

export interface InventoryLog {
  id: string;
  variantId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  createdAt: Date;
}

// ── Testimonial ───────────────────────────────────────────────

export interface Testimonial {
  id: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  rating: number;
  text: string;
  productName?: string;
  verified: boolean;
}

// ── Blog / Journal ────────────────────────────────────────────

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: Date;
}

// ── Store / UI State ──────────────────────────────────────────

export interface UIState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  isRegionModalOpen: boolean;
  isCouponPopupShown: boolean;
  announcementDismissed: boolean;
}

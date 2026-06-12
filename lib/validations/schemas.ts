// ============================================================
// BLENDIFY — Zod Validation Schemas
// All input validation for the backend service layer.
// ============================================================
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// COMMON PRIMITIVES
// ─────────────────────────────────────────────────────────────

export const IdSchema = z.string().cuid();
export const SlugSchema = z.string().min(2).max(120).regex(/^[a-z0-9-]+$/);
export const EmailSchema = z.string().email().toLowerCase().trim();
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/);
export const PositiveInt = z.number().int().positive();
export const NonNegativeInt = z.number().int().min(0);
export const PositiveDecimal = z.number().positive();
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─────────────────────────────────────────────────────────────
// ENUM SCHEMAS (mirror Prisma enums)
// ─────────────────────────────────────────────────────────────

export const RoastLevelSchema = z.enum([
  'LIGHT', 'MEDIUM', 'MEDIUM_DARK', 'DARK', 'EXTRA_DARK',
]);

export const GrindTypeSchema = z.enum([
  'WHOLE_BEAN', 'COARSE', 'MEDIUM_COARSE', 'MEDIUM', 'FINE', 'ESPRESSO',
]);

export const ProductFormatSchema = z.enum([
  'BAG', 'BOTTLE', 'CAPSULE', 'KIT', 'BUNDLE',
]);

export const ProductStatusSchema = z.enum([
  'DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK',
]);

export const OrderStatusSchema = z.enum([
  'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED',
  'RETURNED', 'REFUND_INITIATED', 'REFUNDED',
]);

export const PaymentGatewaySchema = z.enum([
  'RAZORPAY', 'STRIPE', 'COD', 'WALLET', 'LOYALTY_POINTS',
]);

export const SubscriptionFrequencySchema = z.enum([
  'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL',
]);

export const CouponTypeSchema = z.enum([
  'PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y',
]);

export const AddressTypeSchema = z.enum(['HOME', 'WORK', 'OTHER']);

// ─────────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────────

export const FlavorNoteSchema = z.object({
  label: z.string().min(1).max(50),
  intensity: z.number().int().min(0).max(100),
});

export const ProductVariantSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(100).toUpperCase(),
  size: z.string().max(50).optional(),
  grind: GrindTypeSchema.default('WHOLE_BEAN'),
  price: PositiveDecimal,
  compareAt: PositiveDecimal.optional(),
  stock: NonNegativeInt.default(0),
  lowStockThreshold: NonNegativeInt.default(5),
  weight: PositiveDecimal.optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: NonNegativeInt.default(0),
});

export const CreateProductSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2).max(200),
  tagline: z.string().max(300).optional(),
  description: z.string().min(10),
  longDescription: z.string().optional(),
  categoryId: IdSchema.optional(),
  origin: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  altitude: z.string().max(50).optional(),
  process: z.string().max(100).optional(),
  roastLevel: RoastLevelSchema.optional(),
  format: ProductFormatSchema.default('BAG'),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isLimited: z.boolean().default(false),
  sortOrder: NonNegativeInt.default(0),
  basePrice: PositiveDecimal,
  compareAtPrice: PositiveDecimal.optional(),
  subscriptionPrice: PositiveDecimal.optional(),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  tags: z.array(z.string()).default([]),
  variants: z.array(ProductVariantSchema).min(1),
  flavorNotes: z.array(FlavorNoteSchema).default([]),
  collectionIds: z.array(IdSchema).default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial().omit({ slug: true });

export const ProductFiltersSchema = z.object({
  status: ProductStatusSchema.optional(),
  categoryId: IdSchema.optional(),
  collectionSlug: SlugSchema.optional(),
  roastLevel: RoastLevelSchema.optional(),
  format: ProductFormatSchema.optional(),
  isNew: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isLimited: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────────────────────

export const InventoryActionSchema = z.enum([
  'STOCK_IN', 'STOCK_OUT', 'ORDER_DEDUCTION', 'ORDER_CANCELLATION_RESTORE',
  'RETURN_RESTORE', 'MANUAL_ADJUSTMENT', 'DAMAGE_WRITE_OFF', 'INITIAL_STOCK',
]);

export const InventoryUpdateSchema = z.object({
  variantId: IdSchema,
  action: InventoryActionSchema,
  quantity: z.number().int().refine((n) => n !== 0, { message: 'Quantity cannot be zero' }),
  reason: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
});

// ─────────────────────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  phone: PhoneSchema.optional(),
  referralCode: z.string().optional(),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: PhoneSchema.optional(),
  avatar: z.string().url().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─────────────────────────────────────────────────────────────
// ADDRESS
// ─────────────────────────────────────────────────────────────

export const AddressSchema = z.object({
  type: AddressTypeSchema.default('HOME'),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  company: z.string().max(100).optional(),
  phone: PhoneSchema,
  line1: z.string().min(5).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  countryId: IdSchema,
  isDefault: z.boolean().default(false),
  label: z.string().max(50).optional(),
});

// ─────────────────────────────────────────────────────────────
// ORDER
// ─────────────────────────────────────────────────────────────

export const CartItemSchema = z.object({
  productId: IdSchema,
  variantId: IdSchema,
  quantity: PositiveInt,
  isSubscription: z.boolean().default(false),
  subscriptionFrequency: SubscriptionFrequencySchema.optional(),
});

export const CreateOrderSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  shippingAddressId: IdSchema,
  billingAddressId: IdSchema.optional(),
  paymentGateway: PaymentGatewaySchema,
  couponCode: z.string().optional(),
  loyaltyPointsToUse: NonNegativeInt.default(0),
  notes: z.string().max(500).optional(),
  currencyCode: z.string().length(3).default('INR'),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  message: z.string().min(1).max(500),
  isPublic: z.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────

export const RazorpayVerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  orderId: IdSchema,
});

export const StripeConfirmSchema = z.object({
  paymentIntentId: z.string(),
  orderId: IdSchema,
});

// ─────────────────────────────────────────────────────────────
// COUPON
// ─────────────────────────────────────────────────────────────

export const CreateCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  type: CouponTypeSchema,
  value: PositiveDecimal,
  description: z.string().max(300).optional(),
  minOrderAmount: PositiveDecimal.optional(),
  maxDiscountAmount: PositiveDecimal.optional(),
  maxUses: PositiveInt.optional(),
  maxUsesPerUser: PositiveInt.default(1),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  applicableToAll: z.boolean().default(true),
  applicableProducts: z.array(IdSchema).default([]),
});

export const ApplyCouponSchema = z.object({
  code: z.string().min(1).toUpperCase().trim(),
  cartTotal: PositiveDecimal,
});

// ─────────────────────────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────────────────────────

export const NewsletterSubscribeSchema = z.object({
  email: EmailSchema,
  firstName: z.string().max(50).optional(),
  source: z.string().default('website'),
  tags: z.array(z.string()).default([]),
});

// ─────────────────────────────────────────────────────────────
// REVIEW
// ─────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  productId: IdSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10).max(2000),
  authorName: z.string().min(1).max(100),
  images: z.array(z.string().url()).max(5).default([]),
});

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION
// ─────────────────────────────────────────────────────────────

export const CreateSubscriptionSchema = z.object({
  productId: IdSchema,
  variantId: IdSchema,
  planId: IdSchema,
  quantity: PositiveInt.default(1),
  shippingAddressId: IdSchema,
});

// ─────────────────────────────────────────────────────────────
// REGION / COUNTRY / CURRENCY
// ─────────────────────────────────────────────────────────────

export const CreateCountrySchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().length(2).toUpperCase(),
  currencyCode: z.string().length(3).toUpperCase(),
  phonePrefix: z.string().max(6),
  flag: z.string().max(10),
  shippingZone: z.enum(['DOMESTIC', 'ZONE_1', 'ZONE_2', 'ZONE_3', 'RESTRICTED']),
  taxType: z.enum(['GST', 'VAT', 'SALES_TAX', 'NONE']).default('NONE'),
  taxRate: z.number().min(0).max(1),
  isActive: z.boolean().default(true),
});

export const CreateCurrencySchema = z.object({
  code: z.string().length(3).toUpperCase(),
  name: z.string().min(2).max(50),
  symbol: z.string().min(1).max(5),
  exchangeRate: z.number().positive(),
  decimalDigits: z.number().int().min(0).max(4).default(2),
  isActive: z.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────
// RETURN REQUEST
// ─────────────────────────────────────────────────────────────

export const CreateReturnSchema = z.object({
  orderId: IdSchema,
  reason: z.string().min(10).max(500),
  description: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

// Type exports for use throughout the app
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductFiltersInput = z.infer<typeof ProductFiltersSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type NewsletterSubscribeInput = z.infer<typeof NewsletterSubscribeSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type InventoryUpdateInput = z.infer<typeof InventoryUpdateSchema>;
export type CreateCountryInput = z.infer<typeof CreateCountrySchema>;
export type CreateCurrencyInput = z.infer<typeof CreateCurrencySchema>;

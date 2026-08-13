// ============================================================
// BLENDIFY — Admin Validation Schemas (Phase 1)
// Zod schemas for all marketing & engagement modules.
// ============================================================
import { z } from 'zod';
import { IdSchema, SlugSchema, PositiveDecimal, NonNegativeInt, PositiveInt } from './schemas';

// ── Common ──────────────────────────────────────────────────
export const CouponTypeSchema = z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y']);
export const LoyaltyTierSchema = z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export const BulkActionSchema = z.object({
  ids: z.array(IdSchema).min(1),
  action: z.string().min(1),
});
export type BulkActionInput = z.infer<typeof BulkActionSchema>;

// ── Reviews ─────────────────────────────────────────────────
export const ReviewFiltersSchema = PaginationSchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN']).optional(),
  productId: IdSchema.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z.coerce.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
export type ReviewFiltersInput = z.infer<typeof ReviewFiltersSchema>;

export const UpdateReviewSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN']).optional(),
  reply: z.string().max(2000).optional(),
});
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;

export const BulkReviewActionSchema = BulkActionSchema.extend({
  action: z.enum(['approve', 'reject', 'hide', 'delete']),
});

// ── Coupons ─────────────────────────────────────────────────
export const CreateCouponAdminSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  type: CouponTypeSchema,
  value: PositiveDecimal,
  description: z.string().max(500).optional(),
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
export type CreateCouponAdminInput = z.infer<typeof CreateCouponAdminSchema>;

export const UpdateCouponSchema = CreateCouponAdminSchema.partial().omit({ code: true });
export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>;

export const CouponFiltersSchema = PaginationSchema.extend({
  type: CouponTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  expired: z.coerce.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// ── Discount Rules ───────────────────────────────────────────
export const CreateDiscountRuleSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  discountType: CouponTypeSchema,
  discountValue: PositiveDecimal,
  triggerType: z.enum(['ORDER_TOTAL', 'PRODUCT', 'CATEGORY', 'CUSTOMER_TIER']).default('ORDER_TOTAL'),
  triggerValue: PositiveDecimal.optional(),
  applicableTo: z.enum(['ALL', 'PRODUCT', 'CATEGORY']).default('ALL'),
  applicableIds: z.array(IdSchema).default([]),
  customerTiers: z.array(LoyaltyTierSchema).default([]),
  maxDiscountAmount: PositiveDecimal.optional(),
  isActive: z.boolean().default(true),
  isStackable: z.boolean().default(false),
  priority: NonNegativeInt.default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type CreateDiscountRuleInput = z.infer<typeof CreateDiscountRuleSchema>;
export const UpdateDiscountRuleSchema = CreateDiscountRuleSchema.partial();
export type UpdateDiscountRuleInput = z.infer<typeof UpdateDiscountRuleSchema>;

export const DiscountFiltersSchema = PaginationSchema.extend({
  triggerType: z.enum(['ORDER_TOTAL', 'PRODUCT', 'CATEGORY', 'CUSTOMER_TIER']).optional(),
  isActive: z.coerce.boolean().optional(),
  isStackable: z.coerce.boolean().optional(),
});

// ── Flash Sales ──────────────────────────────────────────────
const FlashSaleBaseSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: PositiveDecimal,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  isActive: z.boolean().default(true),
  sortOrder: NonNegativeInt.default(0),
  items: z.array(z.object({
    productId: IdSchema,
    variantId: IdSchema.optional(),
    sortOrder: NonNegativeInt.default(0),
  })).min(1),
});
export const CreateFlashSaleSchema = FlashSaleBaseSchema.refine((d) => d.endsAt > d.startsAt, {
  message: 'End date must be after start date',
  path: ['endsAt'],
});
export type CreateFlashSaleInput = z.infer<typeof CreateFlashSaleSchema>;
export const UpdateFlashSaleSchema = FlashSaleBaseSchema.partial();
export type UpdateFlashSaleInput = z.infer<typeof UpdateFlashSaleSchema>;

export const FlashSaleFiltersSchema = PaginationSchema.extend({
  status: z.enum(['active', 'scheduled', 'expired', 'inactive']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// ── Bundles ──────────────────────────────────────────────────
export const CreateBundleAdminSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  image: z.string().url().optional(),
  bundlePrice: PositiveDecimal,
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: NonNegativeInt.default(0),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  items: z.array(z.object({
    productId: IdSchema,
    variantId: IdSchema,
    quantity: PositiveInt.default(1),
    sortOrder: NonNegativeInt.default(0),
  })).min(1),
});
export type CreateBundleAdminInput = z.infer<typeof CreateBundleAdminSchema>;
export const UpdateBundleAdminSchema = CreateBundleAdminSchema.partial().omit({ slug: true });
export type UpdateBundleAdminInput = z.infer<typeof UpdateBundleAdminSchema>;

export const BundleFiltersSchema = PaginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

// ── Gift Cards ───────────────────────────────────────────────
export const CreateGiftCardSchema = z.object({
  code: z.string().min(8).max(20).toUpperCase().trim().optional(), // auto-generated if omitted
  value: PositiveDecimal,
  currencyCode: z.string().length(3).default('INR'),
  issuedToEmail: z.string().email().optional(),
  issuedToUserId: IdSchema.optional(),
  expiresAt: z.coerce.date().optional(),
  note: z.string().max(500).optional(),
  quantity: PositiveInt.default(1), // generate multiple at once
});
export type CreateGiftCardInput = z.infer<typeof CreateGiftCardSchema>;

export const UpdateGiftCardSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.coerce.date().optional(),
  note: z.string().max(500).optional(),
  balance: PositiveDecimal.optional(),
});
export type UpdateGiftCardInput = z.infer<typeof UpdateGiftCardSchema>;

export const GiftCardFiltersSchema = PaginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  hasBalance: z.coerce.boolean().optional(),
  issuedToEmail: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// ── Loyalty Config ───────────────────────────────────────────
export const LoyaltyConfigSchema = z.object({
  tier: LoyaltyTierSchema,
  minPoints: NonNegativeInt,
  pointsPerRupee: z.number().positive(),
  bonusMultiplier: z.number().positive(),
  birthdayBonus: NonNegativeInt.default(0),
  perks: z.array(z.string().max(200)).default([]),
  isActive: z.boolean().default(true),
});
export type LoyaltyConfigInput = z.infer<typeof LoyaltyConfigSchema>;

export const ManualPointsAdjustSchema = z.object({
  userId: IdSchema,
  points: z.number().int().refine((n) => n !== 0, { message: 'Points cannot be zero' }),
  description: z.string().min(5).max(500),
  type: z.enum(['ADJUSTED', 'EARNED_BONUS', 'EXPIRED']).default('ADJUSTED'),
});
export type ManualPointsAdjustInput = z.infer<typeof ManualPointsAdjustSchema>;

export const LoyaltyFiltersSchema = PaginationSchema.extend({
  userId: IdSchema.optional(),
  type: z.enum(['EARNED_PURCHASE', 'EARNED_REVIEW', 'EARNED_REFERRAL', 'EARNED_BIRTHDAY', 'EARNED_BONUS', 'REDEEMED', 'EXPIRED', 'ADJUSTED']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// ── Referral Config ──────────────────────────────────────────
export const ReferralConfigSchema = z.object({
  isActive: z.boolean().default(true),
  referrerPointsReward: NonNegativeInt.default(100),
  refereeDiscountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  refereeDiscountValue: PositiveDecimal.default(10),
  minimumOrderForReward: PositiveDecimal.optional(),
  maxReferrals: PositiveInt.optional(),
  cookieDurationDays: PositiveInt.default(30),
  terms: z.string().max(5000).optional(),
});
export type ReferralConfigInput = z.infer<typeof ReferralConfigSchema>;

// ── Newsletter ───────────────────────────────────────────────
export const NewsletterFiltersSchema = PaginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  source: z.string().optional(),
  tag: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const UpdateSubscriberSchema = z.object({
  tags: z.array(z.string().max(50)).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().max(50).optional(),
});
export type UpdateSubscriberInput = z.infer<typeof UpdateSubscriberSchema>;

// ── Email Campaigns ──────────────────────────────────────────
export const CreateEmailCampaignSchema = z.object({
  name: z.string().min(2).max(200),
  subject: z.string().min(2).max(300),
  htmlBody: z.string().min(10),
  textBody: z.string().optional(),
  targetType: z.enum(['ALL', 'TAG']).default('ALL'),
  targetTags: z.array(z.string()).default([]),
  scheduledAt: z.coerce.date().optional(),
});
export type CreateEmailCampaignInput = z.infer<typeof CreateEmailCampaignSchema>;
export const UpdateEmailCampaignSchema = CreateEmailCampaignSchema.partial();
export type UpdateEmailCampaignInput = z.infer<typeof UpdateEmailCampaignSchema>;

export const CampaignFiltersSchema = PaginationSchema.extend({
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED']).optional(),
  targetType: z.enum(['ALL', 'TAG']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// ── Push Notifications ───────────────────────────────────────
export const CreatePushNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  icon: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  actionUrl: z.string().url().optional(),
  targetType: z.enum(['ALL']).default('ALL'),
  scheduledAt: z.coerce.date().optional(),
});
export type CreatePushNotificationInput = z.infer<typeof CreatePushNotificationSchema>;

export const PushFiltersSchema = PaginationSchema.extend({
  status: z.enum(['DRAFT', 'SENT', 'FAILED']).optional(),
});

// ── Announcement Bars ────────────────────────────────────────
export const CreateAnnouncementBarSchema = z.object({
  message: z.string().min(1).max(500),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#581312'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  linkText: z.string().max(100).optional(),
  linkUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  sortOrder: NonNegativeInt.default(0),
  targetPages: z.array(z.string()).default([]),
});
export type CreateAnnouncementBarInput = z.infer<typeof CreateAnnouncementBarSchema>;
export const UpdateAnnouncementBarSchema = CreateAnnouncementBarSchema.partial();
export type UpdateAnnouncementBarInput = z.infer<typeof UpdateAnnouncementBarSchema>;

// ── Homepage Banners ─────────────────────────────────────────
export const CreateHomepageBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url(),
  mobileImageUrl: z.string().url().optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().url().optional(),
  badge: z.string().max(50).optional(),
  textPosition: z.enum(['left', 'center', 'right']).default('left'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  overlayOpacity: z.number().min(0).max(1).default(0.4),
  isActive: z.boolean().default(true),
  sortOrder: NonNegativeInt.default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type CreateHomepageBannerInput = z.infer<typeof CreateHomepageBannerSchema>;
export const UpdateHomepageBannerSchema = CreateHomepageBannerSchema.partial();
export type UpdateHomepageBannerInput = z.infer<typeof UpdateHomepageBannerSchema>;

export const BannerFiltersSchema = PaginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
});

// ── Popup Campaigns ──────────────────────────────────────────
export const CreatePopupCampaignSchema = z.object({
  name: z.string().min(2).max(200),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().url().optional(),
  triggerType: z.enum(['TIME_DELAY', 'EXIT_INTENT', 'SCROLL_PERCENT', 'PAGE_LOAD']).default('TIME_DELAY'),
  triggerValue: NonNegativeInt.default(5),
  targetAudience: z.enum(['ALL', 'NEW', 'RETURNING']).default('ALL'),
  targetPages: z.array(z.string()).default([]),
  showFrequency: z.enum(['ONCE', 'EVERY_SESSION', 'EVERY_VISIT']).default('ONCE'),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type CreatePopupCampaignInput = z.infer<typeof CreatePopupCampaignSchema>;
export const UpdatePopupCampaignSchema = CreatePopupCampaignSchema.partial();
export type UpdatePopupCampaignInput = z.infer<typeof UpdatePopupCampaignSchema>;

export const PopupFiltersSchema = PaginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  triggerType: z.enum(['TIME_DELAY', 'EXIT_INTENT', 'SCROLL_PERCENT', 'PAGE_LOAD']).optional(),
  targetAudience: z.enum(['ALL', 'NEW', 'RETURNING']).optional(),
});

// ── Saved Filters ────────────────────────────────────────────
export const SavedFilterSchema = z.object({
  module: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  filters: z.record(z.string(), z.unknown()),
  isDefault: z.boolean().default(false),
});
export type SavedFilterInput = z.infer<typeof SavedFilterSchema>;

// ── Global Search ────────────────────────────────────────────
export const GlobalSearchSchema = z.object({
  query: z.string().min(1).max(200),
  modules: z.array(z.string()).optional(), // limit to specific modules
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type GlobalSearchInput = z.infer<typeof GlobalSearchSchema>;

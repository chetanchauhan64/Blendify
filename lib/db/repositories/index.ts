// ============================================================
// BLENDIFY — Repository Barrel Export
// Import all repositories from this single entry point.
// ============================================================

export { ProductRepository, productRepository } from './product.repository';
export type {
  ProductWithDetails,
  ProductFilters,
  ProductSortField,
} from './product.repository';

export { OrderRepository, orderRepository } from './order.repository';
export type {
  OrderWithDetails,
  OrderListItem,
  OrderFilters,
} from './order.repository';

export { UserRepository, userRepository } from './user.repository';
export type { UserListItem, UserFilters } from './user.repository';

export {
  InventoryRepository,
  inventoryRepository,
} from './inventory.repository';
export type {
  InventoryLogWithRelations,
  InventoryLogFilters,
} from './inventory.repository';

export {
  NewsletterRepository,
  newsletterRepository,
} from './newsletter.repository';

export {
  CountryRepository,
  countryRepository,
  CurrencyRepository,
  currencyRepository,
} from './region.repository';

export { CouponRepository, couponRepository } from './coupon.repository';

// ── Phase 1: Marketing & Engagement ─────────────────────────
export { ReviewRepository, reviewRepository } from './review.repository';
export type { ReviewWithDetails } from './review.repository';

export { FlashSaleRepository, flashSaleRepository } from './flash-sale.repository';
export type { FlashSaleWithItems, FlashSaleStatus } from './flash-sale.repository';

export { GiftCardRepository, giftCardRepository } from './gift-card.repository';
export type { GiftCardWithTransactions } from './gift-card.repository';

export { LoyaltyConfigRepository, loyaltyConfigRepository } from './loyalty-config.repository';

export { ReferralRepository, referralRepository } from './referral.repository';

export { CampaignRepository, campaignRepository } from './campaign.repository';

export { AnnouncementRepository, announcementRepository } from './announcement.repository';

export { BannerRepository, bannerRepository } from './banner.repository';

export { PopupRepository, popupRepository } from './popup.repository';

export { DiscountRepository, discountRepository } from './discount.repository';

export { SavedFilterRepository, savedFilterRepository } from './saved-filter.repository';

export { BaseRepository } from './base.repository';
export type {
  PaginatedResult,
  PaginationParams,
  SortOrder,
} from './base.repository';

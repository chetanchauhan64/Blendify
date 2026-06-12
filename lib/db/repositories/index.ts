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

export { BaseRepository } from './base.repository';
export type {
  PaginatedResult,
  PaginationParams,
  SortOrder,
} from './base.repository';

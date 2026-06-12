// ============================================================
// BLENDIFY — Product Repository
// All database operations for products, variants, images.
// ============================================================
import {
  Prisma,
  ProductStatus,
  RoastLevel,
  ProductFormat,
} from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
  PaginationParams,
} from './base.repository';

// ── Filter & Sort Types ─────────────────────────────────────

export type ProductFilters = {
  status?: ProductStatus;
  categoryId?: string;
  collectionSlug?: string;
  roastLevel?: RoastLevel;
  format?: ProductFormat;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isLimited?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string[];
};

export type ProductSortField =
  | 'createdAt'
  | 'basePrice'
  | 'name'
  | 'sortOrder';

// ── Include Shape ───────────────────────────────────────────

const PRODUCT_INCLUDE = {
  category: true,
  variants: { orderBy: { sortOrder: 'asc' as const } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  flavorNotes: true,
  collections: { include: { collection: true } },
  reviews: {
    where: { status: 'APPROVED' as const },
    select: { rating: true },
  },
} satisfies Prisma.ProductInclude;

// ── Payload Type ────────────────────────────────────────────

export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

// ── Repository Class ────────────────────────────────────────

export class ProductRepository extends BaseRepository {
  // ── Queries ────────────────────────────────────────────────

  async findBySlug(slug: string): Promise<ProductWithDetails | null> {
    return this.db.product.findUnique({
      where: { slug },
      include: {
        ...PRODUCT_INCLUDE,
        brewGuides: { orderBy: { sortOrder: 'asc' } },
        regionPrices: { include: { country: true } },
      },
    });
  }

  async findById(id: string): Promise<ProductWithDetails | null> {
    return this.db.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
  }

  async findMany(
    filters: ProductFilters = {},
    sort: { field: ProductSortField; order: 'asc' | 'desc' } = {
      field: 'sortOrder',
      order: 'asc',
    },
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<ProductWithDetails>> {
    const { page = 1, limit = 20 } = pagination;
    const { skip, take } = this.getPaginationOffset(page, limit);
    const where = this.buildWhereClause(filters);
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sort.field]: sort.order,
    };

    const [products, total] = await Promise.all([
      this.db.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy, skip, take }),
      this.db.product.count({ where }),
    ]);

    return this.paginate(products, total, page, limit);
  }

  async findBestSellers(limit = 6): Promise<ProductWithDetails[]> {
    return this.db.product.findMany({
      where: { isBestSeller: true, status: 'ACTIVE' },
      include: PRODUCT_INCLUDE,
      orderBy: { sortOrder: 'asc' },
      take: limit,
    });
  }

  async findNewArrivals(limit = 4): Promise<ProductWithDetails[]> {
    return this.db.product.findMany({
      where: { isNew: true, status: 'ACTIVE' },
      include: PRODUCT_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async findFeatured(limit = 3): Promise<ProductWithDetails[]> {
    return this.db.product.findMany({
      where: { isFeatured: true, status: 'ACTIVE' },
      include: PRODUCT_INCLUDE,
      orderBy: { sortOrder: 'asc' },
      take: limit,
    });
  }

  async findByCollection(
    collectionSlug: string,
    limit?: number,
  ): Promise<ProductWithDetails[]> {
    return this.db.product.findMany({
      where: {
        status: 'ACTIVE',
        collections: { some: { collection: { slug: collectionSlug } } },
      },
      include: PRODUCT_INCLUDE,
      orderBy: { sortOrder: 'asc' },
      ...(limit ? { take: limit } : {}),
    });
  }

  async search(query: string, limit = 10) {
    return this.db.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tagline: { contains: query, mode: 'insensitive' } },
          { origin: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      include: {
        variants: { take: 1, orderBy: { sortOrder: 'asc' } },
        images: { take: 1, where: { isPrimary: true } },
      },
      take: limit,
    });
  }

  // ── Mutations ──────────────────────────────────────────────

  async create(data: Prisma.ProductCreateInput): Promise<ProductWithDetails> {
    return this.db.product.create({ data, include: PRODUCT_INCLUDE });
  }

  async update(
    id: string,
    data: Prisma.ProductUpdateInput,
  ): Promise<ProductWithDetails> {
    return this.db.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });
  }

  async updateStatus(id: string, status: ProductStatus) {
    return this.db.product.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'ACTIVE' ? new Date() : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.db.product.delete({ where: { id } });
  }

  // ── Stats ──────────────────────────────────────────────────

  async getStats() {
    const [total, active, draft, outOfStock] = await Promise.all([
      this.db.product.count(),
      this.db.product.count({ where: { status: 'ACTIVE' } }),
      this.db.product.count({ where: { status: 'DRAFT' } }),
      this.db.product.count({ where: { status: 'OUT_OF_STOCK' } }),
    ]);
    return { total, active, draft, outOfStock };
  }

  // ── Private Helpers ────────────────────────────────────────

  private buildWhereClause(
    filters: ProductFilters,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.roastLevel) where.roastLevel = filters.roastLevel;
    if (filters.format) where.format = filters.format;
    if (filters.isNew !== undefined) where.isNew = filters.isNew;
    if (filters.isBestSeller !== undefined)
      where.isBestSeller = filters.isBestSeller;
    if (filters.isFeatured !== undefined)
      where.isFeatured = filters.isFeatured;
    if (filters.isLimited !== undefined)
      where.isLimited = filters.isLimited;

    if (
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined
    ) {
      where.basePrice = {};
      if (filters.minPrice !== undefined)
        where.basePrice.gte = filters.minPrice;
      if (filters.maxPrice !== undefined)
        where.basePrice.lte = filters.maxPrice;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        { origin: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.collectionSlug) {
      where.collections = {
        some: { collection: { slug: filters.collectionSlug } },
      };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    return where;
  }
}

export const productRepository = new ProductRepository();

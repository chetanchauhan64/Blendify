// ============================================================
// BLENDIFY — Review Repository
// ============================================================
import { Prisma, ReviewStatus } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';
import type { ReviewFiltersInput } from '@/lib/validations/admin.schemas';

export type ReviewWithDetails = {
  id: string;
  productId: string;
  userId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  verified: boolean;
  helpful: number;
  images: string[];
  reply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; name: string; slug: string };
  user: { id: string; email: string; firstName: string; lastName: string } | null;
};

export class ReviewRepository extends BaseRepository {
  async findAll(filters: ReviewFiltersInput): Promise<PaginatedResult<ReviewWithDetails>> {
    const { page = 1, limit = 25, sortBy = 'createdAt', sortOrder = 'desc', search, status, productId, rating, verified, dateFrom, dateTo } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.ReviewWhereInput = {
      ...(status && { status }),
      ...(productId && { productId }),
      ...(rating && { rating }),
      ...(verified !== undefined && { verified }),
      ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
      ...(search ? {
        OR: [
          { authorName: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    };

    const orderBy: Prisma.ReviewOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.db.review.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy,
        skip,
        take,
      }),
      this.db.review.count({ where }),
    ]);

    return this.paginate(data as ReviewWithDetails[], total, page, limit);
  }

  async findById(id: string): Promise<ReviewWithDetails | null> {
    return this.db.review.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    }) as Promise<ReviewWithDetails | null>;
  }

  async updateStatus(id: string, status: ReviewStatus): Promise<void> {
    await this.db.review.update({ where: { id }, data: { status } });
  }

  async addReply(id: string, reply: string, adminId: string): Promise<void> {
    await this.db.review.update({
      where: { id },
      data: { reply, repliedAt: new Date() },
    });
    void adminId; // stored for audit — Phase 5 will persist this
  }

  async bulkUpdateStatus(ids: string[], status: ReviewStatus): Promise<number> {
    const result = await this.db.review.updateMany({ where: { id: { in: ids } }, data: { status } });
    return result.count;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await this.db.review.deleteMany({ where: { id: { in: ids } } });
    return result.count;
  }

  async getAnalytics() {
    const [total, pending, approved, rejected, hidden, avgRating, ratingDist, recentByDay] = await Promise.all([
      this.db.review.count(),
      this.db.review.count({ where: { status: 'PENDING' } }),
      this.db.review.count({ where: { status: 'APPROVED' } }),
      this.db.review.count({ where: { status: 'REJECTED' } }),
      this.db.review.count({ where: { status: 'HIDDEN' } }),
      this.db.review.aggregate({ _avg: { rating: true } }),
      this.db.review.groupBy({ by: ['rating'], _count: { id: true }, orderBy: { rating: 'asc' } }),
      this.db.review.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      total, pending, approved, rejected, hidden,
      avgRating: avgRating._avg.rating ?? 0,
      ratingDistribution: ratingDist.map((r) => ({ rating: r.rating, count: r._count.id })),
      recentByDay,
    };
  }

  async getTopProductsByReviews(limit = 10) {
    return this.db.review.groupBy({
      by: ['productId'],
      _count: { id: true },
      _avg: { rating: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
  }
}

export const reviewRepository = new ReviewRepository();

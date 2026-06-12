// ============================================================
// BLENDIFY — Newsletter Repository
// ============================================================
import { NewsletterSubscriber } from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
  PaginationParams,
} from './base.repository';

export class NewsletterRepository extends BaseRepository {
  async subscribe(data: {
    email: string;
    userId?: string;
    firstName?: string;
    source?: string;
    tags?: string[];
  }): Promise<NewsletterSubscriber> {
    return this.db.newsletterSubscriber.upsert({
      where: { email: data.email },
      update: {
        isActive: true,
        firstName: data.firstName,
        userId: data.userId,
        tags: data.tags,
        unsubscribedAt: null,
      },
      create: {
        email: data.email,
        userId: data.userId,
        firstName: data.firstName,
        source: data.source ?? 'website',
        tags: data.tags ?? [],
        confirmedAt: new Date(),
        isActive: true,
      },
    });
  }

  async unsubscribe(email: string): Promise<NewsletterSubscriber> {
    return this.db.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
  }

  async findByEmail(email: string): Promise<NewsletterSubscriber | null> {
    return this.db.newsletterSubscriber.findUnique({ where: { email } });
  }

  async findActiveSubscribers(
    pagination: PaginationParams = {},
    tags?: string[],
  ): Promise<PaginatedResult<NewsletterSubscriber>> {
    const { page = 1, limit = 100 } = pagination;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where = {
      isActive: true,
      ...(tags && tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.newsletterSubscriber.count({ where }),
    ]);

    return this.paginate(data, total, page, limit);
  }

  async getStats() {
    const [total, active, unsubscribed] = await Promise.all([
      this.db.newsletterSubscriber.count(),
      this.db.newsletterSubscriber.count({ where: { isActive: true } }),
      this.db.newsletterSubscriber.count({ where: { isActive: false } }),
    ]);

    const bySource = await this.db.newsletterSubscriber.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { isActive: true },
    });

    return { total, active, unsubscribed, bySource };
  }
}

export const newsletterRepository = new NewsletterRepository();

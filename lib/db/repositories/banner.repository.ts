// ============================================================
// BLENDIFY — Homepage Banner Repository
// ============================================================
import { Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';
import type { BannerFiltersSchema } from '@/lib/validations/admin.schemas';
import type { z } from 'zod';

type BannerFiltersInput = z.infer<typeof BannerFiltersSchema>;

export class BannerRepository extends BaseRepository {
  async findAll(filters: BannerFiltersInput): Promise<PaginatedResult<{
    id: string; title: string; subtitle: string | null; imageUrl: string;
    mobileImageUrl: string | null; ctaText: string | null; ctaUrl: string | null;
    badge: string | null; textPosition: string; textColor: string; overlayOpacity: number;
    isActive: boolean; sortOrder: number; startsAt: Date | null; endsAt: Date | null;
    createdAt: Date; updatedAt: Date;
  }>> {
    const { page = 1, limit = 25, search, isActive } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.HomepageBannerWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { subtitle: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.homepageBanner.findMany({ where, orderBy: { sortOrder: 'asc' }, skip, take }),
      this.db.homepageBanner.count({ where }),
    ]);

    const mapped = data.map((b) => ({ ...b, overlayOpacity: Number(b.overlayOpacity) }));
    return this.paginate(mapped, total, page, limit);
  }

  async findById(id: string) {
    const b = await this.db.homepageBanner.findUnique({ where: { id } });
    if (!b) return null;
    return { ...b, overlayOpacity: Number(b.overlayOpacity) };
  }

  async findActive() {
    const now = new Date();
    const data = await this.db.homepageBanner.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: 'asc' },
    });
    return data.map((b) => ({ ...b, overlayOpacity: Number(b.overlayOpacity) }));
  }

  async create(data: {
    title: string; subtitle?: string; description?: string; imageUrl: string;
    mobileImageUrl?: string; ctaText?: string; ctaUrl?: string; badge?: string;
    textPosition: string; textColor: string; overlayOpacity: number;
    isActive: boolean; sortOrder: number; startsAt?: Date; endsAt?: Date; createdById?: string;
  }) {
    return this.db.homepageBanner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        mobileImageUrl: data.mobileImageUrl ?? null,
        ctaText: data.ctaText ?? null,
        ctaUrl: data.ctaUrl ?? null,
        badge: data.badge ?? null,
        textPosition: data.textPosition,
        textColor: data.textColor,
        overlayOpacity: data.overlayOpacity,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        createdById: data.createdById ?? null,
      },
    });
  }

  async update(id: string, data: Parameters<typeof this.create>[0] & { updatedById?: string }) {
    return this.db.homepageBanner.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        mobileImageUrl: data.mobileImageUrl ?? null,
        ctaText: data.ctaText ?? null,
        ctaUrl: data.ctaUrl ?? null,
        badge: data.badge ?? null,
        textPosition: data.textPosition,
        textColor: data.textColor,
        overlayOpacity: data.overlayOpacity,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        updatedById: data.updatedById ?? null,
      },
    });
  }

  async delete(id: string) {
    await this.db.homepageBanner.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    const updates = ids.map((id, index) =>
      this.db.homepageBanner.update({ where: { id }, data: { sortOrder: index } })
    );
    return this.db.$transaction(updates);
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.db.homepageBanner.update({ where: { id }, data: { isActive } });
  }
}

export const bannerRepository = new BannerRepository();

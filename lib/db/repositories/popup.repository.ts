// ============================================================
// BLENDIFY — Popup Campaign Repository
// ============================================================
import { Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';
import type { PopupFiltersSchema } from '@/lib/validations/admin.schemas';
import type { z } from 'zod';

type PopupFiltersInput = z.infer<typeof PopupFiltersSchema>;

export class PopupRepository extends BaseRepository {
  async findAll(filters: PopupFiltersInput): Promise<PaginatedResult<{
    id: string; name: string; title: string; body: string; imageUrl: string | null;
    ctaText: string | null; ctaUrl: string | null; triggerType: string; triggerValue: number;
    targetAudience: string; targetPages: string[]; showFrequency: string;
    isActive: boolean; startsAt: Date | null; endsAt: Date | null;
    impressions: number; conversions: number;
    conversionRate: number; createdAt: Date; updatedAt: Date;
  }>> {
    const { page = 1, limit = 25, sortOrder = 'desc', search, isActive, triggerType, targetAudience } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.PopupCampaignWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(triggerType && { triggerType }),
      ...(targetAudience && { targetAudience }),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.popupCampaign.findMany({ where, orderBy: { createdAt: sortOrder }, skip, take }),
      this.db.popupCampaign.count({ where }),
    ]);

    const mapped = data.map((p) => ({
      ...p,
      conversionRate: p.impressions > 0 ? (p.conversions / p.impressions) * 100 : 0,
    }));

    return this.paginate(mapped, total, page, limit);
  }

  async findById(id: string) {
    const p = await this.db.popupCampaign.findUnique({ where: { id } });
    if (!p) return null;
    return { ...p, conversionRate: p.impressions > 0 ? (p.conversions / p.impressions) * 100 : 0 };
  }

  async findActive() {
    const now = new Date();
    return this.db.popupCampaign.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
    });
  }

  async create(data: {
    name: string; title: string; body: string; imageUrl?: string;
    ctaText?: string; ctaUrl?: string; triggerType: string; triggerValue: number;
    targetAudience: string; targetPages: string[]; showFrequency: string;
    isActive: boolean; startsAt?: Date; endsAt?: Date; createdById?: string;
  }) {
    return this.db.popupCampaign.create({
      data: {
        name: data.name,
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl ?? null,
        ctaText: data.ctaText ?? null,
        ctaUrl: data.ctaUrl ?? null,
        triggerType: data.triggerType,
        triggerValue: data.triggerValue,
        targetAudience: data.targetAudience,
        targetPages: data.targetPages,
        showFrequency: data.showFrequency,
        isActive: data.isActive,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        createdById: data.createdById ?? null,
      },
    });
  }

  async update(id: string, data: Partial<Parameters<typeof this.create>[0]> & { updatedById?: string }) {
    return this.db.popupCampaign.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.db.popupCampaign.delete({ where: { id } });
  }

  async incrementImpression(id: string) {
    await this.db.popupCampaign.update({ where: { id }, data: { impressions: { increment: 1 } } });
  }

  async incrementConversion(id: string) {
    await this.db.popupCampaign.update({ where: { id }, data: { conversions: { increment: 1 } } });
  }

  async getAnalytics() {
    const [total, active, totalImpressions, totalConversions] = await Promise.all([
      this.db.popupCampaign.count(),
      this.db.popupCampaign.count({ where: { isActive: true } }),
      this.db.popupCampaign.aggregate({ _sum: { impressions: true } }),
      this.db.popupCampaign.aggregate({ _sum: { conversions: true } }),
    ]);

    const imp = totalImpressions._sum.impressions ?? 0;
    const conv = totalConversions._sum.conversions ?? 0;

    return {
      total, active,
      totalImpressions: imp,
      totalConversions: conv,
      overallConversionRate: imp > 0 ? (conv / imp) * 100 : 0,
    };
  }
}

export const popupRepository = new PopupRepository();

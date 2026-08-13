// ============================================================
// BLENDIFY — Loyalty Config Repository
// ============================================================
import { LoyaltyTier } from '@prisma/client';
import { BaseRepository } from './base.repository';
import type { LoyaltyConfigInput, LoyaltyFiltersSchema, ManualPointsAdjustInput } from '@/lib/validations/admin.schemas';
import type { z } from 'zod';

type LoyaltyFiltersInput = z.infer<typeof LoyaltyFiltersSchema>;

export class LoyaltyConfigRepository extends BaseRepository {
  async findAll() {
    return this.db.loyaltyConfig.findMany({ orderBy: { tier: 'asc' } });
  }

  async findByTier(tier: LoyaltyTier) {
    return this.db.loyaltyConfig.findUnique({ where: { tier } });
  }

  async upsert(data: LoyaltyConfigInput & { updatedById?: string }) {
    return this.db.loyaltyConfig.upsert({
      where: { tier: data.tier },
      create: {
        tier: data.tier,
        minPoints: data.minPoints,
        pointsPerRupee: data.pointsPerRupee,
        bonusMultiplier: data.bonusMultiplier,
        birthdayBonus: data.birthdayBonus ?? 0,
        perks: data.perks ?? [],
        isActive: data.isActive ?? true,
        updatedById: data.updatedById ?? null,
      },
      update: {
        minPoints: data.minPoints,
        pointsPerRupee: data.pointsPerRupee,
        bonusMultiplier: data.bonusMultiplier,
        birthdayBonus: data.birthdayBonus ?? 0,
        perks: data.perks ?? [],
        isActive: data.isActive ?? true,
        updatedById: data.updatedById ?? null,
      },
    });
  }

  async getTransactions(filters: LoyaltyFiltersInput) {
    const { page = 1, limit = 25, sortOrder = 'desc', userId, type, dateFrom, dateTo } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where = {
      ...(userId && { userId }),
      ...(type && { type }),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.loyaltyTransaction.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, loyaltyTier: true, loyaltyPoints: true } },
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take,
      }),
      this.db.loyaltyTransaction.count({ where }),
    ]);

    return this.paginate(data, total, page, limit);
  }

  async manualAdjust(input: ManualPointsAdjustInput) {
    const user = await this.db.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new Error('User not found');

    const newBalance = user.loyaltyPoints + input.points;
    if (newBalance < 0) throw new Error('Insufficient loyalty points');

    // Determine new tier
    const configs = await this.findAll();
    let newTier: LoyaltyTier = 'BRONZE';
    for (const config of configs.sort((a, b) => b.minPoints - a.minPoints)) {
      if (newBalance >= config.minPoints) { newTier = config.tier; break; }
    }

    return this.db.$transaction([
      this.db.loyaltyTransaction.create({
        data: {
          userId: input.userId,
          type: input.type as 'ADJUSTED' | 'EARNED_BONUS' | 'EXPIRED',
          points: input.points,
          balance: newBalance,
          description: input.description,
        },
      }),
      this.db.user.update({
        where: { id: input.userId },
        data: { loyaltyPoints: newBalance, loyaltyTier: newTier },
      }),
    ]);
  }

  async getAnalytics() {
    const [totalTransactions, totalEarned, totalRedeemed, byTier, recentActivity] = await Promise.all([
      this.db.loyaltyTransaction.count(),
      this.db.loyaltyTransaction.aggregate({
        _sum: { points: true },
        where: { points: { gt: 0 } },
      }),
      this.db.loyaltyTransaction.aggregate({
        _sum: { points: true },
        where: { points: { lt: 0 } },
      }),
      this.db.user.groupBy({
        by: ['loyaltyTier'],
        _count: { id: true },
        _sum: { loyaltyPoints: true },
      }),
      this.db.loyaltyTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    return {
      totalTransactions,
      totalEarned: totalEarned._sum.points ?? 0,
      totalRedeemed: Math.abs(totalRedeemed._sum.points ?? 0),
      byTier,
      recentActivity,
    };
  }
}

export const loyaltyConfigRepository = new LoyaltyConfigRepository();

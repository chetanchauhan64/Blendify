// ============================================================
// BLENDIFY — Referral Repository
// ============================================================
import { BaseRepository } from './base.repository';
import type { ReferralConfigInput } from '@/lib/validations/admin.schemas';

export class ReferralRepository extends BaseRepository {
  async getConfig() {
    return this.db.referralConfig.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  async upsertConfig(data: ReferralConfigInput & { updatedById?: string }) {
    const existing = await this.getConfig();
    if (existing) {
      return this.db.referralConfig.update({
        where: { id: existing.id },
        data: { ...data, updatedById: data.updatedById ?? null },
      });
    }
    return this.db.referralConfig.create({
      data: { ...data, updatedById: data.updatedById ?? null },
    });
  }

  async getLeaderboard(limit = 20) {
    return this.db.user.findMany({
      where: { referrals: { some: {} } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        referralCode: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { referrals: { _count: 'desc' } },
      take: limit,
    });
  }

  async getStats() {
    const [totalReferrers, totalReferrals, recentReferrals] = await Promise.all([
      this.db.user.count({ where: { referrals: { some: {} } } }),
      this.db.user.count({ where: { referredById: { not: null } } }),
      this.db.user.findMany({
        where: {
          referredById: { not: null },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          referredBy: { select: { firstName: true, lastName: true, email: true, referralCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Conversions = referred users who placed at least one order
    const conversions = await this.db.user.count({
      where: {
        referredById: { not: null },
        orders: { some: {} },
      },
    });

    return {
      totalReferrers,
      totalReferrals,
      conversions,
      conversionRate: totalReferrals > 0 ? (conversions / totalReferrals) * 100 : 0,
      recentReferrals,
    };
  }

  async getAnalytics() {
    const stats = await this.getStats();

    const byMonth = await this.db.user.groupBy({
      by: ['createdAt'],
      where: { referredById: { not: null } },
      _count: { id: true },
    });

    return { ...stats, byMonth };
  }
}

export const referralRepository = new ReferralRepository();

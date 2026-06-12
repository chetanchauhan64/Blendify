// ============================================================
// BLENDIFY — Coupon Repository
// ============================================================
import { Coupon, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class CouponRepository extends BaseRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    return this.db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
  }

  async findValid(
    code: string,
    userId: string,
  ): Promise<{
    valid: boolean;
    error: string | null;
    coupon: Coupon | null;
  }> {
    const coupon = await this.findByCode(code);
    if (!coupon)
      return { valid: false, error: 'Coupon not found', coupon: null };

    const now = new Date();

    if (!coupon.isActive)
      return { valid: false, error: 'Coupon is not active', coupon: null };
    if (coupon.startsAt && coupon.startsAt > now)
      return { valid: false, error: 'Coupon not yet valid', coupon: null };
    if (coupon.expiresAt && coupon.expiresAt < now)
      return { valid: false, error: 'Coupon has expired', coupon: null };
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
      return {
        valid: false,
        error: 'Coupon usage limit reached',
        coupon: null,
      };

    const userUsage = await this.db.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsage >= coupon.maxUsesPerUser)
      return {
        valid: false,
        error: 'You have already used this coupon',
        coupon: null,
      };

    return { valid: true, error: null, coupon };
  }

  async recordUsage(
    couponId: string,
    userId: string,
    orderId: string,
  ) {
    return this.db.$transaction([
      this.db.couponUsage.create({
        data: { couponId, userId, orderId },
      }),
      this.db.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
  }

  async create(data: Prisma.CouponCreateInput): Promise<Coupon> {
    return this.db.coupon.create({ data });
  }

  async findAll() {
    return this.db.coupon.findMany({
      include: { _count: { select: { usages: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const couponRepository = new CouponRepository();

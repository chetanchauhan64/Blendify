// ============================================================
// BLENDIFY — User Repository
// ============================================================
import { Prisma, UserRole, LoyaltyTier } from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
  PaginationParams,
} from './base.repository';

// ── Filter Type ─────────────────────────────────────────────

export type UserFilters = {
  role?: UserRole;
  search?: string;
  isActive?: boolean;
};

// ── Select Shape ────────────────────────────────────────────

const USER_LIST_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  loyaltyPoints: true,
  loyaltyTier: true,
  createdAt: true,
  lastLoginAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

export type UserListItem = Prisma.UserGetPayload<{
  select: typeof USER_LIST_SELECT;
}>;

// ── Repository Class ────────────────────────────────────────

export class UserRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: {
        addresses: { include: { country: true } },
        newsletter: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async findByReferralCode(code: string) {
    return this.db.user.findUnique({ where: { referralCode: code } });
  }

  async findMany(
    filters: UserFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<UserListItem>> {
    const { page = 1, limit = 20 } = pagination;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.UserWhereInput = {};
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: USER_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.user.count({ where }),
    ]);

    return this.paginate(users, total, page, limit);
  }

  async create(data: Prisma.UserCreateInput) {
    return this.db.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({ where: { id }, data });
  }

  async updateLastLogin(id: string) {
    return this.db.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateLoyaltyPoints(id: string, points: number) {
    return this.db.user.update({
      where: { id },
      data: { loyaltyPoints: { increment: points } },
    });
  }

  async updateLoyaltyTier(id: string, tier: LoyaltyTier) {
    return this.db.user.update({
      where: { id },
      data: { loyaltyTier: tier },
    });
  }

  async getStats() {
    const [total, active, customers, admins] = await Promise.all([
      this.db.user.count(),
      this.db.user.count({ where: { isActive: true } }),
      this.db.user.count({ where: { role: 'CUSTOMER' } }),
      this.db.user.count({ where: { role: 'ADMIN' } }),
    ]);
    return { total, active, customers, admins };
  }
}

export const userRepository = new UserRepository();

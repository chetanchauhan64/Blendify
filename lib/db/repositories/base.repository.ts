// ============================================================
// BLENDIFY — Base Repository
// All domain repositories extend this abstract base.
// ============================================================
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/db/prisma';

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type SortOrder = 'asc' | 'desc';

export abstract class BaseRepository {
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  protected paginate<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  protected getPaginationOffset(page = 1, limit = 20) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}

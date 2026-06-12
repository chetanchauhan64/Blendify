// ============================================================
// BLENDIFY — Inventory Repository
// ============================================================
import { InventoryAction, Prisma } from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
  PaginationParams,
} from './base.repository';

// ── Types ────────────────────────────────────────────────────

export type InventoryLogFilters = {
  productId?: string;
  variantId?: string;
  action?: InventoryAction;
  reference?: string;
};

const INVENTORY_LOG_INCLUDE = {
  product: { select: { name: true, slug: true } },
  variant: { select: { name: true, sku: true } },
} satisfies Prisma.InventoryLogInclude;

export type InventoryLogWithRelations = Prisma.InventoryLogGetPayload<{
  include: typeof INVENTORY_LOG_INCLUDE;
}>;

// ── Repository Class ────────────────────────────────────────

export class InventoryRepository extends BaseRepository {
  /**
   * Log an inventory movement and atomically update variant stock.
   */
  async logMovement(data: {
    productId: string;
    variantId: string;
    action: InventoryAction;
    quantity: number;
    reason?: string;
    reference?: string;
    performedById?: string;
  }) {
    const variant = await this.db.productVariant.findUniqueOrThrow({
      where: { id: data.variantId },
    });

    const previousStock = variant.stock;
    const currentStock = previousStock + data.quantity;

    if (currentStock < 0) {
      throw new Error(
        `Insufficient stock for variant ${data.variantId}. ` +
          `Available: ${previousStock}, Requested: ${Math.abs(data.quantity)}`,
      );
    }

    const [log] = await this.db.$transaction([
      this.db.inventoryLog.create({
        data: {
          productId: data.productId,
          variantId: data.variantId,
          action: data.action,
          quantity: data.quantity,
          previousStock,
          currentStock,
          reason: data.reason,
          reference: data.reference,
          performedById: data.performedById,
        },
      }),
      this.db.productVariant.update({
        where: { id: data.variantId },
        data: { stock: currentStock },
      }),
    ]);

    return log;
  }

  async getLogs(
    filters: InventoryLogFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<InventoryLogWithRelations>> {
    const { page = 1, limit = 50 } = pagination;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.InventoryLogWhereInput = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.variantId) where.variantId = filters.variantId;
    if (filters.action) where.action = filters.action;
    if (filters.reference) where.reference = filters.reference;

    const [logs, total] = await Promise.all([
      this.db.inventoryLog.findMany({
        where,
        include: INVENTORY_LOG_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.inventoryLog.count({ where }),
    ]);

    return this.paginate(logs, total, page, limit);
  }

  async getLowStockVariants(threshold = 10) {
    return this.db.productVariant.findMany({
      where: {
        isActive: true,
        stock: { lte: threshold },
      },
      include: {
        product: { select: { name: true, slug: true, status: true } },
      },
      orderBy: { stock: 'asc' },
    });
  }

  async getStockSummary(productId: string) {
    return this.db.productVariant.findMany({
      where: { productId },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

export const inventoryRepository = new InventoryRepository();

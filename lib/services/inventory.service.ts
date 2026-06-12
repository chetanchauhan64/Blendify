// ============================================================
// BLENDIFY — Inventory Service
// Manages stock movements with full audit trail.
// ============================================================
import { inventoryRepository } from '@/lib/db/repositories';
import type { InventoryLogFilters } from '@/lib/db/repositories';
import { InventoryUpdateSchema } from '@/lib/validations/schemas';
import type { InventoryUpdateInput } from '@/lib/validations/schemas';
import prisma from '@/lib/db/prisma';

export class InventoryService {
  async adjustStock(
    productId: string,
    rawData: InventoryUpdateInput,
    adminId?: string,
  ) {
    const data = InventoryUpdateSchema.parse(rawData);
    return inventoryRepository.logMovement({
      productId,
      variantId: data.variantId,
      action: data.action,
      quantity: data.quantity,
      reason: data.reason,
      reference: data.reference,
      performedById: adminId,
    });
  }

  async getStockLogs(
    filters: InventoryLogFilters,
    pagination?: { page?: number; limit?: number },
  ) {
    return inventoryRepository.getLogs(filters, pagination);
  }

  async getLowStockAlerts(threshold = 10) {
    return inventoryRepository.getLowStockVariants(threshold);
  }

  async getProductStock(productId: string) {
    return inventoryRepository.getStockSummary(productId);
  }

  /**
   * Bulk set initial stock for a new product (runs on seed/import).
   */
  async initializeStock(
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
    }>,
    adminId?: string,
  ) {
    const results = [];
    for (const item of items) {
      const result = await inventoryRepository.logMovement({
        ...item,
        action: 'INITIAL_STOCK',
        reason: 'Initial stock setup',
        performedById: adminId,
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Get real-time stock status for a variant.
   */
  async getVariantStock(variantId: string) {
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variantId },
      select: { stock: true, lowStockThreshold: true, isActive: true },
    });
    return {
      stock: variant.stock,
      isAvailable: variant.isActive && variant.stock > 0,
      isLowStock:
        variant.stock <= variant.lowStockThreshold && variant.stock > 0,
      isOutOfStock: variant.stock === 0,
    };
  }
}

export const inventoryService = new InventoryService();

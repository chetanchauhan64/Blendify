// ============================================================
// BLENDIFY — Flash Sale Service
// ============================================================
import { flashSaleRepository } from '@/lib/db/repositories';
import {
  CreateFlashSaleSchema,
  UpdateFlashSaleSchema,
  FlashSaleFiltersSchema,
} from '@/lib/validations/admin.schemas';

export class FlashSaleService {
  async list(rawFilters: unknown) {
    const filters = FlashSaleFiltersSchema.parse(rawFilters);
    return flashSaleRepository.findAll(filters);
  }

  async getById(id: string) {
    const sale = await flashSaleRepository.findById(id);
    if (!sale) throw new Error('Flash sale not found');
    return sale;
  }

  async create(rawData: unknown, createdById: string) {
    const data = CreateFlashSaleSchema.parse(rawData);
    return flashSaleRepository.create(data, createdById);
  }

  async update(id: string, rawData: unknown, updatedById: string) {
    const data = UpdateFlashSaleSchema.parse(rawData);
    const existing = await flashSaleRepository.findById(id);
    if (!existing) throw new Error('Flash sale not found');
    return flashSaleRepository.update(id, data, updatedById);
  }

  async delete(id: string) {
    await flashSaleRepository.delete(id);
  }

  async toggleActive(id: string, isActive: boolean) {
    return flashSaleRepository.toggleActive(id, isActive);
  }
}

export const flashSaleService = new FlashSaleService();

// ============================================================
// BLENDIFY — Discount Service
// ============================================================
import { discountRepository } from '@/lib/db/repositories';
import { CreateDiscountRuleSchema, UpdateDiscountRuleSchema, DiscountFiltersSchema } from '@/lib/validations/admin.schemas';

export class DiscountService {
  async list(rawFilters: unknown) {
    const filters = DiscountFiltersSchema.parse(rawFilters);
    return discountRepository.findAll(filters);
  }

  async getById(id: string) {
    const rule = await discountRepository.findById(id);
    if (!rule) throw new Error('Discount rule not found');
    return rule;
  }

  async create(rawData: unknown, createdById: string) {
    const data = CreateDiscountRuleSchema.parse(rawData);
    return discountRepository.create({ ...data, createdById });
  }

  async update(id: string, rawData: unknown, updatedById: string) {
    const data = UpdateDiscountRuleSchema.parse(rawData);
    const existing = await discountRepository.findById(id);
    if (!existing) throw new Error('Discount rule not found');
    return discountRepository.update(id, { ...data, updatedById });
  }

  async delete(id: string) {
    await discountRepository.delete(id);
  }

  async toggleActive(id: string, isActive: boolean) {
    return discountRepository.toggleActive(id, isActive);
  }

  async getActive() {
    return discountRepository.findActive();
  }
}

export const discountService = new DiscountService();

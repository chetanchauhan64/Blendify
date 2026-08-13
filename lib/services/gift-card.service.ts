// ============================================================
// BLENDIFY — Gift Card Service
// ============================================================
import { giftCardRepository } from '@/lib/db/repositories';
import {
  CreateGiftCardSchema,
  UpdateGiftCardSchema,
  GiftCardFiltersSchema,
} from '@/lib/validations/admin.schemas';

export class GiftCardService {
  async list(rawFilters: unknown) {
    const filters = GiftCardFiltersSchema.parse(rawFilters);
    return giftCardRepository.findAll(filters);
  }

  async getById(id: string) {
    const gc = await giftCardRepository.findById(id);
    if (!gc) throw new Error('Gift card not found');
    return gc;
  }

  async create(rawData: unknown, createdById: string) {
    const data = CreateGiftCardSchema.parse(rawData);
    const { quantity = 1, code, ...rest } = data;

    if (quantity > 1) {
      // Bulk generation
      await giftCardRepository.createBulk(quantity, { ...rest, createdById });
      return { created: quantity };
    }

    return giftCardRepository.create({ ...rest, code, createdById });
  }

  async update(id: string, rawData: unknown) {
    const data = UpdateGiftCardSchema.parse(rawData);
    const existing = await giftCardRepository.findById(id);
    if (!existing) throw new Error('Gift card not found');
    return giftCardRepository.update(id, data);
  }

  async getStats() {
    return giftCardRepository.getStats();
  }

  async validateCode(code: string) {
    const gc = await giftCardRepository.findByCode(code);
    if (!gc) return { valid: false, error: 'Gift card not found', giftCard: null };
    if (!gc.isActive) return { valid: false, error: 'Gift card is inactive', giftCard: null };
    if (gc.expiresAt && gc.expiresAt < new Date()) return { valid: false, error: 'Gift card has expired', giftCard: null };
    if (Number(gc.balance) <= 0) return { valid: false, error: 'Gift card has no remaining balance', giftCard: null };
    return { valid: true, error: null, giftCard: gc };
  }
}

export const giftCardService = new GiftCardService();

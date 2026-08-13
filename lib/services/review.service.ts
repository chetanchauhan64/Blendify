// ============================================================
// BLENDIFY — Review Service
// ============================================================
import { reviewRepository } from '@/lib/db/repositories';
import {
  ReviewFiltersSchema,
  UpdateReviewSchema,
  BulkReviewActionSchema,
} from '@/lib/validations/admin.schemas';
import type {
  ReviewFiltersInput,
  UpdateReviewInput,
} from '@/lib/validations/admin.schemas';

export class ReviewService {
  async list(rawFilters: unknown) {
    const filters = ReviewFiltersSchema.parse(rawFilters);
    return reviewRepository.findAll(filters);
  }

  async getById(id: string) {
    const review = await reviewRepository.findById(id);
    if (!review) throw new Error('Review not found');
    return review;
  }

  async update(id: string, rawData: unknown, adminId: string) {
    const data = UpdateReviewSchema.parse(rawData) as UpdateReviewInput;
    const review = await reviewRepository.findById(id);
    if (!review) throw new Error('Review not found');

    if (data.status) {
      await reviewRepository.updateStatus(id, data.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN');
    }
    if (data.reply !== undefined) {
      await reviewRepository.addReply(id, data.reply, adminId);
    }

    return reviewRepository.findById(id);
  }

  async bulkAction(rawData: unknown) {
    const data = BulkReviewActionSchema.parse(rawData);
    if (data.action === 'delete') {
      const count = await reviewRepository.bulkDelete(data.ids);
      return { affected: count, action: 'delete' };
    }
    const statusMap = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      hide: 'HIDDEN',
    } as const;
    const status = statusMap[data.action];
    const count = await reviewRepository.bulkUpdateStatus(data.ids, status as 'APPROVED' | 'REJECTED' | 'HIDDEN');
    return { affected: count, action: data.action };
  }

  async getAnalytics() {
    return reviewRepository.getAnalytics();
  }
}

export const reviewService = new ReviewService();

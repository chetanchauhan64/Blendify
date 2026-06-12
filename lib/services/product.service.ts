// ============================================================
// BLENDIFY — Product Service
// Business logic layer — sits between API routes & repositories.
// ============================================================
import { productRepository } from '@/lib/db/repositories';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductFiltersSchema,
} from '@/lib/validations/schemas';
import type {
  CreateProductInput,
  UpdateProductInput,
} from '@/lib/validations/schemas';
import type { PaginationParams } from '@/lib/db/repositories';
import type { ProductSortField } from '@/lib/db/repositories';

export class ProductService {
  async getProduct(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw new Error(`Product not found: ${slug}`);
    return product;
  }

  async listProducts(
    rawFilters: unknown,
    sort?: { field: ProductSortField; order: 'asc' | 'desc' },
    pagination?: PaginationParams,
  ) {
    const filters = ProductFiltersSchema.parse(rawFilters);
    return productRepository.findMany(filters, sort, pagination);
  }

  async getBestSellers(limit?: number) {
    return productRepository.findBestSellers(limit);
  }

  async getNewArrivals(limit?: number) {
    return productRepository.findNewArrivals(limit);
  }

  async getFeatured(limit?: number) {
    return productRepository.findFeatured(limit);
  }

  async getCollectionProducts(collectionSlug: string, limit?: number) {
    return productRepository.findByCollection(collectionSlug, limit);
  }

  async search(query: string, limit?: number) {
    if (!query.trim()) return [];
    return productRepository.search(query.trim(), limit);
  }

  async createProduct(rawData: CreateProductInput) {
    const data = CreateProductSchema.parse(rawData);
    const { variants, flavorNotes, collectionIds, ...productData } = data;

    return productRepository.create({
      ...productData,
      variants: { create: variants },
      flavorNotes: { create: flavorNotes },
      collections: {
        create: collectionIds.map((collectionId, i) => ({
          collectionId,
          sortOrder: i,
        })),
      },
    });
  }

  async updateProduct(id: string, rawData: UpdateProductInput) {
    const data = UpdateProductSchema.parse(rawData);
    // Strip create-only fields; nested relations are managed separately
    const {
      variants: _variants,
      flavorNotes: _notes,
      collectionIds: _cols,
      ...updateData
    } = data;
    void _variants;
    void _notes;
    void _cols;
    return productRepository.update(id, updateData);
  }

  async publishProduct(id: string) {
    return productRepository.updateStatus(id, 'ACTIVE');
  }

  async archiveProduct(id: string) {
    return productRepository.updateStatus(id, 'ARCHIVED');
  }

  computeRating(product: { reviews: { rating: number }[] }) {
    if (!product.reviews.length) return { rating: 0, count: 0 };
    const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      rating: Math.round((sum / product.reviews.length) * 10) / 10,
      count: product.reviews.length,
    };
  }
}

export const productService = new ProductService();

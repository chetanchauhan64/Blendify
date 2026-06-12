// ============================================================
// BLENDIFY — Order Service
// Handles order creation, status transitions, and pricing.
// ============================================================
import { orderRepository, couponRepository } from '@/lib/db/repositories';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
} from '@/lib/validations/schemas';
import type { CreateOrderInput } from '@/lib/validations/schemas';
import prisma from '@/lib/db/prisma';

export type OrderPricingResult = {
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  loyaltyDiscount: number;
  total: number;
};

export class OrderService {
  /**
   * Calculate order totals server-side. Never trust the client.
   */
  async calculatePricing(
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      isSubscription?: boolean;
    }>,
    options: {
      couponCode?: string;
      loyaltyPointsToUse?: number;
      countryId?: string;
      userId?: string;
    } = {},
  ): Promise<OrderPricingResult> {
    const variantIds = items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    for (const item of items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) throw new Error(`Variant not found: ${item.variantId}`);

      const price =
        item.isSubscription && variant.product.subscriptionPrice
          ? Number(variant.product.subscriptionPrice)
          : Number(variant.price);

      subtotal += price * item.quantity;
    }

    // Free shipping above ₹2499
    const shippingCost = subtotal >= 2499 ? 0 : 99;
    const tax = 0;

    let discount = 0;
    if (options.couponCode && options.userId) {
      const { valid, coupon } = await couponRepository.findValid(
        options.couponCode,
        options.userId,
      );
      if (valid && coupon) {
        if (coupon.type === 'PERCENTAGE') {
          discount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, Number(coupon.maxDiscountAmount));
          }
        } else if (coupon.type === 'FIXED_AMOUNT') {
          discount = Number(coupon.value);
        } else if (coupon.type === 'FREE_SHIPPING') {
          discount = shippingCost;
        }
      }
    }

    const loyaltyDiscount = (options.loyaltyPointsToUse ?? 0) * 0.5;
    const total = Math.max(
      0,
      subtotal + shippingCost + tax - discount - loyaltyDiscount,
    );

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      loyaltyDiscount: Math.round(loyaltyDiscount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Create an order with atomic inventory deduction.
   */
  async createOrder(userId: string, rawData: CreateOrderInput) {
    const data = CreateOrderSchema.parse(rawData);
    const pricing = await this.calculatePricing(data.items, {
      couponCode: data.couponCode,
      loyaltyPointsToUse: data.loyaltyPointsToUse,
      userId,
    });

    const orderNumber = await orderRepository.generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      // 1. Validate stock and deduct atomically
      for (const item of data.items) {
        const variant = await tx.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
        });
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${variant.name}`);
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 2. Fetch variant details for line items
      const variantIds = data.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });
      const vMap = new Map(variants.map((v) => [v.id, v]));

      // 3. Create the order
      return tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          shippingAddressId: data.shippingAddressId,
          billingAddressId:
            data.billingAddressId ?? data.shippingAddressId,
          currencyCode: data.currencyCode,
          subtotal: pricing.subtotal,
          shippingCost: pricing.shippingCost,
          tax: pricing.tax,
          discount: pricing.discount,
          loyaltyDiscount: pricing.loyaltyDiscount,
          total: pricing.total,
          loyaltyPointsUsed: data.loyaltyPointsToUse,
          loyaltyPointsEarned: Math.floor(pricing.total / 10),
          notes: data.notes,
          items: {
            create: data.items.map((item) => {
              const v = vMap.get(item.variantId);
              if (!v) throw new Error(`Variant missing: ${item.variantId}`);
              const price =
                item.isSubscription && v.product.subscriptionPrice
                  ? Number(v.product.subscriptionPrice)
                  : Number(v.price);
              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: v.product.name,
                variantName: v.name,
                sku: v.sku,
                quantity: item.quantity,
                unitPrice: price,
                totalPrice: price * item.quantity,
                isSubscription: item.isSubscription ?? false,
                subscriptionFrequency: item.subscriptionFrequency,
              };
            }),
          },
          timeline: {
            create: {
              status: 'PENDING',
              message: 'Order placed successfully.',
              isPublic: true,
            },
          },
        },
        include: { items: true, timeline: true },
      });
    });

    return order;
  }

  async getOrder(id: string, userId?: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw new Error('Order not found');
    if (userId && order.userId !== userId) throw new Error('Access denied');
    return order;
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async getUserOrders(
    userId: string,
    pagination?: { page?: number; limit?: number },
  ) {
    return orderRepository.findByUserId(userId, pagination);
  }

  async updateStatus(orderId: string, rawData: unknown) {
    const { status, message, isPublic } =
      UpdateOrderStatusSchema.parse(rawData);
    return orderRepository.updateStatus(orderId, status, message, isPublic);
  }

  async cancelOrder(
    orderId: string,
    reason: string,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const order = await this.getOrder(orderId, userId);

    const cancellableStatuses: string[] = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error('Order cannot be cancelled at this stage');
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        // Get current stock before restore
        const variant = await tx.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
          select: { stock: true },
        });
        const previousStock = variant.stock;
        const currentStock = previousStock + item.quantity;

        // Restore stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });

        // Log inventory restore
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            action: 'ORDER_CANCELLATION_RESTORE',
            quantity: item.quantity,
            previousStock,
            currentStock,
            reason: `Order cancelled: ${reason}`,
            reference: orderId,
          },
        });
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });

      // Add timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: 'CANCELLED',
          message: `Order cancelled: ${reason}`,
          isPublic: true,
        },
      });
    });

    return { success: true };
  }
}

export const orderService = new OrderService();

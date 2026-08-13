// GET POST /api/admin/bundles
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { parseSearchParams } from '@/lib/utils/api';
import { z } from 'zod';

const CreateBundleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  originalPrice: z.number().positive(),
  bundlePrice: z.number().positive(),
  savingsPercent: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  startsAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    quantity: z.number().int().positive().default(1),
    sortOrder: z.number().default(0),
  })).optional(),
});

export async function GET(req: Request) {
  await requireAdminAccess();
  const { page = '1', limit = '25', search, isActive } = parseSearchParams(req.url);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: Record<string, unknown> = {
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.bundle.findMany({
      where,
      include: { items: { include: { product: { select: { name: true } }, variant: { select: { name: true, weight: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.bundle.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: data.map((b: { originalPrice: unknown; bundlePrice: unknown; savingsPercent: unknown }) => ({
      ...b,
      originalPrice: Number(b.originalPrice),
      bundlePrice: Number(b.bundlePrice),
      savingsPercent: Number(b.savingsPercent),
    })),
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
}

export async function POST(req: Request) {
  await requireAdminAccess();
  try {
    const body = await req.json();
    const data = CreateBundleSchema.parse(body);
    const { items, ...bundleData } = data;

    const bundle = await prisma.bundle.create({
      data: {
        ...bundleData,
        items: items && items.length > 0 ? {
          create: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
            sortOrder: it.sortOrder,
          })),
        } : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...bundle,
        originalPrice: Number(bundle.originalPrice),
        bundlePrice: Number(bundle.bundlePrice),
        savingsPercent: Number(bundle.savingsPercent),
      },
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

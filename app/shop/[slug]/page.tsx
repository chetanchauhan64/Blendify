import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, PRODUCTS } from '@/lib/data/products';
import { ProductDetailClient } from './ProductDetailClient';

// ── Static params for all known products ──────────────────
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

// ── Dynamic metadata ──────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | BLENDIFY' };
  }

  return {
    title: `${product.name} | BLENDIFY`,
    description: product.description,
    openGraph: {
      title: `${product.name} | BLENDIFY`,
      description: product.description,
      images: [{ url: product.images[0], alt: product.name }],
    },
  };
}

// ── Page ──────────────────────────────────────────────────
export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product, 4);

  return <ProductDetailClient product={product} related={related} />;
}

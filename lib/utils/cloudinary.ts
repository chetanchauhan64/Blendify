// ============================================================
// BLENDIFY — Cloudinary Upload Helper
// Server-side signed upload + client upload URL generation
// ============================================================
import 'server-only';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured =
  !!CLOUD_NAME && !!API_KEY && !!API_SECRET &&
  !CLOUD_NAME.startsWith('REPLACE') &&
  !API_KEY.startsWith('REPLACE');

export type CloudinaryFolder = 'admin/banners' | 'admin/popups' | 'admin/announcements' | 'admin/campaigns' | 'products' | 'general';

/**
 * Generate a signed upload signature for direct browser-to-Cloudinary uploads.
 * This avoids sending large files through Next.js API routes.
 */
export async function generateUploadSignature(
  folder: CloudinaryFolder = 'general',
  overwrite = false,
): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  if (!isCloudinaryConfigured) {
    throw new Error('[Cloudinary] Environment variables not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number | boolean> = {
    folder,
    overwrite,
    timestamp,
  };

  // Build sorted parameter string for signature
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const stringToSign = `${sortedParams}${API_SECRET}`;
  const signature = await sha1(stringToSign);

  return {
    signature,
    timestamp,
    cloudName: CLOUD_NAME!,
    apiKey: API_KEY!,
    folder,
  };
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured) return;

  const timestamp = Math.round(Date.now() / 1000);
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(stringToSign);

  const formData = new URLSearchParams({
    public_id: publicId,
    signature,
    api_key: API_KEY!,
    timestamp: String(timestamp),
  });

  await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

/**
 * Extract the public ID from a Cloudinary URL.
 */
export function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\.[a-z]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Build a Cloudinary URL with transformations.
 */
export function buildCloudinaryUrl(
  publicId: string,
  transformations: { width?: number; height?: number; crop?: string; quality?: string | number } = {},
): string {
  if (!CLOUD_NAME) return publicId;
  const parts: string[] = [];
  if (transformations.width) parts.push(`w_${transformations.width}`);
  if (transformations.height) parts.push(`h_${transformations.height}`);
  if (transformations.crop) parts.push(`c_${transformations.crop}`);
  if (transformations.quality) parts.push(`q_${transformations.quality}`);
  const transform = parts.join(',');
  return transform
    ? `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${publicId}`
    : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
}

// ── SHA-1 (Web Crypto API — available in Node.js 20+) ────────
async function sha1(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

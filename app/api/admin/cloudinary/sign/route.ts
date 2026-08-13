// ============================================================
// BLENDIFY — Cloudinary Sign Route
// GET /api/admin/cloudinary/sign?folder=...
// Returns signed upload credentials for direct browser upload
// ============================================================
import { withAdmin, ok, serverError } from '@/lib/utils/api';
import { generateUploadSignature, isCloudinaryConfigured } from '@/lib/utils/cloudinary';
import type { CloudinaryFolder } from '@/lib/utils/cloudinary';

const ALLOWED_FOLDERS: CloudinaryFolder[] = [
  'admin/banners',
  'admin/popups',
  'admin/announcements',
  'admin/campaigns',
  'products',
  'general',
];

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const folder = (searchParams.get('folder') ?? 'general') as CloudinaryFolder;

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return serverError(`Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(', ')}`);
  }

  if (!isCloudinaryConfigured) {
    // Return mock data for development so the UI doesn't break
    return ok({
      signature: 'dev_signature',
      timestamp: Math.round(Date.now() / 1000),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? 'dev-cloud',
      apiKey: process.env.CLOUDINARY_API_KEY ?? 'dev-key',
      folder,
      configured: false,
    });
  }

  const creds = await generateUploadSignature(folder);
  return ok({ ...creds, configured: true });
});

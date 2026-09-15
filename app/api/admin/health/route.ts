// ============================================================
// BLENDIFY — Admin API: Health & Metrics
// Admin-only. Reports real server metrics only.
// ============================================================
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { getIsDbConfigured } from '@/lib/db/prisma';

export async function GET() {
  try {
    await requireAdminAccess();

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: getIsDbConfigured() ? 'connected' : 'unconfigured',
          type: 'PostgreSQL',
        },
        storage: {
          status: process.env.CLOUDINARY_API_KEY ? 'configured' : 'unconfigured',
          provider: 'Cloudinary',
        },
        email: {
          status: process.env.RESEND_API_KEY ? 'configured' : 'unconfigured',
          provider: 'Resend',
        },
        payments: {
          status: process.env.RAZORPAY_KEY_ID ? 'configured' : 'unconfigured',
          gateway: 'Razorpay',
        },
      },
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(uptime),
        memoryMb: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
      },
    };

    return NextResponse.json({ success: true, data: health });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

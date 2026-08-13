// GET /api/admin/export/[module]
// Exports any module's data as CSV, Excel, or PDF
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { parseSearchParams } from '@/lib/utils/api';
import { generateCSV, generateExcelXML, generatePDFHtml, csvResponse, excelResponse, pdfHtmlResponse, formatDate, formatCurrency, formatDateTime } from '@/lib/utils/export';
import { prisma } from '@/lib/db/prisma';

const EXPORT_LIMIT = 5000;

export async function GET(req: Request, { params }: { params: Promise<{ module: string }> }) {
  await requireAdminAccess();
  const { module } = await params;
  const { format = 'csv' } = parseSearchParams(req.url);
  const now = new Date();

  let data: Record<string, unknown>[] = [];
  let columns: Array<{ header: string; key: string | ((row: Record<string, unknown>) => string | number | boolean | null) }> = [];
  let title = module;

  switch (module) {
    case 'reviews': {
      const rows = await prisma.review.findMany({
        include: { user: { select: { email: true } }, product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT,
      });
      data = rows.map((r) => ({ ...r, rating: r.rating, productName: r.product?.name ?? '', userEmail: r.user?.email ?? '' }));
      columns = [
        { header: 'Author', key: 'authorName' }, { header: 'Email', key: 'userEmail' },
        { header: 'Product', key: 'productName' }, { header: 'Rating', key: 'rating' },
        { header: 'Status', key: 'status' }, { header: 'Date', key: (r) => formatDate(r.createdAt as Date) },
      ];
      title = 'Reviews Export';
      break;
    }
    case 'coupons': {
      const rows = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows.map((r) => ({ ...r, discountValue: Number(r.value) }));
      columns = [
        { header: 'Code', key: 'code' }, { header: 'Type', key: 'type' },
        { header: 'Value', key: 'discountValue' }, { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' },
        { header: 'Used', key: 'usedCount' }, { header: 'Max Uses', key: (r) => String(r.maxUses ?? 'Unlimited') },
        { header: 'Expires', key: (r) => formatDate(r.expiresAt as Date | null) },
      ];
      title = 'Coupons Export';
      break;
    }
    case 'gift-cards': {
      const rows = await prisma.giftCard.findMany({ orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows.map((r) => ({ ...r, value: Number(r.value), balance: Number(r.balance) }));
      columns = [
        { header: 'Code', key: 'code' }, { header: 'Value', key: (r) => formatCurrency(r.value as number) },
        { header: 'Balance', key: (r) => formatCurrency(r.balance as number) }, { header: 'Issued To', key: (r) => String(r.issuedToEmail ?? '') },
        { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' }, { header: 'Expires', key: (r) => formatDate(r.expiresAt as Date | null) },
        { header: 'Created', key: (r) => formatDate(r.createdAt as Date) },
      ];
      title = 'Gift Cards Export';
      break;
    }
    case 'newsletter': {
      const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows as unknown as Record<string, unknown>[];
      columns = [
        { header: 'Email', key: 'email' }, { header: 'Name', key: (r) => `${r.firstName ?? ''}`.trim() },
        { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' }, { header: 'Tags', key: (r) => (r.tags as string[]).join(', ') },
        { header: 'Source', key: (r) => String(r.source ?? '') }, { header: 'Subscribed', key: (r) => formatDate(r.createdAt as Date) },
      ];
      title = 'Newsletter Subscribers';
      break;
    }
    case 'email-campaigns': {
      const rows = await prisma.emailCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows as unknown as Record<string, unknown>[];
      columns = [
        { header: 'Name', key: 'name' }, { header: 'Subject', key: 'subject' }, { header: 'Status', key: 'status' },
        { header: 'Sent', key: 'sentCount' }, { header: 'Opens', key: 'openCount' }, { header: 'Clicks', key: 'clickCount' },
        { header: 'Sent At', key: (r) => formatDateTime(r.sentAt as Date | null) },
      ];
      title = 'Email Campaigns Export';
      break;
    }
    case 'flash-sales': {
      const rows = await prisma.flashSale.findMany({ include: { _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows.map((r) => ({ ...r, discountValue: Number(r.discountValue), itemCount: r._count.items }));
      columns = [
        { header: 'Name', key: 'name' }, { header: 'Type', key: 'discountType' },
        { header: 'Value', key: 'discountValue' }, { header: 'Products', key: 'itemCount' },
        { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' },
        { header: 'Starts', key: (r) => formatDateTime(r.startsAt as Date) },
        { header: 'Ends', key: (r) => formatDateTime(r.endsAt as Date) },
      ];
      title = 'Flash Sales Export';
      break;
    }
    case 'discounts': {
      const rows = await prisma.discountRule.findMany({ orderBy: { priority: 'desc' }, take: EXPORT_LIMIT });
      data = rows.map((r) => ({ ...r, discountValue: Number(r.discountValue) }));
      columns = [
        { header: 'Name', key: 'name' }, { header: 'Type', key: 'triggerType' },
        { header: 'Discount Type', key: 'discountType' }, { header: 'Value', key: 'discountValue' },
        { header: 'Priority', key: 'priority' }, { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' },
      ];
      title = 'Discount Rules Export';
      break;
    }
    case 'bundles': {
      const rows = await prisma.bundle.findMany({ include: { _count: { select: { items: true } } }, orderBy: { sortOrder: 'asc' }, take: EXPORT_LIMIT });
      data = rows.map((r) => ({ ...r, originalPrice: Number(r.originalPrice), bundlePrice: Number(r.bundlePrice), itemCount: r._count.items }));
      columns = [
        { header: 'Name', key: 'name' }, { header: 'Slug', key: 'slug' },
        { header: 'Original (₹)', key: 'originalPrice' }, { header: 'Bundle (₹)', key: 'bundlePrice' },
        { header: 'Items', key: 'itemCount' }, { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' },
      ];
      title = 'Bundles Export';
      break;
    }
    case 'announcement-bars': {
      const rows = await prisma.announcementBar.findMany({ orderBy: { sortOrder: 'asc' }, take: EXPORT_LIMIT });
      data = rows as unknown as Record<string, unknown>[];
      columns = [
        { header: 'Message', key: 'message' }, { header: 'Link Text', key: (r) => String(r.linkText ?? '') },
        { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' }, { header: 'Order', key: 'sortOrder' },
      ];
      title = 'Announcement Bars Export';
      break;
    }
    case 'banners': {
      const rows = await prisma.homepageBanner.findMany({ orderBy: { sortOrder: 'asc' }, take: EXPORT_LIMIT });
      data = rows as unknown as Record<string, unknown>[];
      columns = [
        { header: 'Title', key: 'title' }, { header: 'Badge', key: (r) => String(r.badge ?? '') },
        { header: 'CTA', key: (r) => String(r.ctaText ?? '') }, { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' },
      ];
      title = 'Banners Export';
      break;
    }
    case 'popups': {
      const rows = await prisma.popupCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows as unknown as Record<string, unknown>[];
      columns = [
        { header: 'Name', key: 'name' }, { header: 'Title', key: 'title' },
        { header: 'Trigger', key: 'triggerType' }, { header: 'Audience', key: 'targetAudience' },
        { header: 'Active', key: (r) => r.isActive ? 'Yes' : 'No' },
      ];
      title = 'Popup Campaigns Export';
      break;
    }
    case 'push-notifications': {
      const rows = await prisma.pushNotificationRecord.findMany({ orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows as unknown as Record<string, unknown>[];
      columns = [
        { header: 'Title', key: 'title' }, { header: 'Body', key: 'body' },
        { header: 'Status', key: 'status' }, { header: 'Scheduled', key: (r) => formatDate(r.scheduledAt as Date | null) },
      ];
      title = 'Push Notifications Export';
      break;
    }
    case 'loyalty': {
      const rows = await prisma.loyaltyTransaction.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
      data = rows.map((r) => ({ ...r, userEmail: r.user?.email ?? '' }));
      columns = [
        { header: 'User Email', key: 'userEmail' }, { header: 'Type', key: 'type' },
        { header: 'Points', key: 'points' }, { header: 'Description', key: 'description' },
        { header: 'Date', key: (r) => formatDate(r.createdAt as Date) },
      ];
      title = 'Loyalty Transactions Export';
      break;
    }
    case 'referrals': {
      const rows = await prisma.user.findMany({
        where: { referrals: { some: {} } },
        select: { email: true, referralCode: true, loyaltyPoints: true, loyaltyTier: true, _count: { select: { referrals: true } } },
        orderBy: { referrals: { _count: 'desc' } },
        take: EXPORT_LIMIT,
      });
      data = rows.map((r) => ({ ...r, referralCount: r._count.referrals }));
      columns = [
        { header: 'Email', key: 'email' }, { header: 'Referral Code', key: (r) => String(r.referralCode ?? '') },
        { header: 'Referrals Count', key: 'referralCount' }, { header: 'Points', key: 'loyaltyPoints' },
        { header: 'Tier', key: 'loyaltyTier' },
      ];
      title = 'Referral Leaderboard Export';
      break;
    }
    default:
      return NextResponse.json({ success: false, error: `Unknown export module: ${module}` }, { status: 400 });
  }

  const filename = `${module}-${now.toISOString().slice(0, 10)}`;
  const typedCols = columns as Parameters<typeof generateCSV>[1];

  if (format === 'excel') {
    const xml = generateExcelXML(data, typedCols, title);
    return excelResponse(xml, filename);
  }
  if (format === 'pdf') {
    const html = generatePDFHtml(data, typedCols, title);
    return pdfHtmlResponse(html, filename);
  }
  if (format === 'print') {
    const html = generatePDFHtml(data, typedCols, title);
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  // Default: CSV
  const csv = generateCSV(data, typedCols);
  return csvResponse(csv, filename);
}

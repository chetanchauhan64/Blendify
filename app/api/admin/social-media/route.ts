// ============================================================
// BLENDIFY — Admin API: Social Media Links
// ============================================================
import { NextResponse } from 'next/server';
import { getSocialLinks, updateSocialLinks } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const social = await getSocialLinks();
    return NextResponse.json({ success: true, data: social });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateSocialLinks(body);
    return NextResponse.json({ success: true, data: updated, message: 'Social media links saved' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

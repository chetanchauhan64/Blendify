// ============================================================
// BLENDIFY — Admin API: Email Templates
// ============================================================
import { NextResponse } from 'next/server';
import { getEmailTemplates, updateEmailTemplate } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const templates = await getEmailTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updated = await updateEmailTemplate(id, data);
    return NextResponse.json({ success: true, data: updated, message: 'Email template updated' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

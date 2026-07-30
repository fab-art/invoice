import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const pharmacy = await db.pharmacy.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(pharmacy);
  } catch (error) {
    console.error('Pharmacy update error:', error);
    return NextResponse.json({ error: 'Failed to update pharmacy' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.pharmacy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pharmacy delete error:', error);
    return NextResponse.json({ error: 'Failed to delete pharmacy' }, { status: 500 });
  }
}

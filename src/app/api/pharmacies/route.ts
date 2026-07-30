import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {
      active: includeInactive ? undefined : true,
    };

    if (search) {
      where.OR = [
        { pharmacyName: { contains: search } },
        { pharmacyCode: { contains: search } },
        { district: { contains: search } },
      ];
    }

    const pharmacies = await db.pharmacy.findMany({
      where,
      orderBy: { pharmacyName: 'asc' },
      take: 20,
    });

    return NextResponse.json(pharmacies);
  } catch (error) {
    console.error('Pharmacies fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch pharmacies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pharmacyCode, pharmacyName, district, sector, contactPerson, phone, email } = body;

    if (!pharmacyCode || !pharmacyName || !district) {
      return NextResponse.json({ error: 'Code, name, and district are required' }, { status: 400 });
    }

    const pharmacy = await db.pharmacy.create({
      data: { pharmacyCode, pharmacyName, district, sector: sector || '', contactPerson: contactPerson || '', phone: phone || '', email: email || '' },
    });

    return NextResponse.json(pharmacy, { status: 201 });
  } catch (error: any) {
    console.error('Pharmacy create error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Pharmacy code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create pharmacy' }, { status: 500 });
  }
}

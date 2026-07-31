import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('Pharmacy')
      .select('*')
      .order('pharmacyName', { ascending: true })
      .limit(20);

    if (!includeInactive) {
      query = query.eq('active', true);
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(
        `pharmacyName.ilike.${term},pharmacyCode.ilike.${term},district.ilike.${term}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
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

    const { data, error } = await supabase
      .from('Pharmacy')
      .insert({
        pharmacyCode,
        pharmacyName,
        district,
        sector: sector || '',
        contactPerson: contactPerson || '',
        phone: phone || '',
        email: email || '',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Pharmacy code already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Pharmacy create error:', error);
    return NextResponse.json({ error: 'Failed to create pharmacy' }, { status: 500 });
  }
}

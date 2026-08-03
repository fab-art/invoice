import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const code = String(row['pharmacy_code'] || row['code'] || row['Code'] || '').trim();
        const name = String(row['pharmacy_name'] || row['name'] || row['Name'] || '').trim();
        const district = String(row['district'] || row['District'] || '').trim();

        if (!code || !name || !district) {
          errors.push(`Row skipped: missing required fields (code: ${code || 'empty'})`);
          skipped++;
          continue;
        }

        const { error: upsertError } = await supabase
          .from('Pharmacy')
          .upsert(
            { pharmacyCode: code, pharmacyName: name, district },
            { onConflict: 'pharmacyCode' }
          );

        if (upsertError) throw upsertError;
        created++;
      } catch (err: any) {
        errors.push(`Row error: ${err.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      created,
      skipped,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to import pharmacies' }, { status: 500 });
  }
}

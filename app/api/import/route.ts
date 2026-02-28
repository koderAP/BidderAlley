import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Delete existing items
    await query('DELETE FROM "Item"');

    // Insert new items
    for (const item of items) {
      await query(
        'INSERT INTO "Item" (id, name, category, utility, "basePrice", status, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())',
        [item.name, item.category, item.utility, item.basePrice, 'available']
      );
    }

    return NextResponse.json({ success: true, count: items.length });
  } catch (error) {
    console.error('Error importing items:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}

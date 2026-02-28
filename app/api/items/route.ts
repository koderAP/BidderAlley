import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM "Item" ORDER BY category ASC, name ASC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await query(
      'INSERT INTO "Item" (id, name, category, utility, "basePrice", status, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [body.name, body.category, body.utility, body.basePrice, 'available']
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`"${key}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    setClauses.push(`"updatedAt" = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE "Item" SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const itemResult = await query('SELECT * FROM "Item" WHERE id = $1', [id]);
    if (itemResult.rows[0]?.status === 'sold') {
      return NextResponse.json({ error: 'Cannot delete sold item' }, { status: 400 });
    }

    await query('DELETE FROM "Item" WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT b.*, COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), \'[]\') as items FROM "Bidder" b LEFT JOIN "Item" i ON i."soldTo" = b.id GROUP BY b.id ORDER BY b.name ASC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching bidders:', error);
    return NextResponse.json({ error: 'Failed to fetch bidders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await query(
      `INSERT INTO "Bidder" (id, name, "initialBudget", "remainingBudget", "totalUtility", "isQualified", "hostelsCount", "clubsCount", "datingCount", "friendsCount", "totalItems", "hostelsUtility", "clubsUtility", "datingUtility", "friendsUtility", "hostelsMultiplier", "clubsMultiplier", "datingMultiplier", "friendsMultiplier", "wildcardsCount", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $2, 0, false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 1.0, 1.0, 0, NOW(), NOW()) RETURNING *`,
      [body.name, body.initialBudget]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bidder:', error);
    return NextResponse.json({ error: 'Failed to create bidder' }, { status: 500 });
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
      `UPDATE "Bidder" SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bidder:', error);
    return NextResponse.json({ error: 'Failed to update bidder' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bidder ID required' }, { status: 400 });
    }

    // Unsell all items first
    await query(
      'UPDATE "Item" SET status = $1, "soldTo" = NULL, "soldPrice" = NULL, "updatedAt" = NOW() WHERE "soldTo" = $2',
      ['available', id]
    );

    // Delete wildcards (FK constraint)
    await query('DELETE FROM "Wildcard" WHERE "bidderId" = $1', [id]);

    // Delete the bidder
    await query('DELETE FROM "Bidder" WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bidder:', error);
    return NextResponse.json({ error: 'Failed to delete bidder' }, { status: 500 });
  }
}

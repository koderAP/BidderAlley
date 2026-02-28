import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateTotalUtility } from '@/lib/wildcard-utils';

function getCategoryKey(category: string): string {
  if (category === 'Combat Roles') return 'hostels';
  if (category === 'Strategic Assets & Equipment') return 'clubs';
  if (category === 'Mission Environments') return 'dating';
  return 'friends';
}

function checkQualification(bidder: any): boolean {
  const categoriesWithCards = [
    bidder.hostelsCount > 0 ? 1 : 0,
    bidder.clubsCount > 0 ? 1 : 0,
    bidder.datingCount > 0 ? 1 : 0,
    bidder.friendsCount > 0 ? 1 : 0,
  ].reduce((sum: number, v: number) => sum + v, 0);

  return categoriesWithCards >= 2 && bidder.totalItems >= 4;
}

// GET all wildcards
export async function GET() {
  try {
    const result = await query(
      `SELECT w.*, row_to_json(b.*) as bidder
       FROM "Wildcard" w
       JOIN "Bidder" b ON w."bidderId" = b.id
       ORDER BY w."createdAt" DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching wildcards:', error);
    return NextResponse.json({ error: 'Failed to fetch wildcards' }, { status: 500 });
  }
}

// POST - Record wildcard purchase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, price, bidderId,
      hostelsMultiplier = 1.0, clubsMultiplier = 1.0, datingMultiplier = 1.0, friendsMultiplier = 1.0,
      countsAsTheme,
    } = body;

    if (!name || !bidderId || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields: name, bidderId, price' }, { status: 400 });
    }

    const bidderRes = await query('SELECT * FROM "Bidder" WHERE id = $1', [bidderId]);
    const bidder = bidderRes.rows[0];

    if (!bidder) return NextResponse.json({ error: 'Bidder not found' }, { status: 404 });
    if (bidder.remainingBudget < price) return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });

    // Create the wildcard
    await query(
      `INSERT INTO "Wildcard" (id, name, price, "bidderId", "hostelsMultiplier", "clubsMultiplier", "datingMultiplier", "friendsMultiplier", "countsAsTheme", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [name, price, bidderId, hostelsMultiplier, clubsMultiplier, datingMultiplier, friendsMultiplier, countsAsTheme || null]
    );

    let extraUpdates = '';
    const params: any[] = [price, hostelsMultiplier, clubsMultiplier, datingMultiplier, friendsMultiplier, bidderId];

    if (countsAsTheme) {
      const catKey = getCategoryKey(countsAsTheme);
      extraUpdates = `, "totalItems" = "totalItems" + 1, "${catKey}Count" = "${catKey}Count" + 1`;
    }

    await query(
      `UPDATE "Bidder" SET
        "remainingBudget" = "remainingBudget" - $1,
        "wildcardsCount" = "wildcardsCount" + 1,
        "hostelsMultiplier" = "hostelsMultiplier" * $2,
        "clubsMultiplier" = "clubsMultiplier" * $3,
        "datingMultiplier" = "datingMultiplier" * $4,
        "friendsMultiplier" = "friendsMultiplier" * $5,
        "updatedAt" = NOW()
        ${extraUpdates}
       WHERE id = $6`,
      params
    );

    const newTotalUtility = await calculateTotalUtility(bidderId);
    await query('UPDATE "Bidder" SET "totalUtility" = $1, "updatedAt" = NOW() WHERE id = $2', [newTotalUtility, bidderId]);

    const updatedBidderRes = await query('SELECT * FROM "Bidder" WHERE id = $1', [bidderId]);
    const updatedBidder = updatedBidderRes.rows[0];
    const isQualified = checkQualification(updatedBidder);
    if (updatedBidder.isQualified !== isQualified) {
      await query('UPDATE "Bidder" SET "isQualified" = $1, "updatedAt" = NOW() WHERE id = $2', [isQualified, bidderId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording wildcard:', error);
    return NextResponse.json({ error: 'Failed to record wildcard' }, { status: 500 });
  }
}

// DELETE - Remove wildcard
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wildcardId = searchParams.get('wildcardId');

    if (!wildcardId) return NextResponse.json({ error: 'Wildcard ID is required' }, { status: 400 });

    const wcRes = await query('SELECT * FROM "Wildcard" WHERE id = $1', [wildcardId]);
    const wildcard = wcRes.rows[0];
    if (!wildcard) return NextResponse.json({ error: 'Wildcard not found' }, { status: 404 });

    const bidderRes = await query('SELECT * FROM "Bidder" WHERE id = $1', [wildcard.bidderId]);
    const bidder = bidderRes.rows[0];

    let extraUpdates = '';
    if (wildcard.countsAsTheme) {
      const catKey = getCategoryKey(wildcard.countsAsTheme);
      extraUpdates = `, "totalItems" = GREATEST("totalItems" - 1, 0), "${catKey}Count" = GREATEST("${catKey}Count" - 1, 0)`;
    }

    await query('DELETE FROM "Wildcard" WHERE id = $1', [wildcardId]);

    await query(
      `UPDATE "Bidder" SET
        "remainingBudget" = "remainingBudget" + $1,
        "wildcardsCount" = GREATEST("wildcardsCount" - 1, 0),
        "hostelsMultiplier" = "hostelsMultiplier" / $2,
        "clubsMultiplier" = "clubsMultiplier" / $3,
        "datingMultiplier" = "datingMultiplier" / $4,
        "friendsMultiplier" = "friendsMultiplier" / $5,
        "updatedAt" = NOW()
        ${extraUpdates}
       WHERE id = $6`,
      [wildcard.price, wildcard.hostelsMultiplier, wildcard.clubsMultiplier, wildcard.datingMultiplier, wildcard.friendsMultiplier, bidder.id]
    );

    const newTotalUtility = await calculateTotalUtility(bidder.id);
    await query('UPDATE "Bidder" SET "totalUtility" = $1, "updatedAt" = NOW() WHERE id = $2', [newTotalUtility, bidder.id]);

    const updatedBidderRes = await query('SELECT * FROM "Bidder" WHERE id = $1', [bidder.id]);
    const updatedBidder = updatedBidderRes.rows[0];
    const isQualified = checkQualification(updatedBidder);
    if (updatedBidder.isQualified !== isQualified) {
      await query('UPDATE "Bidder" SET "isQualified" = $1, "updatedAt" = NOW() WHERE id = $2', [isQualified, bidder.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wildcard:', error);
    return NextResponse.json({ error: 'Failed to delete wildcard' }, { status: 500 });
  }
}

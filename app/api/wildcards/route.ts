import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateTotalUtility } from '@/lib/wildcard-utils';

const CATEGORY_LIMITS: Record<string, { min: number; max: number }> = {
  hostels: { min: 1, max: 3 },
  clubs: { min: 2, max: 4 },
  dating: { min: 1, max: 2 },
  friends: { min: 2, max: 4 },
};

const TOTAL_ITEMS_LIMIT = { min: 7, max: 10 };

function getCategoryKey(category: string): string {
  if (category === 'Combat Roles') return 'hostels';
  if (category === 'Strategic Assets & Equipment') return 'clubs';
  if (category === 'Mission Environments') return 'dating';
  return 'friends';
}

function checkQualification(bidder: any): boolean {
  const hostelsOk =
    (bidder.hostelsCount >= CATEGORY_LIMITS.hostels.min && bidder.hostelsCount <= CATEGORY_LIMITS.hostels.max) ||
    bidder.hostelsMultiplier > 1;
  const clubsOk =
    (bidder.clubsCount >= CATEGORY_LIMITS.clubs.min && bidder.clubsCount <= CATEGORY_LIMITS.clubs.max) ||
    bidder.clubsMultiplier > 1;
  const datingOk =
    (bidder.datingCount >= CATEGORY_LIMITS.dating.min && bidder.datingCount <= CATEGORY_LIMITS.dating.max) ||
    bidder.datingMultiplier > 1;
  const friendsOk =
    (bidder.friendsCount >= CATEGORY_LIMITS.friends.min && bidder.friendsCount <= CATEGORY_LIMITS.friends.max) ||
    bidder.friendsMultiplier > 1;
  const totalOk = bidder.totalItems >= TOTAL_ITEMS_LIMIT.min && bidder.totalItems <= TOTAL_ITEMS_LIMIT.max;

  return hostelsOk && clubsOk && datingOk && friendsOk && totalOk;
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
      name,
      price,
      bidderId,
      hostelsMultiplier = 1.0,
      clubsMultiplier = 1.0,
      datingMultiplier = 1.0,
      friendsMultiplier = 1.0,
      countsAsTheme,
    } = body;

    if (!name || !bidderId || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, bidderId, price' },
        { status: 400 }
      );
    }

    const bidderRes = await query('SELECT * FROM "Bidder" WHERE id = $1', [bidderId]);
    const bidder = bidderRes.rows[0];

    if (!bidder) {
      return NextResponse.json({ error: 'Bidder not found' }, { status: 404 });
    }

    if (bidder.remainingBudget < price) {
      return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });
    }

    // Create the wildcard
    await query(
      `INSERT INTO "Wildcard" (id, name, price, "bidderId", "hostelsMultiplier", "clubsMultiplier", "datingMultiplier", "friendsMultiplier", "countsAsTheme", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [name, price, bidderId, hostelsMultiplier, clubsMultiplier, datingMultiplier, friendsMultiplier, countsAsTheme || null]
    );

    // Build update for bidder
    let extraUpdates = '';
    const params: any[] = [
      price,
      hostelsMultiplier,
      clubsMultiplier,
      datingMultiplier,
      friendsMultiplier,
      bidderId,
    ];

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

    // Recalculate total utility
    const newTotalUtility = await calculateTotalUtility(bidderId);
    await query('UPDATE "Bidder" SET "totalUtility" = $1, "updatedAt" = NOW() WHERE id = $2', [newTotalUtility, bidderId]);

    // Check qualification
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

// DELETE - Remove wildcard purchase
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wildcardId = searchParams.get('wildcardId');

    if (!wildcardId) {
      return NextResponse.json({ error: 'Wildcard ID is required' }, { status: 400 });
    }

    const wcRes = await query('SELECT * FROM "Wildcard" WHERE id = $1', [wildcardId]);
    const wildcard = wcRes.rows[0];

    if (!wildcard) {
      return NextResponse.json({ error: 'Wildcard not found' }, { status: 404 });
    }

    const bidderRes = await query('SELECT * FROM "Bidder" WHERE id = $1', [wildcard.bidderId]);
    const bidder = bidderRes.rows[0];

    // Build update
    let extraUpdates = '';
    if (wildcard.countsAsTheme) {
      const catKey = getCategoryKey(wildcard.countsAsTheme);
      extraUpdates = `, "totalItems" = GREATEST("totalItems" - 1, 0), "${catKey}Count" = GREATEST("${catKey}Count" - 1, 0)`;
    }

    // Delete the wildcard first
    await query('DELETE FROM "Wildcard" WHERE id = $1', [wildcardId]);

    // Update bidder
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

    // Recalculate total utility
    const newTotalUtility = await calculateTotalUtility(bidder.id);
    await query('UPDATE "Bidder" SET "totalUtility" = $1, "updatedAt" = NOW() WHERE id = $2', [newTotalUtility, bidder.id]);

    // Check qualification
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

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateTotalUtility } from '@/lib/wildcard-utils';

const getCategoryKey = (category: string): string => {
  switch (category) {
    case 'Combat Roles': return 'hostels';
    case 'Strategic Assets & Equipment': return 'clubs';
    case 'Mission Environments': return 'dating';
    case 'Special Operations & Strategic Actions': return 'friends';
    default: return 'hostels';
  }
};

const CATEGORY_LIMITS: Record<string, { min: number; max: number }> = {
  hostels: { min: 1, max: 3 },
  clubs: { min: 2, max: 4 },
  dating: { min: 1, max: 2 },
  friends: { min: 2, max: 4 },
};

const TOTAL_ITEMS_LIMIT = { min: 7, max: 10 };

const checkQualification = (bidder: any): boolean => {
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
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, bidderId, soldPrice } = body;

    const [itemRes, bidderRes] = await Promise.all([
      query('SELECT * FROM "Item" WHERE id = $1', [itemId]),
      query('SELECT * FROM "Bidder" WHERE id = $1', [bidderId]),
    ]);

    const item = itemRes.rows[0];
    const bidder = bidderRes.rows[0];

    if (!item || !bidder) {
      return NextResponse.json({ error: 'Item or Bidder not found' }, { status: 404 });
    }

    if (bidder.totalItems >= TOTAL_ITEMS_LIMIT.max) {
      return NextResponse.json(
        { error: `Cannot purchase more items. Maximum of ${TOTAL_ITEMS_LIMIT.max} items reached.` },
        { status: 400 }
      );
    }

    if (bidder.remainingBudget < soldPrice) {
      return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });
    }

    const catKey = getCategoryKey(item.category);
    const countField = `${catKey}Count`;
    const currentCount = bidder[countField] as number;

    if (currentCount >= CATEGORY_LIMITS[catKey].max) {
      return NextResponse.json(
        { error: `Maximum ${CATEGORY_LIMITS[catKey].max} items allowed in ${item.category} category` },
        { status: 400 }
      );
    }

    // Update bidder counts and utility
    const utilityField = `${catKey}Utility`;
    await query(
      `UPDATE "Bidder" SET
        "remainingBudget" = "remainingBudget" - $1,
        "totalItems" = "totalItems" + 1,
        "${countField}" = "${countField}" + 1,
        "${utilityField}" = "${utilityField}" + $2,
        "updatedAt" = NOW()
       WHERE id = $3`,
      [soldPrice, item.utility, bidderId]
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

    // Update the item
    await query(
      'UPDATE "Item" SET "soldTo" = $1, "soldPrice" = $2, status = $3, "updatedAt" = NOW() WHERE id = $4',
      [bidderId, soldPrice, 'sold', itemId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording sale:', error);
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const itemRes = await query('SELECT * FROM "Item" WHERE id = $1', [itemId]);
    const item = itemRes.rows[0];

    if (!item || !item.soldTo) {
      return NextResponse.json({ error: 'Item not found or not sold' }, { status: 404 });
    }

    const bidderRes = await query('SELECT * FROM "Bidder" WHERE id = $1', [item.soldTo]);
    const bidder = bidderRes.rows[0];

    if (!bidder) {
      return NextResponse.json({ error: 'Bidder not found' }, { status: 404 });
    }

    const catKey = getCategoryKey(item.category);
    const countField = `${catKey}Count`;
    const utilityField = `${catKey}Utility`;

    // Reverse bidder counts
    await query(
      `UPDATE "Bidder" SET
        "remainingBudget" = "remainingBudget" + $1,
        "totalItems" = GREATEST("totalItems" - 1, 0),
        "${countField}" = GREATEST("${countField}" - 1, 0),
        "${utilityField}" = GREATEST("${utilityField}" - $2, 0),
        "updatedAt" = NOW()
       WHERE id = $3`,
      [item.soldPrice || 0, item.utility, bidder.id]
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

    // Undo the sale
    await query(
      'UPDATE "Item" SET "soldTo" = NULL, "soldPrice" = NULL, status = $1, "updatedAt" = NOW() WHERE id = $2',
      ['available', itemId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error undoing sale:', error);
    return NextResponse.json({ error: 'Failed to undo sale' }, { status: 500 });
  }
}

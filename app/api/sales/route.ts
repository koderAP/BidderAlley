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

const checkQualification = (bidder: any): boolean => {
  // At least 1 card in at least 2 different categories
  const categoriesWithCards = [
    bidder.hostelsCount > 0 ? 1 : 0,
    bidder.clubsCount > 0 ? 1 : 0,
    bidder.datingCount > 0 ? 1 : 0,
    bidder.friendsCount > 0 ? 1 : 0,
  ].reduce((sum: number, v: number) => sum + v, 0);

  // At least 4 total cards
  return categoriesWithCards >= 2 && bidder.totalItems >= 4;
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

    if (bidder.remainingBudget < soldPrice) {
      return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });
    }

    const catKey = getCategoryKey(item.category);
    const countField = `${catKey}Count`;
    const utilityField = `${catKey}Utility`;

    // Update bidder counts and utility
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

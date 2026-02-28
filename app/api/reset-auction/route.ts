import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Delete all wildcards first (foreign key dependency)
    await query('DELETE FROM "Wildcard"');

    // Reset all items to unsold
    await query(
      'UPDATE "Item" SET "soldTo" = NULL, "soldPrice" = NULL, status = $1, "updatedAt" = NOW()',
      ['available']
    );

    // Reset all bidders to initial state
    await query(
      `UPDATE "Bidder" SET
        "remainingBudget" = "initialBudget",
        "totalUtility" = 0,
        "isQualified" = false,
        "hostelsCount" = 0,
        "clubsCount" = 0,
        "datingCount" = 0,
        "friendsCount" = 0,
        "totalItems" = 0,
        "hostelsUtility" = 0,
        "clubsUtility" = 0,
        "datingUtility" = 0,
        "friendsUtility" = 0,
        "wildcardsCount" = 0,
        "hostelsMultiplier" = 1.0,
        "clubsMultiplier" = 1.0,
        "datingMultiplier" = 1.0,
        "friendsMultiplier" = 1.0,
        "updatedAt" = NOW()`
    );

    return NextResponse.json({
      success: true,
      message: 'Auction reset successfully',
    });
  } catch (error) {
    console.error('Error resetting auction:', error);
    return NextResponse.json({ error: 'Failed to reset auction' }, { status: 500 });
  }
}

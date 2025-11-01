import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Delete all wildcards first (foreign key dependency)
    await prisma.wildcard.deleteMany({});

    // Reset all items to unsold
    await prisma.item.updateMany({
      data: {
        soldTo: null,
        soldPrice: null,
        status: 'available',
      },
    });

    // Reset all bidders to initial state
    const bidders = await prisma.bidder.findMany();
    
    await Promise.all(
      bidders.map((bidder: any) =>
        prisma.bidder.update({
          where: { id: bidder.id },
          data: {
            remainingBudget: bidder.initialBudget,
            totalUtility: 0,
            isQualified: false,
            hostelsCount: 0,
            clubsCount: 0,
            datingCount: 0,
            friendsCount: 0,
            totalItems: 0,
            hostelsUtility: 0,
            clubsUtility: 0,
            datingUtility: 0,
            friendsUtility: 0,
            wildcardsCount: 0,
            // Reset multipliers to 1.0 (no effect)
            hostelsMultiplier: 1.0,
            clubsMultiplier: 1.0,
            datingMultiplier: 1.0,
            friendsMultiplier: 1.0,
          },
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Auction reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting auction:', error);
    return NextResponse.json(
      { error: 'Failed to reset auction' }, 
      { status: 500 }
    );
  }
}

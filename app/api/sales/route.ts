import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTotalUtility } from '@/lib/wildcard-utils';

// Category mapping for purchase limits
const getCategoryKey = (category: string): keyof typeof CATEGORY_LIMITS => {
  switch (category) {
    case 'Hostels':
      return 'Hostels';
    case 'Clubs':
      return 'Clubs';
    case 'Dating Preference':
      return 'Dating';
    case 'Friend Type':
      return 'Friends';
    default:
      return 'Hostels';
  }
};

const CATEGORY_LIMITS = {
  Hostels: { min: 1, max: 3 },
  Clubs: { min: 2, max: 4 },
  Dating: { min: 1, max: 2 },
  Friends: { min: 2, max: 4 },
};

const TOTAL_ITEMS_LIMIT = { min: 7, max: 10 };

// Check if bidder qualifies
const checkQualification = (bidder: any): boolean => {
  // For each theme, check if either:
  // 1. They have the required items, OR
  // 2. They have a wildcard multiplier > 1 (automatically qualifies for that theme)
  const hostelsOk = 
    (bidder.hostelsCount >= CATEGORY_LIMITS.Hostels.min && bidder.hostelsCount <= CATEGORY_LIMITS.Hostels.max) ||
    bidder.hostelsMultiplier > 1;
  
  const clubsOk = 
    (bidder.clubsCount >= CATEGORY_LIMITS.Clubs.min && bidder.clubsCount <= CATEGORY_LIMITS.Clubs.max) ||
    bidder.clubsMultiplier > 1;
  
  const datingOk = 
    (bidder.datingCount >= CATEGORY_LIMITS.Dating.min && bidder.datingCount <= CATEGORY_LIMITS.Dating.max) ||
    bidder.datingMultiplier > 1;
  
  const friendsOk = 
    (bidder.friendsCount >= CATEGORY_LIMITS.Friends.min && bidder.friendsCount <= CATEGORY_LIMITS.Friends.max) ||
    bidder.friendsMultiplier > 1;

  const totalOk = bidder.totalItems >= TOTAL_ITEMS_LIMIT.min && bidder.totalItems <= TOTAL_ITEMS_LIMIT.max;

  return hostelsOk && clubsOk && datingOk && friendsOk && totalOk;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, bidderId, soldPrice } = body;

    // Get the item and bidder with current counts
    const [item, bidder] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      prisma.bidder.findUnique({ 
        where: { id: bidderId },
        include: { items: true }
      }),
    ]);

    if (!item || !bidder) {
      return NextResponse.json({ error: 'Item or Bidder not found' }, { status: 404 });
    }

    // Check if bidder has reached max total items
    if (bidder.totalItems >= TOTAL_ITEMS_LIMIT.max) {
      return NextResponse.json(
        { error: `Cannot purchase more items. Maximum of ${TOTAL_ITEMS_LIMIT.max} items reached.` },
        { status: 400 }
      );
    }

    // Check budget
    if (bidder.remainingBudget < soldPrice) {
      return NextResponse.json(
        { error: 'Insufficient budget' },
        { status: 400 }
      );
    }

    // Check category limits
    const categoryKey = getCategoryKey(item.category);
    const countField = `${categoryKey.toLowerCase()}Count` as keyof typeof bidder;
    const currentCount = bidder[countField] as number;
    
    if (currentCount >= CATEGORY_LIMITS[categoryKey].max) {
      return NextResponse.json(
        { error: `Maximum ${CATEGORY_LIMITS[categoryKey].max} items allowed in ${item.category} category` },
        { status: 400 }
      );
    }

    // Calculate new values
    const newRemainingBudget = bidder.remainingBudget - soldPrice;
    const newTotalItems = bidder.totalItems + 1;
    
    const updateData: any = {
      remainingBudget: newRemainingBudget,
      totalItems: newTotalItems,
    };

    // Update category count AND theme-specific utility
    if (categoryKey === 'Hostels') {
      updateData.hostelsCount = bidder.hostelsCount + 1;
      updateData.hostelsUtility = bidder.hostelsUtility + item.utility;
    } else if (categoryKey === 'Clubs') {
      updateData.clubsCount = bidder.clubsCount + 1;
      updateData.clubsUtility = bidder.clubsUtility + item.utility;
    } else if (categoryKey === 'Dating') {
      updateData.datingCount = bidder.datingCount + 1;
      updateData.datingUtility = bidder.datingUtility + item.utility;
    } else if (categoryKey === 'Friends') {
      updateData.friendsCount = bidder.friendsCount + 1;
      updateData.friendsUtility = bidder.friendsUtility + item.utility;
    }

    // Update bidder with new counts (theme utilities updated above)
    await prisma.bidder.update({
      where: { id: bidderId },
      data: updateData,
    });

    // Recalculate total utility based on theme utilities × wildcard multipliers
    const newTotalUtility = await calculateTotalUtility(bidderId);
    
    // Update with the calculated total utility
    const updatedBidder = await prisma.bidder.update({
      where: { id: bidderId },
      data: { totalUtility: newTotalUtility },
    });

    // Check qualification status
    const isQualified = checkQualification(updatedBidder);
    if (updatedBidder.isQualified !== isQualified) {
      await prisma.bidder.update({
        where: { id: bidderId },
        data: { isQualified },
      });
    }

    // Update the item
    await prisma.item.update({
      where: { id: itemId },
      data: {
        soldTo: bidderId,
        soldPrice: soldPrice,
        status: 'sold',
      },
    });

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

    // Get the item with bidder info
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { bidder: true },
    });

    if (!item || !item.soldTo || !item.bidder) {
      return NextResponse.json({ error: 'Item not found or not sold' }, { status: 404 });
    }

    const bidder = item.bidder;
    const categoryKey = getCategoryKey(item.category);

    // Calculate reversed values
    const newRemainingBudget = bidder.remainingBudget + (item.soldPrice || 0);
    const newTotalItems = bidder.totalItems - 1;

    const updateData: any = {
      remainingBudget: newRemainingBudget,
      totalItems: newTotalItems,
    };

    // Update category count AND theme-specific utility
    if (categoryKey === 'Hostels') {
      updateData.hostelsCount = Math.max(0, bidder.hostelsCount - 1);
      updateData.hostelsUtility = Math.max(0, bidder.hostelsUtility - item.utility);
    } else if (categoryKey === 'Clubs') {
      updateData.clubsCount = Math.max(0, bidder.clubsCount - 1);
      updateData.clubsUtility = Math.max(0, bidder.clubsUtility - item.utility);
    } else if (categoryKey === 'Dating') {
      updateData.datingCount = Math.max(0, bidder.datingCount - 1);
      updateData.datingUtility = Math.max(0, bidder.datingUtility - item.utility);
    } else if (categoryKey === 'Friends') {
      updateData.friendsCount = Math.max(0, bidder.friendsCount - 1);
      updateData.friendsUtility = Math.max(0, bidder.friendsUtility - item.utility);
    }

    // Update bidder (theme utilities updated above)
    await prisma.bidder.update({
      where: { id: bidder.id },
      data: updateData,
    });

    // Recalculate total utility based on theme utilities × wildcard multipliers
    const newTotalUtility = await calculateTotalUtility(bidder.id);
    
    // Update with the calculated total utility
    const updatedBidder = await prisma.bidder.update({
      where: { id: bidder.id },
      data: { totalUtility: newTotalUtility },
    });

    // Check qualification status
    const isQualified = checkQualification(updatedBidder);
    if (updatedBidder.isQualified !== isQualified) {
      await prisma.bidder.update({
        where: { id: bidder.id },
        data: { isQualified },
      });
    }

    // Undo the sale
    await prisma.item.update({
      where: { id: itemId },
      data: {
        soldTo: null,
        soldPrice: null,
        status: 'available',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error undoing sale:', error);
    return NextResponse.json({ error: 'Failed to undo sale' }, { status: 500 });
  }
}

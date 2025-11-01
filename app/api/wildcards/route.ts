import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateTotalUtility } from '@/lib/wildcard-utils';

const prisma = new PrismaClient();

const CATEGORY_LIMITS = {
  Hostels: { min: 1, max: 3 },
  Clubs: { min: 2, max: 4 },
  Dating: { min: 1, max: 2 },
  Friends: { min: 2, max: 4 },
};

const TOTAL_ITEMS_LIMIT = { min: 7, max: 10 };

function getCategoryKey(category: string): 'Hostels' | 'Clubs' | 'Dating' | 'Friends' {
  if (category === 'Hostels') return 'Hostels';
  if (category === 'Clubs') return 'Clubs';
  if (category === 'Dating Preference') return 'Dating';
  return 'Friends';
}

function checkQualification(bidder: any): boolean {
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
}

// GET all wildcards
export async function GET() {
  try {
    const wildcards = await prisma.wildcard.findMany({
      include: {
        bidder: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(wildcards);
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
      countsAsTheme, // "Hostels", "Clubs", "Dating Preference", "Friend Type", or null
    } = body;

    if (!name || !bidderId || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, bidderId, price' },
        { status: 400 }
      );
    }

    // Get bidder with wildcards
    const bidder = await prisma.bidder.findUnique({
      where: { id: bidderId },
      include: { wildcards: true },
    });

    if (!bidder) {
      return NextResponse.json({ error: 'Bidder not found' }, { status: 404 });
    }

    // Check budget
    if (bidder.remainingBudget < price) {
      return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });
    }

    // Create the wildcard
    const wildcard = await prisma.wildcard.create({
      data: {
        name,
        price,
        bidderId,
        hostelsMultiplier,
        clubsMultiplier,
        datingMultiplier,
        friendsMultiplier,
        countsAsTheme,
      },
    });

    // Multiply the bidder's theme multipliers (multiplicative stacking)
    // If bidder has (2, 1, 1, 1) and wildcard is (1.3, 1, 1, 1), result is (2.6, 1, 1, 1)
    const updateData: any = {
      remainingBudget: bidder.remainingBudget - price,
      wildcardsCount: bidder.wildcardsCount + 1,
      hostelsMultiplier: bidder.hostelsMultiplier * hostelsMultiplier,
      clubsMultiplier: bidder.clubsMultiplier * clubsMultiplier,
      datingMultiplier: bidder.datingMultiplier * datingMultiplier,
      friendsMultiplier: bidder.friendsMultiplier * friendsMultiplier,
    };

    // If wildcard counts as a theme for qualification, increment that count
    if (countsAsTheme) {
      const categoryKey = getCategoryKey(countsAsTheme);
      updateData.totalItems = bidder.totalItems + 1; // Counts toward total

      if (categoryKey === 'Hostels') {
        updateData.hostelsCount = bidder.hostelsCount + 1;
      } else if (categoryKey === 'Clubs') {
        updateData.clubsCount = bidder.clubsCount + 1;
      } else if (categoryKey === 'Dating') {
        updateData.datingCount = bidder.datingCount + 1;
      } else if (categoryKey === 'Friends') {
        updateData.friendsCount = bidder.friendsCount + 1;
      }
    }

    await prisma.bidder.update({
      where: { id: bidderId },
      data: updateData,
    });

    // Recalculate total utility based on all theme utilities × wildcard multipliers
    const newTotalUtility = await calculateTotalUtility(bidderId);
    
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

    return NextResponse.json({ success: true, wildcard });
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

    // Get the wildcard with bidder info
    const wildcard = await prisma.wildcard.findUnique({
      where: { id: wildcardId },
      include: { bidder: true },
    });

    if (!wildcard) {
      return NextResponse.json({ error: 'Wildcard not found' }, { status: 404 });
    }

    const bidder = wildcard.bidder;

    // Divide the bidder's theme multipliers to remove this wildcard's effect
    // If bidder has (2.6, 1, 1, 1) and wildcard is (1.3, 1, 1, 1), result is (2, 1, 1, 1)
    const updateData: any = {
      remainingBudget: bidder.remainingBudget + wildcard.price,
      wildcardsCount: Math.max(0, bidder.wildcardsCount - 1),
      hostelsMultiplier: bidder.hostelsMultiplier / wildcard.hostelsMultiplier,
      clubsMultiplier: bidder.clubsMultiplier / wildcard.clubsMultiplier,
      datingMultiplier: bidder.datingMultiplier / wildcard.datingMultiplier,
      friendsMultiplier: bidder.friendsMultiplier / wildcard.friendsMultiplier,
    };

    // If wildcard counted as a theme for qualification, decrement that count
    if (wildcard.countsAsTheme) {
      const categoryKey = getCategoryKey(wildcard.countsAsTheme);
      updateData.totalItems = Math.max(0, bidder.totalItems - 1);

      if (categoryKey === 'Hostels') {
        updateData.hostelsCount = Math.max(0, bidder.hostelsCount - 1);
      } else if (categoryKey === 'Clubs') {
        updateData.clubsCount = Math.max(0, bidder.clubsCount - 1);
      } else if (categoryKey === 'Dating') {
        updateData.datingCount = Math.max(0, bidder.datingCount - 1);
      } else if (categoryKey === 'Friends') {
        updateData.friendsCount = Math.max(0, bidder.friendsCount - 1);
      }
    }

    // Delete the wildcard first
    await prisma.wildcard.delete({
      where: { id: wildcardId },
    });

    // Update bidder counts and multipliers
    await prisma.bidder.update({
      where: { id: bidder.id },
      data: updateData,
    });

    // Recalculate total utility based on remaining wildcards
    const newTotalUtility = await calculateTotalUtility(bidder.id);
    
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wildcard:', error);
    return NextResponse.json({ error: 'Failed to delete wildcard' }, { status: 500 });
  }
}

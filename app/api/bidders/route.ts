import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bidders = await prisma.bidder.findMany({
      include: {
        items: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(bidders);
  } catch (error) {
    console.error('Error fetching bidders:', error);
    return NextResponse.json({ error: 'Failed to fetch bidders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const bidder = await prisma.bidder.create({
      data: {
        name: body.name,
        initialBudget: body.initialBudget,
        remainingBudget: body.initialBudget, // Start with full budget
        totalUtility: 0,
        isQualified: false,
        hostelsCount: 0,
        clubsCount: 0,
        datingCount: 0,
        friendsCount: 0,
        totalItems: 0,
      },
    });

    return NextResponse.json(bidder);
  } catch (error) {
    console.error('Error creating bidder:', error);
    return NextResponse.json({ error: 'Failed to create bidder' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const bidder = await prisma.bidder.update({
      where: { id },
      data,
    });

    return NextResponse.json(bidder);
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

    // Check if bidder has any purchased items
    const bidder = await prisma.bidder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (bidder && bidder.items.length > 0) {
      // Unsell all items first
      await prisma.item.updateMany({
        where: { soldTo: id },
        data: {
          status: 'available',
          soldTo: null,
          soldPrice: null,
        },
      });
    }

    // Delete wildcards first (FK constraint)
    await prisma.wildcard.deleteMany({
      where: { bidderId: id },
    });

    // Delete the bidder
    await prisma.bidder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bidder:', error);
    return NextResponse.json({ error: 'Failed to delete bidder' }, { status: 500 });
  }
}

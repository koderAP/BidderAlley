import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Delete existing items and create new ones
    await prisma.item.deleteMany();
    
    const createdItems = await prisma.item.createMany({
      data: items.map((item: any) => ({
        name: item.name,
        category: item.category,
        utility: item.utility,
        basePrice: item.basePrice,
        status: 'available',
      })),
    });

    return NextResponse.json({ success: true, count: createdItems.count });
  } catch (error) {
    console.error('Error importing items:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}

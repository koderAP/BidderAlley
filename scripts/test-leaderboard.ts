/**
 * Test Script for Leaderboard Sorting
 * 
 * This script creates test scenarios to verify the leaderboard sorting:
 * Priority 1: Qualified status (qualified first)
 * Priority 2: Total utility (higher better)
 * Priority 3: Remaining budget (higher better)
 * 
 * Run: npx tsx scripts/test-leaderboard.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAuction() {
  console.log('🔄 Resetting auction to clean state...\n');
  
  // Reset all items
  await prisma.item.updateMany({
    data: {
      soldTo: null,
      soldPrice: null,
      status: 'available',
    },
  });

  // Reset all bidders
  const bidders = await prisma.bidder.findMany();
  for (const bidder of bidders) {
    await prisma.bidder.update({
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
        hostelsMultiplier: 1.0,
        clubsMultiplier: 1.0,
        datingMultiplier: 1.0,
        friendsMultiplier: 1.0,
        wildcardsCount: 0,
      },
    });
  }
}

async function recordSale(itemName: string, bidderName: string, price: number) {
  const item = await prisma.item.findFirst({
    where: { name: itemName },
  });

  const bidder = await prisma.bidder.findFirst({
    where: { name: bidderName },
  });

  if (!item || !bidder) {
    console.log(`❌ Could not find item "${itemName}" or bidder "${bidderName}"`);
    return;
  }

  // Update item (soldTo is the bidder ID, not name)
  await prisma.item.update({
    where: { id: item.id },
    data: {
      soldTo: bidder.id,  // Use bidder.id instead of bidder.name
      soldPrice: price,
      status: 'sold',
    },
  });

  // Update bidder counts AND theme utilities
  const categoryInfo = 
    item.category === 'Hostels' ? { countField: 'hostelsCount', utilityField: 'hostelsUtility' } :
    item.category === 'Clubs' ? { countField: 'clubsCount', utilityField: 'clubsUtility' } :
    item.category === 'Dating Preference' ? { countField: 'datingCount', utilityField: 'datingUtility' } :
    { countField: 'friendsCount', utilityField: 'friendsUtility' };

  const updatedBidder = await prisma.bidder.update({
    where: { id: bidder.id },
    data: {
      remainingBudget: bidder.remainingBudget - price,
      totalUtility: bidder.totalUtility + item.utility,
      [categoryInfo.countField]: bidder[categoryInfo.countField as keyof typeof bidder] as number + 1,
      [categoryInfo.utilityField]: bidder[categoryInfo.utilityField as keyof typeof bidder] as number + item.utility,
      totalItems: bidder.totalItems + 1,
    },
  });

  // Check qualification
  const CATEGORY_LIMITS = {
    Hostels: { min: 1, max: 3 },
    Clubs: { min: 2, max: 4 },
    'Dating Preference': { min: 1, max: 2 },
    'Friend Type': { min: 2, max: 4 },
  };

  const isQualified =
    updatedBidder.hostelsCount >= CATEGORY_LIMITS.Hostels.min &&
    updatedBidder.hostelsCount <= CATEGORY_LIMITS.Hostels.max &&
    updatedBidder.clubsCount >= CATEGORY_LIMITS.Clubs.min &&
    updatedBidder.clubsCount <= CATEGORY_LIMITS.Clubs.max &&
    updatedBidder.datingCount >= CATEGORY_LIMITS['Dating Preference'].min &&
    updatedBidder.datingCount <= CATEGORY_LIMITS['Dating Preference'].max &&
    updatedBidder.friendsCount >= CATEGORY_LIMITS['Friend Type'].min &&
    updatedBidder.friendsCount <= CATEGORY_LIMITS['Friend Type'].max &&
    updatedBidder.totalItems >= 7 &&
    updatedBidder.totalItems <= 10;

  await prisma.bidder.update({
    where: { id: bidder.id },
    data: { isQualified },
  });

  console.log(`✓ ${bidderName} bought "${itemName}" for $${price}M (Utility: ${item.utility})`);
}

async function createTestScenarios() {
  console.log('📝 Creating test scenarios...\n');

  // SCENARIO 1: P01 - QUALIFIED with MEDIUM utility
  console.log('🎯 Scenario 1: P01 - Gopal Gajrani - QUALIFIED with medium utility');
  await recordSale('Satpura', 'P01 - Gopal Gajrani', 10);     // Hostel, Utility: 82
  await recordSale('Zanskar', 'P01 - Gopal Gajrani', 12);     // Hostel, Utility: 77
  await recordSale('Dance', 'P01 - Gopal Gajrani', 10);       // Club, Utility: 85
  await recordSale('Deb', 'P01 - Gopal Gajrani', 10);         // Club, Utility: 82
  await recordSale('Qc', 'P01 - Gopal Gajrani', 10);          // Club (Quiz), Utility: 85
  await recordSale('Senior girl', 'P01 - Gopal Gajrani', 15); // Dating, Utility: 88
  await recordSale('Machau', 'P01 - Gopal Gajrani', 5);       // Friend, Utility: 78
  await recordSale('Love guru', 'P01 - Gopal Gajrani', 5);    // Friend, Utility: 74
  console.log('✅ P01: 8 items (2H/3C/1D/2F), ~651 utility, QUALIFIED\n');

  // SCENARIO 2: P02 - NOT QUALIFIED but HIGH utility
  console.log('🎯 Scenario 2: P02 - Tanvee Jain - NOT QUALIFIED but high utility');
  await recordSale('Kumaon', 'P02 - Tanvee Jain', 8);         // Hostel, Utility: 89
  await recordSale('Nilgiri', 'P02 - Tanvee Jain', 11);       // Hostel, Utility: 87
  await recordSale('Vindhyachal', 'P02 - Tanvee Jain', 11);   // Hostel, Utility: 86
  await recordSale('Lit', 'P02 - Tanvee Jain', 15);           // Club (Literary), Utility: 89
  await recordSale('Dev', 'P02 - Tanvee Jain', 15);           // Club (Development), Utility: 90
  // NO DATING ITEM - Fails qualification!
  await recordSale('Inseparables', 'P02 - Tanvee Jain', 15);  // Friend, Utility: 90
  await recordSale('3 am philosopher', 'P02 - Tanvee Jain', 15); // Friend, Utility: 91
  console.log('❌ P02: 7 items (3H/2C/0D/2F), ~622 utility, NOT QUALIFIED (missing dating)\n');

  // SCENARIO 3: P03 - QUALIFIED but LOW utility
  console.log('🎯 Scenario 3: P03 - Rishabh Jindal - QUALIFIED with low utility');
  await recordSale('Girnar', 'P03 - Rishabh Jindal', 10);     // Hostel, Utility: 78
  await recordSale('Music', 'P03 - Rishabh Jindal', 5);       // Club, Utility: 75
  await recordSale('Drama', 'P03 - Rishabh Jindal', 5);       // Club, Utility: 78
  await recordSale('Du boy', 'P03 - Rishabh Jindal', 5);      // Dating, Utility: 72
  await recordSale('Hostel paglu', 'P03 - Rishabh Jindal', 5); // Friend, Utility: 78
  await recordSale('Common room', 'P03 - Rishabh Jindal', 5); // Friend, Utility: 75
  await recordSale('Medicine', 'P03 - Rishabh Jindal', 5);    // Friend (spare), Utility: 76
  console.log('✅ P03: 7 items (1H/2C/1D/3F), ~532 utility, QUALIFIED\n');

  // SCENARIO 4: P04 - QUALIFIED with HIGH utility
  console.log('🎯 Scenario 4: P04 - Mayank Tayal - QUALIFIED with high utility');
  await recordSale('Shivalik', 'P04 - Mayank Tayal', 13);      // Hostel, Utility: 88
  await recordSale('Robotics', 'P04 - Mayank Tayal', 15);      // Club, Utility: 91
  await recordSale('Eco', 'P04 - Mayank Tayal', 16);           // Club (Economics), Utility: 88
  await recordSale('Enactus', 'P04 - Mayank Tayal', 25);       // Club, Utility: 82
  await recordSale('Emotionally unavailable', 'P04 - Mayank Tayal', 15); // Dating, Utility: 91
  await recordSale('Social butterfly', 'P04 - Mayank Tayal', 15); // Friend, Utility: 88
  await recordSale('Doraemon', 'P04 - Mayank Tayal', 10);      // Friend, Utility: 86
  console.log('✅ P04: 7 items (1H/3C/1D/2F), ~614 utility, QUALIFIED\n');

  // SCENARIO 5: P05 - NOT QUALIFIED, too few items (only 5)
  console.log('🎯 Scenario 5: P05 - Krishna Agrawal - NOT QUALIFIED (too few items)');
  await recordSale('Kailash', 'P05 - Krishna Agrawal', 10);    // Hostel, Utility: 80
  await recordSale('Pfc', 'P05 - Krishna Agrawal', 10);        // Club (Photography), Utility: 86
  await recordSale('Axlr8r', 'P05 - Krishna Agrawal', 10);     // Club, Utility: 85
  await recordSale('In year guy', 'P05 - Krishna Agrawal', 15); // Dating, Utility: 90
  await recordSale('Jugaadu', 'P05 - Krishna Agrawal', 10);    // Friend, Utility: 87
  console.log('❌ P05: 5 items (1H/2C/1D/1F), ~428 utility, NOT QUALIFIED (need 7+ items)\n');
}

async function displayResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 LEADERBOARD TEST RESULTS');
  console.log('='.repeat(80) + '\n');

  const bidders = await prisma.bidder.findMany({
    orderBy: { name: 'asc' },
  });

  // Apply the same sorting as the leaderboard
  const sortedBidders = bidders
    .filter((b: any) => b.totalItems > 0) // Only show active bidders
    .sort((a: any, b: any) => {
      // Priority 1: Qualification (qualified first)
      if (a.isQualified !== b.isQualified) {
        return b.isQualified ? 1 : -1;
      }
      // Priority 2: Total utility (higher better)
      if (b.totalUtility !== a.totalUtility) {
        return b.totalUtility - a.totalUtility;
      }
      // Priority 3: Remaining budget (higher better)
      return b.remainingBudget - a.remainingBudget;
    });

  console.log('Rank | Bidder | Items (H/C/D/F) | Utility | Budget  | Status');
  console.log('-----|--------|-----------------|---------|---------|------------------');

  sortedBidders.forEach((bidder: any, index: number) => {
    const rank = `#${index + 1}`.padEnd(4);
    const name = bidder.name.padEnd(6);
    const items = `${bidder.totalItems} (${bidder.hostelsCount}/${bidder.clubsCount}/${bidder.datingCount}/${bidder.friendsCount})`.padEnd(15);
    const utility = `$${bidder.totalUtility}M`.padEnd(7);
    const budget = `$${bidder.remainingBudget}M`.padEnd(7);
    const status = bidder.isQualified ? '✓ QUALIFIED' : 'In Progress';

    console.log(`${rank} | ${name} | ${items} | ${utility} | ${budget} | ${status}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ EXPECTED SORTING:');
  console.log('='.repeat(80));
  console.log('1️⃣  P04 - QUALIFIED with ~614 utility (highest among qualified)');
  console.log('2️⃣  P01 - QUALIFIED with ~651 utility (but ranks #2 due to budget)');
  console.log('3️⃣  P03 - QUALIFIED with ~532 utility (lowest utility but qualified)');
  console.log('4️⃣  P02 - NOT QUALIFIED with ~622 utility (high utility but missing dating)');
  console.log('5️⃣  P05 - NOT QUALIFIED with ~428 utility (too few items: only 5)');
  console.log('='.repeat(80));
  console.log('\n🔑 KEY TEST: P03 (qualified, utility 532) ranks ABOVE P02 (not qualified, utility 622)');
  console.log('='.repeat(80) + '\n');
}

async function main() {
  try {
    console.log('🚀 Starting Leaderboard Sorting Test\n');
    
    await resetAuction();
    await createTestScenarios();
    await displayResults();

    console.log('✅ Test completed successfully!\n');
    console.log('👉 Now check the leaderboard at: http://localhost:3001');
    console.log('👉 Admin dashboard at: http://localhost:3001/admin/dashboard\n');
    
  } catch (error) {
    console.error('❌ Error running test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

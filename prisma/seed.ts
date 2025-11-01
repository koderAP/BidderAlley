import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.item.deleteMany({});
  await prisma.bidder.deleteMany({});
  console.log('✅ Cleared existing data');

  // Create bidders with player IDs (total budget: $200M each)
  const bidderData = [
    { playerId: 'P01', name: 'Gopal Gajrani' },
    { playerId: 'P02', name: 'Tanvee Jain' },
    { playerId: 'P03', name: 'Rishabh Jindal' },
    { playerId: 'P04', name: 'Mayank Tayal' },
    { playerId: 'P05', name: 'Krishna Agrawal' },
    { playerId: 'P06', name: 'Mohd Arquam' },
    { playerId: 'P07', name: 'Divya Bhardwaj' },
    { playerId: 'P08', name: 'Siddharth Dinakaran' },
    { playerId: 'P09', name: 'Pranjal Kaushal' },
    { playerId: 'P10', name: 'Vinayak Gadag' },
    { playerId: 'P11', name: 'Bhavishya Motwani' },
    { playerId: 'P12', name: 'Geetansh Jain' },
    { playerId: 'P13', name: 'Darsheel Shukla' },
    { playerId: 'P14', name: 'Savitr Chauhan' },
    { playerId: 'P15', name: 'Dhruv Garg' },
    { playerId: 'P16', name: 'Shreyash Amit Asati' },
  ];

  const bidders = await Promise.all(
    bidderData.map(bidder =>
      prisma.bidder.create({
        data: {
          name: `${bidder.playerId} - ${bidder.name}`,
          initialBudget: 200, // $200M (in millions)
          remainingBudget: 200, // Start with full budget
          totalUtility: 0,
          isQualified: false,
          hostelsCount: 0,
          clubsCount: 0,
          datingCount: 0,
          friendsCount: 0,
          totalItems: 0,
          // Initialize theme utilities
          hostelsUtility: 0,
          clubsUtility: 0,
          datingUtility: 0,
          friendsUtility: 0,
          wildcardsCount: 0,
          // Initialize multipliers to 1.0 (no effect)
          hostelsMultiplier: 1.0,
          clubsMultiplier: 1.0,
          datingMultiplier: 1.0,
          friendsMultiplier: 1.0,
        },
      })
    )
  );
  console.log(`✅ Created ${bidders.length} bidders`);

  // Hostels (prices in Million $)
  const hostels = [
    { name: 'Aravali', basePrice: 15, utility: 84 },
    { name: 'Girnar', basePrice: 10, utility: 78 },
    { name: 'Himadri', basePrice: 11, utility: 81 },
    { name: 'Jwalamukhi', basePrice: 12, utility: 82 },
    { name: 'Kailash', basePrice: 10, utility: 80 },
    { name: 'Kara', basePrice: 5, utility: 79 },
    { name: 'Kumaon', basePrice: 8, utility: 89 },
    { name: 'Nilgiri', basePrice: 11, utility: 87 },
    { name: 'Satpura', basePrice: 10, utility: 82 },
    { name: 'Shivalik', basePrice: 13, utility: 88 },
    { name: 'Udaigiri', basePrice: 9, utility: 76 },
    { name: 'Vindhyachal', basePrice: 11, utility: 86 },
    { name: 'Zanskar', basePrice: 12, utility: 77 },
  ];

  // Clubs
  const clubs = [
    { name: 'Dance', basePrice: 10, utility: 85 },
    { name: 'Deb', basePrice: 10, utility: 82 },
    { name: 'Drama', basePrice: 5, utility: 78 },
    { name: 'Music', basePrice: 5, utility: 75 },
    { name: 'Design', basePrice: 5, utility: 75 },
    { name: 'Pfc', basePrice: 10, utility: 86 },
    { name: 'Hs', basePrice: 5, utility: 79 },
    { name: 'Lit', basePrice: 15, utility: 89 },
    { name: 'Qc', basePrice: 10, utility: 85 },
    { name: 'Dev', basePrice: 15, utility: 90 },
    { name: 'Robotics', basePrice: 15, utility: 91 },
    { name: 'Axlr8r', basePrice: 10, utility: 85 },
    { name: 'Indradhanu', basePrice: 23, utility: 85 },
    { name: 'Enactus', basePrice: 25, utility: 82 },
    { name: 'Edc', basePrice: 23, utility: 78 },
    { name: 'Igts', basePrice: 23, utility: 86 },
    { name: 'IITD on air', basePrice: 8, utility: 74 },
    { name: 'Aero', basePrice: 13, utility: 77 },
    { name: 'Pac', basePrice: 15, utility: 78 },
    { name: 'Eco', basePrice: 16, utility: 88 },
  ];

  // Dating Preference
  const dating = [
    { name: 'Senior girl', basePrice: 15, utility: 88 },
    { name: 'Senior guy', basePrice: 10, utility: 81 },
    { name: 'Du girl', basePrice: 10, utility: 82 },
    { name: 'Du boy', basePrice: 5, utility: 72 },
    { name: 'Junior girl', basePrice: 5, utility: 75 },
    { name: 'Junior boy', basePrice: 5, utility: 70 },
    { name: 'Junior non - binary', basePrice: 15, utility: 89 },
    { name: 'Senior non - binary', basePrice: 10, utility: 78 },
    { name: 'In year non - binary', basePrice: 7, utility: 79 },
    { name: 'In year girl', basePrice: 5, utility: 74 },
    { name: 'In year guy', basePrice: 15, utility: 90 },
    { name: 'Study buddy', basePrice: 10, utility: 81 },
    { name: 'Emotionally unavailable', basePrice: 15, utility: 91 },
    { name: 'Forever situationship', basePrice: 10, utility: 82 },
    { name: 'Class clown', basePrice: 10, utility: 78 },
  ];

  // Friend Type
  const friends = [
    { name: 'Love guru', basePrice: 5, utility: 74 },
    { name: 'Machau', basePrice: 5, utility: 78 },
    { name: 'Weekend escape artist', basePrice: 10, utility: 84 },
    { name: 'Hostel chef', basePrice: 10, utility: 85 },
    { name: 'Jugaadu', basePrice: 10, utility: 87 },
    { name: 'Social butterfly', basePrice: 15, utility: 88 },
    { name: 'Maggu', basePrice: 10, utility: 84 },
    { name: 'Inseparables', basePrice: 15, utility: 90 },
    { name: 'Kumbhakarna', basePrice: 10, utility: 81 },
    { name: 'Tipsy', basePrice: 10, utility: 82 },
    { name: 'Poltubaaz', basePrice: 10, utility: 83 },
    { name: 'Depc', basePrice: 5, utility: 79 },
    { name: 'Hostel paglu', basePrice: 5, utility: 78 },
    { name: 'Doraemon', basePrice: 10, utility: 86 },
    { name: 'Medicine', basePrice: 5, utility: 76 },
    { name: 'Common room', basePrice: 5, utility: 75 },
    { name: '3 am philosopher', basePrice: 15, utility: 91 },
    { name: '2 am Tutor', basePrice: 23, utility: 94 },
    { name: 'Borrower', basePrice: 5, utility: 77 },
    { name: 'Gian', basePrice: 5, utility: 79 },
  ];

  // Create all items
  const allItems = [
    ...hostels.map(item => ({ ...item, category: 'Hostels' })),
    ...clubs.map(item => ({ ...item, category: 'Clubs' })),
    ...dating.map(item => ({ ...item, category: 'Dating Preference' })),
    ...friends.map(item => ({ ...item, category: 'Friend Type' })),
  ];

  for (const item of allItems) {
    await prisma.item.create({
      data: {
        name: item.name,
        category: item.category,
        utility: item.utility,
        basePrice: item.basePrice,
        status: 'available',
      },
    });
  }
  console.log(`✅ Created ${allItems.length} items`);

  console.log('🎉 Seed completed successfully!');
  console.log(`📊 Total: ${bidders.length} players, ${allItems.length} items`);
  console.log(`💰 Budget per player: $200M`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

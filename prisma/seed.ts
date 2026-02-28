import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (order matters for foreign keys)
  await pool.query('DELETE FROM "Wildcard"');
  await pool.query('DELETE FROM "Item"');
  await pool.query('DELETE FROM "Bidder"');
  console.log('✅ Cleared existing data');

  // Create bidders
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

  for (const b of bidderData) {
    await pool.query(
      `INSERT INTO "Bidder" (id, name, "initialBudget", "remainingBudget", "totalUtility", "isQualified", "hostelsCount", "clubsCount", "datingCount", "friendsCount", "totalItems", "hostelsUtility", "clubsUtility", "datingUtility", "friendsUtility", "hostelsMultiplier", "clubsMultiplier", "datingMultiplier", "friendsMultiplier", "wildcardsCount", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 200, 200, 0, false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 1.0, 1.0, 0, NOW(), NOW())`,
      [`${b.playerId} - ${b.name}`]
    );
  }
  console.log(`✅ Created ${bidderData.length} players`);

  // Items by category
  const allItems = [
    // CATEGORY 1 — COMBAT ROLES
    ...[
      { name: 'Infantry Rifleman', basePrice: 5, utility: 78 },
      { name: 'Section Commander', basePrice: 10, utility: 84 },
      { name: 'Platoon Leader', basePrice: 14, utility: 88 },
      { name: 'Company Commander', basePrice: 18, utility: 92 },
      { name: 'Sniper Specialist', basePrice: 20, utility: 93 },
      { name: 'Machine Gun Operator', basePrice: 11, utility: 85 },
      { name: 'Combat Medic', basePrice: 16, utility: 90 },
      { name: 'Field Engineer', basePrice: 12, utility: 86 },
      { name: 'Signals Operator', basePrice: 7, utility: 80 },
      { name: 'Reconnaissance Scout', basePrice: 15, utility: 89 },
      { name: 'Paratrooper', basePrice: 17, utility: 91 },
      { name: 'Armoured Corps Officer', basePrice: 16, utility: 90 },
      { name: 'Artillery Fire Controller', basePrice: 13, utility: 87 },
      { name: 'Helicopter Pilot', basePrice: 19, utility: 92 },
      { name: 'Fighter Pilot', basePrice: 23, utility: 95 },
      { name: 'Naval Warfare Officer', basePrice: 18, utility: 91 },
      { name: 'Special Forces Operator', basePrice: 25, utility: 96 },
      { name: 'Explosive Ordnance Specialist', basePrice: 14, utility: 88 },
    ].map(i => ({ ...i, category: 'Combat Roles' })),

    // CATEGORY 2 — STRATEGIC ASSETS & EQUIPMENT
    ...[
      { name: 'Assault Rifle System', basePrice: 8, utility: 80 },
      { name: 'Sniper Weapon System', basePrice: 15, utility: 88 },
      { name: 'Light Machine Gun', basePrice: 11, utility: 84 },
      { name: 'Advanced Body Armour', basePrice: 12, utility: 85 },
      { name: 'Night Vision System', basePrice: 16, utility: 90 },
      { name: 'Tactical Drone', basePrice: 18, utility: 91 },
      { name: 'Surveillance Radar', basePrice: 13, utility: 87 },
      { name: 'Battle Tank Platform', basePrice: 24, utility: 95 },
      { name: 'Infantry Fighting Vehicle', basePrice: 15, utility: 89 },
      { name: 'Attack Helicopter', basePrice: 22, utility: 94 },
      { name: 'Multirole Fighter Jet', basePrice: 26, utility: 97 },
      { name: 'Satellite Recon Support', basePrice: 20, utility: 93 },
      { name: 'Secure Communications Suite', basePrice: 12, utility: 86 },
      { name: 'Field Medical Unit', basePrice: 14, utility: 88 },
      { name: 'Mobile Command Vehicle', basePrice: 17, utility: 90 },
      { name: 'Electronic Warfare Suite', basePrice: 19, utility: 92 },
      { name: 'Precision Guided Munition', basePrice: 23, utility: 94 },
      { name: 'Logistics Supply Convoy', basePrice: 10, utility: 83 },
    ].map(i => ({ ...i, category: 'Strategic Assets & Equipment' })),

    // CATEGORY 3 — MISSION ENVIRONMENTS
    ...[
      { name: 'Desert Warfare Theatre', basePrice: 12, utility: 86 },
      { name: 'Mountain Warfare Zone', basePrice: 18, utility: 91 },
      { name: 'Urban Combat Sector', basePrice: 17, utility: 90 },
      { name: 'Jungle Operations Region', basePrice: 15, utility: 88 },
      { name: 'Arctic Operations Zone', basePrice: 16, utility: 89 },
      { name: 'Maritime Operations Area', basePrice: 14, utility: 87 },
      { name: 'High Altitude Sector', basePrice: 19, utility: 92 },
      { name: 'Night Operations Environment', basePrice: 20, utility: 93 },
      { name: 'Electronic Warfare Zone', basePrice: 22, utility: 94 },
      { name: 'Contested Border Region', basePrice: 17, utility: 90 },
      { name: 'Forward Operating Area', basePrice: 12, utility: 85 },
      { name: 'Deep Strike Theatre', basePrice: 24, utility: 95 },
      { name: 'Amphibious Landing Zone', basePrice: 16, utility: 89 },
      { name: 'Air Superiority Sector', basePrice: 22, utility: 94 },
      { name: 'Integrated Battle Space', basePrice: 25, utility: 96 },
      { name: 'Defensive Perimeter Zone', basePrice: 11, utility: 84 },
      { name: 'Rapid Deployment Corridor', basePrice: 15, utility: 88 },
      { name: 'Strategic High Ground', basePrice: 26, utility: 97 },
    ].map(i => ({ ...i, category: 'Mission Environments' })),

    // CATEGORY 4 — SPECIAL OPERATIONS & STRATEGIC ACTIONS
    ...[
      { name: 'Precision Air Strike', basePrice: 25, utility: 96 },
      { name: 'Covert Infiltration Mission', basePrice: 23, utility: 94 },
      { name: 'Special Forces Raid', basePrice: 24, utility: 95 },
      { name: 'Strategic Recon Mission', basePrice: 17, utility: 90 },
      { name: 'Electronic Disruption Operation', basePrice: 19, utility: 92 },
      { name: 'Rapid Reinforcement Deployment', basePrice: 18, utility: 91 },
      { name: 'Forward Base Establishment', basePrice: 14, utility: 88 },
      { name: 'Amphibious Assault', basePrice: 21, utility: 93 },
      { name: 'Defensive Fortification', basePrice: 12, utility: 85 },
      { name: 'Convoy Protection Detail', basePrice: 11, utility: 84 },
      { name: 'Search and Rescue Mission', basePrice: 16, utility: 89 },
      { name: 'Combat Air Patrol', basePrice: 17, utility: 90 },
      { name: 'Missile Defence Activation', basePrice: 20, utility: 92 },
      { name: 'Joint Forces Coordination', basePrice: 22, utility: 94 },
      { name: 'Battlefield Evacuation', basePrice: 14, utility: 88 },
      { name: 'Strategic Deterrence Posture', basePrice: 21, utility: 93 },
      { name: 'Night Operations Deployment', basePrice: 18, utility: 91 },
      { name: 'Emergency Response Mobilisation', basePrice: 13, utility: 87 },
    ].map(i => ({ ...i, category: 'Special Operations & Strategic Actions' })),
  ];

  for (const item of allItems) {
    await pool.query(
      `INSERT INTO "Item" (id, name, category, utility, "basePrice", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'available', NOW(), NOW())`,
      [item.name, item.category, item.utility, item.basePrice]
    );
  }
  console.log(`✅ Created ${allItems.length} items`);

  console.log('🎉 Seed completed successfully!');
  console.log(`📊 Total: ${bidderData.length} players, ${allItems.length} items`);
  console.log(`💰 Budget per player: $200M`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

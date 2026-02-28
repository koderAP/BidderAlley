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
  console.log(`✅ Created ${bidderData.length} commanders`);

  // Items by category
  const allItems = [
    // CATEGORY 1 — COMBAT ROLES
    ...[
      { name: 'Infantry Commander', basePrice: 15, utility: 84 },
      { name: 'Sniper Specialist', basePrice: 10, utility: 78 },
      { name: 'Tank Commander', basePrice: 11, utility: 81 },
      { name: 'Artillery Officer', basePrice: 12, utility: 82 },
      { name: 'Combat Medic', basePrice: 10, utility: 80 },
      { name: 'Demolitions Expert', basePrice: 5, utility: 79 },
      { name: 'Paratrooper', basePrice: 8, utility: 89 },
      { name: 'Naval Officer', basePrice: 11, utility: 87 },
      { name: 'Air Force Pilot', basePrice: 10, utility: 82 },
      { name: 'Special Forces Operator', basePrice: 13, utility: 88 },
      { name: 'Communications Officer', basePrice: 9, utility: 76 },
      { name: 'Intelligence Analyst', basePrice: 11, utility: 86 },
      { name: 'Field Engineer', basePrice: 12, utility: 77 },
    ].map(i => ({ ...i, category: 'Combat Roles' })),

    // CATEGORY 2 — STRATEGIC ASSETS & EQUIPMENT
    ...[
      { name: 'Stealth Drone', basePrice: 10, utility: 85 },
      { name: 'EMP Device', basePrice: 10, utility: 82 },
      { name: 'Tactical Shield', basePrice: 5, utility: 78 },
      { name: 'Night Vision Suite', basePrice: 5, utility: 75 },
      { name: 'Cyber Warfare Kit', basePrice: 5, utility: 75 },
      { name: 'Satellite Uplink', basePrice: 10, utility: 86 },
      { name: 'Ballistic Armor', basePrice: 5, utility: 79 },
      { name: 'Laser Designator', basePrice: 15, utility: 89 },
      { name: 'Radar Jammer', basePrice: 10, utility: 85 },
      { name: 'Nuclear Submarine', basePrice: 15, utility: 90 },
      { name: 'Attack Helicopter', basePrice: 15, utility: 91 },
      { name: 'Cruise Missile', basePrice: 10, utility: 85 },
      { name: 'Anti-Aircraft System', basePrice: 23, utility: 85 },
      { name: 'Armored Transport', basePrice: 25, utility: 82 },
      { name: 'Mine Sweeper', basePrice: 23, utility: 78 },
      { name: 'Command Vehicle', basePrice: 23, utility: 86 },
      { name: 'Surveillance Satellite', basePrice: 8, utility: 74 },
      { name: 'Stealth Fighter', basePrice: 13, utility: 77 },
      { name: 'Guided Missile System', basePrice: 15, utility: 78 },
      { name: 'Electronic Countermeasures', basePrice: 16, utility: 88 },
    ].map(i => ({ ...i, category: 'Strategic Assets & Equipment' })),

    // CATEGORY 3 — MISSION ENVIRONMENTS
    ...[
      { name: 'Arctic Tundra', basePrice: 15, utility: 88 },
      { name: 'Desert Wasteland', basePrice: 10, utility: 81 },
      { name: 'Urban Warzone', basePrice: 10, utility: 82 },
      { name: 'Dense Jungle', basePrice: 5, utility: 72 },
      { name: 'Mountain Pass', basePrice: 5, utility: 75 },
      { name: 'Underground Bunker', basePrice: 5, utility: 70 },
      { name: 'Open Sea', basePrice: 15, utility: 89 },
      { name: 'Volcanic Island', basePrice: 10, utility: 78 },
      { name: 'Nuclear Fallout Zone', basePrice: 7, utility: 79 },
      { name: 'Swamp Delta', basePrice: 5, utility: 74 },
      { name: 'High Altitude Base', basePrice: 15, utility: 90 },
      { name: 'Coastal Fortress', basePrice: 10, utility: 81 },
      { name: 'Abandoned City', basePrice: 15, utility: 91 },
      { name: 'Space Station', basePrice: 10, utility: 82 },
      { name: 'Deep Forest Camp', basePrice: 10, utility: 78 },
    ].map(i => ({ ...i, category: 'Mission Environments' })),

    // CATEGORY 4 — SPECIAL OPERATIONS & STRATEGIC ACTIONS
    ...[
      { name: 'Hostage Rescue', basePrice: 5, utility: 74 },
      { name: 'Assassination Mission', basePrice: 5, utility: 78 },
      { name: 'Supply Line Sabotage', basePrice: 10, utility: 84 },
      { name: 'Chemical Warfare Defense', basePrice: 10, utility: 85 },
      { name: 'Cyber Attack', basePrice: 10, utility: 87 },
      { name: 'Diplomatic Espionage', basePrice: 15, utility: 88 },
      { name: 'Recon Mission', basePrice: 10, utility: 84 },
      { name: 'Deep Cover Infiltration', basePrice: 15, utility: 90 },
      { name: 'Diversion Operation', basePrice: 10, utility: 81 },
      { name: 'Black Market Deal', basePrice: 10, utility: 82 },
      { name: 'Propaganda Campaign', basePrice: 10, utility: 83 },
      { name: 'Counter Intelligence', basePrice: 5, utility: 79 },
      { name: 'Prisoner Extraction', basePrice: 5, utility: 78 },
      { name: 'Air Strike Coordination', basePrice: 10, utility: 86 },
      { name: 'Bioweapon Neutralization', basePrice: 5, utility: 76 },
      { name: 'Forward Operating Base', basePrice: 5, utility: 75 },
      { name: 'Night Raid', basePrice: 15, utility: 91 },
      { name: 'Siege Warfare', basePrice: 23, utility: 94 },
      { name: 'Arms Dealing', basePrice: 5, utility: 77 },
      { name: 'Scorched Earth Protocol', basePrice: 5, utility: 79 },
    ].map(i => ({ ...i, category: 'Special Operations & Strategic Actions' })),
  ];

  for (const item of allItems) {
    await pool.query(
      `INSERT INTO "Item" (id, name, category, utility, "basePrice", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'available', NOW(), NOW())`,
      [item.name, item.category, item.utility, item.basePrice]
    );
  }
  console.log(`✅ Created ${allItems.length} tactical assets`);

  console.log('🎉 Seed completed successfully!');
  console.log(`📊 Total: ${bidderData.length} commanders, ${allItems.length} assets`);
  console.log(`💰 Budget per commander: $200M`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

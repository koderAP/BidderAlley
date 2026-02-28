import { query } from '@/lib/db';

export async function calculateTotalUtility(bidderId: string): Promise<number> {
  const result = await query(
    'SELECT "hostelsUtility", "clubsUtility", "datingUtility", "friendsUtility", "hostelsMultiplier", "clubsMultiplier", "datingMultiplier", "friendsMultiplier" FROM "Bidder" WHERE id = $1',
    [bidderId]
  );

  if (result.rows.length === 0) {
    throw new Error('Bidder not found');
  }

  const b = result.rows[0];
  const totalUtility =
    b.hostelsUtility * b.hostelsMultiplier +
    b.clubsUtility * b.clubsMultiplier +
    b.datingUtility * b.datingMultiplier +
    b.friendsUtility * b.friendsMultiplier;

  return Math.floor(totalUtility);
}

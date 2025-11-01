import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate the total utility for a bidder based on their theme utilities and wildcard multipliers
 * Formula: totalUtility = (hostelsUtility × hostelsMultiplier) + (clubsUtility × clubsMultiplier) + ...
 * The multipliers are already stored in the bidder record and represent the product of all wildcard multipliers
 */
export async function calculateTotalUtility(bidderId: string): Promise<number> {
  const bidder = await prisma.bidder.findUnique({
    where: { id: bidderId },
  });

  if (!bidder) {
    throw new Error('Bidder not found');
  }

  const totalUtility =
    bidder.hostelsUtility * bidder.hostelsMultiplier +
    bidder.clubsUtility * bidder.clubsMultiplier +
    bidder.datingUtility * bidder.datingMultiplier +
    bidder.friendsUtility * bidder.friendsMultiplier;

  return Math.floor(totalUtility);
}

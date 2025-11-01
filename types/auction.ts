export type Category = 'Clubs' | 'Hostels' | 'Dating Preference' | 'Friend Type';

export interface Item {
  id: string;
  name: string;
  category: Category;
  utility: number;
  basePrice: number;
  soldPrice?: number | null;
  soldTo?: string | null;
  status: 'available' | 'sold';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Bidder {
  id: string;
  name: string;
  initialBudget: number;
  remainingBudget: number;
  totalUtility: number;
  isQualified: boolean;
  hostelsCount: number;
  clubsCount: number;
  datingCount: number;
  friendsCount: number;
  totalItems: number;
  hostelsUtility: number;
  clubsUtility: number;
  datingUtility: number;
  friendsUtility: number;
  wildcardsCount: number;
  hostelsMultiplier: number;
  clubsMultiplier: number;
  datingMultiplier: number;
  friendsMultiplier: number;
  items?: Item[];
  wildcards?: Wildcard[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Wildcard {
  id: string;
  name: string;
  price: number;
  bidderId: string;
  hostelsMultiplier: number;
  clubsMultiplier: number;
  datingMultiplier: number;
  friendsMultiplier: number;
  countsAsTheme?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuctionData {
  items: Item[];
  bidders: Bidder[];
  categories: Category[];
  wildcards?: Wildcard[];
}

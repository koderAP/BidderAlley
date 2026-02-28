'use client';

import { useEffect, useState } from 'react';
import { AuctionData, Category } from '@/types/auction';
import Link from 'next/link';

const categories: Category[] = ['Combat Roles', 'Strategic Assets & Equipment', 'Mission Environments', 'Special Operations & Strategic Actions'];

const categoryShort: Record<Category, string> = {
  'Combat Roles': 'CR',
  'Strategic Assets & Equipment': 'SA',
  'Mission Environments': 'ME',
  'Special Operations & Strategic Actions': 'SO',
};

const categoryColors: Record<Category, { border: string; text: string; bg: string; badge: string; badgeText: string }> = {
  'Combat Roles': { border: 'border-red-300', text: 'text-red-700', bg: 'bg-red-50', badge: 'bg-red-100', badgeText: 'text-red-700' },
  'Strategic Assets & Equipment': { border: 'border-amber-300', text: 'text-amber-700', bg: 'bg-amber-50', badge: 'bg-amber-100', badgeText: 'text-amber-700' },
  'Mission Environments': { border: 'border-emerald-300', text: 'text-emerald-700', bg: 'bg-emerald-50', badge: 'bg-emerald-100', badgeText: 'text-emerald-700' },
  'Special Operations & Strategic Actions': { border: 'border-violet-300', text: 'text-violet-700', bg: 'bg-violet-50', badge: 'bg-violet-100', badgeText: 'text-violet-700' },
};

export default function AuctionDashboard() {
  const [data, setData] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [itemsRes, biddersRes, wildcardsRes] = await Promise.all([
        fetch('/api/items', { cache: 'no-store' }),
        fetch('/api/bidders', { cache: 'no-store' }),
        fetch('/api/wildcards', { cache: 'no-store' }),
      ]);

      if (!itemsRes.ok || !biddersRes.ok || !wildcardsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const items = await itemsRes.json();
      const bidders = await biddersRes.json();
      const wildcards = await wildcardsRes.json();

      setData({ items, bidders, categories, wildcards });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please refresh the page.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-red-500 mb-4">{error}</div>
        <button onClick={fetchData} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-500">No data available</div>
      </div>
    );
  }

  const soldItems = data.items.filter(item => item.status === 'sold');
  const totalRevenue = soldItems.reduce((sum, item) => sum + (item.soldPrice || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">STRATEZENITH FINAL</h1>
              <p className="text-base text-blue-600 font-semibold">English Auction</p>
              <p className="text-gray-500 text-sm">Live Tactical Auction System</p>
            </div>
            <Link
              href="/admin"
              className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 border border-gray-300 text-sm font-medium"
            >
              Admin
            </Link>
          </div>

          {/* Mission Briefing */}
          <div className="mt-4 p-5 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-bold text-blue-800 mb-2">Mission Briefing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to <strong>Stratezenith Final</strong> — the ultimate tactical auction.
              Commanders compete to build the most powerful force by strategically acquiring assets across four critical dimensions.
              Deploy your budget wisely across all sectors to qualify and maximize your strategic utility score.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {categories.map((cat) => (
                <div key={cat} className={`${categoryColors[cat].bg} p-3 rounded-lg border ${categoryColors[cat].border}`}>
                  <h3 className={`font-semibold ${categoryColors[cat].text} mb-1 text-sm`}>{cat}</h3>
                  <p className="text-xs text-gray-600">
                    {cat === 'Combat Roles' && 'Frontline leadership and battlefield specialists.'}
                    {cat === 'Strategic Assets & Equipment' && 'Weapons, tech, and critical infrastructure.'}
                    {cat === 'Mission Environments' && 'Terrain and operational theaters of war.'}
                    {cat === 'Special Operations & Strategic Actions' && 'Covert ops, intelligence, and tactical maneuvers.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-4 p-5 bg-yellow-50 rounded-lg border border-yellow-200">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">How Does an English Auction Work?</h2>
            <p className="text-gray-700 leading-relaxed">
              In this <strong>English Auction</strong> format, commanders openly compete by placing
              increasingly higher bids. Each bid must exceed the previous one. The auction concludes
              when no one is willing to outbid the current highest offer. The victor acquires the asset at their final bid price.
            </p>
            <div className="mt-3 p-3 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong className="text-blue-600">Objective:</strong> Build a complete tactical force by strategically bidding
                across all four sectors to qualify and maximize your total utility score!
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-700 text-sm font-medium">ASSETS ACQUIRED</p>
              <p className="text-2xl font-bold text-green-800">{soldItems.length} / {data.items.length}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-amber-700 text-sm font-medium">TOTAL EXPENDITURE</p>
              <p className="text-2xl font-bold text-amber-800">${totalRevenue}M</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-sm font-medium">ACTIVE COMMANDERS</p>
              <p className="text-2xl font-bold text-blue-800">{data.bidders.filter(b => b.totalItems > 0).length}</p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Commander Leaderboard</h2>
          <p className="text-gray-500 mb-4 text-sm">Ranked by Qualification Status → Total Utility → Remaining Budget</p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commander</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utility</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget ($M)</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets (CR/SA/ME/SO)</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...data.bidders]
                  .sort((a, b) => {
                    if (a.isQualified !== b.isQualified) return b.isQualified ? 1 : -1;
                    if (b.totalUtility !== a.totalUtility) return b.totalUtility - a.totalUtility;
                    return b.remainingBudget - a.remainingBudget;
                  })
                  .map((bidder, index) => {
                    const budgetUsed = bidder.initialBudget - bidder.remainingBudget;
                    const budgetPercentage = (budgetUsed / bidder.initialBudget) * 100;

                    return (
                      <tr key={bidder.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">
                            {bidder.name}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-base border border-blue-200">
                            {bidder.totalUtility}
                            {bidder.wildcardsCount > 0 && (
                              <span className="ml-1.5 text-amber-600 text-xs">
                                W×{bidder.wildcardsCount}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-700">${bidder.remainingBudget}M</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${budgetPercentage > 80 ? 'bg-red-500' :
                                budgetPercentage > 50 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                              style={{ width: `${100 - budgetPercentage}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium text-xs">
                              CR:{bidder.hostelsCount}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium text-xs">
                              SA:{bidder.clubsCount}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium text-xs">
                              ME:{bidder.datingCount}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-violet-100 text-violet-700 font-medium text-xs">
                              SO:{bidder.friendsCount}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Total: {bidder.totalItems}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {bidder.isQualified ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                              QUALIFIED
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                                NOT QUALIFIED
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {[bidder.hostelsCount > 0, bidder.clubsCount > 0, bidder.datingCount > 0, bidder.friendsCount > 0].filter(Boolean).length < 2 && <div>Need: cards in 2+ categories</div>}
                                {bidder.totalItems < 4 && <div>Need: {4 - bidder.totalItems} more cards (min 4)</div>}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Qualification Requirements */}
          <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Qualification Requirements:</h3>
            <div className="grid grid-cols-1 gap-1.5 text-sm text-gray-600">
              <div>- At least <span className="font-semibold text-blue-600">1 card</span> in at least <span className="font-semibold text-blue-600">2 different categories</span></div>
              <div>- Minimum <span className="font-semibold text-blue-600">4 total cards</span> overall</div>
            </div>
          </div>
        </div>

        {/* Items by Category */}
        {data.categories.map((category) => {
          const categoryItems = data.items.filter(item => item.category === category);
          const soldCategoryItems = categoryItems.filter(item => item.status === 'sold');
          const colors = categoryColors[category];

          return (
            <div key={category} className={`bg-white rounded-xl shadow-sm border ${colors.border} p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${colors.text}`}>{category}</h2>
                <span className="text-sm text-gray-500">
                  {soldCategoryItems.length} / {categoryItems.length} acquired
                </span>
              </div>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Utility values are hidden until assets are acquired. Unacquired assets show &quot;--&quot;.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utility</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price ($M)</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acquired By</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Price ($M)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryItems.map((item) => {
                      const buyer = item.soldTo ? data.bidders.find(b => b.id === item.soldTo) : null;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-800">{item.name}</div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {item.status === 'sold' ? item.utility : (
                                <span className="text-gray-400 font-bold">--</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-700">${item.basePrice}M</div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${item.status === 'sold'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {item.status === 'sold' ? 'Acquired' : 'Available'}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{buyer ? buyer.name : '-'}</div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-700">
                              {item.soldPrice ? `$${item.soldPrice}M` : '-'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Wildcards Section */}
        {data.wildcards && data.wildcards.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Tactical Wildcards</h2>
            <p className="text-gray-500 text-sm mb-4">
              Wildcards provide multipliers to boost your utility scores.
              Multipliers are <strong>multiplicative</strong> — they stack by multiplication (e.g., 2.0x and 1.3x = 2.6x).
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wildcard</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price ($M)</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combat</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missions</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spec Ops</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.wildcards.map((wildcard) => {
                    const owner = wildcard.bidderId
                      ? data.bidders.find(b => b.id === wildcard.bidderId)
                      : null;

                    return (
                      <tr key={wildcard.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">{wildcard.name}</div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-700">${wildcard.price}M</div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${wildcard.hostelsMultiplier > 1
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-400'
                            }`}>
                            {wildcard.hostelsMultiplier}x
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${wildcard.clubsMultiplier > 1
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-gray-100 text-gray-400'
                            }`}>
                            {wildcard.clubsMultiplier}x
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${wildcard.datingMultiplier > 1
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-gray-100 text-gray-400'
                            }`}>
                            {wildcard.datingMultiplier}x
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${wildcard.friendsMultiplier > 1
                            ? 'bg-violet-100 text-violet-700 border border-violet-300'
                            : 'bg-gray-100 text-gray-400'
                            }`}>
                            {wildcard.friendsMultiplier}x
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {owner ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                              {owner.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Wildcard Info:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>- <strong>Multipliers:</strong> Boost your utility scores for specific categories (e.g., 2.0x doubles your utility)</li>
                <li>- <strong>Stacking:</strong> Multiple wildcards multiply together (2.0x and 1.3x = 2.6x total)</li>
                <li>- <strong>Strategy:</strong> Use wildcards to reinforce weak sectors or dominate strong ones</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

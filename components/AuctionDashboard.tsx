'use client';

import { useEffect, useState } from 'react';
import { AuctionData, Category } from '@/types/auction';
import Link from 'next/link';

const categories: Category[] = ['Combat Roles', 'Strategic Assets & Equipment', 'Mission Environments', 'Special Operations & Strategic Actions'];

const categoryIcons: Record<Category, string> = {
  'Combat Roles': '⚔️',
  'Strategic Assets & Equipment': '🎯',
  'Mission Environments': '🌍',
  'Special Operations & Strategic Actions': '🔥',
};

const categoryShort: Record<Category, string> = {
  'Combat Roles': 'CR',
  'Strategic Assets & Equipment': 'SA',
  'Mission Environments': 'ME',
  'Special Operations & Strategic Actions': 'SO',
};

const categoryColors: Record<Category, { border: string; text: string; bg: string; badge: string; badgeText: string }> = {
  'Combat Roles': { border: 'border-red-700', text: 'text-red-400', bg: 'bg-red-950/40', badge: 'bg-red-900/60', badgeText: 'text-red-300' },
  'Strategic Assets & Equipment': { border: 'border-amber-700', text: 'text-amber-400', bg: 'bg-amber-950/40', badge: 'bg-amber-900/60', badgeText: 'text-amber-300' },
  'Mission Environments': { border: 'border-emerald-700', text: 'text-emerald-400', bg: 'bg-emerald-950/40', badge: 'bg-emerald-900/60', badgeText: 'text-emerald-300' },
  'Special Operations & Strategic Actions': { border: 'border-violet-700', text: 'text-violet-400', bg: 'bg-violet-950/40', badge: 'bg-violet-900/60', badgeText: 'text-violet-300' },
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
      setError('Failed to load mission data. Please refresh the page.');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-green-400 font-mono animate-pulse">⏳ Loading tactical data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-xl text-red-400 mb-4 font-mono">{error}</div>
        <button
          onClick={fetchData}
          className="bg-green-700 text-green-100 px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-mono"
        >
          ↻ Retry Connection
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-400 font-mono">No mission data available</div>
      </div>
    );
  }

  const soldItems = data.items.filter(item => item.status === 'sold');
  const totalRevenue = soldItems.reduce((sum, item) => sum + (item.soldPrice || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-8 shadow-[0_0_30px_rgba(0,255,65,0.05)]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2 tracking-wide">
              ⚔️ STRATEZENITH FINAL
            </h1>
            <p className="text-lg text-green-400 font-semibold mb-1 font-mono">English Auction</p>
            <p className="text-gray-500 font-mono text-sm">Live Tactical Auction System</p>
          </div>
          <Link
            href="/admin"
            className="bg-green-800 text-green-100 px-6 py-3 rounded-lg hover:bg-green-700 transition-colors border border-green-600 font-mono text-sm tracking-wider"
          >
            🔒 COMMAND CENTER
          </Link>
        </div>

        {/* Mission Briefing */}
        <div className="mt-6 p-6 bg-gradient-to-br from-[#0d1f0d] to-[#1a1a2e] rounded-lg border-2 border-green-900/60">
          <h2 className="text-2xl font-bold text-green-400 mb-3 tracking-wide">
            🎖️ MISSION BRIEFING
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Welcome to <strong className="text-green-300">Stratezenith Final</strong> — the ultimate tactical auction.
            Commanders compete to build the most powerful force by strategically acquiring assets across four critical dimensions.
            Deploy your budget wisely across all sectors to qualify and maximize your strategic utility score.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {categories.map((cat) => (
              <div key={cat} className={`bg-[#0d1117] p-4 rounded-lg border ${categoryColors[cat].border} ${categoryColors[cat].bg}`}>
                <h3 className={`font-semibold ${categoryColors[cat].text} mb-2`}>{categoryIcons[cat]} {cat}</h3>
                <p className="text-sm text-gray-400">
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
        <div className="mt-6 p-6 bg-[#0d1117] rounded-lg border border-amber-900/40">
          <h2 className="text-xl font-semibold text-amber-400 mb-3 tracking-wide">
            📡 HOW DOES AN ENGLISH AUCTION WORK?
          </h2>
          <p className="text-gray-300 leading-relaxed">
            In this <strong className="text-amber-300">English Auction</strong> format, commanders openly compete by placing
            increasingly higher bids. Each bid must exceed the previous one, creating intense competition! The auction concludes
            when no one is willing to outbid the current highest offer. The victor acquires the asset at their final bid price.
          </p>
          <div className="mt-4 p-3 bg-[#161b22] rounded border border-green-800/50">
            <p className="text-sm text-gray-300">
              <strong className="text-green-400">🎯 Objective:</strong> Build a complete tactical force by strategically bidding
              across all four sectors to qualify and maximize your total utility score!
            </p>
          </div>
        </div>

        {/* Auction Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0d1117] p-4 rounded-lg border border-green-900/50">
            <p className="text-green-500 text-sm font-medium font-mono">ASSETS ACQUIRED</p>
            <p className="text-3xl font-bold text-green-400">
              {soldItems.length} / {data.items.length}
            </p>
          </div>
          <div className="bg-[#0d1117] p-4 rounded-lg border border-amber-900/50">
            <p className="text-amber-500 text-sm font-medium font-mono">TOTAL EXPENDITURE</p>
            <p className="text-3xl font-bold text-amber-400">${totalRevenue}M</p>
          </div>
          <div className="bg-[#0d1117] p-4 rounded-lg border border-red-900/50">
            <p className="text-red-500 text-sm font-medium font-mono">ACTIVE COMMANDERS</p>
            <p className="text-3xl font-bold text-red-400">
              {data.bidders.filter(b => b.totalItems > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Bidders Leaderboard */}
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-4 tracking-wide">🏆 COMMANDER LEADERBOARD</h2>
        <p className="text-gray-500 mb-6 font-mono text-sm">Ranked by Qualification Status → Total Utility → Remaining Budget</p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#30363d]">
            <thead className="bg-[#0d1117]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Commander</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Utility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Budget ($M)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Assets (CR/SA/ME/SO)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
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
                    <tr key={bidder.id} className="hover:bg-[#1c2128] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-300 font-mono">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-200">
                            {bidder.name}
                            {bidder.isQualified && <span className="ml-2 text-green-400">✓</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-900/40 text-green-300 font-bold text-lg border border-green-800/50">
                          {bidder.totalUtility}
                          {bidder.wildcardsCount > 0 && (
                            <span className="ml-2 text-amber-400" title={`${bidder.wildcardsCount} wildcard${bidder.wildcardsCount > 1 ? 's' : ''} applied`}>
                              🎴×{bidder.wildcardsCount}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-200 font-mono">${bidder.remainingBudget}M</div>
                        <div className="w-full bg-[#21262d] rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${budgetPercentage > 80 ? 'bg-red-500' :
                              budgetPercentage > 50 ? 'bg-amber-500' :
                                'bg-green-500'
                              }`}
                            style={{ width: `${100 - budgetPercentage}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-900/50 text-red-300 font-medium border border-red-800/30">
                            CR:{bidder.hostelsCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 font-medium border border-amber-800/30">
                            SA:{bidder.clubsCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 font-medium border border-emerald-800/30">
                            ME:{bidder.datingCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-violet-900/50 text-violet-300 font-medium border border-violet-800/30">
                            SO:{bidder.friendsCount}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">Total: {bidder.totalItems}/10</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bidder.isQualified ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-900/50 text-green-300 border border-green-700/50">
                            ✓ QUALIFIED
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-900/50 text-red-300 border border-red-700/50">
                              ✗ NOT QUALIFIED
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
        <div className="mt-6 p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
          <h3 className="text-sm font-semibold text-green-400 mb-2 font-mono">📋 QUALIFICATION REQUIREMENTS:</h3>
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-400 font-mono">
            <div>• At least <span className="font-medium text-green-400">1 card</span> in at least <span className="font-medium text-green-400">2 different categories</span></div>
            <div>• Minimum <span className="font-medium text-green-400">4 total cards</span> overall</div>
          </div>
        </div>
      </div>

      {/* Items by Category */}
      {data.categories.map((category) => {
        const categoryItems = data.items.filter(item => item.category === category);
        const soldCategoryItems = categoryItems.filter(item => item.status === 'sold');
        const colors = categoryColors[category];

        return (
          <div key={category} className={`bg-[#161b22] rounded-lg border ${colors.border}/40 p-8`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${colors.text} tracking-wide`}>
                {categoryIcons[category]} {category}
              </h2>
              <span className="text-sm text-gray-500 font-mono">
                {soldCategoryItems.length} / {categoryItems.length} acquired
              </span>
            </div>
            <div className="mb-4 p-3 bg-[#0d1117] border border-amber-900/30 rounded-lg">
              <p className="text-sm text-amber-400/80 font-mono">
                <strong>⚠️ INTEL:</strong> Utility values are classified until assets are acquired. Unacquired assets show &quot;--&quot;.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#30363d]">
                <thead className="bg-[#0d1117]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Asset Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Utility</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Base Price ($M)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Acquired By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Sold Price ($M)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {categoryItems.map((item) => {
                    const buyer = item.soldTo ? data.bidders.find(b => b.id === item.soldTo) : null;

                    return (
                      <tr key={item.id} className="hover:bg-[#1c2128] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-200">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {item.status === 'sold' ? item.utility : (
                              <span className="text-gray-600 font-bold" title="Utility declassified after acquisition">--</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300 font-mono">${item.basePrice}M</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'sold'
                            ? 'bg-green-900/50 text-green-300 border border-green-700/30'
                            : 'bg-amber-900/50 text-amber-300 border border-amber-700/30'
                            }`}>
                            {item.status === 'sold' ? '✓ Acquired' : '◯ Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {buyer ? buyer.name : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-300 font-mono">
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
        <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-8">
          <h2 className="text-2xl font-bold text-amber-400 mb-4 tracking-wide">🎴 TACTICAL WILDCARDS</h2>
          <p className="text-gray-400 mb-6">
            Wildcards provide multipliers to boost your utility scores and can help you qualify for categories.
            Multipliers are <strong className="text-amber-300">multiplicative</strong> — they stack by multiplication (e.g., 2.0× and 1.3× = 2.6×).
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#30363d]">
              <thead className="bg-[#0d1117]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Wildcard Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Price ($M)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">⚔️ Combat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">🎯 Assets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">🌍 Missions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">🔥 Spec Ops</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {data.wildcards.map((wildcard) => {
                  const owner = wildcard.bidderId
                    ? data.bidders.find(b => b.id === wildcard.bidderId)
                    : null;

                  return (
                    <tr key={wildcard.id} className="hover:bg-[#1c2128] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">{wildcard.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-200 font-mono">${wildcard.price}M</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${wildcard.hostelsMultiplier > 1
                          ? 'bg-red-900/50 text-red-300 border border-red-700/30'
                          : 'bg-[#21262d] text-gray-500'
                          }`}>
                          {wildcard.hostelsMultiplier}×
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${wildcard.clubsMultiplier > 1
                          ? 'bg-amber-900/50 text-amber-300 border border-amber-700/30'
                          : 'bg-[#21262d] text-gray-500'
                          }`}>
                          {wildcard.clubsMultiplier}×
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${wildcard.datingMultiplier > 1
                          ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/30'
                          : 'bg-[#21262d] text-gray-500'
                          }`}>
                          {wildcard.datingMultiplier}×
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${wildcard.friendsMultiplier > 1
                          ? 'bg-violet-900/50 text-violet-300 border border-violet-700/30'
                          : 'bg-[#21262d] text-gray-500'
                          }`}>
                          {wildcard.friendsMultiplier}×
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {owner ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700/30">
                            {owner.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-[#0d1117] rounded-lg border border-amber-900/30">
            <h3 className="text-sm font-semibold text-amber-400 mb-2 font-mono">🎴 WILDCARD INTEL:</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• <strong className="text-gray-300">Multipliers:</strong> Boost your utility scores for specific categories (e.g., 2.0× doubles your utility)</li>
              <li>• <strong className="text-gray-300">Auto-Qualification:</strong> Having a multiplier &gt; 1.0 automatically qualifies you for that category</li>
              <li>• <strong className="text-gray-300">Stacking:</strong> Multiple wildcards multiply together (2.0× and 1.3× = 2.6× total multiplier)</li>
              <li>• <strong className="text-gray-300">Strategy:</strong> Use wildcards to reinforce weak sectors or dominate strong ones</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

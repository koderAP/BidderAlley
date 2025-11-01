'use client';

import { useEffect, useState } from 'react';
import { AuctionData, Category } from '@/types/auction';
import Link from 'next/link';

const categories: Category[] = ['Clubs', 'Hostels', 'Dating Preference', 'Friend Type'];

export default function AuctionDashboard() {
  const [data, setData] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [itemsRes, biddersRes] = await Promise.all([
        fetch('/api/items', { cache: 'no-store' }),
        fetch('/api/bidders', { cache: 'no-store' }),
      ]);

      if (!itemsRes.ok || !biddersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const items = await itemsRes.json();
      const bidders = await biddersRes.json();

      setData({ items, bidders, categories });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load auction data. Please refresh the page.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchData, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading auction data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-xl text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchData}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No auction data available</div>
      </div>
    );
  }

  const soldItems = data.items.filter(item => item.status === 'sold');
  const totalRevenue = soldItems.reduce((sum, item) => sum + (item.soldPrice || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎯 Bidder's Alley 3.0
            </h1>
            <p className="text-xl text-indigo-600 font-semibold mb-1">English Auction</p>
            <p className="text-gray-600">Live Auction</p>
          </div>
          <Link 
            href="/admin" 
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Admin Login
          </Link>
        </div>
        
        {/* Event Information */}
        <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            🎓 College Survival Kit
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Welcome to Bidder's Alley 3.0! This English Auction features the ultimate <strong>College Survival Kit</strong> - 
            everything you need to thrive in college life. Compete to build your perfect college experience across four essential themes:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-2">🏠 Hostels</h3>
              <p className="text-sm text-gray-600">Your home away from home - choose your living space wisely!</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
              <h3 className="font-semibold text-purple-900 mb-2">🎭 Clubs</h3>
              <p className="text-sm text-gray-600">Join societies and clubs to pursue your passions and build your network.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-100">
              <h3 className="font-semibold text-pink-900 mb-2">💝 Dating Preference</h3>
              <p className="text-sm text-gray-600">Find your perfect companion for your college journey.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-2">👥 Friend Type</h3>
              <p className="text-sm text-gray-600">Build your squad with friends who'll make college unforgettable!</p>
            </div>
          </div>
        </div>
        
        {/* What is English Auction */}
        <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            📢 How Does an English Auction Work?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            In this <strong>English Auction</strong> format, bidders openly compete by placing increasingly higher bids. 
            Each bid must exceed the previous one, creating exciting competition! The auction concludes when no one is 
            willing to outbid the current highest offer. The winner gets the item at their final bid price. This transparent 
            format ensures items reach their true value and creates a thrilling bidding experience!
          </p>
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-sm text-gray-700">
              <strong>🎯 Goal:</strong> Build a complete College Survival Kit by strategically bidding across all four themes 
              to qualify and maximize your total utility score!
            </p>
          </div>
        </div>

        {/* Auction Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm font-medium">Items Sold</p>
            <p className="text-3xl font-bold text-green-900">
              {soldItems.length} / {data.items.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <p className="text-purple-800 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-900">${totalRevenue}M</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <p className="text-orange-800 text-sm font-medium">Active Bidders</p>
            <p className="text-3xl font-bold text-orange-900">
              {data.bidders.filter(b => b.totalItems > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Bidders Leaderboard */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Bidders Leaderboard</h2>
        <p className="text-gray-600 mb-6">Ranked by Qualification Status, then Total Utility, then Remaining Budget</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player ID & Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Utility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining Budget ($M)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items (H/C/D/F)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...data.bidders]
                .sort((a, b) => {
                  // Sort by: 1) Qualified status (descending - qualified first)
                  //          2) Total utility (descending - higher is better)
                  //          3) Remaining budget (descending - higher is better)
                  if (a.isQualified !== b.isQualified) {
                    return b.isQualified ? 1 : -1; // Qualified comes first
                  }
                  if (b.totalUtility !== a.totalUtility) {
                    return b.totalUtility - a.totalUtility;
                  }
                  return b.remainingBudget - a.remainingBudget;
                })
                .map((bidder, index) => {
                  const budgetUsed = bidder.initialBudget - bidder.remainingBudget;
                  const budgetPercentage = (budgetUsed / bidder.initialBudget) * 100;
                  
                  return (
                    <tr key={bidder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {bidder.name}
                            {bidder.isQualified && <span className="ml-2 text-green-600">✓</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-lg">
                          {bidder.totalUtility}
                          {bidder.wildcardsCount > 0 && (
                            <span className="ml-2 text-purple-600" title={`${bidder.wildcardsCount} wildcard${bidder.wildcardsCount > 1 ? 's' : ''} applied`}>
                              🎴×{bidder.wildcardsCount}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">${bidder.remainingBudget}M</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              budgetPercentage > 80 ? 'bg-red-600' : 
                              budgetPercentage > 50 ? 'bg-yellow-600' : 
                              'bg-green-600'
                            }`}
                            style={{ width: `${100 - budgetPercentage}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium">
                            H:{bidder.hostelsCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                            C:{bidder.clubsCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-pink-100 text-pink-800 font-medium">
                            D:{bidder.datingCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
                            F:{bidder.friendsCount}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Total: {bidder.totalItems}/10</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bidder.isQualified ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            ✓ QUALIFIED
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              ✗ NOT QUALIFIED
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                              {bidder.hostelsCount < 1 && bidder.hostelsMultiplier <= 1 && <div>Need: 1+ Hostels (or wildcard)</div>}
                              {bidder.hostelsCount > 3 && <div>Too many Hostels (max 3)</div>}
                              {bidder.clubsCount < 2 && bidder.clubsMultiplier <= 1 && <div>Need: 2+ Clubs (or wildcard)</div>}
                              {bidder.clubsCount > 4 && <div>Too many Clubs (max 4)</div>}
                              {bidder.datingCount < 1 && bidder.datingMultiplier <= 1 && <div>Need: 1+ Dating (or wildcard)</div>}
                              {bidder.datingCount > 2 && <div>Too many Dating (max 2)</div>}
                              {bidder.friendsCount < 2 && bidder.friendsMultiplier <= 1 && <div>Need: 2+ Friends (or wildcard)</div>}
                              {bidder.friendsCount > 4 && <div>Too many Friends (max 4)</div>}
                              {bidder.totalItems < 7 && <div>Need: 7+ total items</div>}
                              {bidder.totalItems > 10 && <div>Too many items (max 10)</div>}
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
        
        {/* Purchase Requirements Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 Qualification Requirements:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
            <div>• <span className="font-medium">Hostels:</span> 1-3 items</div>
            <div>• <span className="font-medium">Clubs:</span> 2-4 items</div>
            <div>• <span className="font-medium">Dating:</span> 1-2 items</div>
            <div>• <span className="font-medium">Friends:</span> 2-4 items</div>
            <div className="md:col-span-2">• <span className="font-medium">Total Items:</span> 7-10 items overall</div>
          </div>
        </div>
      </div>

      {/* Items by Category */}
      {data.categories.map((category) => {
        const categoryItems = data.items.filter(item => item.category === category);
        const soldCategoryItems = categoryItems.filter(item => item.status === 'sold');
        
        return (
          <div key={category} className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
              <span className="text-sm text-gray-600">
                {soldCategoryItems.length} / {categoryItems.length} sold
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Price ($M)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold To (Player)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold Price ($M)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryItems.map((item) => {
                    const buyer = item.soldTo ? data.bidders.find(b => b.id === item.soldTo) : null;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.utility}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${item.basePrice}M</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'sold' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'sold' ? 'Sold' : 'Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {buyer ? buyer.name : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
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
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item, Bidder, Category } from '@/types/auction';

const categories: Category[] = ['Clubs', 'Hostels', 'Dating Preference', 'Friend Type'];

export default function AdminDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'bidders' | 'sales' | 'wildcards'>('sales');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem('admin_authenticated');
    if (auth !== 'true') {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [itemsRes, biddersRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/bidders'),
      ]);

      if (itemsRes.ok && biddersRes.ok) {
        const itemsData = await itemsRes.json();
        const biddersData = await biddersRes.json();
        setItems(itemsData);
        setBidders(biddersData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin');
  };

  const handleItemSale = async (itemId: string, bidderId: string, soldPrice: number) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, bidderId, soldPrice }),
      });

      const data = await res.json();

      if (res.ok) {
        await loadData();
      } else {
        alert(data.error || 'Failed to record sale');
      }
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Error recording sale');
    }
  };

  const handleUnsellItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/sales?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to undo sale');
      }
    } catch (error) {
      console.error('Error undoing sale:', error);
      alert('Error undoing sale');
    }
  };

  const handleUpdateBidder = async (bidderId: string, updates: Partial<Bidder>) => {
    try {
      const res = await fetch('/api/bidders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bidderId, ...updates }),
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to update bidder');
      }
    } catch (error) {
      console.error('Error updating bidder:', error);
      alert('Error updating bidder');
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<Item>) => {
    try {
      const res = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, ...updates }),
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  const handleCreateItem = async (newItem: Omit<Item, 'id' | 'status' | 'soldTo' | 'soldPrice' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        await loadData();
        alert('Item created successfully!');
      } else {
        alert('Failed to create item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Error creating item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`/api/items?id=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleCreateBidder = async (newBidder: Omit<Bidder, 'id' | 'remainingBudget' | 'totalUtility' | 'itemsBought' | 'items'>) => {
    try {
      const res = await fetch('/api/bidders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBidder),
      });

      if (res.ok) {
        await loadData();
        alert('Bidder created successfully!');
      } else {
        alert('Failed to create bidder');
      }
    } catch (error) {
      console.error('Error creating bidder:', error);
      alert('Error creating bidder');
    }
  };

  const handleDeleteBidder = async (bidderId: string) => {
    if (!confirm('Are you sure you want to delete this bidder? This will undo all their purchases.')) return;
    
    try {
      const res = await fetch(`/api/bidders?id=${bidderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to delete bidder');
      }
    } catch (error) {
      console.error('Error deleting bidder:', error);
      alert('Error deleting bidder');
    }
  };

  const handleImportJSON = async (jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      
      if (imported.items) {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: imported.items }),
        });

        if (res.ok) {
          await loadData();
          alert('Items imported successfully!');
        } else {
          alert('Failed to import items');
        }
      }
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      items,
      bidders,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-data-${new Date().toISOString()}.json`;
    a.click();
  };

  const handleEndAuction = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will reset the entire auction!\n\n' +
      'All items will be marked as unsold.\n' +
      'All bidders will be reset to initial budgets.\n' +
      'All purchase history will be cleared.\n\n' +
      'This action cannot be undone. Are you sure?'
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirm = window.confirm(
      '🚨 FINAL CONFIRMATION\n\n' +
      'Are you ABSOLUTELY SURE you want to end the auction and reset everything?'
    );

    if (!doubleConfirm) return;

    try {
      const res = await fetch('/api/reset-auction', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Auction reset successfully! All items unsold and bidders reset to defaults.');
        await loadData();
      } else {
        alert(data.error || 'Failed to reset auction');
      }
    } catch (error) {
      console.error('Error resetting auction:', error);
      alert('Error resetting auction');
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage auction items, bidders, and sales</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEndAuction}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                title="Reset entire auction to default state"
              >
                🔄 End Auction
              </button>
              <button
                onClick={handleExportJSON}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Data
              </button>
              <a
                href="/"
                target="_blank"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Public
              </a>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'sales'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Record Sales
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'items'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manage Items
            </button>
            <button
              onClick={() => setActiveTab('bidders')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'bidders'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manage Bidders
            </button>
            <button
              onClick={() => setActiveTab('wildcards')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'wildcards'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎴 Wildcards
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'sales' && <SalesTab items={items} bidders={bidders} onSale={handleItemSale} onUnsell={handleUnsellItem} />}
            {activeTab === 'items' && <ItemsTab items={items} onUpdate={handleUpdateItem} onCreate={handleCreateItem} onDelete={handleDeleteItem} onImport={handleImportJSON} />}
            {activeTab === 'bidders' && <BiddersTab bidders={bidders} onUpdate={handleUpdateBidder} onCreate={handleCreateBidder} onDelete={handleDeleteBidder} />}
            {activeTab === 'wildcards' && <WildcardsTab bidders={bidders} onUpdate={loadData} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sales Tab Component
function SalesTab({ items, bidders, onSale, onUnsell }: { 
  items: Item[]; 
  bidders: Bidder[];
  onSale: (itemId: string, bidderId: string, soldPrice: number) => void;
  onUnsell: (itemId: string) => void;
}) {
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedBidder, setSelectedBidder] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  const availableItems = items.filter(item => 
    item.status === 'available' && 
    (filterCategory === 'all' || item.category === filterCategory)
  );

  const soldItems = items.filter(item => item.status === 'sold');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && selectedBidder && soldPrice) {
      onSale(selectedItem, selectedBidder, parseFloat(soldPrice));
      setSelectedItem('');
      setSelectedBidder('');
      setSoldPrice('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Record Sale Form */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Record New Sale</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Filter</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Item</label>
            <select
              value={selectedItem}
              onChange={(e) => {
                setSelectedItem(e.target.value);
                const item = items.find(i => i.id === e.target.value);
                if (item) setSoldPrice(item.basePrice.toString());
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Choose item...</option>
              {availableItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category}) - ${item.basePrice}M
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sold To</label>
            <select
              value={selectedBidder}
              onChange={(e) => setSelectedBidder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Choose bidder...</option>
              {bidders.map(bidder => (
                <option key={bidder.id} value={bidder.id}>
                  {bidder.name} (${bidder.remainingBudget}M remaining)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sold Price (in Million $)</label>
            <input
              type="number"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter price in millions"
              required
              min="0"
              step="1"
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Record Sale
            </button>
          </div>
        </form>
      </div>

      {/* Recently Sold Items */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Sales ({soldItems.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price ($M)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold To (Player)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Price ($M)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {soldItems.slice().reverse().map(item => {
                const bidder = bidders.find(b => b.id === item.soldTo);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.utility}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.basePrice}M
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bidder?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${item.soldPrice}M
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onUnsell(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Undo Sale
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Items Tab Component
function ItemsTab({ items, onUpdate, onCreate, onDelete, onImport }: { 
  items: Item[];
  onUpdate: (itemId: string, updates: Partial<Item>) => void;
  onCreate: (newItem: Omit<Item, 'id' | 'status' | 'soldTo' | 'soldPrice' | 'createdAt' | 'updatedAt'>) => void;
  onDelete: (itemId: string) => void;
  onImport: (json: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});
  const [jsonImport, setJsonImport] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'Clubs' as Category,
    utility: 70,
    basePrice: 500,
  });

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleImport = () => {
    onImport(jsonImport);
    setJsonImport('');
    setShowImport(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(createForm);
    setCreateForm({
      name: '',
      category: 'Clubs',
      utility: 70,
      basePrice: 500,
    });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {showCreateForm ? 'Hide' : 'Add New Item'}
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showImport ? 'Hide' : 'Import JSON'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Item</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as Category })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Utility</label>
              <input
                type="number"
                value={createForm.utility}
                onChange={(e) => setCreateForm({ ...createForm, utility: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (in Million $)</label>
              <input
                type="number"
                value={createForm.basePrice}
                onChange={(e) => setCreateForm({ ...createForm, basePrice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 15 for $15M"
                required
                min="0"
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Create Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import JSON */}
      {showImport && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste JSON (must have "items" array)
          </label>
          <textarea
            value={jsonImport}
            onChange={(e) => setJsonImport(e.target.value)}
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder='{"items": [{"name": "Item 1", "category": "Clubs", "utility": 80, "basePrice": 500}]}'
          />
          <button
            onClick={handleImport}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Import Items
          </button>
        </div>
      )}

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price ($M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                {editingId === item.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                        className="w-full px-2 py-1 border rounded"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editForm.utility || 0}
                        onChange={(e) => setEditForm({ ...editForm, utility: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editForm.basePrice || 0}
                        onChange={(e) => setEditForm({ ...editForm, basePrice: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">{item.status}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-900">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.utility}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">${item.basePrice}M</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                          disabled={item.status === 'sold'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                          disabled={item.status === 'sold'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Bidders Tab Component
function BiddersTab({ bidders, onUpdate, onCreate, onDelete }: { 
  bidders: Bidder[];
  onUpdate: (bidderId: string, updates: Partial<Bidder>) => void;
  onCreate: (newBidder: Omit<Bidder, 'id' | 'items' | 'createdAt' | 'updatedAt'>) => void;
  onDelete: (bidderId: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Bidder>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    initialBudget: 200,
  });

  const startEdit = (bidder: Bidder) => {
    setEditingId(bidder.id);
    setEditForm({ name: bidder.name, initialBudget: bidder.initialBudget });
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...createForm,
      remainingBudget: createForm.initialBudget,
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
    });
    setCreateForm({
      name: '',
      initialBudget: 200,
    });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Add New Bidder Button */}
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        {showCreateForm ? 'Hide' : 'Add New Bidder'}
      </button>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Bidder</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Initial Budget (in Million $)</label>
              <input
                type="number"
                value={createForm.initialBudget}
                onChange={(e) => setCreateForm({ ...createForm, initialBudget: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 200 for $200M"
                required
                min="0"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Create Bidder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bidders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player ID & Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initial Budget ($M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining ($M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Utility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items (H/C/D/F)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bidders.map(bidder => {
              return (
                <tr key={bidder.id} className="hover:bg-gray-50">
                  {editingId === bidder.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.initialBudget || 0}
                          onChange={(e) => setEditForm({ ...editForm, initialBudget: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">${bidder.remainingBudget}M</td>
                      <td className="px-6 py-4 text-sm">{bidder.totalUtility}</td>
                      <td className="px-6 py-4 text-sm">
                        {bidder.hostelsCount}/{bidder.clubsCount}/{bidder.datingCount}/{bidder.friendsCount} ({bidder.totalItems})
                      </td>
                      <td className="px-6 py-4">
                        {bidder.isQualified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Qualified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={saveEdit} className="text-green-600 hover:text-green-900 font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {bidder.name}
                        {bidder.isQualified && <span className="ml-2 text-green-600">✓</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">${bidder.initialBudget}M</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${bidder.remainingBudget}M</td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{bidder.totalUtility}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {bidder.hostelsCount}/{bidder.clubsCount}/{bidder.datingCount}/{bidder.friendsCount} ({bidder.totalItems})
                      </td>
                      <td className="px-6 py-4">
                        {bidder.isQualified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Qualified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => startEdit(bidder)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(bidder.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            disabled={bidder.totalItems > 0}
                            title={bidder.totalItems > 0 ? 'Cannot delete bidder with purchased items' : 'Delete bidder'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Wildcards Tab Component
function WildcardsTab({ bidders, onUpdate }: { bidders: Bidder[]; onUpdate: () => void }) {
  const [wildcardForm, setWildcardForm] = useState({
    name: '',
    price: 0,
    bidderId: '',
    hostelsMultiplier: 1.0,
    clubsMultiplier: 1.0,
    datingMultiplier: 1.0,
    friendsMultiplier: 1.0,
    countsAsTheme: '',
  });

  const [wildcards, setWildcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWildcards();
  }, []);

  const loadWildcards = async () => {
    try {
      const res = await fetch('/api/wildcards');
      if (res.ok) {
        const data = await res.json();
        setWildcards(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading wildcards:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wildcardForm.name || !wildcardForm.bidderId || wildcardForm.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/wildcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wildcardForm,
          countsAsTheme: wildcardForm.countsAsTheme || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Wildcard recorded successfully!');
        setWildcardForm({
          name: '',
          price: 0,
          bidderId: '',
          hostelsMultiplier: 1.0,
          clubsMultiplier: 1.0,
          datingMultiplier: 1.0,
          friendsMultiplier: 1.0,
          countsAsTheme: '',
        });
        await loadWildcards();
        await onUpdate();
      } else {
        alert(data.error || 'Failed to record wildcard');
      }
    } catch (error) {
      console.error('Error recording wildcard:', error);
      alert('Error recording wildcard');
    }
  };

  const handleDelete = async (wildcardId: string) => {
    if (!confirm('Are you sure you want to remove this wildcard?')) return;

    try {
      const res = await fetch(`/api/wildcards?wildcardId=${wildcardId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('✅ Wildcard removed successfully!');
        await loadWildcards();
        await onUpdate();
      } else {
        alert('Failed to remove wildcard');
      }
    } catch (error) {
      console.error('Error removing wildcard:', error);
      alert('Error removing wildcard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Wildcard Form */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🎴 Record Wildcard Purchase</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Wildcard Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wildcard Name *
              </label>
              <input
                type="text"
                value={wildcardForm.name}
                onChange={(e) => setWildcardForm({ ...wildcardForm, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., Super Hostel Boost"
                required
              />
            </div>

            {/* Bidder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bidder *
              </label>
              <select
                value={wildcardForm.bidderId}
                onChange={(e) => setWildcardForm({ ...wildcardForm, bidderId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select bidder</option>
                {bidders.map((bidder) => (
                  <option key={bidder.id} value={bidder.id}>
                    {bidder.name} (${bidder.remainingBudget}M)
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($M) *
              </label>
              <input
                type="number"
                value={wildcardForm.price}
                onChange={(e) => setWildcardForm({ ...wildcardForm, price: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
                min="0"
                required
              />
            </div>

            {/* Counts As Theme (for qualification) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Counts As Theme (Optional)
                <span className="text-xs text-gray-500 ml-1">(for qualification)</span>
              </label>
              <select
                value={wildcardForm.countsAsTheme}
                onChange={(e) => setWildcardForm({ ...wildcardForm, countsAsTheme: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">None (multiplier only)</option>
                <option value="Hostels">Hostels</option>
                <option value="Clubs">Clubs</option>
                <option value="Dating Preference">Dating Preference</option>
                <option value="Friend Type">Friend Type</option>
              </select>
            </div>
          </div>

          {/* Multipliers */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Utility Multipliers</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hostels
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.hostelsMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, hostelsMultiplier: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">1.0 = no change, 2.0 = double</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clubs
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.clubsMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, clubsMultiplier: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dating
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.datingMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, datingMultiplier: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Friends
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.friendsMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, friendsMultiplier: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Record Wildcard Purchase
          </button>
        </form>
      </div>

      {/* Wildcards List */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Purchased Wildcards</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : wildcards.length === 0 ? (
          <p className="text-gray-500">No wildcards purchased yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wildcard</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bidder</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Multipliers (H/C/D/F)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counts As</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {wildcards.map((wc) => (
                  <tr key={wc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">🎴 {wc.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{wc.bidder.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">${wc.price}M</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {wc.hostelsMultiplier}x / {wc.clubsMultiplier}x / {wc.datingMultiplier}x / {wc.friendsMultiplier}x
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {wc.countsAsTheme ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {wc.countsAsTheme}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(wc.id)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

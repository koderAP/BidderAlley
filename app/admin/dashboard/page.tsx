'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item, Bidder, Category } from '@/types/auction';

const categories: Category[] = ['Combat Roles', 'Strategic Assets & Equipment', 'Mission Environments', 'Special Operations & Strategic Actions'];

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
        alert('Asset created successfully!');
      } else {
        alert('Failed to create asset');
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Error creating asset');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const res = await fetch(`/api/items?id=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Error deleting asset');
    }
  };

  const handleCreateBidder = async (newBidder: Omit<Bidder, 'id' | 'items' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/bidders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBidder),
      });

      if (res.ok) {
        await loadData();
        alert('Commander created successfully!');
      } else {
        alert('Failed to create commander');
      }
    } catch (error) {
      console.error('Error creating commander:', error);
      alert('Error creating commander');
    }
  };

  const handleDeleteBidder = async (bidderId: string) => {
    if (!confirm('Are you sure you want to delete this commander? This will undo all their acquisitions.')) return;

    try {
      const res = await fetch(`/api/bidders?id=${bidderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to delete commander');
      }
    } catch (error) {
      console.error('Error deleting commander:', error);
      alert('Error deleting commander');
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
          alert('Assets imported successfully!');
        } else {
          alert('Failed to import assets');
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
    a.download = `stratezenith-data-${new Date().toISOString()}.json`;
    a.click();
  };

  const handleEndAuction = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will reset the entire operation!\n\n' +
      'All assets will be marked as available.\n' +
      'All commanders will be reset to initial budgets.\n' +
      'All acquisition history will be cleared.\n\n' +
      'This action cannot be undone. Are you sure?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      '🚨 FINAL CONFIRMATION\n\n' +
      'Are you ABSOLUTELY SURE you want to reset everything?'
    );

    if (!doubleConfirm) return;

    try {
      const res = await fetch('/api/reset-auction', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Operation reset successfully! All assets available and commanders reset.');
        await loadData();
      } else {
        alert(data.error || 'Failed to reset operation');
      }
    } catch (error) {
      console.error('Error resetting operation:', error);
      alert('Error resetting operation');
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <div className="text-xl text-green-400 font-mono animate-pulse">⏳ Loading command center...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 tracking-wide">⚔️ COMMAND CENTER</h1>
              <p className="text-gray-500 mt-1 font-mono text-sm">Manage tactical assets, commanders, and acquisitions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEndAuction}
                className="bg-red-900 text-red-200 px-4 py-2 rounded-lg hover:bg-red-800 transition-colors font-medium border border-red-700 font-mono text-sm"
                title="Reset entire operation"
              >
                🔄 RESET OPS
              </button>
              <button
                onClick={handleExportJSON}
                className="bg-amber-900 text-amber-200 px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors border border-amber-700 font-mono text-sm"
              >
                📥 Export
              </button>
              <a
                href="/"
                target="_blank"
                className="bg-green-900 text-green-200 px-4 py-2 rounded-lg hover:bg-green-800 transition-colors border border-green-700 font-mono text-sm"
              >
                👁 Public View
              </a>
              <button
                onClick={handleLogout}
                className="bg-[#21262d] text-gray-300 px-4 py-2 rounded-lg hover:bg-[#30363d] transition-colors border border-[#30363d] font-mono text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#161b22] rounded-lg border border-[#30363d] mb-8">
          <div className="flex border-b border-[#30363d]">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-4 font-medium font-mono text-sm ${activeTab === 'sales'
                  ? 'border-b-2 border-green-500 text-green-400'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              ⚡ Record Sales
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-4 font-medium font-mono text-sm ${activeTab === 'items'
                  ? 'border-b-2 border-green-500 text-green-400'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              📦 Manage Assets
            </button>
            <button
              onClick={() => setActiveTab('bidders')}
              className={`px-6 py-4 font-medium font-mono text-sm ${activeTab === 'bidders'
                  ? 'border-b-2 border-green-500 text-green-400'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              👥 Manage Commanders
            </button>
            <button
              onClick={() => setActiveTab('wildcards')}
              className={`px-6 py-4 font-medium font-mono text-sm ${activeTab === 'wildcards'
                  ? 'border-b-2 border-green-500 text-green-400'
                  : 'text-gray-500 hover:text-gray-300'
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
      <div className="bg-[#0d1117] p-6 rounded-lg border border-green-900/40">
        <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">⚡ RECORD NEW ACQUISITION</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Category Filter</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200 focus:ring-2 focus:ring-green-600"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Select Asset</label>
            <select
              value={selectedItem}
              onChange={(e) => {
                setSelectedItem(e.target.value);
                const item = items.find(i => i.id === e.target.value);
                if (item) setSoldPrice(item.basePrice.toString());
              }}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200 focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">Choose asset...</option>
              {availableItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category}) - ${item.basePrice}M
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Acquired By</label>
            <select
              value={selectedBidder}
              onChange={(e) => setSelectedBidder(e.target.value)}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200 focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">Choose commander...</option>
              {bidders.map(bidder => (
                <option key={bidder.id} value={bidder.id}>
                  {bidder.name} (${bidder.remainingBudget}M remaining)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Price ($M)</label>
            <input
              type="number"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200 focus:ring-2 focus:ring-green-600"
              placeholder="Enter price"
              required
              min="0"
              step="1"
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="w-full bg-green-800 text-green-100 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium border border-green-600 font-mono"
            >
              CONFIRM ACQUISITION
            </button>
          </div>
        </form>
      </div>

      {/* Recently Sold Items */}
      <div>
        <h3 className="text-xl font-semibold text-gray-200 mb-4 font-mono">Recent Acquisitions ({soldItems.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#30363d]">
            <thead className="bg-[#0d1117]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Utility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Base ($M)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Acquired By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Price ($M)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {soldItems.slice().reverse().map(item => {
                const bidder = bidders.find(b => b.id === item.soldTo);
                return (
                  <tr key={item.id} className="hover:bg-[#1c2128]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.utility}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">${item.basePrice}M</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{bidder?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400 font-mono">${item.soldPrice}M</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onUnsell(item.id)}
                        className="text-red-400 hover:text-red-300 font-mono"
                      >
                        Undo
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
    category: 'Combat Roles' as Category,
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
      category: 'Combat Roles',
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
          className="bg-green-800 text-green-100 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-600 font-mono text-sm"
        >
          {showCreateForm ? 'Hide' : '+ Add New Asset'}
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          className="bg-amber-900 text-amber-200 px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors border border-amber-700 font-mono text-sm"
        >
          {showImport ? 'Hide' : '📥 Import JSON'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-[#0d1117] p-6 rounded-lg border border-green-900/40">
          <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">ADD NEW ASSET</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Category</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as Category })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Utility</label>
              <input
                type="number"
                value={createForm.utility}
                onChange={(e) => setCreateForm({ ...createForm, utility: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Base Price ($M)</label>
              <input
                type="number"
                value={createForm.basePrice}
                onChange={(e) => setCreateForm({ ...createForm, basePrice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200"
                required
                min="0"
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                className="w-full bg-green-800 text-green-100 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium border border-green-600 font-mono"
              >
                CREATE ASSET
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import JSON */}
      {showImport && (
        <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
          <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">
            Paste JSON (must have &quot;items&quot; array)
          </label>
          <textarea
            value={jsonImport}
            onChange={(e) => setJsonImport(e.target.value)}
            className="w-full h-40 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg font-mono text-sm text-gray-200"
            placeholder='{"items": [{"name": "Asset 1", "category": "Combat Roles", "utility": 80, "basePrice": 500}]}'
          />
          <button
            onClick={handleImport}
            className="mt-2 bg-green-800 text-green-100 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-600 font-mono text-sm"
          >
            Import Assets
          </button>
        </div>
      )}

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#30363d]">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Utility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Base Price ($M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-[#1c2128]">
                {editingId === item.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                        className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-gray-200"
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
                        className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editForm.basePrice || 0}
                        onChange={(e) => setEditForm({ ...editForm, basePrice: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{item.status}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={saveEdit} className="text-green-400 hover:text-green-300 font-mono">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-300 font-mono">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm font-medium text-gray-200">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{item.utility}</td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">${item.basePrice}M</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'sold' ? 'bg-green-900/50 text-green-300' : 'bg-amber-900/50 text-amber-300'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-amber-400 hover:text-amber-300 font-medium font-mono text-sm"
                          disabled={item.status === 'sold'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-red-400 hover:text-red-300 font-medium font-mono text-sm"
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
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="bg-green-800 text-green-100 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-600 font-mono text-sm"
      >
        {showCreateForm ? 'Hide' : '+ Add New Commander'}
      </button>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-[#0d1117] p-6 rounded-lg border border-green-900/40">
          <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">ADD NEW COMMANDER</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Initial Budget ($M)</label>
              <input
                type="number"
                value={createForm.initialBudget}
                onChange={(e) => setCreateForm({ ...createForm, initialBudget: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-gray-200"
                required
                min="0"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-green-800 text-green-100 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium border border-green-600 font-mono"
              >
                CREATE COMMANDER
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bidders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#30363d]">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Commander</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Budget ($M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Remaining ($M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Utility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Assets (CR/SA/ME/SO)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {bidders.map(bidder => {
              return (
                <tr key={bidder.id} className="hover:bg-[#1c2128]">
                  {editingId === bidder.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-gray-200"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.initialBudget || 0}
                          onChange={(e) => setEditForm({ ...editForm, initialBudget: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-gray-200"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">${bidder.remainingBudget}M</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{bidder.totalUtility}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                        {bidder.hostelsCount}/{bidder.clubsCount}/{bidder.datingCount}/{bidder.friendsCount} ({bidder.totalItems})
                      </td>
                      <td className="px-6 py-4">
                        {bidder.isQualified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
                            ✓ Qualified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={saveEdit} className="text-green-400 hover:text-green-300 font-mono text-sm">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-300 font-mono text-sm">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">
                        {bidder.name}
                        {bidder.isQualified && <span className="ml-2 text-green-400">✓</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono">${bidder.initialBudget}M</td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono">${bidder.remainingBudget}M</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-400">{bidder.totalUtility}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                        {bidder.hostelsCount}/{bidder.clubsCount}/{bidder.datingCount}/{bidder.friendsCount} ({bidder.totalItems})
                      </td>
                      <td className="px-6 py-4">
                        {bidder.isQualified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
                            ✓ Qualified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => startEdit(bidder)}
                            className="text-amber-400 hover:text-amber-300 font-medium font-mono text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(bidder.id)}
                            className="text-red-400 hover:text-red-300 font-medium font-mono text-sm"
                            disabled={bidder.totalItems > 0}
                            title={bidder.totalItems > 0 ? 'Cannot delete commander with acquired assets' : 'Delete commander'}
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
      <div className="bg-[#0d1117] p-6 rounded-lg border-2 border-amber-900/40">
        <h3 className="text-xl font-bold text-amber-400 mb-4 font-mono">🎴 RECORD WILDCARD PURCHASE</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">Wildcard Name *</label>
              <input
                type="text"
                value={wildcardForm.name}
                onChange={(e) => setWildcardForm({ ...wildcardForm, name: e.target.value })}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
                placeholder="e.g., Tactical Boost"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">Commander *</label>
              <select
                value={wildcardForm.bidderId}
                onChange={(e) => setWildcardForm({ ...wildcardForm, bidderId: e.target.value })}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
                required
              >
                <option value="">Select commander</option>
                {bidders.map((bidder) => (
                  <option key={bidder.id} value={bidder.id}>
                    {bidder.name} (${bidder.remainingBudget}M)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">Price ($M) *</label>
              <input
                type="number"
                value={wildcardForm.price}
                onChange={(e) => setWildcardForm({ ...wildcardForm, price: Number(e.target.value) })}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">
                Counts As Category
                <span className="text-xs text-gray-600 ml-1">(for qualification)</span>
              </label>
              <select
                value={wildcardForm.countsAsTheme}
                onChange={(e) => setWildcardForm({ ...wildcardForm, countsAsTheme: e.target.value })}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
              >
                <option value="">None (multiplier only)</option>
                <option value="Combat Roles">Combat Roles</option>
                <option value="Strategic Assets & Equipment">Strategic Assets & Equipment</option>
                <option value="Mission Environments">Mission Environments</option>
                <option value="Special Operations & Strategic Actions">Special Operations & Strategic Actions</option>
              </select>
            </div>
          </div>

          {/* Multipliers */}
          <div className="border-t border-[#30363d] pt-4">
            <h4 className="font-semibold text-gray-300 mb-3 font-mono">Utility Multipliers</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-red-400 mb-1 font-mono">⚔️ Combat</label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.hostelsMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, hostelsMultiplier: Number(e.target.value) })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
                  min="1"
                />
                <p className="text-xs text-gray-600 mt-1">1.0 = no change</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-400 mb-1 font-mono">🎯 Assets</label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.clubsMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, clubsMultiplier: Number(e.target.value) })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-400 mb-1 font-mono">🌍 Missions</label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.datingMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, datingMultiplier: Number(e.target.value) })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-400 mb-1 font-mono">🔥 Spec Ops</label>
                <input
                  type="number"
                  step="0.1"
                  value={wildcardForm.friendsMultiplier}
                  onChange={(e) => setWildcardForm({ ...wildcardForm, friendsMultiplier: Number(e.target.value) })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200"
                  min="1"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-800 text-amber-100 px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium border border-amber-600 font-mono"
          >
            RECORD WILDCARD PURCHASE
          </button>
        </form>
      </div>

      {/* Wildcards List */}
      <div className="bg-[#0d1117] p-6 rounded-lg border border-[#30363d]">
        <h3 className="text-xl font-bold text-gray-200 mb-4 font-mono">Purchased Wildcards</h3>
        {loading ? (
          <p className="text-gray-500 font-mono">Loading...</p>
        ) : wildcards.length === 0 ? (
          <p className="text-gray-500 font-mono">No wildcards purchased yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-[#30363d]">
              <thead className="bg-[#161b22]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Wildcard</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Commander</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Multipliers (CR/SA/ME/SO)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Counts As</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {wildcards.map((wc) => (
                  <tr key={wc.id} className="hover:bg-[#1c2128]">
                    <td className="px-4 py-3 text-sm font-medium text-gray-200">🎴 {wc.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{wc.bidder.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">${wc.price}M</td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                      {wc.hostelsMultiplier}x / {wc.clubsMultiplier}x / {wc.datingMultiplier}x / {wc.friendsMultiplier}x
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {wc.countsAsTheme ? (
                        <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-medium">
                          {wc.countsAsTheme}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(wc.id)}
                        className="text-red-400 hover:text-red-300 font-medium text-sm font-mono"
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

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
    if (auth !== 'true') { router.push('/admin'); return; }
    setIsAuthenticated(true);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [itemsRes, biddersRes] = await Promise.all([fetch('/api/items'), fetch('/api/bidders')]);
      if (itemsRes.ok && biddersRes.ok) {
        setItems(await itemsRes.json());
        setBidders(await biddersRes.json());
      }
    } catch (error) { console.error('Error loading data:', error); }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem('admin_authenticated'); router.push('/admin'); };

  const handleItemSale = async (itemId: string, bidderId: string, soldPrice: number) => {
    const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, bidderId, soldPrice }) });
    const data = await res.json();
    if (res.ok) await loadData(); else alert(data.error || 'Failed to record sale');
  };

  const handleUnsellItem = async (itemId: string) => {
    const res = await fetch(`/api/sales?itemId=${itemId}`, { method: 'DELETE' });
    if (res.ok) await loadData(); else alert('Failed to undo sale');
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<Item>) => {
    const res = await fetch('/api/items', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: itemId, ...updates }) });
    if (res.ok) await loadData(); else alert('Failed to update item');
  };

  const handleCreateItem = async (newItem: Omit<Item, 'id' | 'status' | 'soldTo' | 'soldPrice' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    if (res.ok) { await loadData(); alert('Item created!'); } else alert('Failed to create item');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/items?id=${itemId}`, { method: 'DELETE' });
    if (res.ok) await loadData(); else alert('Failed to delete item');
  };

  const handleCreateBidder = async (newBidder: Omit<Bidder, 'id' | 'items' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/bidders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBidder) });
    if (res.ok) { await loadData(); alert('Player added!'); } else alert('Failed to add player');
  };

  const handleUpdateBidder = async (bidderId: string, updates: Partial<Bidder>) => {
    const res = await fetch('/api/bidders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: bidderId, ...updates }) });
    if (res.ok) await loadData(); else alert('Failed to update player');
  };

  const handleDeleteBidder = async (bidderId: string) => {
    if (!confirm('Delete this player? All their purchases will be undone.')) return;
    const res = await fetch(`/api/bidders?id=${bidderId}`, { method: 'DELETE' });
    if (res.ok) await loadData(); else alert('Failed to delete player');
  };

  const handleImportJSON = async (jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.items) {
        const res = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: imported.items }) });
        if (res.ok) { await loadData(); alert('Items imported!'); } else alert('Failed to import');
      }
    } catch { alert('Invalid JSON format'); }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ items, bidders }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `stratezenith-data-${new Date().toISOString()}.json`; a.click();
  };

  const handleResetGame = async () => {
    if (!window.confirm('⚠️ Reset the entire game?\n\nAll items will become available.\nAll players will be reset.\nAll purchases cleared.\n\nThis cannot be undone.')) return;
    if (!window.confirm('Are you SURE?')) return;
    const res = await fetch('/api/reset-auction', { method: 'POST' });
    if (res.ok) { alert('Game reset!'); await loadData(); } else alert('Failed to reset');
  };

  if (!isAuthenticated || loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="text-lg text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-gray-500 text-sm mt-0.5">Manage players, items, and sales</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleResetGame} className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">🔄 Reset Game</button>
              <button onClick={handleExportJSON} className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-sm font-medium">📥 Export</button>
              <a href="/" target="_blank" className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm font-medium">👁 Public View</a>
              <button onClick={handleLogout} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium">Logout</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'sales', label: '⚡ Record Sales' },
              { key: 'items', label: '📦 Manage Items' },
              { key: 'bidders', label: '👥 Manage Players' },
              { key: 'wildcards', label: '🎴 Wildcards' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-5 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
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

/* ========== SALES TAB ========== */
function SalesTab({ items, bidders, onSale, onUnsell }: { items: Item[]; bidders: Bidder[]; onSale: (itemId: string, bidderId: string, soldPrice: number) => void; onUnsell: (itemId: string) => void }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedBidder, setSelectedBidder] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  const availableItems = items.filter(i => i.status === 'available' && (filterCategory === 'all' || i.category === filterCategory));
  const soldItems = items.filter(i => i.status === 'sold');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && selectedBidder && soldPrice) {
      onSale(selectedItem, selectedBidder, parseFloat(soldPrice));
      setSelectedItem(''); setSelectedBidder(''); setSoldPrice('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Record Sale</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Category Filter</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white">
              <option value="all">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Item</label>
            <select value={selectedItem} onChange={(e) => { setSelectedItem(e.target.value); const item = items.find(i => i.id === e.target.value); if (item) setSoldPrice(item.basePrice.toString()); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white" required>
              <option value="">Select item...</option>
              {availableItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.category}) - ${i.basePrice}M</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sold To</label>
            <select value={selectedBidder} onChange={(e) => setSelectedBidder(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white" required>
              <option value="">Select player...</option>
              {bidders.map(b => <option key={b.id} value={b.id}>{b.name} (${b.remainingBudget}M left)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Price ($M)</label>
            <input type="number" value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700" required min="0" step="1" />
          </div>
          <div className="md:col-span-4">
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Confirm Sale</button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Sales ({soldItems.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'Category', 'Utility', 'Base', 'Sold To', 'Sold Price', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {soldItems.slice().reverse().map(item => {
                const bidder = bidders.find(b => b.id === item.soldTo);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.utility}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${item.basePrice}M</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{bidder?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">${item.soldPrice}M</td>
                    <td className="px-4 py-3 text-sm"><button onClick={() => onUnsell(item.id)} className="text-red-500 hover:text-red-700 font-medium">Undo</button></td>
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

/* ========== ITEMS TAB ========== */
function ItemsTab({ items, onUpdate, onCreate, onDelete, onImport }: { items: Item[]; onUpdate: (id: string, u: Partial<Item>) => void; onCreate: (i: any) => void; onDelete: (id: string) => void; onImport: (j: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});
  const [jsonImport, setJsonImport] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', category: 'Combat Roles' as Category, utility: 70, basePrice: 500 });

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">{showCreate ? 'Hide' : '+ Add Item'}</button>
        <button onClick={() => setShowImport(!showImport)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm font-medium">{showImport ? 'Hide' : '📥 Import JSON'}</button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Add New Item</h3>
          <form onSubmit={(e) => { e.preventDefault(); onCreate(createForm); setCreateForm({ name: '', category: 'Combat Roles', utility: 70, basePrice: 500 }); setShowCreate(false); }} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
              <select value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as Category })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Utility</label>
              <input type="number" value={createForm.utility} onChange={(e) => setCreateForm({ ...createForm, utility: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Base Price ($M)</label>
              <input type="number" value={createForm.basePrice} onChange={(e) => setCreateForm({ ...createForm, basePrice: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700" required />
            </div>
            <div className="md:col-span-4"><button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Add Item</button></div>
          </form>
        </div>
      )}

      {showImport && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-600 mb-1">Paste JSON</label>
          <textarea value={jsonImport} onChange={(e) => setJsonImport(e.target.value)} className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700" placeholder='{"items": [...]}' />
          <button onClick={() => { onImport(jsonImport); setJsonImport(''); setShowImport(false); }} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">Import</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Category', 'Utility', 'Base Price', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                {editingId === item.id ? (
                  <>
                    <td className="px-4 py-3"><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-2 py-1 border rounded text-gray-700" /></td>
                    <td className="px-4 py-3"><select value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })} className="w-full px-2 py-1 border rounded text-gray-700 bg-white">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></td>
                    <td className="px-4 py-3"><input type="number" value={editForm.utility || 0} onChange={(e) => setEditForm({ ...editForm, utility: parseInt(e.target.value) })} className="w-full px-2 py-1 border rounded text-gray-700" /></td>
                    <td className="px-4 py-3"><input type="number" value={editForm.basePrice || 0} onChange={(e) => setEditForm({ ...editForm, basePrice: parseInt(e.target.value) })} className="w-full px-2 py-1 border rounded text-gray-700" /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.status}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => { onUpdate(editingId!, editForm); setEditingId(null); }} className="text-green-600 hover:text-green-800 font-medium text-sm">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.utility}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${item.basePrice}M</td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span></td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="text-blue-600 hover:text-blue-800 font-medium text-sm" disabled={item.status === 'sold'}>Edit</button>
                      <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium text-sm" disabled={item.status === 'sold'}>Delete</button>
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

/* ========== PLAYERS TAB ========== */
function BiddersTab({ bidders, onUpdate, onCreate, onDelete }: { bidders: Bidder[]; onUpdate: (id: string, u: Partial<Bidder>) => void; onCreate: (b: any) => void; onDelete: (id: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Bidder>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', initialBudget: 200 });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...createForm, remainingBudget: createForm.initialBudget, totalUtility: 0, isQualified: false,
      hostelsCount: 0, clubsCount: 0, datingCount: 0, friendsCount: 0, totalItems: 0,
      hostelsUtility: 0, clubsUtility: 0, datingUtility: 0, friendsUtility: 0,
      hostelsMultiplier: 1.0, clubsMultiplier: 1.0, datingMultiplier: 1.0, friendsMultiplier: 1.0, wildcardsCount: 0,
    });
    setCreateForm({ name: '', initialBudget: 200 }); setShowCreate(false);
  };

  return (
    <div className="space-y-5">
      <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">{showCreate ? 'Hide' : '+ Add Player'}</button>

      {showCreate && (
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Add New Player</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Budget ($M)</label>
              <input type="number" value={createForm.initialBudget} onChange={(e) => setCreateForm({ ...createForm, initialBudget: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700" required min="0" />
            </div>
            <div className="md:col-span-2"><button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Add Player</button></div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Player', 'Budget', 'Remaining', 'Utility', 'Items (CR/SA/ME/SO)', 'Qualified', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bidders.map(bidder => (
              <tr key={bidder.id} className="hover:bg-gray-50">
                {editingId === bidder.id ? (
                  <>
                    <td className="px-4 py-3"><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-2 py-1 border rounded text-gray-700" /></td>
                    <td className="px-4 py-3"><input type="number" value={editForm.initialBudget || 0} onChange={(e) => setEditForm({ ...editForm, initialBudget: parseInt(e.target.value) })} className="w-full px-2 py-1 border rounded text-gray-700" /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">${bidder.remainingBudget}M</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{bidder.totalUtility}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{bidder.hostelsCount}/{bidder.clubsCount}/{bidder.datingCount}/{bidder.friendsCount} ({bidder.totalItems})</td>
                    <td className="px-4 py-3">{bidder.isQualified && <span className="text-green-600 font-medium">✓</span>}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => { onUpdate(editingId!, editForm); setEditingId(null); }} className="text-green-600 hover:text-green-800 font-medium text-sm">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{bidder.name} {bidder.isQualified && <span className="text-green-500">✓</span>}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${bidder.initialBudget}M</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${bidder.remainingBudget}M</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{bidder.totalUtility}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{bidder.hostelsCount}/{bidder.clubsCount}/{bidder.datingCount}/{bidder.friendsCount} ({bidder.totalItems})</td>
                    <td className="px-4 py-3">{bidder.isQualified && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Qualified</span>}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => { setEditingId(bidder.id); setEditForm({ name: bidder.name, initialBudget: bidder.initialBudget }); }} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                      <button onClick={() => onDelete(bidder.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
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

/* ========== WILDCARDS TAB ========== */
function WildcardsTab({ bidders, onUpdate }: { bidders: Bidder[]; onUpdate: () => void }) {
  const [form, setForm] = useState({ name: '', price: 0, bidderId: '', hostelsMultiplier: 1.0, clubsMultiplier: 1.0, datingMultiplier: 1.0, friendsMultiplier: 1.0, countsAsTheme: '' });
  const [wildcards, setWildcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWildcards(); }, []);

  const loadWildcards = async () => {
    try { const res = await fetch('/api/wildcards'); if (res.ok) setWildcards(await res.json()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.bidderId || form.price <= 0) { alert('Fill all required fields'); return; }
    const res = await fetch('/api/wildcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, countsAsTheme: form.countsAsTheme || null }) });
    if (res.ok) { alert('Wildcard recorded!'); setForm({ name: '', price: 0, bidderId: '', hostelsMultiplier: 1.0, clubsMultiplier: 1.0, datingMultiplier: 1.0, friendsMultiplier: 1.0, countsAsTheme: '' }); await loadWildcards(); await onUpdate(); }
    else { const data = await res.json(); alert(data.error || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this wildcard?')) return;
    const res = await fetch(`/api/wildcards?wildcardId=${id}`, { method: 'DELETE' });
    if (res.ok) { await loadWildcards(); await onUpdate(); } else alert('Failed');
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">🎴 Record Wildcard Purchase</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Player *</label>
              <select value={form.bidderId} onChange={(e) => setForm({ ...form, bidderId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white" required>
                <option value="">Select player</option>
                {bidders.map(b => <option key={b.id} value={b.id}>{b.name} (${b.remainingBudget}M)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Price ($M) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700" min="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Counts As Category</label>
              <select value={form.countsAsTheme} onChange={(e) => setForm({ ...form, countsAsTheme: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white">
                <option value="">None (multiplier only)</option>
                <option value="Combat Roles">Combat Roles</option>
                <option value="Strategic Assets & Equipment">Strategic Assets & Equipment</option>
                <option value="Mission Environments">Mission Environments</option>
                <option value="Special Operations & Strategic Actions">Special Ops & Strategic Actions</option>
              </select>
            </div>
          </div>
          <div className="border-t pt-3">
            <h4 className="font-medium text-gray-700 mb-2">Utility Multipliers</h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'hostelsMultiplier', label: 'Combat Roles' },
                { key: 'clubsMultiplier', label: 'Strategic Assets' },
                { key: 'datingMultiplier', label: 'Mission Env' },
                { key: 'friendsMultiplier', label: 'Special Ops' },
              ].map(m => (
                <div key={m.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{m.label}</label>
                  <input type="number" step="0.1" value={(form as any)[m.key]} onChange={(e) => setForm({ ...form, [m.key]: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700" min="1" />
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-yellow-500 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-600 font-medium">Record Wildcard</button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Purchased Wildcards</h3>
        {loading ? <p className="text-gray-500">Loading...</p> : wildcards.length === 0 ? <p className="text-gray-400">No wildcards yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Wildcard', 'Player', 'Price', 'Multipliers (CR/SA/ME/SO)', 'Counts As', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wildcards.map(wc => (
                  <tr key={wc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">🎴 {wc.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{wc.bidder.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${wc.price}M</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{wc.hostelsMultiplier}x / {wc.clubsMultiplier}x / {wc.datingMultiplier}x / {wc.friendsMultiplier}x</td>
                    <td className="px-4 py-3 text-sm">{wc.countsAsTheme ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{wc.countsAsTheme}</span> : <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-3"><button onClick={() => handleDelete(wc.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Remove</button></td>
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

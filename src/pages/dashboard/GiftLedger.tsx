import { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../App';
import { Gift, RelationType, GiftType } from '../../types';
import { Search, Filter, Download, Trash2, Edit, X, User, DollarSign, Calendar, Info, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function GiftLedger() {
  const { wedding } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (wedding) {
      const giftsRef = collection(db, 'weddings', wedding.id, 'gifts');
      const q = query(giftsRef, orderBy('logged_at', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const giftList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
        setGifts(giftList);
      });
      return () => unsubscribe();
    }
  }, [wedding]);

  const filteredGifts = useMemo(() => {
    return gifts.filter(gift => {
      const matchesSearch = gift.guest_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'All' || gift.gift_type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [gifts, searchTerm, filterType]);

  const stats = useMemo(() => {
    const total = gifts.reduce((acc, gift) => acc + gift.amount, 0);
    const count = gifts.length;
    const average = count > 0 ? total / count : 0;

    const typeBreakdown = gifts.reduce((acc, gift) => {
      acc[gift.gift_type] = (acc[gift.gift_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const relationBreakdown = gifts.reduce((acc, gift) => {
      acc[gift.relation] = (acc[gift.relation] || 0) + gift.amount;
      return acc;
    }, {} as Record<string, number>);

    const relationData = Object.entries(relationBreakdown).map(([name, value]) => ({ name, value }));

    return { total, count, average, typeBreakdown, relationData };
  }, [gifts]);

  const exportToCSV = () => {
    const headers = ['Guest Name', 'Amount', 'Relation', 'Gift Type', 'Note', 'Time Logged'];
    const rows = gifts.map(gift => [
      gift.guest_name,
      gift.amount,
      gift.relation,
      gift.gift_type,
      gift.note || '',
      gift.logged_at ? format(new Date((gift.logged_at as any).seconds * 1000), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      `Total,${stats.total},,,,`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wedding_gifts_${wedding?.couple_name || 'ledger'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!wedding) return;
    if (confirm('Are you sure you want to delete this gift?')) {
      await deleteDoc(doc(db, 'weddings', wedding.id, 'gifts', id));
      setIsPanelOpen(false);
    }
  };

  const COLORS = ['#312e81', '#4338ca', '#6366f1', '#818cf8', '#a5b4fc'];

  return (
    <div className="space-y-8 pb-20">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
          <h3 className="text-2xl font-bold text-indigo-950">${stats.total.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Guests</p>
          <h3 className="text-2xl font-bold text-indigo-950">{stats.count}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Average Gift</p>
          <h3 className="text-2xl font-bold text-indigo-950">${stats.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cash %</p>
          <h3 className="text-2xl font-bold text-indigo-950">
            {stats.count > 0 ? Math.round(((stats.typeBreakdown['Cash envelope'] || 0) / stats.count) * 100) : 0}%
          </h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-950 mb-6">Amount by Relation</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.relationData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {stats.relationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* List Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search guest name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Cash envelope', 'Check', 'Venmo/Zelle/Digital'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                ${filterType === type 
                  ? 'bg-indigo-900 text-white shadow-md' 
                  : 'bg-white text-indigo-900 border border-indigo-100 hover:bg-indigo-50'}
              `}
            >
              {type === 'Cash envelope' ? 'Cash' : type === 'Venmo/Zelle/Digital' ? 'Digital' : type}
            </button>
          ))}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-900 text-sm font-bold hover:bg-indigo-100 transition-all ml-auto"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Gift List */}
      <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-indigo-50/50 border-b border-indigo-100">
                <th className="px-6 py-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-900 uppercase tracking-wider hidden md:table-cell">Relation</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-900 uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {filteredGifts.map((gift) => (
                <tr 
                  key={gift.id} 
                  onClick={() => { setSelectedGift(gift); setIsPanelOpen(true); }}
                  className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-indigo-950">{gift.guest_name}</p>
                    <p className="text-xs text-gray-500 md:hidden">{gift.relation}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-indigo-900">${gift.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                      {gift.relation}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                      {gift.gift_type === 'Venmo/Zelle/Digital' ? 'Digital' : gift.gift_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {gift.logged_at ? formatDistanceToNow(new Date((gift.logged_at as any).seconds * 1000), { addSuffix: true }) : 'Just now'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors inline" />
                  </td>
                </tr>
              ))}
              {filteredGifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                    No gifts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {isPanelOpen && selectedGift && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-indigo-950">Guest Details</h3>
                <button onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 p-6 bg-indigo-50 rounded-3xl">
                  <div className="w-16 h-16 bg-indigo-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                    {selectedGift.guest_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-indigo-950">{selectedGift.guest_name}</h4>
                    <p className="text-indigo-600 font-bold text-lg">${selectedGift.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Relation:</span>
                    <span className="ml-auto font-bold text-indigo-950">{selectedGift.relation}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Gift Type:</span>
                    <span className="ml-auto font-bold text-indigo-950">{selectedGift.gift_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Logged At:</span>
                    <span className="ml-auto font-bold text-indigo-950">
                      {selectedGift.logged_at ? format(new Date((selectedGift.logged_at as any).seconds * 1000), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </span>
                  </div>
                </div>

                {selectedGift.note && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                      <Info className="w-4 h-4" />
                      Note
                    </div>
                    <p className="text-amber-900 italic">"{selectedGift.note}"</p>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-100 flex gap-4">
                  <button
                    onClick={() => handleDelete(selectedGift.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                  <button
                    onClick={() => alert('Edit functionality coming soon!')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-900 text-white font-bold hover:bg-indigo-800 transition-all shadow-lg"
                  >
                    <Edit className="w-5 h-5" />
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

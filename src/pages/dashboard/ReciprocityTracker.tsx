import { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../App';
import { Gift, ReciprocityStatus } from '../../types';
import { Repeat, CheckCircle2, Calendar, Gift as GiftIcon, Info, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function ReciprocityTracker() {
  const { wedding } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wedding) {
      const giftsRef = collection(db, 'weddings', wedding.id, 'gifts');
      const q = query(giftsRef, orderBy('logged_at', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const giftList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
        setGifts(giftList);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [wedding]);

  const stats = useMemo(() => {
    const pending = gifts.filter(g => g.reciprocity_status === 'pending').length;
    const upcoming = gifts.filter(g => g.reciprocity_status === 'upcoming').length;
    const fulfilled = gifts.filter(g => g.reciprocity_status === 'fulfilled').length;
    return { pending, upcoming, fulfilled };
  }, [gifts]);

  const updateStatus = async (giftId: string, status: ReciprocityStatus, extraData: any = {}) => {
    if (!wedding) return;
    const giftRef = doc(db, 'weddings', wedding.id, 'gifts', giftId);
    await updateDoc(giftRef, { reciprocity_status: status, ...extraData });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-900"></div></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Repeat className="text-indigo-900 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-indigo-950">Who Do I Owe?</h2>
            <p className="text-gray-500 text-sm">Track your obligations to guests who gave you gifts.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-indigo-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-950">{stats.pending + stats.upcoming}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.fulfilled}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfilled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.upcoming}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {gifts.map((gift) => (
          <motion.div
            layout
            key={gift.id}
            className={`
              bg-white p-6 rounded-3xl shadow-sm border transition-all
              ${gift.reciprocity_status === 'fulfilled' ? 'border-green-100 opacity-75' : 'border-indigo-100'}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${gift.reciprocity_status === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {gift.guest_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-indigo-950">{gift.guest_name}</h4>
                  <p className="text-xs text-gray-500">Gave you <span className="font-bold text-indigo-900">${gift.amount.toLocaleString()}</span></p>
                </div>
              </div>
              {gift.reciprocity_status === 'fulfilled' && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Fulfilled
                </span>
              )}
            </div>

            {gift.reciprocity_status !== 'fulfilled' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                  <p className="text-xs font-bold text-indigo-900 mb-1">Suggested Gift Amount</p>
                  <p className="text-lg font-bold text-indigo-950">${gift.amount.toLocaleString()}</p>
                </div>

                {gift.reciprocity_status === 'upcoming' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      {gift.their_event_type} on {gift.their_event_date}
                    </div>
                    <button
                      onClick={() => updateStatus(gift.id, 'fulfilled')}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Mark as Fulfilled
                    </button>
                    <button
                      onClick={() => updateStatus(gift.id, 'pending', { their_event_type: null, their_event_date: null })}
                      className="w-full text-gray-500 text-xs font-bold hover:text-indigo-900 transition-colors"
                    >
                      Cancel Upcoming Event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const type = prompt('Event type? (e.g. Wedding, Baby shower)');
                        const date = prompt('Event date? (YYYY-MM-DD)');
                        if (type && date) {
                          updateStatus(gift.id, 'upcoming', { their_event_type: type, their_event_date: date });
                        }
                      }}
                      className="w-full bg-indigo-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Mark as Upcoming Event
                    </button>
                    <button
                      onClick={() => updateStatus(gift.id, 'fulfilled')}
                      className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Mark as Fulfilled
                    </button>
                  </div>
                )}
              </div>
            )}

            {gift.reciprocity_status === 'fulfilled' && (
              <button
                onClick={() => updateStatus(gift.id, 'pending')}
                className="w-full text-gray-400 text-xs font-bold hover:text-indigo-900 transition-colors mt-2"
              >
                Undo Fulfilled Status
              </button>
            )}
          </motion.div>
        ))}

        {gifts.length === 0 && (
          <div className="col-span-full bg-white p-20 rounded-3xl shadow-sm border border-indigo-100 text-center">
            <AlertCircle className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Log your first gift to start tracking reciprocity!</p>
          </div>
        )}
      </div>
    </div>
  );
}

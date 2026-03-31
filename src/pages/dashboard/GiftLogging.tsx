import { useState, useEffect, useRef, FormEvent } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../../App';
import { RelationType, GiftType } from '../../types';
import { DollarSign, User, Users, CreditCard, StickyNote, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GiftLogging() {
  const { wedding, user } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [amount, setAmount] = useState('');
  const [relation, setRelation] = useState<RelationType>('Close friend');
  const [giftType, setGiftType] = useState<GiftType>('Cash envelope');
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [totalCollected, setTotalCollected] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const guestNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wedding) {
      const giftsRef = collection(db, 'weddings', wedding.id, 'gifts');
      const unsubscribe = onSnapshot(giftsRef, (snapshot) => {
        let total = 0;
        snapshot.docs.forEach(doc => {
          total += doc.data().amount || 0;
        });
        setTotalCollected(total);
        setGuestCount(snapshot.size);
      });
      return () => unsubscribe();
    }
  }, [wedding]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!wedding || !user || !guestName || !amount) return;

    setLoading(true);
    try {
      const giftData = {
        guest_name: guestName,
        amount: parseFloat(amount),
        relation,
        gift_type: giftType,
        note,
        logged_by: user.uid,
        logged_at: serverTimestamp(),
        reciprocity_status: 'pending',
      };

      await addDoc(collection(db, 'weddings', wedding.id, 'gifts'), giftData);

      // Reset form instantly
      setGuestName('');
      setAmount('');
      setNote('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Auto-focus back to guest name
      guestNameRef.current?.focus();
    } catch (error) {
      console.error('Error logging gift:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!wedding) return <div>Loading wedding...</div>;

  return (
    <div className="space-y-6">
      {/* Live Counter */}
      <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <p className="text-indigo-300 text-sm font-bold uppercase tracking-wider">Total Collected</p>
          <h2 className="text-3xl font-bold">${totalCollected.toLocaleString()}</h2>
        </div>
        <div className="text-right">
          <p className="text-indigo-300 text-sm font-bold uppercase tracking-wider">Guests</p>
          <h2 className="text-3xl font-bold">{guestCount}</h2>
        </div>
      </div>

      {/* Logging Form */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
            >
              <CheckCircle2 className="text-green-500 w-16 h-16 mb-2" />
              <p className="text-green-600 font-bold text-xl">Gift Logged!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-indigo-900 mb-2">Guest Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={guestNameRef}
                  type="text"
                  required
                  autoFocus
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg"
                  placeholder="Who gave the gift?"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-indigo-900 mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-indigo-900 mb-2">
                {wedding?.event_type === 'Wedding' ? 'Relation to Couple' : 'Relation to Host'}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value as RelationType)}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg appearance-none bg-white"
                >
                  <option>Immediate family</option>
                  <option>Extended family</option>
                  <option>Close friend</option>
                  <option>Colleague</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-indigo-900 mb-2">Gift Type</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={giftType}
                  onChange={(e) => setGiftType(e.target.value as GiftType)}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg appearance-none bg-white"
                >
                  <option>Cash envelope</option>
                  <option>Check</option>
                  <option>Venmo/Zelle/Digital</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-indigo-900 mb-2">Note (Optional)</label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg"
                placeholder="e.g. from uncle in Dubai"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95 transform"
          >
            {loading ? 'Logging...' : 'LOG GIFT'}
          </button>
        </form>
      </div>

      {/* Onboarding Tooltip */}
      {guestCount === 0 && (
        <div className="flex justify-center">
          <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold animate-bounce border border-amber-200">
            Tap here to log your first gift! ↓
          </div>
        </div>
      )}
    </div>
  );
}

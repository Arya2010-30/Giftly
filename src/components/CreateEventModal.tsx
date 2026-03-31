import React, { useState, FormEvent } from 'react';
import { X, PartyPopper, User as UserIcon, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { EventType } from '../types';
import { useAuth } from '../App';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
  const { user, refreshWeddings, setWedding } = useAuth();
  const [eventType, setEventType] = useState<EventType>('Wedding');
  const [eventName, setEventName] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const weddingData = {
        event_type: eventType,
        event_name: eventType === 'Other' ? eventName : '',
        couple_name: coupleName,
        wedding_date: weddingDate,
        created_by: user.uid,
        created_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'weddings'), weddingData);
      const newEvent = { id: docRef.id, ...weddingData, created_at: new Date().toISOString() } as any;
      
      await refreshWeddings();
      setWedding(newEvent);
      onClose();
      
      // Reset form
      setEventType('Wedding');
      setEventName('');
      setCoupleName('');
      setWeddingDate('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10 border border-indigo-100"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 hover:bg-indigo-50 rounded-full transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-900 rounded-xl flex items-center justify-center">
                <PartyPopper className="text-amber-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-indigo-950">Add New Event</h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type</label>
                <div className="relative">
                  <PartyPopper className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all appearance-none bg-white font-medium"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {eventType === 'Other' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Event Name</label>
                  <div className="relative">
                    <PartyPopper className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="e.g. Graduation Party"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {eventType === 'Wedding' ? 'Couple Names' : 'Host Name'}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder={eventType === 'Wedding' ? "e.g. Sarah & James" : "e.g. Alex Johnson"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    required
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 mt-4"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

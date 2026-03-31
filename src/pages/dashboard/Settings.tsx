import { useState, useEffect, FormEvent } from 'react';
import { db, auth } from '../../firebase';
import { doc, updateDoc, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../App';
import { Settings as SettingsIcon, User, Calendar, Mail, UserPlus, CheckCircle2, AlertCircle, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventType } from '../../types';

export default function Settings() {
  const { wedding, user, setWedding } = useAuth();
  const [eventType, setEventType] = useState<EventType>(wedding?.event_type || 'Wedding');
  const [eventName, setEventName] = useState(wedding?.event_name || '');
  const [coupleName, setCoupleName] = useState(wedding?.couple_name || '');
  const [weddingDate, setWeddingDate] = useState(wedding?.wedding_date || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (wedding) {
      setEventType(wedding.event_type);
      setEventName(wedding.event_name || '');
      setCoupleName(wedding.couple_name);
      setWeddingDate(wedding.wedding_date);
      
      const membersRef = collection(db, 'weddings', wedding.id, 'members');
      const unsubscribe = onSnapshot(membersRef, (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [wedding]);

  const handleUpdateWedding = async (e: FormEvent) => {
    e.preventDefault();
    if (!wedding) return;

    setLoading(true);
    try {
      const weddingRef = doc(db, 'weddings', wedding.id);
      const updatedData = {
        event_type: eventType,
        event_name: eventType === 'Other' ? eventName : '',
        couple_name: coupleName,
        wedding_date: weddingDate,
      };
      await updateDoc(weddingRef, updatedData);
      setWedding({ ...wedding, ...updatedData });
      setMessage({ type: 'success', text: 'Event details updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!wedding || !inviteEmail) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'weddings', wedding.id, 'members'), {
        invited_email: inviteEmail,
        role: 'member',
        user_id: null, // To be filled when they join
      });
      setInviteEmail('');
      setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}!` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <SettingsIcon className="text-indigo-900 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-indigo-950">Settings</h2>
            <p className="text-gray-500 text-sm">Manage your wedding details and team.</p>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-2xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Wedding Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <PartyPopper className="w-5 h-5" />
              Event Details
            </h3>
            <form onSubmit={handleUpdateWedding} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Event Type</label>
                <div className="relative">
                  <PartyPopper className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none bg-white"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {eventType === 'Other' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Event Name</label>
                  <div className="relative">
                    <PartyPopper className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      placeholder="e.g. Graduation Party"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {eventType === 'Wedding' ? 'Couple Names' : 'Host Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Event Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    required
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-800 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Event'}
              </button>
            </form>
          </div>

          {/* Team Management */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite Family Members
            </h3>
            <p className="text-sm text-gray-500">Add family members so they can help log gifts simultaneously.</p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="family@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 text-indigo-950 py-3 rounded-xl font-bold hover:bg-amber-500 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>

            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Current Members</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-950">{user?.email}</p>
                      <p className="text-xs text-indigo-600 font-medium">Owner</p>
                    </div>
                  </div>
                </div>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold">
                        {member.invited_email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-indigo-950">{member.invited_email}</p>
                        <p className="text-xs text-gray-500 font-medium">Invited Member</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-900 mb-4">Your Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold uppercase">
            {user?.email?.charAt(0)}
          </div>
          <div>
            <p className="text-xl font-bold text-indigo-950">{user?.email}</p>
            <p className="text-gray-500">User ID: {user?.uid}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

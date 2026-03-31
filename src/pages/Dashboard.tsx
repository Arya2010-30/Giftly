import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { Gift, FileText, Repeat, Settings as SettingsIcon, LogOut, Menu, X, ChevronDown, PlusCircle } from 'lucide-react';
import { useAuth } from '../App';
import GiftLogging from './dashboard/GiftLogging';
import GiftLedger from './dashboard/GiftLedger';
import ReciprocityTracker from './dashboard/ReciprocityTracker';
import Settings from './dashboard/Settings';
import CreateEventModal from '../components/CreateEventModal';

export default function Dashboard() {
  const { user, wedding, weddings, setWedding, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEventSwitcherOpen, setIsEventSwitcherOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Log Gift', icon: Gift },
    { path: '/dashboard/ledger', label: 'Ledger', icon: FileText },
    { path: '/dashboard/reciprocity', label: 'Reciprocity', icon: Repeat },
    { path: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const activeItem = navItems.find(item => item.path === location.pathname) || navItems[0];

  if (!wedding && !loading) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-indigo-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-indigo-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
            <Gift className="text-amber-400 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-indigo-950 mb-4 tracking-tight">Welcome to Giftly!</h2>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            You haven't created any events yet. Create your first event to start tracking gifts.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full bg-indigo-900 text-white py-5 rounded-2xl font-bold text-xl hover:bg-indigo-800 transition-all shadow-xl hover:shadow-indigo-200 transform hover:-translate-y-1 active:scale-95"
          >
            Create My First Event
          </button>
          <button
            onClick={handleSignOut}
            className="mt-6 text-gray-400 font-semibold hover:text-gray-600 transition-colors"
          >
            Sign Out
          </button>
          <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <Gift className="text-amber-400 w-6 h-6" />
          <span className="font-bold text-lg">Giftly</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-indigo-800 rounded-lg transition-colors">
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop) / Mobile Menu Overlay */}
      <aside className={`
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:static inset-0 z-40 bg-indigo-900 text-white w-64 flex flex-col transition-transform duration-300 ease-in-out
      `}>
        <div className="p-8 hidden md:flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Gift className="text-amber-400 w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Giftly</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                ${location.pathname === item.path 
                  ? 'bg-amber-400 text-indigo-950 shadow-lg' 
                  : 'text-indigo-100 hover:bg-white/10'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="relative mb-4">
            <button
              onClick={() => setIsEventSwitcherOpen(!isEventSwitcherOpen)}
              className="w-full px-4 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                  {wedding?.event_type || 'Event'}
                </p>
                <ChevronDown className={`w-4 h-4 text-indigo-300 transition-transform ${isEventSwitcherOpen ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-sm font-bold truncate pr-2">
                {wedding?.event_type === 'Other' ? wedding.event_name : wedding?.couple_name}
              </p>
              <p className="text-[10px] text-indigo-300/80 font-medium">{wedding?.wedding_date || 'TBD'}</p>
            </button>

            {isEventSwitcherOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-indigo-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                <div className="max-h-48 overflow-y-auto py-2">
                  {weddings.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setWedding(w);
                        setIsEventSwitcherOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${wedding?.id === w.id ? 'bg-white/10' : ''}`}
                    >
                      <p className="text-xs font-bold text-indigo-200 uppercase tracking-tighter mb-0.5">{w.event_type}</p>
                      <p className="text-sm font-semibold truncate">
                        {w.event_type === 'Other' ? w.event_name : w.couple_name}
                      </p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsEventSwitcherOpen(false);
                  }}
                  className="w-full px-4 py-4 bg-indigo-700 hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm font-bold border-t border-white/10"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Event
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-indigo-100 hover:bg-white/10 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Create Event Modal */}
      <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Routes>
            <Route index element={<GiftLogging />} />
            <Route path="ledger" element={<GiftLedger />} />
            <Route path="reciprocity" element={<ReciprocityTracker />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

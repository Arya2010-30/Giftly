import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { Wedding } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  wedding: Wedding | null;
  weddings: Wedding[];
  setWedding: (wedding: Wedding | null) => void;
  refreshWeddings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  wedding: null,
  weddings: [],
  setWedding: () => {},
  refreshWeddings: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [weddings, setWeddings] = useState<Wedding[]>([]);

  const fetchWeddings = async (userId: string) => {
    const weddingsRef = collection(db, 'weddings');
    const q = query(weddingsRef, where('created_by', '==', userId));
    const querySnapshot = await getDocs(q);
    const fetchedWeddings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wedding));
    setWeddings(fetchedWeddings);
    return fetchedWeddings;
  };

  const refreshWeddings = async () => {
    if (user) {
      await fetchWeddings(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const fetched = await fetchWeddings(user.uid);
        if (fetched.length > 0) {
          // Default to the first one if none selected or if current one not in list
          setWedding(prev => {
            if (prev && fetched.find(w => w.id === prev.id)) return prev;
            return fetched[0];
          });
        } else {
          setWedding(null);
        }
      } else {
        setWedding(null);
        setWeddings([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-900"></div>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, wedding, weddings, setWedding, refreshWeddings }}>
      <Router>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
          <Route 
            path="/dashboard/*" 
            element={user ? <Dashboard /> : <Navigate to="/auth" />} 
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

import { Link } from 'react-router-dom';
import { Gift, FileText, Repeat, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-indigo-950 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center">
            <Gift className="text-amber-400 w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Giftly</span>
        </div>
        <div className="flex gap-4">
          <Link to="/auth" className="text-sm font-medium hover:text-indigo-700 transition-colors">Log In</Link>
          <Link to="/auth" className="bg-indigo-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-800 transition-all shadow-sm">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 py-20 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Never lose track of a <br className="hidden md:block" />
          <span className="text-indigo-700">gift</span> again.
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Log every cash gift in real time. Know exactly who gave what. 
          Never forget who to give back to at future events.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth" className="bg-indigo-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Get Started for Free
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-indigo-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Everything you need for your big day</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Gift className="text-indigo-900 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Real-time gift logging</h3>
              <p className="text-gray-600">Fast, mobile-friendly interface designed to be used during the event reception.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="text-indigo-900 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Family gift ledger</h3>
              <p className="text-gray-600">A complete, searchable record of every gift received, with detailed analytics.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Repeat className="text-indigo-900 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Reciprocity tracker</h3>
              <p className="text-gray-600">Keep track of your obligations. Know exactly how much to give back when guests have their own events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Footer */}
      <footer className="py-20 px-6 text-center border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <CheckCircle className="text-green-500 w-5 h-5" />
            <span className="text-sm font-medium text-gray-500">Trusted by over 1,000 hosts</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 Giftly Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

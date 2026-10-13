import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QACommunity from './views/QACommunity';
import OpportunityHub from './views/OpportunityHub';
import CampusMarketplace from './views/CampusMarketplace';
import AuthModal from './components/AuthModal';
import ProfileDrawer from './components/ProfileDrawer';
import { MessageSquare, Briefcase, ShoppingBag, Plus, Zap } from 'lucide-react';
import { supabase } from './supabaseClient';

function App() {
  const [activeTab, setActiveTab] = useState('qa');
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [counts, setCounts] = useState({ qa: 0, opportunities: 0, marketplace: 0 });

  useEffect(() => {
    // Fetch counts from DB
    const fetchCounts = async () => {
      const { count: qaCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
      const { count: oppCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
      const { count: marketCount } = await supabase.from('marketplace_items').select('*', { count: 'exact', head: true });
      setCounts({
        qa: qaCount || 0,
        opportunities: oppCount || 0,
        marketplace: marketCount || 0
      });
    };
    fetchCounts();
    
    // Auth setup
    const stored = localStorage.getItem('campus_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    
    // Theme setup
    const theme = localStorage.getItem('campus_theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('campus_user');
    setUser(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'qa':
        return <QACommunity user={user} onRequireAuth={() => setIsAuthOpen(true)} />;
      case 'opportunities':
        return <OpportunityHub user={user} />;
      case 'marketplace':
        return <CampusMarketplace user={user} onRequireAuth={() => setIsAuthOpen(true)} />;
      default:
        return <QACommunity user={user} onRequireAuth={() => setIsAuthOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20 relative">
      <Navbar user={user} onOpenAuth={() => setIsAuthOpen(true)} onLogout={handleLogout} onOpenProfile={() => setIsProfileOpen(true)} />
      
      {/* Hero Banner with Radial Glow */}
      <div className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/70 via-slate-50 to-slate-50 border-b border-slate-200/80 hidden sm:block relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 py-10 md:py-14 text-center md:text-left flex flex-col md:flex-row items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Connect. Learn. Exchange.
            </h1>
            <p className="mt-3 text-slate-600 text-sm md:text-base font-medium max-w-xl">The ultimate digital campus experience built for ambitious students. Trade, collaborate, and discover opportunities.</p>
          </div>
          <div className="mt-6 md:mt-0 bg-white border border-indigo-100 px-5 py-2.5 rounded-full shadow-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-500 fill-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700">124+ Active Peers</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative pb-20 md:pb-0 z-10">
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
        </div>
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto w-full">
          {renderContent()}
        </main>
      </div>
      
      {/* Mobile Floating Action Button */}
      <button 
        className="md:hidden fixed bottom-24 right-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white p-4 rounded-full shadow-lg shadow-indigo-500/25 z-40 transition-transform active:scale-95"
        onClick={() => setIsAuthOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 px-6 py-3 flex justify-between items-center safe-area-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setActiveTab('qa')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'qa' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-[10px] font-bold">Q&A</span>
        </button>
        <button 
          onClick={() => setActiveTab('opportunities')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'opportunities' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Briefcase className="h-6 w-6" />
          <span className="text-[10px] font-bold">Opps</span>
        </button>
        <button 
          onClick={() => setActiveTab('marketplace')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'marketplace' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="text-[10px] font-bold">Market</span>
        </button>
      </div>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={(userData) => setUser(userData)} 
      />
      <ProfileDrawer 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
        onLogout={() => {
          setIsProfileOpen(false);
          handleLogout();
        }}
        onUpdateProfile={(updatedData) => setUser(updatedData)}
      />
    </div>
  );
}

export default App;

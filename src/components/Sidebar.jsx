import React from 'react';
import { MessageSquare, Briefcase, ShoppingBag } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, counts = { qa: 0, opportunities: 0, marketplace: 0 } }) {
  const tabs = [
    { id: 'qa', name: 'Q&A Community', icon: MessageSquare, desc: 'Discussions & Help', count: counts.qa },
    { id: 'opportunities', name: 'Opportunity Hub', icon: Briefcase, desc: 'Hackathons & Internships', count: counts.opportunities },
    { id: 'marketplace', name: 'Campus Marketplace', icon: ShoppingBag, desc: 'Peer-to-peer trading', count: counts.marketplace },
  ];

  return (
    <div className="w-64 bg-transparent h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 flex flex-col pr-6 border-r border-slate-200/50">
      <div className="py-8 flex-1">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-3">
          Menu
        </h2>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-white border border-slate-200 shadow-sm shadow-slate-200/50'
                    : 'text-slate-500 hover:bg-white/60 border border-transparent hover:border-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{tab.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">
                      {tab.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
      
    </div>
  );
}

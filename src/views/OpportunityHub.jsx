import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, DollarSign, Users, ExternalLink, Briefcase, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

const allTypes = ['All', 'Internship', 'Hackathon', 'Fellowship'];

export default function OpportunityHub({ user }) {
  const [activeType, setActiveType] = useState('All');
  const [opportunities, setOpportunities] = useState([]);
  const [expandedTipId, setExpandedTipId] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('deadline', { ascending: true });
    
    if (data) setOpportunities(data);
  };

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = Math.abs(deadlineDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredOpportunities = activeType === 'All' 
    ? opportunities 
    : opportunities.filter(opp => opp.type === activeType);

  return (
    <div className="max-w-6xl mx-auto pt-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Opportunity Hub</h1>
          <p className="text-slate-500 text-sm font-semibold">Discover hackathons, internships, and fellowships.</p>
        </div>
        <div className="hidden md:block">
          <button 
            onClick={fetchOpportunities}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold shadow-sm"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide mask-edges">
        {allTypes.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm ${
              activeType === type 
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOpportunities.map(opp => {
          const daysRemaining = getDaysRemaining(opp.deadline);
          
          return (
            <div key={opp.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-300 relative overflow-hidden group flex flex-col h-full">
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 bg-slate-900`}></div>
              
              <div className="flex justify-between items-start mb-5 relative z-10 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-indigo-500/20 bg-gradient-to-br from-indigo-600 to-violet-600`}>
                    {opp.logo || (opp.company ? opp.company.charAt(0) : 'O')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1 group-hover:text-indigo-700 transition-colors">{opp.title}</h3>
                    <p className="text-sm text-slate-500 font-bold">{opp.company}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200">
                    {opp.type}
                  </span>
                  {daysRemaining <= 14 && (
                    <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-md border border-rose-200 animate-pulse">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {daysRemaining} days left
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{opp.location}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{opp.stipend}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-amber-600 font-bold truncate">By {new Date(opp.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>{opp.applicants || 0} Applicants</span>
                </div>
              </div>

              <div className="mt-auto">
                {opp.senior_tips && (
                  <div className="mb-5 border border-indigo-100 bg-indigo-50/50 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setExpandedTipId(expandedTipId === opp.id ? null : opp.id)}
                      className="w-full flex justify-between items-center p-3.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">💡 Senior Tip for this role</span>
                      {expandedTipId === opp.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expandedTipId === opp.id && (
                      <div className="px-4 pb-4 text-sm text-indigo-900/80 leading-relaxed font-medium">
                        {opp.senior_tips}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {opp.tags && opp.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold tracking-wide uppercase text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a 
                    href={opp.apply_link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                  >
                    Apply Now <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredOpportunities.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">No opportunities found for this category.</p>
        </div>
      )}
    </div>
  );
}

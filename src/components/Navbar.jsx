import React from 'react';
import { Search, Bell, Hexagon } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout, onOpenProfile }) {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const parseYear = (yearStr) => {
    if (!yearStr) return '';
    const match = yearStr.match(/\(([^)]+)\)/);
    return match ? match[1] : yearStr.split(' ')[0];
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 text-slate-900 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center text-indigo-600">
              <Hexagon className="h-8 w-8 fill-indigo-100" />
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:block">
              <span className="text-slate-900">Campus</span>
              <span className="text-indigo-600">Connect</span>
            </span>
            <div className="hidden sm:flex items-center ml-4 px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
              <span className="text-[10px] font-bold text-emerald-700 tracking-wider">LIVE</span>
            </div>
          </div>
          
          <div className="flex-1 max-w-2xl px-4 lg:px-8 hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 sm:text-sm transition-all duration-300 shadow-sm"
                placeholder="Search resources, opportunities, discussions..."
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="sm:hidden flex items-center px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
              <span className="text-[9px] font-bold text-emerald-700">LIVE</span>
            </div>
            
            <button className="text-slate-400 hover:text-indigo-600 relative transition-colors">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>
            
            {user ? (
              <div 
                onClick={onOpenProfile}
                className="flex items-center gap-3 bg-white rounded-full pl-1.5 pr-4 py-1.5 border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group relative"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="DP" className="rounded-full h-8 w-8 object-cover shadow-sm border border-slate-200" />
                ) : (
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold text-white shadow-sm shadow-indigo-500/20">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                <div className="flex-col hidden sm:flex">
                  <span className="text-sm font-bold leading-none text-slate-900">{user.firstName}</span>
                  <span className="text-[10px] text-slate-500 mt-1 font-semibold tracking-wider">{parseYear(user.year)} {user.branch}</span>
                </div>
                {/* Tooltip */}
                <div className="absolute -bottom-10 right-0 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg font-medium">
                  View Profile
                </div>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-md shadow-indigo-500/20 active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

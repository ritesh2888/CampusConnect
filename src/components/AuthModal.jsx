import React, { useState } from 'react';
import { X, Hexagon, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    year: 'First Year (FE)',
    branch: 'COMP',
    phone: '',
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random().toString(36).substring(7)}`
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signup');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'login') {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', formData.email).single();
      if (data) {
        const userData = {
          firstName: data.full_name?.split(' ')[0] || 'Student',
          lastName: data.full_name?.split(' ')[1] || '',
          email: data.email,
          year: data.year_of_study,
          branch: data.branch,
          phone: data.phone,
          avatar_url: data.avatar_url,
          id: data.id
        };
        localStorage.setItem('campus_user', JSON.stringify(userData));
        onLogin(userData);
        onClose();
      } else {
        alert("Account not found. Please create an account first.");
      }
    } else {
      if (!/^\d{4}\.[a-zA-Z]+\.[a-zA-Z]+@ves\.ac\.in$/.test(formData.email)) {
        alert("Invalid Email Format! You must use your official college email:\nFormat: year.firstname.lastname@ves.ac.in");
        setLoading(false);
        return;
      }

      if (!/^\d{10}$/.test(formData.phone)) {
        alert("Invalid Phone Number! It must be exactly 10 digits.");
        setLoading(false);
        return;
      }

      const mockId = crypto.randomUUID ? crypto.randomUUID() : '123e4567-e89b-12d3-a456-426614174000';
      const { data, error } = await supabase
        .from('profiles')
        .upsert([
          {
            id: mockId,
            full_name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            year_of_study: formData.year,
            branch: formData.branch,
            phone: formData.phone,
            avatar_url: formData.avatar_url,
            is_phone_public: formData.isPhonePublic !== false
          }
        ])
        .select();

      if (error) {
        console.warn("Supabase profiles upsert failed. Continuing locally:", error.message);
      }
      
      const userData = { ...formData, id: data?.[0]?.id || mockId };
      localStorage.setItem('campus_user', JSON.stringify(userData));
      onLogin(userData);
      onClose();
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-200/80 bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Hexagon className="h-5 w-5 fill-indigo-100" />
            </div>
            Join Campus
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-1 rounded-full border border-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200/80">
          <button 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50/50' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50/50' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
            onClick={() => setMode('signup')}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">First Name</label>
                <input 
                  type="text" required={mode === 'signup'}
                  value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="Ritesh"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Last Name</label>
                <input 
                  type="text" required={mode === 'signup'}
                  value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="Yadav"
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">College Email</label>
            <input 
              type="email" required
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              placeholder="student@college.edu"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} required
                value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Year of Study</label>
                  <select 
                    value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  >
                    <option value="First Year (FE)">First Year (FE)</option>
                    <option value="Second Year (SE)">Second Year (SE)</option>
                    <option value="Third Year (TE)">Third Year (TE)</option>
                    <option value="Final Year (BE)">Final Year (BE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Branch</label>
                  <select 
                    value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  >
                    <option value="COMP">COMP</option>
                    <option value="IT">IT</option>
                    <option value="AI/DS">AI/DS</option>
                    <option value="ECS">ECS</option>
                    <option value="EXTC">EXTC</option>
                    <option value="AURO">AURO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">WhatsApp No.</label>
                <input 
                  type="text" required={mode === 'signup'}
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium mb-3"
                  placeholder="+91 9876543210"
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isPhonePublic"
                    checked={formData.isPhonePublic !== false} 
                    onChange={e => setFormData({...formData, isPhonePublic: e.target.checked})}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <label htmlFor="isPhonePublic" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    Show my number publicly on my profile
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="pt-2 mt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl py-3.5 font-bold shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

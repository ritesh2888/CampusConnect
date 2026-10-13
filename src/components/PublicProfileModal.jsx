import React, { useState, useEffect } from 'react';
import { X, Shield, Phone, MapPin, GraduationCap, UserCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function PublicProfileModal({ userId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    
    // First check local storage for our own profile (fast response)
    const localUser = JSON.parse(localStorage.getItem('campus_user') || '{}');
    if (localUser.id === userId) {
      setProfile(localUser);
      setLoading(false);
      return;
    }

    // Otherwise fetch from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile({
        firstName: data.full_name?.split(' ')[0] || 'Student',
        lastName: data.full_name?.split(' ')[1] || '',
        email: data.email,
        year: data.year_of_study,
        branch: data.branch,
        phone: data.phone,
        avatar_url: data.avatar_url,
        isPhonePublic: data.is_phone_public,
        id: data.id
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="relative h-24 bg-gradient-to-r from-indigo-500 to-violet-600">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-1.5 rounded-full backdrop-blur-md">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 pb-6 pt-0 relative">
          {loading ? (
            <div className="flex flex-col items-center py-10">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : profile ? (
            <>
              {/* Avatar floating over banner */}
              <div className="flex justify-center -mt-12 mb-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
                  {profile.firstName} {profile.lastName}
                  <Shield className="h-5 w-5 text-emerald-500" title="Verified Campus Student" />
                </h3>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold mt-2 border border-indigo-100">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {profile.year?.split(' ')[0]} • {profile.branch}
                </span>
              </div>
              
              <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                  <span className="font-semibold">{profile.email}</span>
                </div>
                
                {profile.isPhonePublic ? (
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Phone className="h-5 w-5 text-emerald-500" />
                    <span className="font-bold text-emerald-600">{profile.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Phone className="h-5 w-5 text-slate-300" />
                    <span className="font-medium italic">Number is private</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <UserCircle className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Account Not Found</h3>
              <p className="text-sm text-slate-500 mt-1">This user may have permanently deleted their account.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

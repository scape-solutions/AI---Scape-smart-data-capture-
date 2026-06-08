import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, X, Settings } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: any;
  profile: UserProfile | null;
  globalError: string | null;
  globalSuccess: string | null;
  setGlobalError: (msg: string | null) => void;
  setGlobalSuccess: (msg: string | null) => void;
  setView: (view: 'dashboard' | 'questionnaire' | 'profile_setup') => void;
  logout: () => void;
  switchMode: (role: 'evaluator' | 'external' | 'superuser', onStatusChanged: (isAdmin: boolean) => void) => void;
  isAllowedEvaluator: (email: string | null | undefined) => boolean;
  isScapeEmployee: (email: string | null | undefined, uid?: string | null) => boolean;
  saveProfile: (data: any) => Promise<void>;
  projectName?: string;
  projectId?: string;
  locationLabel?: string;
  ownerName?: string;
  ownerCompany?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

export function Header({
  user,
  profile,
  globalError,
  globalSuccess,
  setGlobalError,
  setGlobalSuccess,
  setView,
  logout,
  switchMode,
  isAllowedEvaluator,
  isScapeEmployee,
  saveProfile,
  projectName,
  projectId,
  locationLabel,
  ownerName,
  ownerCompany,
  ownerEmail,
  ownerPhone
}: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'enduser' | 'integrator' | 'other'>('enduser');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showContactPopover, setShowContactPopover] = useState(false);

  useEffect(() => {
    setShowContactPopover(false);
  }, [projectId]);

  // Sync profile details when loaded or modal is opened
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCompany(profile.company || profile.organization || '');
      setPhone(profile.phone || '');
      setRole(profile.role || 'enduser');
    }
  }, [profile, isModalOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company) return;
    setIsSavingProfile(true);
    try {
      await saveProfile({
        ...profile,
        name,
        company,
        organization: company,
        phone,
        role
      });
      setGlobalSuccess("Contact profile updated successfully!");
      setTimeout(() => setGlobalSuccess(null), 4000);
      setIsModalOpen(false);
    } catch (err) {
      setGlobalError("Failed to update profile info.");
      setTimeout(() => setGlobalError(null), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 relative md:sticky top-0 z-[50]">
      {/* Hvis globalError er sat til noget (ikke null), viser vi denne røde boks. */}
      {globalError && (
        <div className="absolute top-16 left-0 right-0 bg-red-600 text-white text-[10px] py-1 px-4 md:px-8 font-bold flex justify-between items-center z-[60]">
          <span>Error: {globalError}</span>
          <button onClick={() => setGlobalError(null)} className="underline">Dismiss</button>
        </div>
      )}
      
      {/* Det samme for succes-beskeder (grøn boks) */}
      {globalSuccess && (
        <div className="absolute top-16 left-0 right-0 bg-emerald-600 text-white text-[10px] py-1 px-4 md:px-8 font-bold flex justify-between items-center z-[60]">
          <span>{globalSuccess}</span>
          <button onClick={() => setGlobalSuccess(null)} className="underline">Dismiss</button>
        </div>
      )}
      
      <div className="flex items-center gap-2 cursor-pointer shrink-0 select-none hover:opacity-90 active:scale-[0.98] transition-all" onClick={() => setView('dashboard')}>
        <span className="font-extrabold text-2xl tracking-[0.04em] text-slate-900 flex items-center select-none">
          SC
          <span className="inline-flex items-center justify-center mx-[0.5px] relative top-[0.5px]">
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
              {/* Left slanted leg of A */}
              <path d="M 22,90 L 50,15 L 62,15 L 34,90 Z" fill="currentColor" />
              {/* Right slanted leg of A */}
              <path d="M 50,15 L 68,55 L 56,55 L 42,23 Z" fill="currentColor" />
              {/* Slanted red block leg of A */}
              <path d="M 61,62 L 70,62 L 78,82 L 69,82 Z" fill="#bf1e2e" />
            </svg>
          </span>
          PE
        </span>
      </div>
      
      {projectName && (
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 max-w-md lg:max-w-xl mx-4 select-none overflow-hidden animate-fadeIn">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl shrink-0">
            <span className="uppercase tracking-wider text-[9px] text-slate-400 font-bold">Project:</span>
            <span className="text-slate-800 font-black truncate max-w-[120px] lg:max-w-[200px]" title={projectName}>
              {projectName}
            </span>
            {projectId && (
              <div className="relative inline-flex items-center">
                <span className="text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded select-all" title={`Case ID: ${projectId}`}>
                  #{projectId.substring(0, 6).toUpperCase()}
                </span>
                {profile?.isAdmin && (ownerName || ownerCompany || ownerEmail) && (
                  <div className="relative ml-1 shrink-0">
                    <button
                      onClick={() => setShowContactPopover(!showContactPopover)}
                      className={`p-1 rounded-md transition-all select-none cursor-pointer hover:bg-slate-100 ${showContactPopover ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                      title="View external user contact info"
                    >
                      <UserIcon className="w-3 h-3" />
                    </button>

                    {showContactPopover && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setShowContactPopover(false)} 
                        />
                        <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-fadeIn text-left cursor-default select-text">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                            <span>Project Owner Contact</span>
                            <button 
                              onClick={() => setShowContactPopover(false)}
                              className="text-slate-400 hover:text-slate-600 rounded p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Name</p>
                              <p className="text-xs font-bold text-slate-800">{ownerName || 'Unknown Owner'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Company / Org</p>
                              <p className="text-xs font-bold text-slate-800">{ownerCompany || 'No Company'}</p>
                            </div>
                            {ownerEmail && (
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Email</p>
                                <a href={`mailto:${ownerEmail}`} className="text-xs font-bold text-blue-600 hover:underline">{ownerEmail}</a>
                              </div>
                            )}
                            {ownerPhone && ownerPhone !== 'Unknown' && (
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Phone</p>
                                <a href={`tel:${ownerPhone}`} className="text-xs font-bold text-slate-800 hover:underline">{ownerPhone}</a>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <svg className="w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <div className="bg-blue-50 border border-blue-100/50 px-3 py-1.5 rounded-xl text-blue-700 font-black text-[11px] truncate shrink-0 max-w-[220px]">
            {locationLabel}
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 md:gap-6">
        {/* Vises kun for Scape ansatte. */}
        {(isScapeEmployee(user?.email, user?.uid) || isAllowedEvaluator(user?.email)) && (
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {user?.email?.toLowerCase() === 'rune.k.larsen@scapesolutions.eu' && (
              <button 
                onClick={() => switchMode('superuser', () => {})}
                className={`text-[9px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg transition-all ${profile?.requestedRole === 'superuser' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Super User
              </button>
            )}
            <button 
              onClick={() => switchMode('evaluator', () => {})}
              className={`text-[9px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg transition-all ${profile?.requestedRole === 'evaluator' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Evaluator
            </button>
            <button 
              onClick={() => switchMode('external', () => {})}
              className={`text-[9px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg transition-all ${profile?.requestedRole === 'external' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              External
            </button>
          </div>
        )}
        
        {/* Interactive clickable Profile area */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-3 px-3 py-1.5 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 cursor-pointer transition-all duration-200 select-none text-right"
          title="Vis / ret profil & kontaktdata"
        >
          <div className="hidden sm:block">
            <div className="flex items-center justify-end gap-2">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none ${
                profile?.requestedRole === 'superuser' ? 'bg-amber-600 text-white border-amber-600' :
                profile?.isAdmin ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {profile?.requestedRole === 'superuser' ? "Super User" : profile?.isAdmin ? "Scape Eng" : "External"}
              </span>
              <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors">{profile?.name}</span>
            </div>
            <p className="text-[10px] text-slate-400 group-hover:text-slate-500 transition-colors font-medium">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-500 group-hover:text-slate-700 border border-slate-200 transition-all duration-200 shrink-0">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>
        
        <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* DET SMUKKE MY PROFILE / KONTAKTDATA MODAL POPUP */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl max-w-md w-full border border-slate-100 relative overflow-hidden animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            {/* Elegant top color band */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-amber-500" />
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-all border border-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Contact Profile</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Ret dine kontaktoplysninger</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Navn / Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rune Larsen" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-red-500 transition-all text-sm" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Firma / Company</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Scape Solutions A/S" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-red-500 transition-all text-sm" 
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Telefon / Phone (Valgfri)</label>
                <input 
                  type="text" 
                  placeholder="e.g. +45 12345678" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-red-500 transition-all text-sm" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rolle / Position</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-red-500 transition-all text-sm" 
                  value={role} 
                  onChange={e => setRole(e.target.value as any)}
                >
                  <option value="enduser">End User / Slutkunde</option>
                  <option value="integrator">Integrator / Forhandler</option>
                  <option value="other">Other / Andet</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingProfile || !name || !company}
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 hover:scale-[1.01] transition-all select-none text-sm flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Gemmer...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

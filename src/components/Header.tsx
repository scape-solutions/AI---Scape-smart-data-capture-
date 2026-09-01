import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, X, Settings, Mail, LayoutDashboard, Bot, Zap, Play, Sparkles } from 'lucide-react';
import { isDynamicSuperuser } from '../hooks/useAuth';
import { UserProfile } from '../types';
import { IntroVideoModal } from './IntroVideoModal';

interface HeaderProps {
  user: any;
  profile: UserProfile | null;
  globalError: string | null;
  globalSuccess: string | null;
  setGlobalError: (msg: string | null) => void;
  setGlobalSuccess: (msg: string | null) => void;
  setView: (view: 'dashboard' | 'questionnaire' | 'profile_setup') => void;
  logout: () => void;
  switchMode: (role: 'evaluator' | 'user' | 'superuser', onStatusChanged: (isAdmin: boolean) => void) => void;
  isAllowedEvaluator: (email: string | null | undefined) => boolean;
  isScapeEmployee: (email: string | null | undefined, uid?: string | null) => boolean;
  saveProfile: (data: any) => Promise<void>;
  onOpenToS?: () => void;
  projectName?: string;
  projectId?: string;
  locationLabel?: string;
  ownerName?: string;
  ownerCompany?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  onBackToDashboard?: () => void;
  isSplitScreenMode?: boolean;
  onToggleSplitScreen?: () => void;
  onOpenAIAdviceDrawer?: () => void;
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
  onOpenToS,
  projectName,
  projectId,
  locationLabel,
  ownerName,
  ownerCompany,
  ownerEmail,
  ownerPhone,
  onBackToDashboard,
  isSplitScreenMode,
  onToggleSplitScreen,
  onOpenAIAdviceDrawer
}: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
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
    <header className="h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 bg-white border-b border-slate-200 relative md:sticky top-0 z-[50] w-full min-w-0 max-w-full overflow-hidden">
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
      
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
        <div 
          className="flex items-center gap-2 cursor-pointer shrink-0 select-none hover:opacity-90 active:scale-[0.98] transition-all" 
          onClick={() => setIsAboutModalOpen(true)}
          title="Om Scape Bin-Picker Projects"
        >
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
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded-md leading-none select-none">
            Info
          </span>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            title="Back to Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}

        {onToggleSplitScreen && (
          <button 
            type="button"
            onClick={onToggleSplitScreen}
            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl border transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
              isSplitScreenMode 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={isSplitScreenMode ? "Switch to Manual Mode" : "Switch to AI Auto-fill Mode"}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSplitScreenMode ? 'Switch to Manual Mode' : 'Switch to AI Mode'}</span>
            <span className="sm:hidden">{isSplitScreenMode ? 'Manual' : 'AI'}</span>
          </button>
        )}

        {onOpenAIAdviceDrawer && (
          <button 
            type="button"
            onClick={onOpenAIAdviceDrawer}
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl border border-amber-200/80 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            title="Open AI Feasibility Advice Drawer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="hidden xl:inline">AI Advice</span>
            <span className="hidden sm:inline xl:hidden">Advice</span>
            <span className="sm:hidden">⚡</span>
          </button>
        )}

        {/* Intro Video & Guide Launch Button */}
        <button
          type="button"
          onClick={() => setIsIntroModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
          title="App Storyboard & Step-by-Step Guide"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">App Guide</span>
        </button>
      </div>

      {projectName && (
        <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 max-w-[130px] sm:max-w-md lg:max-w-xl mx-1 sm:mx-4 select-none overflow-hidden animate-fadeIn min-w-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl min-w-0">
            <span className="uppercase tracking-wider text-[9px] text-slate-400 font-bold shrink-0">Project:</span>
            <span className="text-slate-800 font-black truncate max-w-[80px] sm:max-w-[120px] lg:max-w-[180px]" title={projectName}>
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
                      title="View user contact info"
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
      
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
        
        {/* Interactive clickable Profile area */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-1 rounded-2xl border border-slate-100 sm:border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all duration-200 select-none text-right shrink-0 bg-slate-50/50 sm:bg-transparent"
          title="Vis / ret profil & kontaktdata"
        >
          <div className="flex flex-col sm:items-end justify-center">
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none self-end mb-0.5 ${
              profile?.requestedRole === 'superuser' ? 'bg-amber-600 text-white border-amber-600' :
              profile?.requestedRole === 'evaluator' ? 'bg-blue-600 text-white border-blue-600' : 
              profile?.isAdmin ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {profile?.requestedRole === 'superuser' ? "Super User" : 
               profile?.requestedRole === 'evaluator' ? "Evaluator" :
               profile?.isAdmin ? "Scape Eng" : "User"}
            </span>
            <div className="hidden lg:block text-right min-w-0 max-w-[140px] truncate">
              <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors block truncate">{profile?.name}</span>
              <p className="text-[10px] text-slate-400 group-hover:text-slate-500 transition-colors font-medium leading-tight truncate">{user?.email}</p>
            </div>
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
            className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl max-w-md w-full border border-slate-100 relative overflow-hidden animate-scaleIn max-h-[85svh] overflow-y-auto"
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

            {/* Rolle-vælger til Scape Ansatte - Flyttet ind i modal for at spare plads i Header */}
            {(isAllowedEvaluator(user?.email) || isDynamicSuperuser(user?.email)) && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Admin View Mode</label>
                <div className="flex bg-slate-200/60 p-1 rounded-xl">
                  {isDynamicSuperuser(user?.email) && (
                    <button 
                      onClick={() => switchMode('superuser', () => {})}
                      type="button"
                      className={`flex-1 text-[10px] font-black uppercase px-2 py-2 rounded-lg transition-all ${profile?.requestedRole === 'superuser' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Super User
                    </button>
                  )}
                  <button 
                    onClick={() => switchMode('evaluator', () => {})}
                    type="button"
                    className={`flex-1 text-[10px] font-black uppercase px-2 py-2 rounded-lg transition-all ${profile?.requestedRole === 'evaluator' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Evaluator
                  </button>
                  <button 
                    onClick={() => switchMode('user', () => {})}
                    type="button"
                    className={`flex-1 text-[10px] font-black uppercase px-2 py-2 rounded-lg transition-all ${profile?.requestedRole === 'user' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    User
                  </button>
                </div>
              </div>
            )}

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
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email (Locked / Read-only)</label>
                <div className="relative">
                  <input 
                    type="email" 
                    disabled
                    className="w-full p-4 bg-slate-100 border border-slate-100 rounded-2xl font-semibold text-slate-400 cursor-not-allowed text-sm" 
                    value={profile?.email || user?.email || ''}
                  />
                </div>
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

      {/* DET SMUKKE OM / ABOUT MODAL POPUP */}
      {isAboutModalOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl max-w-lg w-full border border-slate-100 relative overflow-hidden animate-scaleIn select-text text-left max-h-[85svh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Elegant top color band */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-amber-500" />
            
            <button 
              onClick={() => setIsAboutModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-all border border-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo and Header */}
            <div className="flex items-center gap-2 mb-6">
              <span className="font-extrabold text-2xl tracking-[0.04em] text-slate-900 flex items-center select-none">
                SC
                <span className="inline-flex items-center justify-center mx-[0.5px] relative top-[0.5px]">
                  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
                    <path d="M 22,90 L 50,15 L 62,15 L 34,90 Z" fill="currentColor" />
                    <path d="M 50,15 L 68,55 L 56,55 L 42,23 Z" fill="currentColor" />
                    <path d="M 61,62 L 70,62 L 78,82 L 69,82 Z" fill="#bf1e2e" />
                  </svg>
                </span>
                PE
              </span>
              <span className="text-xs font-bold text-slate-400">Bin-Picker Projects</span>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
              {/* Build Info */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">System Version Info</h4>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold text-slate-600">
                  <div>
                    <span className="block text-[9px] font-sans text-slate-400 uppercase tracking-tight">Version</span>
                    <span>v{__APP_VERSION__}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-sans text-slate-400 uppercase tracking-tight">Git Commit</span>
                    <span>{__APP_GIT_HASH__}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-sans text-slate-400 uppercase tracking-tight">Build Date</span>
                    <span>{new Date(__APP_BUILD_DATE__).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">About Scape Bin-Picking Projects</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Welcome to Scape Bin-Picking Projects. This platform is designed to dramatically accelerate your automation journey and reduce quotation lead times. By easily collecting key component and cell parameters, it allows Scape engineers to deliver fast, verified feasibility assessments.
                </p>
                <div className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                  <p className="font-bold text-slate-800">Time-saving features:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>AI Chat Assistant:</strong> Talk or type to specify cell info (e.g. say <em>"We are using a Kuka robot with a 500x300mm bin"</em> to auto-fill fields).</li>
                    <li><strong>Split-Screen AI Onboarding:</strong> Drag in an existing project specification sheet or PDF, and watch the AI extract and pre-fill fields side-by-side.</li>
                    <li><strong>Instant Project Advice:</strong> Run an automated checklist to scan your project for errors and omissions before submission.</li>
                  </ul>
                </div>
              </div>

              {/* Condensed How-To */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Quick Guide</h4>
                <ul className="text-xs text-slate-700 space-y-1.5 leading-relaxed list-decimal pl-4">
                  <li>Define your robot and bin size under <strong>Project & Cell Info</strong>.</li>
                  <li>Add your parts with weights and dimensions.</li>
                  <li><strong className="text-red-600">[CRITICAL]</strong> Upload CAD files (.stl, .stp, .step) and clear images of your part inside the bin. Without these files, Scape engineers cannot conduct a final technical verification.</li>
                  <li>Review completeness using the automated <strong>Project Information Advice</strong> tool.</li>
                  <li>Click <strong>Submit</strong> to request your feasibility report.</li>
                </ul>
              </div>

              {/* Terms of Service Link */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Review terms & privacy:</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenToS();
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  Terms of Service (ToS)
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-3">
              <button 
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs cursor-pointer"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={() => {
                  setView('dashboard');
                  setIsAboutModalOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:scale-[1.01] transition-all text-xs cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTRO VIDEO & GUIDE MODAL */}
      <IntroVideoModal 
        isOpen={isIntroModalOpen} 
        onClose={() => setIsIntroModalOpen(false)} 
      />
    </header>
  );
}

/**
 * AuthView.tsx
 * Dette er den første skærm, brugeren ser. Den håndterer SignIn og SignUp.
 */
import { Cpu, X, Play, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { IntroVideoModal } from '../components/IntroVideoModal';
import { isCampaignTagActive } from '../hooks/useAuth';

// Props interfacen. Disse værdier "flyder" ned fra App.tsx
interface AuthViewProps {
  authStep: 'signin' | 'signup' | 'forgot';
  setAuthStep: (step: 'signin' | 'signup' | 'forgot') => void;
  authEmail: string;
  setAuthEmail: (e: string) => void;
  authPassword: string;
  setAuthPassword: (e: string) => void;
  authDisplayName: string;
  setAuthDisplayName: (e: string) => void;
  authError: string | null;
  allowedConfig?: any;
  activeCampaignTag?: string | null;
  loginWithEmail: () => void;
  signupWithEmail: () => void;
  loginWithGoogle: () => void;
  sendPasswordReset?: (email: string) => Promise<boolean>;
  authLoading: boolean;
}

export function AuthView({
  authStep,
  setAuthStep,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authDisplayName,
  setAuthDisplayName,
  authError,
  allowedConfig,
  activeCampaignTag,
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  sendPasswordReset,
  authLoading
}: AuthViewProps) {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const emailValid = !authEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.trim());

  const handleSendReset = async () => {
    if (!sendPasswordReset || !authEmail.trim()) return;
    setIsSendingReset(true);
    setResetSentEmail(null);
    try {
      const success = await sendPasswordReset(authEmail.trim());
      if (success) {
        setResetSentEmail(authEmail.trim());
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-sm w-full text-center relative z-10">
        <div 
          className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg cursor-pointer hover:scale-105 transition-all relative group"
          onClick={() => setIsAboutModalOpen(true)}
          title="App Info"
        >
          <img src="/scape-logo.jpg" alt="Scape" className="w-10 h-auto object-contain mix-blend-screen" onError={(e) => e.currentTarget.style.display = 'none'} />
          <Cpu className="text-white w-8 h-8 absolute opacity-20" />
          <span className="absolute -bottom-2 -right-2 bg-white text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-red-100">Info</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">SCAPE PICK-PILOT</h1>
        <p className="text-slate-500 mb-4 text-sm font-medium">Smart Data Capture & Feasibility Assessment</p>
        
        {activeCampaignTag && (
          !allowedConfig ? (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold rounded-full animate-pulse">
              <span>🎟️</span>
              <span>Validating campaign: {activeCampaignTag}...</span>
            </div>
          ) : isCampaignTagActive(activeCampaignTag, allowedConfig) ? (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
              <span>🎟️</span>
              <span>Campaign Access: {activeCampaignTag}</span>
            </div>
          ) : (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
              <span>⏸️</span>
              <span>Campaign Paused / Expired: {activeCampaignTag}</span>
            </div>
          )
        )}

        <button
          type="button"
          onClick={() => setIsIntroModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold mb-6 transition-all border border-slate-200 cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>App Storyboard & Guide</span>
        </button>
        
        {authLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-red-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Authenticating...</p>
          </div>
        ) : (
          <>
            {authStep === 'forgot' ? (
              <div className="space-y-4 mb-8 text-left animate-fadeIn">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Reset Password</span>
                  <button 
                    type="button" 
                    onClick={() => { setAuthStep('signin'); setResetSentEmail(null); }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Indtast din e-mailadresse for at modtage et link til at nulstille din adgangskode.
                </p>

                <div className="space-y-1">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className={`w-full p-4 bg-slate-50 rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      !emailValid 
                        ? 'ring-2 ring-red-500 bg-red-50/30' 
                        : 'focus:ring-blue-600'
                    }`}
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                  />
                  {!emailValid && (
                    <p className="text-[10px] text-red-500 font-bold px-1">Indtast en gyldig e-mailadresse / Enter a valid email</p>
                  )}
                </div>

                {resetSentEmail && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 animate-fadeIn text-center">
                    ✓ Link sendt til <span className="underline">{resetSentEmail}</span>! Tjek venligst din indbakke.
                  </div>
                )}

                {authError && <p className="text-[10px] text-red-500 font-bold">{authError}</p>}

                <button 
                  type="button"
                  onClick={handleSendReset} 
                  disabled={!authEmail.trim() || !emailValid || isSendingReset}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
                >
                  {isSendingReset && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  <span>{isSendingReset ? 'Sender link...' : 'Send Reset Link'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl mb-6">
                  <button onClick={() => setAuthStep('signin')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authStep === 'signin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Sign In</button>
                  <button onClick={() => setAuthStep('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authStep === 'signup' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Sign Up</button>
                </div>

                {/* Vises kun hvis vi er i 'signup' tilstand */}
                {authStep === 'signup' && (
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="w-full p-4 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-600"
                    value={authDisplayName}
                    onChange={e => setAuthDisplayName(e.target.value)}
                  />
                )}
                
                <div className="space-y-1 text-left">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className={`w-full p-4 bg-slate-50 rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      !emailValid 
                        ? 'ring-2 ring-red-500 bg-red-50/30' 
                        : 'focus:ring-blue-600'
                    }`}
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                  />
                  {!emailValid && (
                    <p className="text-[10px] text-red-500 font-bold px-1">Indtast en gyldig e-mailadresse / Enter a valid email</p>
                  )}
                </div>

                <div className="space-y-1">
                  <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full p-4 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-600"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                  />
                  {authStep === 'signin' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => { setAuthStep('forgot'); setResetSentEmail(null); }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer transition-all"
                      >
                        Glemt adgangskode? / Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {authError && <p className="text-[10px] text-red-500 font-bold">{authError}</p>}

                <button 
                  onClick={authStep === 'signin' ? loginWithEmail : signupWithEmail} 
                  disabled={!authEmail.trim() || !authPassword.trim() || !emailValid || (authStep === 'signup' && !authDisplayName.trim())}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {authStep === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            )}

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300"><span className="bg-white px-2">OR</span></div>
            </div>

            <button onClick={loginWithGoogle} className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              {/* Dette er SVG koden for Google logoet */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
            
            <p className="mt-8 text-[10px] text-slate-400 font-medium">To enable email login, please activate it in your Firebase console.</p>
          </>
        )}
      </div>

      {/* ABOUT MODAL POPUP */}
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
              <span className="text-xs font-black tracking-wider text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg select-none">PICK-PILOT</span>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
              {/* Build Info */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">System Version Info</h4>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold text-slate-600">
                  <div>
                    <span className="block text-[9px] font-sans text-slate-400 uppercase tracking-tight">Version</span>
                    {/* @ts-ignore */}
                    <span>v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'Local'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-sans text-slate-400 uppercase tracking-tight">Git Commit</span>
                    {/* @ts-ignore */}
                    <span>{typeof __APP_GIT_HASH__ !== 'undefined' ? __APP_GIT_HASH__ : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-sans text-slate-400 uppercase tracking-tight">Build Date</span>
                    {/* @ts-ignore */}
                    <span>{typeof __APP_BUILD_DATE__ !== 'undefined' ? new Date(__APP_BUILD_DATE__).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Purpose</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  This tool helps collect and evaluate technical specifications for bin-picking tasks. 
                  By sharing data about parts, bins, and performance, we can quickly provide advice and assess the feasibility of an automated solution.
                </p>
              </div>

              {/* Condensed How-To */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Quick Guide</h4>
                <ul className="text-xs text-slate-700 space-y-1.5 leading-relaxed list-decimal pl-4">
                  <li>Log in with your Google account.</li>
                  <li>Create a new project and specify bin size, as well as preferred robot brand.</li>
                  <li>Add parts with weight and dimensions, and take photos with your mobile.</li>
                  <li>Use the AI Assistant in the panel to quickly fill in the form using speech.</li>
                  <li>Submit your project, after which Scape performs the final evaluation.</li>
                </ul>
              </div>

              {/* Data Security */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Data Security</h4>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  All entered information, CAD files, and uploaded images are kept confidential and encrypted. 
                  Data is protected against unauthorized access and is accessed solely by authorized personnel from Scape Solutions for evaluation purposes.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8">
              <button 
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intro Video & Guide Modal */}
      <IntroVideoModal 
        isOpen={isIntroModalOpen} 
        onClose={() => setIsIntroModalOpen(false)} 
      />
    </div>
  );
}

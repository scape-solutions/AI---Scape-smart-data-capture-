/**
 * AuthView.tsx
 * Dette er den første skærm, brugeren ser. Den håndterer SignIn og SignUp.
 */
import { Cpu } from 'lucide-react';

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
  loginWithEmail: () => void;
  signupWithEmail: () => void;
  loginWithGoogle: () => void;
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
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle
}: AuthViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Cpu className="text-white w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Scape Evaluator</h1>
        <p className="text-slate-500 mb-8 text-sm">Professional Bin-Picking Assessment</p>
        
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
          
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-600"
            value={authEmail}
            // e.target.value er standard JavaScript for at hente det, brugeren har tastet ind
            onChange={e => setAuthEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-600"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
          />

          {authError && <p className="text-[10px] text-red-500 font-bold">{authError}</p>}

          <button 
            // Vælger den rigtige funktion baseret på tilstanden
            onClick={authStep === 'signin' ? loginWithEmail : signupWithEmail} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:scale-[1.02] transition-all"
          >
            {authStep === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

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
      </div>
    </div>
  );
}

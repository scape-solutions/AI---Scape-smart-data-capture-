/**
 * ProfileSetupView.tsx
 * Vises hvis brugeren logger ind via Google, men mangler at udfylde firma eller navn i databasen.
 */
import { UserProfile } from '../types';

interface ProfileSetupViewProps {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  saveProfile: (data: any) => void;
  isScapeEmployee: (email: string | null | undefined, uid?: string | null) => boolean;
  isAllowedEvaluator: (email: string | null | undefined) => boolean;
  userEmail: string | null | undefined;
}

export function ProfileSetupView({
  profile,
  setProfile,
  saveProfile,
  isScapeEmployee,
  isAllowedEvaluator,
  userEmail
}: ProfileSetupViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Complete your profile</h2>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Name" 
            className="w-full p-4 bg-slate-50 rounded-xl" 
            value={profile?.name || ''}
            // "Spread-operatoren" (...) tager alle eksisterende felter fra 'profile' 
            // og kopierer dem over i et nyt objekt. Derefter overskriver vi 'name'.
            // I React må man nemlig ALDRIG ændre 'profile' direkte. Man skal altid lave en kopi.
            onChange={e => setProfile(profile ? { ...profile, name: e.target.value } : { name: e.target.value } as any)} 
          />
          <input 
            type="text" 
            placeholder="Company / Organization" 
            className="w-full p-4 bg-slate-50 rounded-xl" 
            value={profile?.company || profile?.organization || ''}
            onChange={e => {
              const val = e.target.value;
              setProfile(profile ? { ...profile, company: val, organization: val } : { company: val, organization: val } as any);
            }} 
          />
          <input 
            type="text" 
            placeholder="Phone Number (e.g. +45 12345678)" 
            className="w-full p-4 bg-slate-50 rounded-xl" 
            value={profile?.phone || ''}
            onChange={e => setProfile(profile ? { ...profile, phone: e.target.value } : { phone: e.target.value } as any)} 
          />
          <select 
            className="w-full p-4 bg-slate-50 rounded-xl" 
            value={profile?.role || ''} 
            onChange={e => setProfile(profile ? { ...profile, role: e.target.value as any } : { role: e.target.value } as any)}
          >
            <option value="">Select Role</option>
            <option value="enduser">End User</option>
            <option value="integrator">Integrator</option>
            <option value="other">Other</option>
          </select>

          {/* Vises KUN, hvis mail-adressen indikerer en admin eller ansat */}
          {(isScapeEmployee(userEmail) || isAllowedEvaluator(userEmail)) && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scape Employee Mode</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setProfile(profile ? { ...profile, requestedRole: 'evaluator' } : { requestedRole: 'evaluator' } as any)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${profile?.requestedRole === 'evaluator' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                  Evaluator
                </button>
                <button 
                  onClick={() => setProfile(profile ? { ...profile, requestedRole: 'external' } : { requestedRole: 'external' } as any)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${profile?.requestedRole === 'external' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                  External Partner
                </button>
              </div>
              {!isAllowedEvaluator(userEmail) && profile?.requestedRole === 'evaluator' && (
                <p className="text-[10px] text-amber-600 font-medium">Note: You are not in the approved evaluator list. Admin features will be restricted.</p>
              )}
            </div>
          )}

          <button 
            // Knappen deaktiveres ("gråes ud") indtil navn, firma og rolle er udfyldt.
            onClick={() => profile?.name && profile?.company && profile?.role && saveProfile(profile)} 
            className={`w-full py-4 text-white rounded-xl font-bold transition-all ${profile?.name && profile?.company && profile?.role ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
          >
            Start Evaluating
          </button>
        </div>
      </div>
    </div>
  );
}

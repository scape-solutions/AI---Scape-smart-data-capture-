/**
 * Dette er en "Custom React Hook". 
 * Hooks i React er funktioner (der altid starter med 'use'), som lader os gemme 
 * data ("state") og lytte efter ændringer, uden at vi behøver at blande det ind
 * i selve brugerfladen (UI).
 * Ved at trække login-logikken herud, bliver selve login-skærmen meget pænere at se på.
 */
import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, OperationType } from '../types';
import { isAllowedEvaluator, isSuperuser, ALLOWED_EVALUATORS } from '../config/evaluators';

// Global cache for the allowed configuration from Firestore
let globalAllowedConfig: any = null;

// Tjekker om en email/bruger er en intern Scape-medarbejder
export const isScapeEmployee = (email: string | null | undefined, uid?: string | null) => {
  if (uid === "PvdZWFVtE6YKsa16loWrUNwjuif1") return true;
  if (!email) return false;
  const e = email.toLowerCase();
  const domain = e.split('@')[1];
  
  const allowedDomains = globalAllowedConfig?.allowedDomains || ['scapesolutions.eu', 'scapesolutions.com'];
  const allowedEmails = globalAllowedConfig?.allowedEmails || [];
  
  return allowedDomains.some((d: string) => d.toLowerCase() === domain) || 
         allowedEmails.some((m: string) => m.toLowerCase() === e);
};

// Bestemmer om en bruger rent faktisk har 'Admin'/'Evaluator' rettigheder
export const getEffectiveAdminStatus = (p: UserProfile | null, uid?: string | null) => {
  if (!p) return false;
  const email = p.email;
  const isEmployee = isScapeEmployee(email, uid);
  if (!isEmployee) return false;
  
  const allowedEvaluators = globalAllowedConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
  return (p.requestedRole === 'evaluator' || p.requestedRole === 'superuser') && isAllowedEvaluator(email, allowedEvaluators);
};

export function useAuth(handleAppError: (e: any, op?: OperationType, path?: string) => void) {
  // useState() er den mest brugte Hook i React.
  // Den returnerer to ting: variablen der indeholder værdien (f.eks. 'user'),
  // og funktionen til at ændre den (f.eks. 'setUser').
  // <User | null> fortæller TypeScript, at variablen enten er et Firebase User-objekt eller ingenting (null).
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'questionnaire' | 'profile_setup'>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);
  const [allowedConfig, setAllowedConfig] = useState<any>(null);

  // Sync the access config in real time
  useEffect(() => {
    if (user) {
      return onSnapshot(doc(db, 'config', 'access'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          globalAllowedConfig = data;
          setAllowedConfig(data);
        }
      }, (error) => {
        console.warn("Could not load dynamic config from Firestore (expected for external users). Using offline defaults.", error);
      });
    }
  }, [user]);

  // useEffect() er en Hook, der kører automatisk i baggrunden.
  // Her bruger vi den til at lytte efter: "Er brugeren logget ind nu?" (onAuthStateChanged).
  // Den tomme liste [] i bunden betyder "kør kun dette én gang, når appen starter".
  useEffect(() => {
    // Tjek for redirect-resultater (hvis login blev foretaget via redirect på mobil/PWA)
    getRedirectResult(auth).catch((e: any) => {
      console.error("Google Redirect Auth error:", e);
      if (e.code === 'auth/unauthorized-domain') {
        setAuthError("This domain is not authorized in Firebase. Please add it to 'Authorized domains' in the Firebase Console.");
      } else {
        setAuthError(e.message || "Failed to sign in with Google Redirect");
      }
    });

    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // async / await er moderne JavaScript for asynkrone funktioner.
          // Det lader os vente på et svar fra en server (f.eks. databasen),
          // uden at fryse/stoppe resten af programmet imens.
          const profileDoc = await getDoc(doc(db, 'users', u.uid));
          if (profileDoc.exists()) {
            const pData = profileDoc.data() as UserProfile;
            // Migrate 'external' to 'user' role automatically
            if ((pData.requestedRole as any) === 'external') {
              pData.requestedRole = 'user';
              updateDoc(doc(db, 'users', u.uid), { requestedRole: 'user' }).catch(console.error);
            }
            const actualAdmin = getEffectiveAdminStatus(pData, u.uid);
            setProfile({ ...pData, isAdmin: actualAdmin });
            setView('dashboard');
          } else {
            // Hvis brugeren ligger i 'auth' men ikke har udfyldt sit navn/firma i vores database,
            // sender vi dem til 'profile_setup' skærmen.
            setView('profile_setup');
          }
        } catch (e) {
          handleAppError(e, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
    });
  }, []);

  // Logger ind via Google Popup (på desktop/PWA) eller Redirect (på mobil)
  const login = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isStandalone) {
        // iOS PWA standalone: signInWithRedirect opens Google in regular Safari and the
        // redirect result NEVER returns to the PWA context. Use popup instead —
        // Firebase uses window.postMessage which crosses the standalone/Safari boundary.
        try {
          await signInWithPopup(auth, provider);
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
            // Popup was blocked — fall back to redirect as last resort
            await signInWithRedirect(auth, provider);
          } else {
            throw popupErr;
          }
        }
      } else if (isMobile) {
        // Regular mobile browser: redirect gives smoother UX
        await signInWithRedirect(auth, provider);
      } else {
        // Desktop: popup
        await signInWithPopup(auth, provider);
      }
    } catch (e: any) {
      console.error("Login error:", e);
      if (e.code === 'auth/unauthorized-domain') {
        setAuthError("This domain is not authorized in Firebase. Please add it to 'Authorized domains' in the Firebase Console.");
      } else {
        setAuthError(e.message || "Failed to sign in with Google");
      }
    }
  };

  // Logger ind via almindelig email og kodeord
  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      setAuthError(e.message || "Failed to sign in");
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
    } catch (e: any) {
      setAuthError(e.message || "Failed to sign up");
    }
  };

  const logout = () => signOut(auth);

  // Nogle gange har vi kun email fra Firebase, nogle gange fra profilen.
  // Denne funktion finder ud af, hvilken email vi skal bruge.
  const getEffectiveEmail = () => {
    const e = auth.currentUser?.email || user?.email || profile?.email;
    return (e && e !== 'Unknown') ? e : null;
  };

  // Gemmer brugerens profil i Firestore databasen
  const saveProfile = async (data: any) => {
    if (!user) return;
    const email = getEffectiveEmail();
    const isAdmin = getEffectiveAdminStatus({ ...data, email }, user.uid);
    const p: UserProfile = { ...data, email, isAdmin };
    try {
      await setDoc(doc(db, 'users', user.uid), p);
      setProfile(p);
      setView('dashboard');
    } catch (e) {
      handleAppError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Lader Scape Evaluators skifte mellem "Admin", "User" og "Super User" visning
  const switchMode = async (newRole: 'evaluator' | 'user' | 'superuser', onStatusChanged: (isAdmin: boolean) => void) => {
    if (!user || !profile) return;
    const email = getEffectiveEmail();
    
    // Safety check for superuser
    const superusers = globalAllowedConfig?.superusers || ['rune.k.larsen@scapesolutions.eu'];
    if (newRole === 'superuser' && !isSuperuser(email, superusers)) {
      console.warn("Unauthorized attempt to switch to superuser role");
      return;
    }

    const allowedEvaluators = globalAllowedConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
    const isAdmin = (newRole === 'evaluator' || newRole === 'superuser') && 
                    (isScapeEmployee(email, user.uid) || isAllowedEvaluator(email, allowedEvaluators));
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { requestedRole: newRole, isAdmin });
      setProfile({ ...profile, requestedRole: newRole, isAdmin });
      onStatusChanged(isAdmin);
    } catch (e) {
      handleAppError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Vi returnerer alle de variabler og funktioner, som vores UI får brug for
  return {
    user,
    profile,
    setProfile,
    view,
    setView,
    authError,
    setAuthError,
    login,
    loginWithEmail,
    signupWithEmail,
    logout,
    saveProfile,
    switchMode,
    getEffectiveEmail
  };
}

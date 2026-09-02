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
  signInWithCustomToken,
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
import { isAllowedEvaluator, isSuperuser, ALLOWED_EVALUATORS, SUPERUSERS } from '../config/evaluators';

let globalAllowedConfig: any = null;
//a small test-only configuration setter
export const setGlobalAllowedConfigForTesting = (config: any) => {
  globalAllowedConfig = config;
};
// Expose to window for debugging
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__debugConfig', {
    get: () => globalAllowedConfig
  });
}

// Hjælpefunktion til sikkerhed: Tjekker at brugeren enten er logget ind med Google (OAuth)
// eller har en bekræftet e-mail. Blokerer "falske" Email/Password logins uden bekræftelse.
const isVerifiedIdentity = () => {
  const user = auth.currentUser;
  if (!user) return false;
  const isGoogleLogin = user.providerData.some(p => p.providerId === 'google.com');
  return isGoogleLogin || user.emailVerified;
};

// Tjekker om en email/bruger er en intern Scape-medarbejder
export const isScapeEmployee = (email: string | null | undefined, uid?: string | null) => {
  if (uid === "PvdZWFVtE6YKsa16loWrUNwjuif1") return true;
  if (!email) return false;

  const e = email.toLowerCase().trim();
  const domain = e.split('@')[1];

  const allowedDomains = globalAllowedConfig?.allowedDomains || ['scapesolutions.eu', 'scapesolutions.com'];
  const allowedEmails = globalAllowedConfig?.allowedEmails || [];

  // Eksplicit tilladte emails behøver ikke være verificerede (tillader test/demo konti)
  if (allowedEmails.some((m: string) => m.toLowerCase().trim() === e)) return true;

  // Domæne-baseret adgang KRÆVER verificeret identity (forhindrer fake@scapesolutions.eu)
  if (allowedDomains.some((d: string) => d.toLowerCase().trim() === domain)) {
    return isVerifiedIdentity();
  }

  return false;
};

// Tjekker om en bruger er på den dynamiske evaluator-liste fra Firestore
export const isDynamicAllowedEvaluator = (email: string | null | undefined
) => {
  if (!email) return false;

  const list =
    globalAllowedConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
  // Bemærk: Vi kræver ikke verificering for eksplicit tilladte emails.
  return isAllowedEvaluator(email, list);
};
// Tjekker om en bruger er på den dynamiske superuser-liste fra Firestore
export const isDynamicSuperuser = (email: string | null | undefined) => {
  if (!email) return false;
  const list = globalAllowedConfig?.superusers || SUPERUSERS;
  // Bemærk: Vi kræver ikke verificering for eksplicit tilladte emails.
  return isSuperuser(email, list);
};

// Tjekker om en kampagne/event tag (f.eks. Automatik26) er aktiv og gyldig
export const isCampaignTagActive = (tag: string | null | undefined, config?: any) => {
  if (!tag) return false;
  const cleanTag = tag.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const cfg = config || globalAllowedConfig;
  const passcodes = cfg?.activeEventPasscodes;
  if (!passcodes || Object.keys(passcodes).length === 0) {
    return cleanTag === 'open';
  }
  for (const key of Object.keys(passcodes)) {
    const item = passcodes[key];
    if (!item) continue;
    const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanCode = (item.code || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    // Check if cleanTag matches key or code or known alias
    const isMatch = cleanKey === cleanTag || 
                    cleanCode === cleanTag ||
                    cleanKey.includes(cleanTag) ||
                    cleanTag.includes(cleanKey) ||
                    (cleanTag === 'automatik26' && (cleanKey === 'autonatik26' || cleanCode === 'autonatik26')) ||
                    (cleanTag === 'autonatik26' && (cleanKey === 'automatik26' || cleanCode === 'automatik26'));

    if (isMatch) {
      if (item.active === false) return false;
      if (item.expiresAt) {
        const today = new Date().toISOString().split('T')[0];
        if (today > item.expiresAt) return false;
      }
      return true;
    }
  }
  return false;
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
  const [authLoading, setAuthLoading] = useState<boolean>(true); // Starter som true mens vi venter på Firebase init
  const [allowedConfig, setAllowedConfig] = useState<any>(null);
  const [activeCampaignTag, setActiveCampaignTag] = useState<string | null>(null);

  // Extract event tag from URL query params on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tagFromUrl = params.get('event') || params.get('source') || params.get('tag');
      if (tagFromUrl) {
        localStorage.setItem('registered_event_tag', tagFromUrl.trim());
        setActiveCampaignTag(tagFromUrl.trim());
      } else {
        const stored = localStorage.getItem('registered_event_tag');
        if (stored) setActiveCampaignTag(stored);
      }
    }
  }, []);

  // Sync the access config in real time
  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'access'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        globalAllowedConfig = data;
        setAllowedConfig(data);
      }
    }, (error) => {
      console.warn("Could not load dynamic config from Firestore. Using offline defaults.", error);
    });
  }, []);

  // Auto-upgrade/downgrade role and sync isAdmin status dynamically when allowedConfig or user/profile updates
  useEffect(() => {
    if (!user || !profile || !allowedConfig) return;

    const email = getEffectiveEmail();
    if (!email) return;

    const allowedEvaluators = allowedConfig.allowedEvaluators || ALLOWED_EVALUATORS;
    const superusers = allowedConfig.superusers || SUPERUSERS;

    const isAllowed = isAllowedEvaluator(email, allowedEvaluators);
    const isAllowedSuper = isSuperuser(email, superusers);

    let targetRole = profile.requestedRole;
    if (profile.requestedRole === 'superuser') {
      if (!isAllowedSuper) {
        targetRole = isAllowed ? 'evaluator' : 'user';
      }
    } else if (profile.requestedRole === 'evaluator') {
      if (!isAllowed) {
        targetRole = 'user';
      }
    } else { // 'user' or undefined
      if (isAllowed && !profile.userModePreferred) {
        targetRole = 'evaluator';
      }
    }

    const roleChanged = targetRole !== profile.requestedRole;

    // Recalculate effective admin status with targetRole
    const actualAdminStatus = getEffectiveAdminStatus({ ...profile, requestedRole: targetRole }, user.uid);
    const adminStatusChanged = profile.isAdmin !== actualAdminStatus;

    if (roleChanged || adminStatusChanged) {
      const updates: any = {};
      if (roleChanged) {
        updates.requestedRole = targetRole;
        if (targetRole === 'evaluator') {
          updates.userModePreferred = false;
        }
        console.log(`Syncing user ${email} role in Firestore: ${profile.requestedRole} -> ${targetRole}`);
      }
      if (adminStatusChanged) {
        updates.isAdmin = actualAdminStatus;
        console.log(`Syncing user ${email} admin status in Firestore to ${actualAdminStatus}`);
      }

      updateDoc(doc(db, 'users', user.uid), updates).catch(console.error);

      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates
        };
      });
    }
  }, [user, profile?.requestedRole, profile?.isAdmin, allowedConfig]);


  // useEffect() er en Hook, der kører automatisk i baggrunden.
  // Her bruger vi den til at lytte efter: "Er brugeren logget ind nu?" (onAuthStateChanged).
  // Den tomme liste [] i bunden betyder "kør kun dette én gang, når appen starter".
  useEffect(() => {
    // 1. ROBUST PWA LOGIN FIX: Tjekker om vi netop er returneret fra Google OAuth med en token i URL'en (eller localStorage).
    // Dette omgår 100% Safari/iOS problemer med at slette cookies på tværs af redirects.

    const resolvePwaToken = async () => {
      let token: string | null = null;

      const hash = window.location.hash;
      if (hash.startsWith('#token=')) {
        token = decodeURIComponent(hash.substring('#token='.length));
        window.location.hash = ''; // Fjern token fra URL med det samme
      }

      const localToken = localStorage.getItem('pwa_custom_token');
      if (localToken) {
        token = localToken;
        localStorage.removeItem('pwa_custom_token');
      }

      if (token) {
        console.log("Found PWA auth token, signing in...");
        setAuthLoading(true);
        try {
          await signInWithCustomToken(auth, token);
          console.log("Successfully logged in via PWA custom token!");
          return true;
        } catch (e: any) {
          console.error("Custom token login failed:", e);
          setAuthError(e.message || "Failed to sign in with custom PWA token");
        }
      }
      return false;
    };

    setAuthLoading(true);

    resolvePwaToken().then((hasCustomToken) => {
      if (hasCustomToken) return;

      // Also handle standard Firebase redirect results (dette tager typisk 2-3 sekunder)
      getRedirectResult(auth).then((result) => {
        if (result) {
          console.log("Successfully logged in via redirect");
        }
      }).catch((e: any) => {
        console.error("Google Redirect Auth error:", e);
        if (e.code === 'auth/unauthorized-domain') {
          setAuthError("This domain is not authorized in Firebase. Please add it to 'Authorized domains' in the Firebase Console.");
        } else {
          setAuthError(e.message || "Failed to sign in with Google Redirect");
        }
      }).finally(() => {
        setTimeout(() => setAuthLoading(false), 1000);
      });
    });

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log("Auth state changed:", u?.email);
      setUser(u);
      if (u) {
        try {
          // async / await er moderne JavaScript for asynkrone funktioner.
          // Det lader os vente på et svar fra en server (f.eks. databasen),
          // uden at fryse/stoppe resten af programmet imens.
          const profileDoc = await getDoc(doc(db, 'users', u.uid));
          if (profileDoc.exists()) {
            let pData = profileDoc.data() as UserProfile;

            // Check if user is suspended
            if ((pData as any).isSuspended) {
              await signOut(auth);
              setUser(null);
              setProfile(null);
              setAuthError("Your account has been suspended. Please contact Scape support.");
              setAuthLoading(false);
              return;
            }

            // Record last active time dynamically
            const lastActiveAt = new Date().toISOString();
            updateDoc(doc(db, 'users', u.uid), { lastActiveAt }).catch(console.error);
            pData.lastActiveAt = lastActiveAt;

            // Migrate 'external' to 'user' role automatically
            if ((pData.requestedRole as any) === 'external') {
              pData.requestedRole = 'user';
              updateDoc(doc(db, 'users', u.uid), { requestedRole: 'user' }).catch(console.error);
            }

            // Auto-upgrade or auto-downgrade role if user's whitelist status changed
            const allowedEvaluators = globalAllowedConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
            const superusers = globalAllowedConfig?.superusers || SUPERUSERS;
            const isAllowed = u.email ? isAllowedEvaluator(u.email, allowedEvaluators) : false;
            const isAllowedSuper = u.email ? isSuperuser(u.email, superusers) : false;

            let finalRole = pData.requestedRole;
            let roleUpdated = false;

            if (pData.requestedRole === 'superuser') {
              if (!isAllowedSuper) {
                finalRole = isAllowed ? 'evaluator' : 'user';
                roleUpdated = true;
              }
            } else if (pData.requestedRole === 'evaluator') {
              if (!isAllowed) {
                finalRole = 'user';
                roleUpdated = true;
              }
            } else { // 'user' or undefined
              if (isAllowed && !pData.userModePreferred) {
                finalRole = 'evaluator';
                roleUpdated = true;
              }
            }

            if (roleUpdated) {
              pData.requestedRole = finalRole;
              if (finalRole === 'evaluator') {
                pData.userModePreferred = false;
              }
              const actualAdmin = getEffectiveAdminStatus(pData, u.uid);
              pData.isAdmin = actualAdmin;
              updateDoc(doc(db, 'users', u.uid), {
                requestedRole: finalRole,
                isAdmin: actualAdmin,
                ...(finalRole === 'evaluator' ? { userModePreferred: false } : {})
              })
                .then(() => console.log(`Synced role for user ${u.email} on login to ${finalRole} (admin: ${actualAdmin}).`))
                .catch(console.error);
            } else {
              const actualAdmin = getEffectiveAdminStatus(pData, u.uid);
              if (pData.isAdmin !== actualAdmin) {
                pData.isAdmin = actualAdmin;
                updateDoc(doc(db, 'users', u.uid), { isAdmin: actualAdmin }).catch(console.error);
              }
            }

            setProfile({ ...pData });
            setView('dashboard');
          } else {
            // New user registration check (Option A: Tag acts as the registration key)
            const email = u.email || 'Unknown';
            let accessDoc = await getDoc(doc(db, 'config', 'access')).catch(() => null);
            const liveConfig = (accessDoc && accessDoc.exists()) ? accessDoc.data() : (globalAllowedConfig || {});
            const allowedEvaluators = liveConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
            const isAllowed = isAllowedEvaluator(email, allowedEvaluators);
            const isEmployee = isScapeEmployee(email, u.uid);
            const storedTag = typeof window !== 'undefined' ? localStorage.getItem('registered_event_tag') : null;
            const isTagValid = isCampaignTagActive(storedTag, liveConfig);

            if (!isAllowed && !isEmployee && !isTagValid) {
              await signOut(auth);
              setUser(null);
              setProfile(null);
              setAuthError("Access restricted. The campaign pass code is paused, expired, or invalid. An active event pass code or authorized email is required to register.");
              setAuthLoading(false);
              return;
            }

            const initialRole = (isAllowed || isEmployee) ? 'evaluator' : 'user';
            const newProfile: UserProfile = {
              email,
              name: u.displayName || '',
              company: '',
              companyType: 'other',
              phone: '',
              requestedRole: initialRole,
              registeredViaCampaign: (storedTag && isTagValid) ? storedTag : undefined,
              isAdmin: getEffectiveAdminStatus({
                email,
                name: u.displayName || '',
                company: '',
                companyType: 'other',
                phone: '',
                requestedRole: initialRole,
                isAdmin: false
              }, u.uid)
            };
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setProfile(newProfile);
            setView('profile_setup');
          }
        } catch (e) {
          handleAppError(e, OperationType.READ, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
      setAuthLoading(false); // Færdig med at loade
    });
    return unsubscribe;
  }, []);

  // Logger ind via Google
  const login = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      setAuthLoading(true);

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
      const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

      if (isStandalone && isMobile && !isLocal) {
        // I iOS standalone PWA tilstand virker hverken popups eller redirect retur.
        // Derfor navigerer vi til vores server-side OAuth proxy, som bygger broen.
        window.location.href = '/api/auth/google/start';
        return;
      }

      if (isMobile && !isLocal) {
        // Firebase anbefaler signInWithRedirect på mobile enheder og PWA'er,
        // da signInWithPopup kan blive blokeret af popup-blockers i iOS standalone mode.
        await signInWithRedirect(auth, provider);
      } else {
        // Vi bruger signInWithPopup på desktop og ved lokal test (for at undgå redirect-port fejl).
        await signInWithPopup(auth, provider);
      }
    } catch (e: any) {
      setAuthLoading(false);
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
      // Pre-validate registration gate before creating auth user
      let accessDoc = await getDoc(doc(db, 'config', 'access')).catch(() => null);
      const liveConfig = (accessDoc && accessDoc.exists()) ? accessDoc.data() : globalAllowedConfig;
      const allowedEvaluators = liveConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
      const isAllowed = isAllowedEvaluator(email, allowedEvaluators);
      const isEmployee = isScapeEmployee(email);
      const storedTag = typeof window !== 'undefined' ? localStorage.getItem('registered_event_tag') : null;
      const isTagValid = isCampaignTagActive(storedTag, liveConfig);

      if (!isAllowed && !isEmployee && !isTagValid) {
        setAuthError("Access restricted. The campaign pass code is paused, expired, or invalid. An active event pass code or authorized email is required to register.");
        return;
      }

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

    const allowedEvaluators = globalAllowedConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
    const superusers = globalAllowedConfig?.superusers || SUPERUSERS;
    const isAllowed = email ? isAllowedEvaluator(email, allowedEvaluators) : false;
    const isAllowedSuper = email ? isSuperuser(email, superusers) : false;

    let requestedRole = data.requestedRole;
    const currentUserModePreferred = data.userModePreferred ?? profile?.userModePreferred ?? false;

    // Enforce role ceilings and upgrades
    if (requestedRole === 'superuser') {
      if (!isAllowedSuper) {
        requestedRole = isAllowed ? 'evaluator' : 'user';
      }
    } else if (requestedRole === 'evaluator') {
      if (!isAllowed) {
        requestedRole = 'user';
      }
    } else { // 'user' or undefined
      if (isAllowed && !currentUserModePreferred) {
        requestedRole = 'evaluator';
      }
    }

    const updatedData = { ...data, requestedRole };
    const isAdmin = getEffectiveAdminStatus({ ...updatedData, email }, user.uid);
    const p: UserProfile = { ...updatedData, email, isAdmin, userModePreferred: currentUserModePreferred };
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
    const superusers = globalAllowedConfig?.superusers || SUPERUSERS;
    if (newRole === 'superuser' && !isSuperuser(email?.trim(), superusers)) {
      console.warn("Unauthorized attempt to switch to superuser role");
      return;
    }

    // Safety check for evaluator
    const allowedEvaluators = globalAllowedConfig?.allowedEvaluators || ALLOWED_EVALUATORS;
    if (newRole === 'evaluator' && !isAllowedEvaluator(email?.trim(), allowedEvaluators)) {
      console.warn("Unauthorized attempt to switch to evaluator role");
      return;
    }

    const isAdmin = getEffectiveAdminStatus({ ...profile, requestedRole: newRole }, user.uid);
    const userModePreferred = newRole === 'user';
    try {
      await updateDoc(doc(db, 'users', user.uid), { requestedRole: newRole, isAdmin, userModePreferred });
      setProfile({ ...profile, requestedRole: newRole, isAdmin, userModePreferred });
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
    authLoading,
    allowedConfig,
    activeCampaignTag,
    login,
    loginWithEmail,
    signupWithEmail,
    logout,
    saveProfile,
    switchMode,
    getEffectiveEmail
  };
}

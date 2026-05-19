/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Settings2, 
  Clock, 
  Box, 
  Zap, 
  Camera, 
  ChevronRight, 
  Info,
  Cpu,
  ArrowRight,
  Trash2,
  LogOut,
  XCircle,
  Sparkles,
  FileText,
  RotateCcw,
  Loader2,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  User as UserIcon,
  CheckCircle2,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { GENERAL_STEPS, PART_STEPS, Step } from './questionnaire';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface PartData {
  responses: Record<string, any>;
  images: string[];
}

interface ProjectState {
  id: string | null;
  projectName: string;
  generalResponses: Record<string, any>;
  parts: PartData[];
  report: string | null;
  status: 'draft' | 'submitted' | 'cancelled' | 'approved' | 'rejected';
  userId: string;
  isLocked?: boolean;
  isFullySpecified?: boolean;
  isInactive?: boolean;
  takenBy?: string;
  takenByName?: string;
  isVerdictVisible?: boolean;
  ownerName?: string;
  ownerCompany?: string;
  ownerEmail?: string;
}

interface UserProfile {
  name: string;
  company: string;
  role: 'enduser' | 'integrator' | 'other';
  email: string;
  isAdmin?: boolean;
  requestedRole?: 'evaluator' | 'external';
}

import { isAllowedEvaluator } from './config/evaluators';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'questionnaire' | 'profile_setup'>('dashboard');
  
  // Projects state
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Current project state
  const [currentProject, setCurrentProject] = useState<ProjectState | null>(null);
  const [currentStep, setCurrentStep] = useState(0); 
  const [isReviewing, setIsReviewing] = useState(false);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  
  // UI Helpers
  const [aiGuidance, setAiGuidance] = useState<string>("Sign in to start your Scape evaluation.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [changelog, setChangelog] = useState<any[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'org' | 'user'>('date');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  
  // Filtering
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'danger' | 'info';
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    fetchProjects(profile?.isAdmin);
  }, [profile?.isAdmin, sortBy]);

  const isScapeEmployee = (email: string | null | undefined, uid?: string | null) => {
    if (uid === "PvdZWFVtE6YKsa16loWrUNwjuif1") return true;
    if (!email) return false;
    const e = email.toLowerCase();
    return e.endsWith('@scapesolutions.eu') || e.endsWith('@scapesolutions.com');
  };

  const getEffectiveAdminStatus = (p: UserProfile | null, uid?: string | null) => {
    if (!p) return false;
    const email = p.email;
    const isEmployee = isScapeEmployee(email, uid);
    if (!isEmployee) return false;
    // If Scape employee, they are admin ONLY if they requested 'evaluator' role AND are in the allowed list
    return p.requestedRole === 'evaluator' && isAllowedEvaluator(email);
  };

  // --- Auth & Profile ---
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', u.uid));
          
          if (profileDoc.exists()) {
            const pData = profileDoc.data() as UserProfile;
            const actualAdmin = getEffectiveAdminStatus(pData, u.uid);
            setProfile({ ...pData, isAdmin: actualAdmin });
            setView('dashboard');
          } else {
            setView('profile_setup');
          }
        } catch (e) {
          handleAppError(e, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
        setProjects([]);
      }
    });
  }, []);

  const login = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error("Login error:", e);
      if (e.code === 'auth/unauthorized-domain') {
        setAuthError("This domain (localhost) is not authorized in Firebase. Please add it to 'Authorized domains' in the Firebase Console.");
      } else {
        setAuthError(e.message || "Failed to sign in with Google");
      }
    }
  };

  const loginWithEmail = async () => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (e: any) {
      setAuthError(e.message || "Failed to sign in");
    }
  };

  const signupWithEmail = async () => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      await updateProfile(cred.user, { displayName: authDisplayName });
      // Profile setup view will trigger automatically via onAuthStateChanged
    } catch (e: any) {
      setAuthError(e.message || "Failed to sign up");
    }
  };

  const logout = () => signOut(auth);

  const saveProfile = async (data: any) => {
    if (!user) return;
    const email = getEffectiveEmail();
    const isAdmin = getEffectiveAdminStatus({ ...data, email });
    const p: UserProfile = { ...data, email, isAdmin };
    try {
      await setDoc(doc(db, 'users', user.uid), p);
      setProfile(p);
      setView('dashboard');
    } catch (e) {
      handleAppError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // --- Projects Data ---
  function handleAppError(e: any, op?: OperationType, path?: string) {
    console.error(`Error in ${op || 'app'} at ${path || 'unknown'}:`, e);
    const msg = e instanceof Error ? e.message : String(e);
    setGlobalError(msg);
  }

  const fetchProjects = async (isAdmin: boolean = false) => {
    if (!user) return;
    setIsLoadingProjects(true);
    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, 'projects'));
      } else {
        q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      }
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ProjectState));
      
      // Sort by updatedAt desc in memory to avoid missing index errors
      data.sort((a: any, b: any) => {
        const t1 = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0);
        const t2 = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0);
        return t2 - t1;
      });

      if (sortBy === 'org') {
        data.sort((a, b) => (a.generalResponses?.['1.02'] || '').localeCompare(b.generalResponses?.['1.02'] || ''));
      } else if (sortBy === 'user') {
        data.sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
      }
      
      setProjects(data);
    } catch (e) {
      handleAppError(e, OperationType.LIST, 'projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const createNewProject = () => {
    setCurrentProject({
      id: null,
      projectName: "",
      generalResponses: {
        '1.02': profile?.company || profile?.organization,
        '1.03': profile?.name
      },
      parts: [{ responses: {}, images: [] }],
      report: null,
      status: 'draft',
      userId: user!.uid,
      ownerName: profile?.name || user?.displayName || 'Unknown',
      ownerCompany: profile?.company || 'Unknown',
      ownerEmail: getEffectiveEmail(),
      isLocked: false,
    });
    setCurrentStep(0);
    setActivePartIndex(0);
    setIsReviewing(false);
    setView('questionnaire');
  };

  const openProject = (p: ProjectState) => {
    // Merge email if missing or unknown
    const email = getEffectiveEmail();
    const updatedP = { 
      ...p, 
      ownerEmail: (p.ownerEmail && p.ownerEmail !== 'Unknown') ? p.ownerEmail : (email || p.ownerEmail)
    };
    setCurrentProject(updatedP);
    setCurrentStep(0);
    setActivePartIndex(0);
    setIsReviewing(false); // Always start at questionnaire walkthrough even if submitted/locked
    setView('questionnaire');
  };

  const logChange = async (projectId: string, action: string) => {
    const path = `projects/${projectId}/changelog`;
    try {
      await addDoc(collection(db, 'projects', projectId, 'changelog'), {
        action,
        userId: user!.uid,
        userName: profile?.name || user?.displayName || 'Unknown',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleAppError(e);
    }
  };

  const getEffectiveEmail = () => {
    const e = auth.currentUser?.email || user?.email || profile?.email;
    return (e && e !== 'Unknown') ? e : null;
  };

  const saveProject = async (status: 'draft' | 'submitted' | 'cancelled' = 'draft') => {
    if (!user || !currentProject) return null;

    // If locked and not admin, skip save and just return current state to allow navigation
    if (currentProject.isLocked && !profile?.isAdmin && currentProject.id) {
      return currentProject;
    }

    const email = getEffectiveEmail();
    const data = {
      ...currentProject,
      status,
      isLocked: status === 'submitted' || !!currentProject.isLocked,
      updatedAt: serverTimestamp(),
      projectName: currentProject.generalResponses['1.01'] || "Untitled Project",
      ownerName: currentProject.ownerName && currentProject.ownerName !== 'Unknown' ? currentProject.ownerName : (profile?.name || user?.displayName || 'Unknown'),
      ownerCompany: currentProject.ownerCompany && currentProject.ownerCompany !== 'Unknown' ? currentProject.ownerCompany : (profile?.company || 'Unknown'),
      ownerEmail: currentProject.ownerEmail && currentProject.ownerEmail !== 'Unknown' ? currentProject.ownerEmail : (email || 'Unknown')
    };
    
    try {
      if (!currentProject.id) {
        const docRef = await addDoc(collection(db, 'projects'), { ...data, createdAt: serverTimestamp() });
        const updated = { ...data, id: docRef.id };
        setCurrentProject(updated);
        await logChange(docRef.id, "Created Project");
        return updated;
      } else {
        await updateDoc(doc(db, 'projects', currentProject.id), data);
        await logChange(currentProject.id, `Status updated to ${status}`);
        return data;
      }
    } catch (e) {
      handleAppError(e, OperationType.WRITE, currentProject.id ? `projects/${currentProject.id}` : 'projects');
      return null;
    } finally {
      fetchProjects(profile?.isAdmin);
    }
  };

  // --- AI Advisor ---
   const updateAiGuidance = async () => {
    if (!user || !currentProject) return;
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY missing");
      const ai = new GoogleGenAI({ apiKey });
      
      const activeStep = currentStep === 0 ? GENERAL_STEPS[0] : PART_STEPS[currentStep - 1];
      const data = currentStep === 0 ? currentProject.generalResponses : currentProject.parts[activePartIndex].responses;
      
      const prompt = `Scape AI Advisor. Section: ${activeStep.title}. 
      Context: ${Object.values(data).join(', ')}. 
      Provide 1 short engineering tip for this step. Pro tone.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setAiGuidance(result.text || "Accurate dimensions are key for robotic path planning.");
    } catch (e) {
      setAiGuidance("Accurate dimensions are key for robotic path planning.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = async () => {
    if (!currentProject) return;
    setIsGeneratingReport(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY missing");
      const ai = new GoogleGenAI({ apiKey });

      const partsSummary = currentProject.parts.map((p, i) => {
        const resp = p.responses;
        return `Part ${i+1}: ${resp['2.01'] || 'Unnamed'}. 
        Dimensions: ${resp['2.02']}mm. 
        Weight: ${resp['2.03']}kg. 
        Cycle: ${resp['2.04']}s. 
        Material: ${resp['2.14']}. 
        Shiny: ${resp['2.11']}. 
        Lubricated: ${resp['2.07']}. 
        Entangled: ${resp['2.09']}.`;
      }).join('\n');

      const binDims = `${currentProject.generalResponses['1.04_w']}x${currentProject.generalResponses['1.04_l']}x${currentProject.generalResponses['1.04_h']}`;
      const prompt = `Act as a Scape Applications Engineer. 
      Analyze this bin-picking project BASED ON THE SUBMITTED DATA:
      General Specs: Bin Type=${currentProject.generalResponses['1.03']}, Bin Dims=${binDims}mm, Robot=${currentProject.generalResponses['1.05']}
      Parts Data:
      ${partsSummary}
      
      Provide a DATA-DRIVEN FEASIBILITY VERDICT. 
      Analyze if Scape systems (like Scape Mini or Scape Pro) can handle these parts based on their dimensions, weight, and cycle time requirements.
      1. Technical Score (0-100)
      2. Key Risks (Mention specific data points like cycle time or material)
      3. Next Steps
      Be professional, technical, and concise.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const report = result.text || "Report generation failed.";
      setCurrentProject(prev => prev ? ({ ...prev, report }) : null);
      
      // Only persist if authorized
      if (currentProject.id && (!currentProject.isLocked || profile?.isAdmin)) {
        try {
          await updateDoc(doc(db, 'projects', currentProject.id), { report });
        } catch (e) {
          console.warn("Could not save report to Firestore (likely locked):", e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    if (view === 'questionnaire' && currentProject) updateAiGuidance();
  }, [view, currentStep, activePartIndex, currentProject?.id]);

  useEffect(() => {
    if (isReviewing && !currentProject?.report) generateReport();
  }, [isReviewing, currentProject?.id]);

  const fetchLog = async (id: string) => {
    const path = `projects/${id}/changelog`;
    try {
      const snap = await getDocs(query(collection(db, 'projects', id, 'changelog'), orderBy('timestamp', 'desc')));
      setChangelog(snap.docs.map(d => d.data()));
      setShowLog(true);
    } catch (e) {
      handleAppError(e, OperationType.LIST, path);
    }
  };

  const isActuallyEmail = (email: string | null | undefined) => {
    if (!email) return false;
    return email.includes('@') && email.includes('.');
  };

  const deleteProject = async (p: ProjectState) => {
    if (!p.id) {
      handleAppError("Cannot delete: Project ID is missing.");
      return;
    }
    
    const currentUid = auth.currentUser?.uid || user?.uid;
    const isOwner = p.userId === currentUid;
    const isEval = profile?.isAdmin;
    
    console.log("Delete request:", { projectId: p.id, currentUid, isOwner, isEval, isAdmin: profile?.isAdmin });

    if (!isOwner && !isEval) {
      handleAppError(`Permission Denied: You do not own this project. (Your ID: ${currentUid}, Project Owner: ${p.userId})`);
      return;
    }

    console.log("Delete request triggered for:", p.id, { isOwner, isEval });

    const isInternal = p.ownerEmail && (p.ownerEmail.endsWith('@scapesolutions.eu') || p.ownerEmail.endsWith('@scapesolutions.com'));
    const message = isInternal 
      ? `This project appears to be an internal Scape submission (${p.ownerEmail}). Are you sure you want to permanently delete it?`
      : `Are you sure you want to delete project "${p.projectName}"? This cannot be undone.`;

    setConfirmModal({
      show: true,
      title: "Delete Project",
      message,
      type: 'danger',
      confirmText: "Delete Permanently",
      onConfirm: async () => {
        try {
          console.log("Executing deleteDoc for:", p.id);
          await deleteDoc(doc(db, 'projects', p.id!));
          console.log("deleteDoc successful");
          setGlobalSuccess(`Project "${p.projectName}" deleted successfully.`);
          setTimeout(() => setGlobalSuccess(null), 5000);
          await fetchProjects(profile?.isAdmin);
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (e: any) {
          console.error("Firestore delete error:", e);
          handleAppError(e, OperationType.DELETE, `projects/${p.id}`);
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const switchMode = async (newRole: 'evaluator' | 'external') => {
    if (!user || !profile) return;
    const email = getEffectiveEmail();
    const isAdmin = newRole === 'evaluator' && (isScapeEmployee(email, user.uid) || isAllowedEvaluator(email));
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { requestedRole: newRole, isAdmin });
      setProfile({ ...profile, requestedRole: newRole, isAdmin });
      await fetchProjects(isAdmin);
    } catch (e) {
      handleAppError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const takeProject = async (p: ProjectState) => {
    if (!profile?.isAdmin || !p.id) return;
    if (!p.isLocked && p.status !== 'submitted') {
      console.warn("Only locked or submitted projects can be taken.");
      return;
    }
    try {
      await updateDoc(doc(db, 'projects', p.id), { 
        takenBy: user!.uid,
        takenByName: profile.name,
        status: 'approved'
      });
      await logChange(p.id, `Project taken by Scape Employee: ${profile.name}`);
      fetchProjects(true);
    } catch (e) {
      handleAppError(e);
    }
  };

  const toggleVerdictVisibility = async (p: ProjectState) => {
    if (!profile?.isAdmin || !p.id) return;
    const newVal = !p.isVerdictVisible;
    try {
      await updateDoc(doc(db, 'projects', p.id), { isVerdictVisible: newVal });
      await logChange(p.id, `${newVal ? 'Published' : 'Hid'} verdict for user`);
      fetchProjects(true);
    } catch (e) {
      handleAppError(e);
    }
  };

  const toggleLock = async (p: ProjectState) => {
    if (!p.id) return;
    const isAdmin = !!profile?.isAdmin;
    const isOwner = p.userId === user?.uid;
    
    // User can unlock ONLY if it's NOT taken by Scape yet.
    // If it's taken, only Scape (Admin) can unlock.
    if (!isAdmin && p.takenBy) return; 

    const newLock = !p.isLocked;
    try {
      await updateDoc(doc(db, 'projects', p.id), { isLocked: newLock });
      await logChange(p.id, `${newLock ? 'Locked' : 'Unlocked'} by ${isAdmin ? 'Admin' : 'User'}`);
      
      if (currentProject?.id === p.id) {
        setCurrentProject(prev => prev ? ({ ...prev, isLocked: newLock }) : null);
      }
      
      fetchProjects(isAdmin);
    } catch (e) {
      handleAppError(e);
    }
  };

  const updateStatus = async (p: ProjectState, status: ProjectState['status']) => {
    if (!profile?.isAdmin || !p.id) return;
    try {
      await updateDoc(doc(db, 'projects', p.id), { status });
      await logChange(p.id, `Status set to ${status} by Admin`);
      fetchProjects(true);
    } catch (e) {
      handleAppError(e);
    }
  };

  const toggleSpecified = async (p: ProjectState) => {
    if (!p.id) return;
    const isOwner = p.userId === user?.uid;
    const isAdmin = !!profile?.isAdmin;
    
    // User can set it to true. Only Admin can toggle it back or re-approve.
    // Wait, the user said: "marked as fully specified by 1 or 2 AND an internal app evaluator agrees"
    // So let's use two flags: isFullySpecified (by user) and isSpecApproved (by Scape)
    
    const newVal = !p.isFullySpecified;
    try {
      await updateDoc(doc(db, 'projects', p.id), { isFullySpecified: newVal });
      await logChange(p.id, `Project marked as ${newVal ? 'fully specified' : 'partially specified'} by ${isAdmin ? 'evaluator' : 'user'}`);
      fetchProjects(isAdmin);
    } catch (e) {
      handleAppError(e);
    }
  };

  const toggleInactive = async (p: ProjectState) => {
    if (!p.id || !profile?.isAdmin) return;
    const newVal = !p.isInactive;
    try {
      await updateDoc(doc(db, 'projects', p.id), { isInactive: newVal });
      await logChange(p.id, `Project marked as ${newVal ? 'inactive' : 'active'} by evaluator`);
      fetchProjects(true);
    } catch (e) {
      handleAppError(e);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (!showInactive && p.isInactive && filterStatus !== 'inactive') return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'inactive' && !p.isInactive) return false;
      if (filterStatus !== 'inactive' && p.status !== filterStatus) return false;
    }
    if (filterOrg && !p.ownerCompany?.toLowerCase().includes(filterOrg.toLowerCase()) && !p.generalResponses?.['1.02']?.toLowerCase().includes(filterOrg.toLowerCase())) return false;
    if (filterUser && !p.ownerName?.toLowerCase().includes(filterUser.toLowerCase()) && !p.userId.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  // --- Views ---
  if (!user) {
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

          <button onClick={login} className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
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

  if (view === 'profile_setup') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6">Complete your profile</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Name" className="w-full p-4 bg-slate-50 rounded-xl" onChange={e => setProfile(p => ({ ...p, name: e.target.value } as any))} />
            <input type="text" placeholder="Company / Organization" className="w-full p-4 bg-slate-50 rounded-xl" onChange={e => {
              const val = e.target.value;
              setProfile(p => ({ ...p, company: val, organization: val } as any));
            }} />
            <select className="w-full p-4 bg-slate-50 rounded-xl" value={profile?.role || ''} onChange={e => setProfile(p => ({ ...p, role: e.target.value } as any))}>
              <option value="">Select Role</option>
              <option value="enduser">End User</option>
              <option value="integrator">Integrator</option>
              <option value="other">Other</option>
            </select>

            {(isScapeEmployee(user?.email) || isAllowedEvaluator(user?.email)) && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scape Employee Mode</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setProfile(p => ({ ...p, requestedRole: 'evaluator' } as any))}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${profile?.requestedRole === 'evaluator' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    Evaluator
                  </button>
                  <button 
                    onClick={() => setProfile(p => ({ ...p, requestedRole: 'external' } as any))}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${profile?.requestedRole === 'external' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    External Partner
                  </button>
                </div>
                {!isAllowedEvaluator(user?.email) && profile?.requestedRole === 'evaluator' && (
                  <p className="text-[10px] text-amber-600 font-medium">Note: You are not in the approved evaluator list. Admin features will be restricted.</p>
                )}
              </div>
            )}

            <button onClick={() => profile?.name && profile?.company && profile?.role && saveProfile(profile)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">
              Start Evaluating
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-[50]">
        {globalError && (
          <div className="absolute top-16 left-0 right-0 bg-red-600 text-white text-[10px] py-1 px-8 font-bold flex justify-between items-center z-[60]">
            <span>Error: {globalError}</span>
            <button onClick={() => setGlobalError(null)} className="underline">Dismiss</button>
          </div>
        )}
        {globalSuccess && (
          <div className="absolute top-16 left-0 right-0 bg-emerald-600 text-white text-[10px] py-1 px-8 font-bold flex justify-between items-center z-[60]">
            <span>{globalSuccess}</span>
            <button onClick={() => setGlobalSuccess(null)} className="underline">Dismiss</button>
          </div>
        )}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-xl">SCAPE</span>
        </div>
        <div className="flex items-center gap-6">
          {(isScapeEmployee(user?.email) || isAllowedEvaluator(user?.email)) && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => switchMode('evaluator')}
                className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${profile?.requestedRole === 'evaluator' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Evaluator
              </button>
              <button 
                onClick={() => switchMode('external')}
                className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${profile?.requestedRole === 'external' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                External
              </button>
            </div>
          )}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${profile?.isAdmin ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {profile?.isAdmin ? "Scape App Engineer" : "External Partner"}
              </span>
              <span className="text-xs font-bold text-slate-900">{profile?.name}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{user?.email}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {view === 'dashboard' && (
          <div className="flex-1 p-10 overflow-y-auto max-w-6xl mx-auto w-full">
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-black mb-2">Projects</h1>
                  <p className="text-slate-500">{profile?.isAdmin ? "Administrative Dashboard" : "Manage your Scape bin-picking evaluations"}</p>
                </div>
                <button onClick={createNewProject} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all">
                  <PlusCircle className="w-5 h-5" /> New Project
                </button>
              </div>

              {profile?.isAdmin && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Search Organization</p>
                    <input 
                      type="text" 
                      placeholder="e.g. Billund Automation" 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
                      value={filterOrg}
                      onChange={e => setFilterOrg(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Search User</p>
                    <input 
                      type="text" 
                      placeholder="Name or UID" 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
                      value={filterUser}
                      onChange={e => setFilterUser(e.target.value)}
                    />
                  </div>
                  <div className="w-48">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Status</p>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                  <div className="w-48">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Sort By</p>
                    <select 
                      value={sortBy} 
                      onChange={e => setSortBy(e.target.value as any)}
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="date">Date</option>
                      <option value="org">Organization</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <button 
                      onClick={() => setShowInactive(!showInactive)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showInactive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {showInactive ? "Hide Inactive" : "Show Inactive"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(p => (
                <div key={p.id} className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${p.isInactive ? 'opacity-60 border-slate-200' : 'border-slate-100'}`} onClick={() => openProject(p)}>
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                        p.status === 'submitted' ? 'bg-blue-100 text-blue-600' : 
                        p.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                      {p.isLocked && <span className="bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Locked</span>}
                      {p.isFullySpecified && <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Specified</span>}
                      {p.isInactive && <span className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Inactive</span>}
                    </div>
                    <Clock className="w-4 h-4 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{p.projectName}</h3>
                  <div className="mb-4">
                    <p className="text-[11px] text-slate-600 font-bold">{p.ownerName || 'Unknown Owner'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.ownerCompany || 'No Company'}</p>
                    {p.ownerEmail && p.ownerEmail !== 'Unknown' ? (
                      <p className="text-[9px] text-slate-400 mt-1 italic font-medium">{p.ownerEmail}</p>
                    ) : (
                      <p className="text-[9px] text-amber-500 mt-1 italic font-bold">Email unknown</p>
                    )}
                  </div>

                  {profile?.isAdmin && (
                    <div className="mb-4 py-3 px-3 bg-slate-50 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-tight">Org: {p.generalResponses?.['1.02'] || 'N/A'}</p>
                      {p.ownerEmail && isActuallyEmail(p.ownerEmail) && p.ownerEmail !== 'Unknown' ? (
                        <p className="text-[10px] text-slate-400 truncate font-medium">Email: {p.ownerEmail}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 truncate font-medium">User ID: {p.userId}</p>
                      )}
                    </div>
                  )}
                   {profile?.isAdmin && (
                    <div className="flex flex-wrap gap-2 mb-4 border-t pt-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleLock(p); }}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-colors ${p.isLocked ? 'bg-amber-600 text-white border-amber-600' : 'text-slate-400 border-slate-200 hover:border-slate-900'}`}
                      >
                        {p.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      
                      {!p.takenBy ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); takeProject(p); }}
                          disabled={!p.isLocked && p.status !== 'submitted'}
                          className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${(!p.isLocked && p.status !== 'submitted') ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400' : 'border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                        >
                          Take Case
                        </button>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-400 px-2 py-1 flex items-center gap-1"><UserIcon className="w-2 h-2" /> {p.takenByName || 'Taken'}</span>
                      )}

                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(p, 'approved'); }}
                        className="text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-600 hover:border-green-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSpecified(p); }}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-colors ${p.isFullySpecified ? 'bg-emerald-600 text-white border-emerald-600' : 'text-slate-400 border-slate-200 hover:border-emerald-600'}`}
                      >
                        {p.isFullySpecified ? 'Unspecify' : 'Approve Spec'}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleInactive(p); }}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-colors ${p.isInactive ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400 border-slate-200 hover:border-slate-900'}`}
                      >
                        {p.isInactive ? 'Activate' : 'Deactivate'}
                      </button>
                    </div>
                  )}
                  {!profile?.isAdmin && p.isLocked && !p.takenBy && (
                    <div className="flex gap-2 mb-4 border-t pt-4">
                      <button 
                         onClick={(e) => { e.stopPropagation(); toggleLock(p); }}
                         className="text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-200 text-slate-400 hover:border-amber-600 hover:text-amber-600 transition-colors"
                      >
                         Unlock for Editing
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <span>{p.parts.length} Parts</span>
                      <button onClick={(e) => { e.stopPropagation(); fetchLog(p.id!); }} className="hover:text-blue-600 flex items-center gap-1">
                        <History className="w-3 h-3" /> History
                      </button>
                      {(p.userId === user?.uid || profile?.isAdmin) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteProject(p); }} 
                          className="hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openProject(p); }}
                      className="text-blue-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      {p.isLocked && !profile?.isAdmin ? <ShieldCheck className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {p.isLocked && !profile?.isAdmin ? 'View Data' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
              {confirmModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 text-center">
                    <div className={`w-16 h-16 ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      {confirmModal.type === 'danger' ? <Trash2 className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                    </div>
                    <h3 className="text-xl font-black mb-2">{confirmModal.title}</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">{confirmModal.message}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                        className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmModal.onConfirm}
                        className={`flex-1 py-4 ${confirmModal.type === 'danger' ? 'bg-red-600' : 'bg-blue-600'} text-white rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]`}
                      >
                        {confirmModal.confirmText || 'Confirm'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Changelog Modal */}
            <AnimatePresence>
              {showLog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="font-black text-xl">Project History</h3>
                      <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-slate-900"><XCircle className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {changelog.map((log, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{log.action}</p>
                            <p className="text-[10px] text-slate-400 font-medium">User: {log.userName || log.userId} • {log.timestamp?.toDate().toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {view === 'questionnaire' && currentProject && (
          <>
            <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-4">
               <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sm text-slate-500 mb-6"><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
               <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Structure</h2>
                <button onClick={() => { setIsReviewing(false); setCurrentStep(0); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium ${currentStep === 0 && !isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                  <Settings2 className="w-4 h-4" /> General Info
               </button>
               {currentProject.parts.map((part, i) => (
                 <div key={i} className="space-y-1">
                   <div className="text-[10px] font-bold text-slate-300 px-3 mt-4">PART {i+1}</div>
                   {PART_STEPS.map((s, si) => (
                     <button key={s.id} onClick={() => { setIsReviewing(false); setActivePartIndex(i); setCurrentStep(si+1); }} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium ${currentStep === si+1 && activePartIndex === i && !isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                        <s.icon className="w-4 h-4" /> {s.title}
                     </button>
                   ))}
                 </div>
               ))}
               <div className="mt-4 pt-4 border-t border-slate-100">
                 <button onClick={() => setIsReviewing(true)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium ${isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                    <Sparkles className="w-4 h-4" /> Final Verdict
                 </button>
               </div>
               <button 
                 disabled={currentProject.isLocked && !profile?.isAdmin} 
                 onClick={() => setCurrentProject({...currentProject, parts: [...currentProject.parts, {responses: {}, images: []}]})} 
                 className={`mt-4 flex items-center gap-2 text-xs font-bold px-3 transition-colors ${currentProject.isLocked && !profile?.isAdmin ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
               >
                 <PlusCircle className="w-4 h-4" /> Add Part
               </button>
            </aside>

            <div className="flex-1 p-12 overflow-y-auto bg-slate-50">
               <div className="max-w-2xl mx-auto w-full">
                  {currentProject.isLocked && !profile?.isAdmin && (
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Project Locked (Read-Only)</p>
                        <p className="text-xs text-amber-700">This project has been submitted or locked by Scape. You cannot edit it in this state.</p>
                      </div>
                      {!currentProject.takenBy && (
                        <button 
                          onClick={() => toggleLock(currentProject)}
                          className="ml-auto text-[10px] font-black uppercase bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                        >
                          Unlock to Edit
                        </button>
                      )}
                    </div>
                  )}
                  {!isReviewing ? (
                    <div className="space-y-8">
                       <h1 className="text-3xl font-black">{currentStep === 0 ? "General Project Details" : `Part ${activePartIndex+1}: ${PART_STEPS[currentStep-1].title}`}</h1>
                       <div className="space-y-6">
                         {(currentStep === 0 ? GENERAL_STEPS[0] : PART_STEPS[currentStep-1]).questions.map(q => (
                           <div key={q.id}>
                             <label className="block text-sm font-bold text-slate-700 mb-2">{q.label}</label>
                              {(q.type === 'text' || q.type === 'number') && (
                                <input 
                                  type={q.type} 
                                  disabled={currentProject.isLocked && !profile?.isAdmin} 
                                  placeholder={q.placeholder}
                                  className="w-full p-4 bg-white border rounded-2xl disabled:bg-slate-50 disabled:text-slate-400" 
                                  value={(currentStep === 0 ? currentProject.generalResponses[q.id] : currentProject.parts[activePartIndex].responses[q.id]) || ''} 
                                  onChange={e => {
                                    const val = q.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                                    if (currentStep === 0) setCurrentProject({...currentProject, generalResponses: {...currentProject.generalResponses, [q.id]: val}});
                                    else {
                                      const parts = [...currentProject.parts];
                                      parts[activePartIndex].responses[q.id] = val;
                                      setCurrentProject({...currentProject, parts});
                                    }
                                  }} 
                                />
                              )}
                             {q.type === 'select' && (
                               <select disabled={currentProject.isLocked && !profile?.isAdmin} className="w-full p-4 bg-white border rounded-2xl disabled:bg-slate-50 disabled:text-slate-400" value={(currentStep === 0 ? currentProject.generalResponses[q.id] : currentProject.parts[activePartIndex].responses[q.id]) || ''} onChange={e => {
                                 if (currentStep === 0) setCurrentProject({...currentProject, generalResponses: {...currentProject.generalResponses, [q.id]: e.target.value}});
                                 else {
                                   const parts = [...currentProject.parts];
                                   parts[activePartIndex].responses[q.id] = e.target.value;
                                   setCurrentProject({...currentProject, parts});
                                 }
                               }}>
                                 <option value="">Select...</option>
                                 {q.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                               </select>
                             )}
                             {q.type === 'boolean' && (
                               <div className="flex gap-4">
                                 {[true, false].map(v => (
                                   <button key={v.toString()} disabled={currentProject.isLocked && !profile?.isAdmin} onClick={() => {
                                      if (currentStep === 0) setCurrentProject({...currentProject, generalResponses: {...currentProject.generalResponses, [q.id]: v}});
                                      else {
                                        const parts = [...currentProject.parts];
                                        parts[activePartIndex].responses[q.id] = v;
                                        setCurrentProject({...currentProject, parts});
                                      }
                                   }} className={`flex-1 p-4 rounded-xl border-2 font-bold ${ (currentStep === 0 ? currentProject.generalResponses[q.id] : currentProject.parts[activePartIndex].responses[q.id]) === v ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white border-slate-100 text-slate-400' } ${ (currentProject.isLocked && !profile?.isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                     {v ? 'Yes' : 'No'}
                                   </button>
                                 ))}
                               </div>
                             )}
                             {q.type === 'media' && (
                               <div className="space-y-4">
                                  <label className={`w-full h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center bg-white ${ (currentProject.isLocked && !profile?.isAdmin) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                   <Camera className="w-8 h-8 text-slate-300" />
                                   <span className="text-xs font-bold text-slate-400 mt-2">Upload Part Photos</span>
                                   <input type="file" multiple disabled={currentProject.isLocked && !profile?.isAdmin} className="hidden" onChange={e => {
                                      if (e.target.files) {
                                        Array.from(e.target.files).forEach((f: any) => {
                                          const r = new FileReader();
                                          r.onloadend = () => {
                                            const parts = [...currentProject.parts];
                                            parts[activePartIndex].images = [...parts[activePartIndex].images, r.result as string];
                                            setCurrentProject({...currentProject, parts});
                                          };
                                          r.readAsDataURL(f);
                                        });
                                      }
                                   }} />
                                 </label>
                                 <div className="grid grid-cols-4 gap-2">
                                    {currentProject.parts[activePartIndex].images.map((img, i) => <img key={i} src={img} className="w-full h-16 object-cover rounded-lg border" />)}
                                 </div>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                       <div className="flex justify-between pt-10 border-t">
                          <button onClick={() => setCurrentStep(Math.max(0, currentStep-1))} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Back</button>
                          <button 
                            onClick={async () => {
                              const saved = await saveProject('draft');
                              if (saved) {
                                if (currentStep === PART_STEPS.length) {
                                  if (activePartIndex < saved.parts.length - 1) { setActivePartIndex(activePartIndex+1); setCurrentStep(1); }
                                  else setIsReviewing(true);
                                } else setCurrentStep(currentStep+1);
                              }
                            }} 
                            className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                          >
                            {(currentProject.isLocked && !profile?.isAdmin) ? 'Next' : 'Continue'}
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                       <h1 className="text-5xl font-black tracking-tighter">Final Review</h1>
                       <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                          <Sparkles className="absolute top-0 right-0 w-40 h-40 opacity-10" />
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Zap className="text-blue-400" /> Advisor Verdict</h3>
                          
                          {(profile?.isAdmin || currentProject.isVerdictVisible) ? (
                            <>
                              {isGeneratingReport ? (
                                <div className="flex items-center gap-3">
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Calculating Feasibility...</span>
                                </div>
                              ) : (
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{currentProject.report || "Awaiting submission data..."}</p>
                              )}
                              
                              {profile?.isAdmin && (
                                <button 
                                  onClick={() => toggleVerdictVisibility(currentProject)}
                                  className={`mt-10 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${currentProject.isVerdictVisible ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-700 text-slate-400 hover:text-white hover:border-white'}`}
                                >
                                  {currentProject.isVerdictVisible ? 'Verdict Published' : 'Publish Verdict to User'}
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="py-10 text-center">
                              <Info className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Verdict Pending</p>
                              <p className="text-slate-400 text-sm mt-2">A Scape Applications Engineer is reviewing your specification.</p>
                            </div>
                          )}
                       </div>
                       <div className="space-y-4">
                          <h3 className="font-bold flex items-center gap-2"><Box /> Parts Summary</h3>
                          {currentProject.parts.map((p, i) => (
                             <div key={i} className="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm">
                                <span className="font-bold">Part #0{i+1}: {p.responses['2.01'] || "Unnamed"}</span>
                                <span className="text-xs text-slate-400">{p.images.length} Images</span>
                             </div>
                          ))}
                       </div>
                       <div className="flex flex-col gap-4">
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setIsReviewing(false)} 
                              disabled={currentProject.isLocked && !profile?.isAdmin}
                              className={`flex-1 py-5 border-2 rounded-2xl font-bold transition-all ${currentProject.isLocked && !profile?.isAdmin ? 'bg-slate-50 border-slate-100 text-slate-300' : 'hover:border-slate-900'}`}
                            >
                              Edit Details
                            </button>
                            {currentProject.isLocked && !profile?.isAdmin && !currentProject.takenBy && (
                              <button 
                                onClick={() => toggleLock(currentProject)}
                                className="flex-1 py-5 border-2 border-amber-500 text-amber-600 rounded-2xl font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" /> Unlock to Edit
                              </button>
                            )}
                            <button 
                              onClick={async () => { 
                                if (profile?.isAdmin) {
                                  const saved = await saveProject('draft');
                                  if (saved) setView('dashboard');
                                  return;
                                }
                                setIsSubmitting(true); 
                                const saved = await saveProject('submitted'); 
                                if (saved) {
                                  setIsSubmitting(false); 
                                  setView('dashboard'); 
                                  setGlobalSuccess("Project submitted to Scape Solutions successfully!");
                                  setTimeout(() => setGlobalSuccess(null), 5000);
                                } else {
                                  setIsSubmitting(false);
                                }
                              }} 
                              disabled={isSubmitting || (currentProject.isLocked && !profile?.isAdmin)}
                              className={`flex-[2] py-5 rounded-2xl font-bold shadow-lg transition-all ${isSubmitting || (currentProject.isLocked && !profile?.isAdmin) ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-blue-600 text-white shadow-blue-200 hover:scale-[1.01]'}`}
                            >
                               {isSubmitting ? 'Submitting...' : (profile?.isAdmin ? 'Back to Dashboard' : 'Submit to Scape Solutions')}
                            </button>
                          </div>
                          {!currentProject.isFullySpecified && (
                            <button 
                              disabled={currentProject.isLocked && !profile?.isAdmin}
                              onClick={async () => {
                                if (currentProject.isLocked && !profile?.isAdmin) return;
                                const newVal = !currentProject.isFullySpecified;
                                setCurrentProject({...currentProject, isFullySpecified: newVal});
                                if (currentProject.id) {
                                  await updateDoc(doc(db, 'projects', currentProject.id), { isFullySpecified: newVal });
                                  await logChange(currentProject.id, `Project marked as fully specified by user`);
                                  fetchProjects(profile?.isAdmin);
                                }
                              }}
                              className={`w-full py-4 border-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${currentProject.isLocked && !profile?.isAdmin ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              <CheckCircle2 className="w-5 h-5" /> Mark as Fully Specified
                            </button>
                          )}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

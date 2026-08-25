/**
 * App.tsx
 * Dette er selve "Hjertet" af vores React applikation. 
 * I moderne React bygger man brugerfladen ved hjælp af "Functional Components" (funktioner, der returnerer HTML).
 * Denne fil fungerer primært som en "Router", der ser på variablen `view` og bestemmer, 
 * hvilket skærmbillede (View) der skal vises.
 */
import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { updateDoc, doc, onSnapshot, waitForPendingWrites, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './lib/firebase';

import { useAuth, isScapeEmployee, getEffectiveAdminStatus, isDynamicAllowedEvaluator, isDynamicSuperuser } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { GENERAL_STEPS, PART_STEPS } from './questionnaire';

import { Header } from './components/Header';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ChangelogModal } from './components/ChangelogModal';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingModal } from './components/OnboardingModal';

import { AuthView } from './views/AuthView';
import { ProfileSetupView } from './views/ProfileSetupView';
import { DashboardView } from './views/DashboardView';
import { QuestionnaireView } from './views/QuestionnaireView';

import { ProjectState, OperationType } from './types';
import { computeDataDiff, getCurrentResponsesSnapshot } from './utils/diffHelper';

import externalAdvicePromptRaw from './docs/externalAdvicePrompt.md?raw';
import evaluatorDraftPromptRaw from './docs/evaluatorDraftPrompt.md?raw';
import autoFillPromptRaw from './docs/autoFillPrompt.md?raw';
import observationsExtractionPromptRaw from './docs/observationsExtractionPrompt.md?raw';

let activeClientPrompts = {
  externalAdvicePrompt: externalAdvicePromptRaw.trim(),
  evaluatorDraftPrompt: evaluatorDraftPromptRaw.trim(),
  autoFillPrompt: autoFillPromptRaw.trim(),
  observationsExtractionPrompt: observationsExtractionPromptRaw.trim(),
  includeImagesForAdvice: true,
  includeImagesForDraft: true,
  includeImagesForChat: false
};

// Initialiserer Gemini AI (Google's kunstige intelligens)
// import.meta.env er den måde, Vite-bygge-værktøjet læser ".env" filer på.
// Vi bruger kun det direkte SDK på localhost (Vite dev server) for at undgå CORS-fejl
// når appen tilgås fra en telefon eller anden vært. I alle andre tilfælde bruges serveren.
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const GEMINI_API_KEY = isLocalhost ? (import.meta as any).env.VITE_GEMINI_API_KEY : null;
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Hjælpefunktion: Fjerner de gigantiske Base64-billeder fra JSON-strengen
 * og pakker dem i stedet som rigtige 'inlineData' filer, så Gemini kan "se" dem.
 */
const prepareAIRequest = (project: ProjectState, basePrompt: string, includeImages: boolean = true) => {
  // Klon projektet så vi ikke ødelægger det originale state
  const cleanProject = JSON.parse(JSON.stringify(project));
  
  // Exclude chatHistory and AI-generated fields so evaluations only use structured questionnaire fields
  delete cleanProject.chatHistory;
  delete cleanProject.report;
  delete cleanProject.evaluatorDraft;
  delete cleanProject.finalVerdict;
  delete cleanProject.fieldObservations;
  
  const imageParts: any[] = [];

  // Handle general cell images
  if (cleanProject.generalImages && Array.isArray(cleanProject.generalImages)) {
    if (includeImages) {
      cleanProject.generalImages.forEach((imgBase64: string) => {
        if (imgBase64.startsWith('data:')) {
          const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
          const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
          imageParts.push({ inlineData: { data, mimeType } });
        }
      });
    }
    cleanProject.generalImages = [`[${cleanProject.generalImages.length} general cell images provided as attachments]`];
  } else {
    cleanProject.generalImages = [];
  }

  cleanProject.parts.forEach((part: any) => {
    // Ekstraher billeder
    if (part.images && Array.isArray(part.images)) {
      if (includeImages) {
        part.images.forEach((imgBase64: string) => {
          if (imgBase64.startsWith('data:')) {
            const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
            const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
            imageParts.push({ inlineData: { data, mimeType } });
          }
        });
      }
      // Erstat de gigantiske strenge med en simpel tekst placeholder i JSON
      part.images = [`[${part.images.length} images provided as attachments]`];
    }
    
    // Fjern evt. CAD base64 data for at spare tokens (Gemini kan alligevel ikke læse rå .step filer endnu)
    if (part.cadFile && part.cadFile.dataUrl) {
      part.cadFile.dataUrl = "[CAD data removed to save tokens]";
    }
  });

  // Sammensæt den fulde tekst
  const finalPromptText = `${basePrompt}\n\nData:\n${JSON.stringify(cleanProject, null, 2)}`;
  
  // Returnér et array bestående af teksten først, og derefter alle billederne
  return [finalPromptText, ...imageParts];
};

/**
 * Henter Project Information Advice.
 * Bruger det lokale SDK hvis en API-nøgle er tilgængelig, ellers kaldes det sikre server-side endpoint.
 */
async function generateAdviceAPI(project: ProjectState): Promise<string> {
  if (GEMINI_API_KEY) {
    if (!ai) ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const basePrompt = activeClientPrompts.externalAdvicePrompt;
    const contents = prepareAIRequest(project, basePrompt, activeClientPrompts.includeImagesForAdvice);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents,
    });
    return response.text || "";
  } else {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    const response = await fetch('/api/ai/advice', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ project }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Failed to generate advice.');
    }
    const data = await response.json();
    return data.text || "";
  }
}

/**
 * Extracts structured field-level observations from an advice text.
 * Returns a JSON map of field IDs -> { severity, text } for use in UI indicators and PDF.
 */
async function extractObservationsAPI(
  adviceText: string,
  schema: any
): Promise<Record<string, { severity: 'warning' | 'critical'; text: string }>> {
  const prompt = `${activeClientPrompts.observationsExtractionPrompt}\n\n## QUESTIONNAIRE SCHEMA (field IDs and labels)\n${JSON.stringify(schema, null, 2)}\n\n## ADVICE REPORT TO ANALYSE\n${adviceText}`;

  let rawText = '';
  if (GEMINI_API_KEY) {
    if (!ai) ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [prompt],
    });
    rawText = response.text || '';
  } else {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    const response = await fetch('/api/ai/extract-observations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ adviceText, schema }),
    });
    if (!response.ok) return {};
    const data = await response.json();
    rawText = data.text || '';
  }

  // Parse the JSON code block from the AI response
  try {
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) return JSON.parse(match[1]);
    return JSON.parse(rawText.trim());
  } catch {
    console.warn('extractObservationsAPI: failed to parse JSON response', rawText);
    return {};
  }
}

/**
 * Henter Evaluator Draft.
 * Bruger det lokale SDK hvis en API-nøgle er tilgængelig, ellers kaldes det sikre server-side endpoint.
 */
async function generateDraftAPI(project: ProjectState): Promise<string> {
  if (GEMINI_API_KEY) {
    if (!ai) ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const basePrompt = activeClientPrompts.evaluatorDraftPrompt;
    const contents = prepareAIRequest(project, basePrompt, activeClientPrompts.includeImagesForDraft);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents,
    });
    return response.text || "";
  } else {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    const response = await fetch('/api/ai/draft', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ project }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Failed to generate draft.');
    }
    const data = await response.json();
    return data.text || "";
  }
}

/**
 * Sender besked til chat assistenten.
 * Bruger det lokale SDK hvis en API-nøgle er tilgængelig, ellers kaldes det sikre server-side endpoint.
 */
async function sendChatAPI(
  project: ProjectState,
  activePartIndex: number,
  history: any[],
  schema: any
): Promise<string> {
  if (GEMINI_API_KEY) {
    if (!ai) ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const cleanProject = JSON.parse(JSON.stringify(project));
    const includeImages = activeClientPrompts.includeImagesForChat;
    const imageParts: any[] = [];

    // Process generalImages
    if (cleanProject.generalImages && Array.isArray(cleanProject.generalImages)) {
      if (includeImages) {
        cleanProject.generalImages.forEach((imgBase64: string) => {
          if (imgBase64.startsWith('data:')) {
            const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
            const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
            imageParts.push({ inlineData: { data, mimeType } });
          }
        });
      }
      cleanProject.generalImages = [`[${cleanProject.generalImages.length} general cell images]`];
    } else {
      cleanProject.generalImages = [];
    }

    cleanProject.parts.forEach((part: any) => {
      if (part.images && Array.isArray(part.images)) {
        if (includeImages) {
          part.images.forEach((imgBase64: string) => {
            if (imgBase64.startsWith('data:')) {
              const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
              const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
              imageParts.push({ inlineData: { data, mimeType } });
            }
          });
        }
        part.images = [`[${part.images.length} images]`];
      }
      if (part.cadFile && part.cadFile.dataUrl) {
        part.cadFile.dataUrl = "[CAD removed]";
      }
    });

    const systemInstruction = `${activeClientPrompts.autoFillPrompt}

QUESTIONNAIRE SCHEMA:
${JSON.stringify(schema, null, 2)}

VERIFIED CURRENT PROJECT STATE (ABSOLUTE GROUND TRUTH):
${JSON.stringify(cleanProject, null, 2)}

ACTIVE PART INDEX (0-based): ${activePartIndex}

DATA DISCREPANCY RULE FOR CHAT HISTORY:
The chat history transcript below contains past conversation messages. If any user or assistant message in history mentions values that contradict VERIFIED CURRENT PROJECT STATE (for example, history mentions "CCC" but VERIFIED CURRENT PROJECT STATE has "AAA"), VERIFIED CURRENT PROJECT STATE is the final result of manual user edits and SUPERSEDES all historical chat messages. Treat conflicting history values as obsolete and NEVER propose overwriting VERIFIED CURRENT PROJECT STATE with obsolete values from history.`;

    const contents = history.map((msg, i) => {
      let text = msg.text;
      // Strip raw JSON proposal blocks from past assistant turns in history so obsolete JSON proposals don't pollute Gemini context
      if (msg.role === 'model' || msg.role === 'assistant') {
        text = text.replace(/```(?:json)?\s*[\s\S]*?\s*```/ig, '').trim();
      }

      const parts: any[] = [{ text }];
      // We always send attachments uploaded in the current (very last) user turn.
      // Older attachments in history are skipped to save tokens and prevent 429 quota/rate limit errors.
      const isLastMessage = (i === history.length - 1);
      if (isLastMessage && msg.images && Array.isArray(msg.images)) {
        msg.images.forEach((imgBase64: string) => {
          if (imgBase64.startsWith('data:')) {
            const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
            const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
            parts.push({ inlineData: { data, mimeType } });
          }
        });
      }
      
      return { role: msg.role, parts };
    });

    // Append images to the last user message's parts if includeImages is true and we have images
    if (includeImages && imageParts.length > 0) {
      const lastMsg = contents[contents.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        lastMsg.parts.push(...imageParts);
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
      },
      contents,
    });
    return response.text || "";
  } else {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ project, activePartIndex, history, schema }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Failed to process chat message.');
    }
    const data = await response.json();
    return data.text || "";
  }
}

// export default betyder, at når andre filer importerer denne fil, 
// er 'App' den primære ting, de får.
export default function App() {
  // useState hooks til at gemme globale fejl- eller succesbeskeder.
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // Synchronize dynamic prompts from Firestore in real-time.
  // For the autoFillPrompt: only use the Firestore version if it contains the JSON proposal
  // instruction (i.e. the ---END--- marker). If it's an older version without it, fall back
  // to the local file so the "Apply Changes" card always appears correctly.
  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'prompts'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        activeClientPrompts.externalAdvicePrompt = data.externalAdvicePrompt || externalAdvicePromptRaw.trim();
        activeClientPrompts.evaluatorDraftPrompt = data.evaluatorDraftPrompt || evaluatorDraftPromptRaw.trim();
        activeClientPrompts.includeImagesForAdvice = data.includeImagesForAdvice !== false;
        activeClientPrompts.includeImagesForDraft = data.includeImagesForDraft !== false;
        activeClientPrompts.includeImagesForChat = !!data.includeImagesForChat;
        // Only use the Firestore autoFillPrompt if it has the JSON proposal block instruction
        const firestoreAutoFill = data.autoFillPrompt || '';
        if (firestoreAutoFill.includes('---END---') && firestoreAutoFill.includes('```json')) {
          activeClientPrompts.autoFillPrompt = firestoreAutoFill;
          console.log("Client AI Chat Prompt: using Firestore version (has JSON proposal block).");
        } else {
          activeClientPrompts.autoFillPrompt = autoFillPromptRaw.trim();
          console.warn("Client AI Chat Prompt: Firestore version is outdated (missing JSON block). Using local file fallback. Please update via the Prompts Editor in the app.");
        }
        console.log("Client AI Prompts synchronized in real-time.");
      }
    });
  }, []);

  // En hjælpefunktion til at vise pæne fejlbeskeder uanset hvor fejlen sker.
  const handleAppError = (e: any, op?: OperationType, path?: string) => {
    let context = "";
    if (op && path) context = ` (Failed to ${op} ${path})`;
    else if (op) context = ` (Operation: ${op})`;
    
    if (e.code === 'permission-denied') {
      setGlobalError(`Permission Denied${context}: You do not have the required access rights.`);
    } else if (e.code === 'unavailable') {
      setGlobalError(`Network Error${context}: Please check your internet connection.`);
    } else {
      setGlobalError(`An error occurred${context}: ${e.message || "Unknown error"}`);
    }
  };

  // Her "destrukturerer" (trækker vi specifikke ting ud af) det objekt, vores useAuth hook returnerer.
  const {
    user,
    profile,
    setProfile,
    view,
    setView,
    authError,
    setAuthError,
    authLoading,
    login,
    loginWithEmail,
    signupWithEmail,
    logout,
    saveProfile,
    switchMode,
    getEffectiveEmail
  } = useAuth(handleAppError);

  // Lokale states til filtrering på Dashboardet
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);

  // Trækker alt projekt-relateret funktionalitet ud fra useProjects
  const {
    projects,
    isLoadingProjects,
    currentProject,
    setCurrentProject,
    fetchProjects,
    saveProject,
    saveProjectImages,
    deleteProject,
    restoreProject,
    fetchLog,
    changelog,
    showLog,
    setShowLog,
    updateProjectField,
    logChange,
    fetchProjectImages,
    isGeneratingDemo,
    isCleaningDemo,
    generateDemoProjects,
    cleanDemoProjects,
    acceptProject,
    acceptAllPendingProjects,
    importProjectsFromJson
  } = useProjects(user, profile, sortBy, handleAppError, setGlobalSuccess, getEffectiveEmail());

  const handleLogout = async () => {
    if (view === 'questionnaire' && currentProject) {
      try {
        await saveProject(currentProject.status || 'draft', currentProject);
      } catch (e) {
        console.error("Auto-save failed on logout:", e);
      }
    }
    try {
      console.log("Waiting for pending Firestore writes to complete before logout...");
      await waitForPendingWrites(db);
      console.log("Firestore writes completed.");
    } catch (e) {
      console.warn("Error waiting for pending writes:", e);
    }
    logout();
  };

  // State-variabler specifikt til Login/Sign-up processen
  const [authStep, setAuthStep] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');

  // State til vores globale popup, der beder om bekræftelse før en sletning
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'danger' | 'info';
    requireTextConfirm?: string;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Questionnaire state - holder styr på, hvor langt brugeren er i formularen
  const [currentStep, setCurrentStep] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeCustomSection, setActiveCustomSection] = useState<'business-case' | 'additional-opportunities' | 'scape-review' | null>(null);
  const [reviewTab, setReviewTab] = useState<'advice' | 'evaluation'>('advice');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showToSModal, setShowToSModal] = useState(false);

  const handleAcceptOnboarding = async (updatedData: { name: string; company: string; phone: string; role: 'enduser' | 'integrator' }) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates = {
        name: updatedData.name,
        company: updatedData.company,
        organization: updatedData.company,
        phone: updatedData.phone,
        role: updatedData.role,
        tosAcceptedAt: serverTimestamp()
      };
      await updateDoc(userRef, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setGlobalSuccess("Welcome! Onboarding completed successfully.");
      setTimeout(() => setGlobalSuccess(null), 1500);
    } catch (err) {
      handleAppError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Splash screen state og inaktivitets-timer (5 minutter)
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        setShowSplash(true);
      }, 5 * 60 * 1000); // 5 minutter
    };

    if (!showSplash) {
      resetTimer();

      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
      const handleActivity = () => resetTimer();

      events.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
      });

      return () => {
        clearTimeout(inactivityTimeout);
        events.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [showSplash]);

  // Opretter et helt nyt "tomt" projekt i hukommelsen. 
  // Bemærk: Det gemmes ikke i databasen endnu.
  const createNewProject = (withAI = false) => {
    setCurrentProject({
      id: null,
      projectName: "New Scape Bin-Picker Project",
      generalResponses: {},
      parts: [{ responses: {}, images: [] }],
      report: null,
      status: 'draft',
      userId: user!.uid,
      ownerEmail: getEffectiveEmail() || undefined,
      ownerName: profile?.name || user?.displayName || undefined,
      ownerCompany: profile?.company || undefined,
      ownerPhone: profile?.phone || undefined,
      isSplitScreen: withAI,
      lastActiveStep: 0,
      lastActivePartIndex: 0,
      lastActiveCustomSection: null,
      lastIsReviewing: false,
    });
    setView('questionnaire');
    setCurrentStep(0);
    setIsReviewing(false);
    setActiveCustomSection(null);
    setReviewTab('advice');
    setActivePartIndex(0);
  };

  const openProject = async (p: ProjectState) => {
    setCurrentProject(p);
    setView('questionnaire');
    
    // Restore the exact section and view mode the project was last in
    if (p.lastActiveCustomSection !== undefined && p.lastActiveCustomSection !== null) {
      setActiveCustomSection(p.lastActiveCustomSection);
      setIsReviewing(false);
    } else if (p.lastIsReviewing !== undefined) {
      setIsReviewing(p.lastIsReviewing);
      setActiveCustomSection(null);
    } else {
      // Default to section 0 (Project & Cell Info)
      setIsReviewing(false);
      setActiveCustomSection(null);
    }

    setCurrentStep(p.lastActiveStep !== undefined ? p.lastActiveStep : 0);
    setActivePartIndex(p.lastActivePartIndex !== undefined ? p.lastActivePartIndex : 0);
    setReviewTab(p.status === 'submitted' ? 'evaluation' : 'advice');
    
    // Hent billederne asynkront i baggrunden for super-hurtig UI-respons
    const fullProject = await fetchProjectImages(p);
    setCurrentProject(fullProject);
  };

  const triggerDeleteProject = (p: ProjectState) => {
    const currentUid = user?.uid;
    const isOwner = p.userId === currentUid;
    const isEval = profile?.isAdmin;
    
    // Sikkerhedstjek: Du kan kun slette, hvis du ejer det, eller er Admin
    if (!isOwner && !isEval) {
      handleAppError({ code: 'permission-denied', message: `You do not own this project. (Your ID: ${currentUid}, Project Owner: ${p.userId})` });
      return;
    }

    if (p.isDeleted) {
      if (!isEval) {
        handleAppError({ code: 'permission-denied', message: 'Only evaluators can permanently delete projects.' });
        return;
      }
      
      const isInternal = p.ownerEmail && (p.ownerEmail.endsWith('@scapesolutions.eu') || p.ownerEmail.endsWith('@scapesolutions.com'));
      const message = isInternal 
        ? `This project appears to be an internal Scape submission (${p.ownerEmail}). Are you sure you want to permanently delete it?`
        : `Are you sure you want to PERMANENTLY delete project "${p.projectName}"? This cannot be undone.`;

      setConfirmModal({
        show: true,
        title: "Final Delete Project",
        message,
        type: 'danger',
        confirmText: "Delete Permanently",
        requireTextConfirm: "delete",
        onConfirm: async () => {
          try {
            await deleteProject(p, true);
            setConfirmModal(prev => ({ ...prev, show: false })); // Luk modalen
          } catch (e) {
            setConfirmModal(prev => ({ ...prev, show: false }));
          }
        }
      });
    } else {
      setConfirmModal({
        show: true,
        title: "Move to Trash",
        message: `Are you sure you want to move project "${p.projectName}" to the trash?`,
        type: 'danger',
        confirmText: "Move to Trash",
        requireTextConfirm: "delete",
        onConfirm: async () => {
          try {
            await deleteProject(p, false);
            setConfirmModal(prev => ({ ...prev, show: false })); // Luk modalen
          } catch (e) {
            setConfirmModal(prev => ({ ...prev, show: false }));
          }
        }
      });
    }
  };



  /**
   * ==========================================
   * AI ADVICE GENERATION FOR EXTERNAL USERS
   * ==========================================
   * Denne funktion kaldes når en almindelig bruger (ikke-evaluator) klikker
   * på "Get Advice on Data" knappen. Formålet er at give brugeren konstruktiv
   * feedback på den data, de har indtastet indtil videre, og fortælle dem
   * præcis hvad der eventuelt mangler (især billeder eller cyklustider),
   * før de indsender det endeligt.
   */
  const generateExternalAdvice = async () => {
    if (!currentProject || profile?.isAdmin) return;
    setIsGeneratingAdvice(true);
    try {
      // Step 0: Calculate diff from last snapshot
      const diffList = computeDataDiff(currentProject);
      const newSnapshot = getCurrentResponsesSnapshot(currentProject);
      const timestamp = new Date().toLocaleString();

      // Step 1: Generate the full advice narrative
      let text = await generateAdviceAPI(currentProject);

      // Prepend diff section if changes exist
      if (diffList.length > 0) {
        const diffBlock = `### 🔄 Data Changes Since Last Advice Request\n*Report updated: ${timestamp}*\n\n` +
          diffList.map(item => `- ${item}`).join('\n') + '\n\n---\n\n';
        text = diffBlock + text;
      }

      // Step 2: Extract structured field-level observations from the advice
      let observations: Record<string, { severity: 'warning' | 'critical'; text: string }> = {};
      try {
        const schema = { generalSteps: GENERAL_STEPS, partSteps: PART_STEPS };
        observations = await extractObservationsAPI(text, schema);
      } catch (obsErr) {
        console.warn('Could not extract field observations:', obsErr);
      }

      // Step 3: Update state and persist fields
      const updatedProject: ProjectState = {
        ...currentProject,
        report: text,
        fieldObservations: observations,
        lastAdviceResponsesSnapshot: newSnapshot,
        lastAdviceTimestamp: timestamp
      };

      setCurrentProject(updatedProject);
      if (currentProject.id) {
        await updateProjectField(updatedProject, 'report', text, 'AI generated Project Information Advice');
        await updateProjectField(updatedProject, 'lastAdviceResponsesSnapshot', newSnapshot, 'Updated responses snapshot');
        await updateProjectField(updatedProject, 'lastAdviceTimestamp', timestamp, 'Updated advice timestamp');
        if (Object.keys(observations).length > 0) {
          await updateProjectField(updatedProject, 'fieldObservations', observations, 'AI field observations extracted');
        }
      }
    } catch (e) {
      console.error(e);
      handleAppError(e);
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  /**
   * ==========================================
   * AI VERDICT GENERATION FOR EVALUATORS (ADMINS)
   * ==========================================
   * Denne funktion kaldes udelukkende når en Evaluator klikker på 
   * "Generate Evaluator Draft" knappen i Final Review panelet.
   * Modellen analyserer projektet og kommer med en dybdegående, teknisk
   * konklusion på om Bin-Picking løsningen er mulig, og hvilken hardware
   * der evt. skal bruges.
   */
  const generateEvaluatorDraft = async () => {
    if (!currentProject || !profile?.isAdmin) return;
    setIsGeneratingDraft(true);
    try {
      const text = await generateDraftAPI(currentProject);
      setCurrentProject({...currentProject, evaluatorDraft: text});
      if (currentProject.id) {
        await updateProjectField(currentProject, 'evaluatorDraft', text, "AI generated evaluator draft");
      }
    } catch (e) {
      console.error(e);
      handleAppError(e);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  /**
   * ==========================================
   * AI AUTO-FILL ASSISTANT (CHAT)
   * ==========================================
   */
  const sendMessageToAssistant = async (userMessage: string, images?: string[]) => {
    if (!currentProject) return;
    const history = currentProject.chatHistory ? [...currentProject.chatHistory] : [];
    const newHistory = [...history, { role: 'user' as const, text: userMessage, images: images || [] }];
    setCurrentProject({ ...currentProject, chatHistory: newHistory });
    setIsAssistantThinking(true);
    try {
      const questionnaireSchema = {
        generalFields: GENERAL_STEPS[0].questions.map(q => ({
          id: q.id, label: q.label, type: q.type, description: q.description,
          important: q.important, options: q.options?.map(o => o.value)
        })),
        partFields: PART_STEPS.flatMap(step => step.questions.map(q => ({
          id: q.id, label: q.label, type: q.type, description: q.description,
          important: q.important, options: q.options?.map(o => o.value)
        })))
      };
      const aiText = await sendChatAPI(currentProject, activePartIndex, newHistory, questionnaireSchema);
      const finalHistory = [...newHistory, { role: 'model' as const, text: aiText }];
      const updatedProject = { ...currentProject, chatHistory: finalHistory };
      setCurrentProject(updatedProject);
      if (updatedProject.id) {
        await updateProjectField(updatedProject, 'chatHistory', finalHistory, "AI Assistant chat updated");
      }
    } catch (e: any) {
      console.error(e);
      // Show the error as a message bubble inside the chat so the user sees it in context
      let errorMessage = e?.message || 'Unknown error. Check the browser console for details.';
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('exhausted') || errorMessage.toLowerCase().includes('rate limit')) {
        errorMessage = "You have exceeded the Gemini API quota or rate limit. If you just uploaded a large PDF, it may have exceeded the allowed token count for your current AI Studio billing plan. Please check your Google AI Studio plan and budget caps, or try using a smaller document (Max 5MB).";
      }
      const errorText = `⚠️ AI error: ${errorMessage}`;
      const errorHistory = [...newHistory, { role: 'model' as const, text: errorText }];
      setCurrentProject({ ...currentProject, chatHistory: errorHistory });
    } finally {
      setIsAssistantThinking(false);
    }
  };

  /**
   * RENDERING: 
   * Herunder returnerer komponenten sit HTML/JSX.
   * I JSX bruger vi tuborgklammer {} til at skrive almindelig JavaScript indeni HTML'en.
   */

  // Hvis splash skærmen skal vises, returnerer vi den med det samme
  if (showSplash) {
    return <SplashScreen onClose={() => setShowSplash(false)} />;
  }

  // Hvis der ikke er en bruger ('user' er null), vis Login-skærmen
  if (!user) {
    return (
      <AuthView 
        authStep={authStep} setAuthStep={setAuthStep}
        authEmail={authEmail} setAuthEmail={setAuthEmail}
        authPassword={authPassword} setAuthPassword={setAuthPassword}
        authDisplayName={authDisplayName} setAuthDisplayName={setAuthDisplayName}
        authError={authError}
        loginWithEmail={() => loginWithEmail(authEmail, authPassword)}
        signupWithEmail={() => signupWithEmail(authEmail, authPassword, authDisplayName)}
        loginWithGoogle={login}
        authLoading={authLoading}
      />
    );
  }

  // Hvis brugeren mangler en profil (f.eks. ved allerførste login), vis profil-setup
  if (view === 'profile_setup') {
    return (
      <ProfileSetupView 
        profile={profile} setProfile={setProfile}
        saveProfile={saveProfile}
        isScapeEmployee={isScapeEmployee}
        isAllowedEvaluator={isDynamicAllowedEvaluator}
        isDynamicSuperuser={isDynamicSuperuser}
        userEmail={user.email}
      />
    );
  }

  // Ellers viser vi hoved-applikationen (Header + enten Dashboard eller Questionnaire)
  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col font-sans text-slate-900">
      {/* Headeren modtager data via 'props' (parametrene i komponent-kaldet) */}
      {view !== 'questionnaire' && (
        <Header 
          user={user} profile={profile}
          globalError={globalError} setGlobalError={setGlobalError}
          globalSuccess={globalSuccess} setGlobalSuccess={setGlobalSuccess}
          setView={setView} logout={handleLogout} switchMode={switchMode}
          isAllowedEvaluator={isDynamicAllowedEvaluator} isScapeEmployee={isScapeEmployee}
          saveProfile={saveProfile}
          onOpenToS={() => setShowToSModal(true)}
        />
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* && bruges i React som eine 'if'. Hvis det til venstre er sandt, vis det til højre. */}
        {view === 'dashboard' && (
          <DashboardView 
            projects={projects} profile={profile} user={user}
            sortBy={sortBy} setSortBy={setSortBy}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filterOrg={filterOrg} setFilterOrg={setFilterOrg}
            filterUser={filterUser} setFilterUser={setFilterUser}
            showInactive={showInactive} setShowInactive={setShowInactive}
            createNewProject={createNewProject}
            openProject={openProject}
            fetchLog={fetchLog}
            deleteProject={triggerDeleteProject}
            restoreProject={restoreProject}
            toggleLock={(p) => updateProjectField(p, 'isLocked', !p.isLocked, `Project lock state changed to ${!p.isLocked}`)}
            takeProject={async (p) => {
              if (!p.id) return;
              const evaluatorName = profile?.name || 'Scape Engineer';
              try {
                await updateDoc(doc(db, 'projects', p.id), { 
                  takenBy: user.uid, 
                  takenByName: evaluatorName 
                });
                await logChange(p.id, `Project assigned to ${evaluatorName}`);
                fetchProjects(profile?.isAdmin);
              } catch (e) {
                console.error("Failed to assign case:", e);
              }
            }}
            updateStatus={(p, status) => updateProjectField(p, 'status', status, `Project status changed to ${status}`)}
            toggleInactive={(p) => updateProjectField(p, 'isInactive', !p.isInactive, `Project marked as ${!p.isInactive ? 'inactive' : 'active'}`)}
            isGeneratingDemo={isGeneratingDemo}
            isCleaningDemo={isCleaningDemo}
            generateDemoProjects={generateDemoProjects}
            cleanDemoProjects={cleanDemoProjects}
            acceptProject={acceptProject}
            acceptAllPendingProjects={acceptAllPendingProjects}
            importProjectsFromJson={importProjectsFromJson}
            fetchProjectImages={fetchProjectImages}
            setGlobalSuccess={setGlobalSuccess}
          />
        )}

        {view === 'questionnaire' && currentProject && (
          <QuestionnaireView 
            currentProject={currentProject} setCurrentProject={setCurrentProject}
            profile={profile} setView={(v) => setView(v as any)}
            currentStep={currentStep} setCurrentStep={setCurrentStep}
            activePartIndex={activePartIndex} setActivePartIndex={setActivePartIndex}
            isReviewing={isReviewing} setIsReviewing={setIsReviewing}
            activeCustomSection={activeCustomSection} setActiveCustomSection={setActiveCustomSection}
            reviewTab={reviewTab} setReviewTab={setReviewTab}
            isGeneratingAdvice={isGeneratingAdvice}
            isGeneratingDraft={isGeneratingDraft}
            isAssistantThinking={isAssistantThinking}
            isSubmitting={isSubmitting}
            saveProject={saveProject}
            toggleLock={(p) => updateProjectField(p, 'isLocked', !p.isLocked, `Project lock state changed to ${!p.isLocked}`)}
            toggleVerdictVisibility={(p) => updateProjectField(p, 'isVerdictVisible', !p.isVerdictVisible, `Verdict visibility changed to ${!p.isVerdictVisible}`)}
            setGlobalSuccess={setGlobalSuccess}
            updateDoc={updateDoc} doc={doc} db={db} logChange={logChange} fetchProjects={fetchProjects}
            generateExternalAdvice={generateExternalAdvice}
            generateEvaluatorDraft={generateEvaluatorDraft}
            sendMessageToAssistant={sendMessageToAssistant}
            user={user}
            logout={handleLogout}
            switchMode={switchMode}
            isAllowedEvaluator={isDynamicAllowedEvaluator}
            isScapeEmployee={isScapeEmployee}
            saveProfile={saveProfile}
            updateProjectField={(p, field, value, comment) => updateProjectField(p, field, value, comment)}
            handleAppError={handleAppError}
            fetchProjectImages={fetchProjectImages}
            onOpenToS={() => setShowToSModal(true)}
          />
        )}
      </main>

      {/* Disse modaler er altid i DOM'en, men de har en intern 'show' variabel, 
          der afgør om de reelt kan ses på skærmen. */}
      <ConfirmationModal 
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        requireTextConfirm={confirmModal.requireTextConfirm}
      />

      <ChangelogModal 
        show={showLog}
        onClose={() => setShowLog(false)}
        changelog={changelog}
      />

      <OnboardingModal
        show={!!(user && profile && !profile.tosAcceptedAt)}
        user={user}
        profile={profile}
        readOnly={false}
        onAccept={handleAcceptOnboarding}
      />

      <OnboardingModal
        show={showToSModal}
        user={user}
        profile={profile}
        readOnly={true}
        onClose={() => setShowToSModal(false)}
      />
    </div>
  );
}

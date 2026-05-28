/**
 * App.tsx
 * Dette er selve "Hjertet" af vores React applikation. 
 * I moderne React bygger man brugerfladen ved hjælp af "Functional Components" (funktioner, der returnerer HTML).
 * Denne fil fungerer primært som en "Router", der ser på variablen `view` og bestemmer, 
 * hvilket skærmbillede (View) der skal vises.
 */
import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase';

import { useAuth, isScapeEmployee, getEffectiveAdminStatus } from './hooks/useAuth';
import { isAllowedEvaluator } from './config/evaluators';
import { useProjects } from './hooks/useProjects';

import { Header } from './components/Header';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ChangelogModal } from './components/ChangelogModal';

import { AuthView } from './views/AuthView';
import { ProfileSetupView } from './views/ProfileSetupView';
import { DashboardView } from './views/DashboardView';
import { QuestionnaireView } from './views/QuestionnaireView';

import { ProjectState, OperationType } from './types';

import externalAdvicePromptRaw from './docs/externalAdvicePrompt.md?raw';
import evaluatorDraftPromptRaw from './docs/evaluatorDraftPrompt.md?raw';
import autoFillPromptRaw from './docs/autoFillPrompt.md?raw';

// Initialiserer Gemini AI (Google's kunstige intelligens)
// import.meta.env er den måde, Vite-bygge-værktøjet læser ".env" filer på.
const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// export default betyder, at når andre filer importerer denne fil, 
// er 'App' den primære ting, de får.
export default function App() {
  // useState hooks til at gemme globale fejl- eller succesbeskeder.
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

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
    fetchProjectImages
  } = useProjects(user, profile, sortBy, handleAppError, setGlobalSuccess, getEffectiveEmail);

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
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Questionnaire state - holder styr på, hvor langt brugeren er i formularen
  const [currentStep, setCurrentStep] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opretter et helt nyt "tomt" projekt i hukommelsen. 
  // Bemærk: Det gemmes ikke i databasen endnu.
  const createNewProject = () => {
    setCurrentProject({
      id: null,
      projectName: "New Bin-Picking Evaluation",
      generalResponses: {},
      parts: [{ responses: {}, images: [] }],
      report: null,
      status: 'draft',
      userId: user!.uid,
      ownerEmail: getEffectiveEmail() || undefined,
      ownerName: profile?.name || user?.displayName || undefined,
      ownerCompany: profile?.company || undefined,
      ownerPhone: profile?.phone || undefined,
    });
    setView('questionnaire');
    setCurrentStep(0);
    setIsReviewing(false);
    setActivePartIndex(0);
  };

  const openProject = async (p: ProjectState) => {
    setCurrentProject(p);
    setView('questionnaire');
    setIsReviewing(true); // Åbner altid projektet på "Final Verdict" siden
    
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
   * Hjælpefunktion: Fjerner de gigantiske Base64-billeder fra JSON-strengen
   * og pakker dem i stedet som rigtige 'inlineData' filer, så Gemini kan "se" dem.
   */
  const prepareAIRequest = (project: ProjectState, basePrompt: string) => {
    // Klon projektet så vi ikke ødelægger det originale state
    const cleanProject = JSON.parse(JSON.stringify(project));
    const imageParts: any[] = [];

    cleanProject.parts.forEach((part: any) => {
      // Ekstraher billeder
      if (part.images && Array.isArray(part.images)) {
        part.images.forEach((imgBase64: string) => {
          if (imgBase64.startsWith('data:')) {
            const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
            const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
            imageParts.push({ inlineData: { data, mimeType } });
          }
        });
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
    // 1. Sikkerheds-tjek:
    // - Har vi adgang til Firebase Genkit AI SDK? (!ai)
    // - Er der et aktivt projekt? (!currentProject)
    // - Er brugeren en Evaluator/Admin? (profile?.isAdmin) -> Hvis ja, stop! De bruger den anden funktion.
    if (!ai || !currentProject || profile?.isAdmin) return;
    
    // Viser "Analyzing Data..." spinner i UI'et
    setIsGeneratingReport(true);
    
    try {
      // Opret system prompten til LLM'en baseret på markdown filen i src/docs:
      const basePrompt = externalAdvicePromptRaw.trim();
      
      // Brug vores nye hjælpefunktion til at pakke dataen korrekt (JSON + rigtige billedfiler)
      const contents = prepareAIRequest(currentProject, basePrompt);
      
      // 3. Kald Gemini API'et
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
      });
      const text = response.text; // Det rene markdown svar fra AI'en
      
      // 4. Opdater det lokale state på frontend'en med det samme:
      // Vi gemmer rådgivningen i feltet 'report'. (Tidligere brugt til verdicts).
      setCurrentProject({...currentProject, report: text});
      
      // 5. Gem til Firestore databasen:
      // Hvis projektet eksisterer (har et ID), gemmer vi det i databasen,
      // således at brugeren kan lukke appen og stadig se AI-rådet næste gang.
      if (currentProject.id) {
        await updateProjectField(currentProject, 'report', text, "AI generated data capture advice");
      }
    } catch (e) {
      console.error(e);
      handleAppError(e); // Viser evt. kvote-fejl (Quota exceeded) til brugeren i en toast.
    } finally {
      setIsGeneratingReport(false); // Skjul spinner uanset om det lykkedes eller fejlede
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
    // 1. Sikkerheds-tjek: Forhindrer almindelige brugere i at generere en evaluator konklusion.
    if (!ai || !currentProject || !profile?.isAdmin) return;
    
    // Viser "Drafting Conclusion..." spinner i UI'et
    setIsGeneratingReport(true);
    
    try {
      // Opret system prompten til LLM'en baseret på markdown filen i src/docs:
      const basePrompt = evaluatorDraftPromptRaw.trim();
      
      // Gør data klar (JSON + Billeder)
      const contents = prepareAIRequest(currentProject, basePrompt);
      
      // 3. Kald Gemini API'et
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
      });
      const text = response.text;
      
      // 4. Opdater det lokale state:
      // Vi gemmer draftet i et NYT felt kaldet 'evaluatorDraft'. 
      // Dette overskriver IKKE den almindelige brugers 'report', og det bliver
      // IKKE vist til den almindelige bruger.
      setCurrentProject({...currentProject, evaluatorDraft: text});
      
      // 5. Gem til Firestore databasen:
      // Gemmer udkastet til skyen under feltet 'evaluatorDraft'.
      // Evaluatoren kan nu kopiere denne tekst over i deres 'Final Verdict' tekstboks.
      if (currentProject.id) {
        await updateProjectField(currentProject, 'evaluatorDraft', text, "AI generated evaluator draft");
      }
    } catch (e) {
      console.error(e);
      handleAppError(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  /**
   * ==========================================
   * AI AUTO-FILL ASSISTANT (CHAT)
   * ==========================================
   */
  const sendMessageToAssistant = async (userMessage: string) => {
    if (!ai || !currentProject) return;

    // 1. Add user message to history
    const history = currentProject.chatHistory ? [...currentProject.chatHistory] : [];
    const newHistory = [...history, { role: 'user' as const, text: userMessage }];
    
    // Update local UI immediately so it feels snappy
    setCurrentProject({ ...currentProject, chatHistory: newHistory });
    setIsGeneratingReport(true);

    try {
      const cleanProject = JSON.parse(JSON.stringify(currentProject));
      
      // Strip images to save tokens, exactly like prepareAIRequest does
      cleanProject.parts.forEach((part: any) => {
        if (part.images) part.images = [`[${part.images.length} images]`];
        if (part.cadFile) part.cadFile.dataUrl = "[CAD removed]";
      });

      // Construct history for Gemini
      const contents = newHistory.map((msg, i) => {
        let text = msg.text;
        // Inject the latest system prompt and project state into the final user message
        if (i === newHistory.length - 1 && msg.role === 'user') {
           text = `${autoFillPromptRaw.trim()}\n\nCURRENT PROJECT STATE:\n${JSON.stringify(cleanProject, null, 2)}\n\nUSER MESSAGE:\n${text}`;
        }
        return { role: msg.role, parts: [{ text }] };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
      });

      const aiText = response.text || "";

      // Append AI response
      const finalHistory = [...newHistory, { role: 'model' as const, text: aiText }];
      
      // Update local state and Firestore
      const updatedProject = { ...currentProject, chatHistory: finalHistory };
      setCurrentProject(updatedProject);
      if (updatedProject.id) {
        await updateProjectField(updatedProject, 'chatHistory', finalHistory, "AI Assistant chat updated");
      }

    } catch (e) {
      console.error(e);
      handleAppError(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  /**
   * RENDERING: 
   * Herunder returnerer komponenten sit HTML/JSX.
   * I JSX bruger vi tuborgklammer {} til at skrive almindelig JavaScript indeni HTML'en.
   */

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
        isAllowedEvaluator={isAllowedEvaluator}
        userEmail={user.email}
      />
    );
  }

  // Ellers viser vi hoved-applikationen (Header + enten Dashboard eller Questionnaire)
  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col font-sans text-slate-900">
      {/* Headeren modtager data via 'props' (parametrene i komponent-kaldet) */}
      <div className={view === 'questionnaire' ? 'hidden md:block' : 'block'}>
        <Header 
          user={user} profile={profile}
          globalError={globalError} setGlobalError={setGlobalError}
          globalSuccess={globalSuccess} setGlobalSuccess={setGlobalSuccess}
          setView={setView} logout={logout} switchMode={switchMode}
          isAllowedEvaluator={isAllowedEvaluator} isScapeEmployee={isScapeEmployee}
          saveProfile={saveProfile}
        />
      </div>

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
            takeProject={(p) => updateProjectField(p, 'takenBy', user.uid, `Project assigned to ${profile?.name}`)}
            updateStatus={(p, status) => updateProjectField(p, 'status', status, `Project status changed to ${status}`)}
            toggleSpecified={(p) => updateProjectField(p, 'isFullySpecified', !p.isFullySpecified, `Project fully specified status changed to ${!p.isFullySpecified}`)}
            toggleInactive={(p) => updateProjectField(p, 'isInactive', !p.isInactive, `Project marked as ${!p.isInactive ? 'inactive' : 'active'}`)}
          />
        )}

        {view === 'questionnaire' && currentProject && (
          <QuestionnaireView 
            currentProject={currentProject} setCurrentProject={setCurrentProject}
            profile={profile} setView={setView}
            currentStep={currentStep} setCurrentStep={setCurrentStep}
            activePartIndex={activePartIndex} setActivePartIndex={setActivePartIndex}
            isReviewing={isReviewing} setIsReviewing={setIsReviewing}
            isGeneratingReport={isGeneratingReport} isSubmitting={isSubmitting}
            saveProject={saveProject}
            toggleLock={(p) => updateProjectField(p, 'isLocked', !p.isLocked, `Project lock state changed to ${!p.isLocked}`)}
            toggleVerdictVisibility={(p) => updateProjectField(p, 'isVerdictVisible', !p.isVerdictVisible, `Verdict visibility changed to ${!p.isVerdictVisible}`)}
            setGlobalSuccess={setGlobalSuccess}
            updateDoc={updateDoc} doc={doc} db={db} logChange={logChange} fetchProjects={fetchProjects}
            generateExternalAdvice={generateExternalAdvice}
            generateEvaluatorDraft={generateEvaluatorDraft}
            sendMessageToAssistant={sendMessageToAssistant}
            user={user}
            logout={logout}
            switchMode={switchMode}
            isAllowedEvaluator={isAllowedEvaluator}
            isScapeEmployee={isScapeEmployee}
            saveProfile={saveProfile}
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
      />

      <ChangelogModal 
        show={showLog}
        onClose={() => setShowLog(false)}
        changelog={changelog}
      />
    </div>
  );
}

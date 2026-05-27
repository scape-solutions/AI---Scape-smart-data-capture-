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
    deleteProject,
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
          await deleteProject(p);
          setConfirmModal(prev => ({ ...prev, show: false })); // Luk modalen
        } catch (e) {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  // Sender data til Gemini AI for at generere en rapport
  const generateReport = async () => {
    // Hvis vi mangler en AI-nøgle, et projekt, eller hvis brugeren er Admin, gør vi intet.
    if (!ai || !currentProject || profile?.isAdmin || currentProject.report) return;
    setIsGeneratingReport(true);
    try {
      const prompt = `Analyze this bin-picking project specification and determine feasibility, risks, and necessary Scape Solutions hardware. Act as an expert Scape Applications Engineer. Be professional, analytical, and structured.\n\nData:\n${JSON.stringify(currentProject, null, 2)}`;
      
      // Kalder API'et over netværket
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = response.text;
      setCurrentProject({...currentProject, report: text});
      
      if (currentProject.id) {
        // Opdaterer databasen i baggrunden, så rapporten er gemt til næste gang
        await updateProjectField(currentProject, 'report', text, "AI generated initial feasibility report");
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
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Headeren modtager data via 'props' (parametrene i komponent-kaldet) */}
      <Header 
        user={user} profile={profile}
        globalError={globalError} setGlobalError={setGlobalError}
        globalSuccess={globalSuccess} setGlobalSuccess={setGlobalSuccess}
        setView={setView} logout={logout} switchMode={switchMode}
        isAllowedEvaluator={isAllowedEvaluator} isScapeEmployee={isScapeEmployee}
        saveProfile={saveProfile}
      />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* && bruges i React som en 'if'. Hvis det til venstre er sandt, vis det til højre. */}
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
            generateReport={generateReport}
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

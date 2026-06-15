import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings2, 
  Sparkles, 
  PlusCircle, 
  ShieldCheck, 
  Camera, 
  Loader2, 
  Zap, 
  Box, 
  Info, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  UploadCloud,
  Menu,
  ChevronDown,
  Download,
  Trash2,
  Bot
} from 'lucide-react';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';
import { ProjectState, UserProfile } from '../types';
import imageCompression from 'browser-image-compression';
import { Header } from '../components/Header';
import { ConfirmationModal } from '../components/ConfirmationModal';
import ReactMarkdown from 'react-markdown';
import { AIAssistantTab, isProposalAlreadyApplied } from '../components/AIAssistantTab';

const cleanMarkdownWrapper = (text: string): string => {
  let cleaned = text.trim();
  const fullMatch = cleaned.match(/^```(?:markdown)?\s*([\s\S]*?)\s*```$/i);
  if (fullMatch) {
    return fullMatch[1].trim();
  }
  const blockMatch = cleaned.match(/```(?:markdown)?\s*([\s\S]*?)\s*```/i);
  if (blockMatch) {
    const blockContent = blockMatch[1].trim();
    if (blockContent.length > cleaned.length * 0.7) {
      return blockContent;
    }
  }
  return cleaned;
};

interface QuestionnaireViewProps {
  currentProject: ProjectState;
  setCurrentProject: (p: ProjectState) => void;
  profile: UserProfile | null;
  setView: (view: string) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
  isReviewing: boolean;
  setIsReviewing: (r: boolean) => void;
  /** true while generateExternalAdvice() is running */
  isGeneratingAdvice: boolean;
  /** true while generateEvaluatorDraft() is running */
  isGeneratingDraft: boolean;
  /** true while sendMessageToAssistant() is waiting for the AI reply */
  isAssistantThinking: boolean;
  isSubmitting: boolean;
  saveProject: (status?: ProjectState['status'], projectToSave?: ProjectState) => Promise<ProjectState | null>;
  toggleLock: (p: ProjectState) => void;
  toggleVerdictVisibility: (p: ProjectState) => void;
  setGlobalSuccess: (msg: string | null) => void;
  updateDoc: any;
  doc: any;
  db: any;
  logChange: any;
  fetchProjects: any;
  generateExternalAdvice: any;
  generateEvaluatorDraft: any;
  user: any;
  logout: () => void;
  switchMode: (role: 'evaluator' | 'user' | 'superuser', onStatusChanged: (isAdmin: boolean) => void) => void;
  isAllowedEvaluator: (email: string | null | undefined) => boolean;
  isScapeEmployee: (email: string | null | undefined, uid?: string | null) => boolean;
  saveProfile: (data: any) => Promise<void>;
  sendMessageToAssistant: (msg: string) => Promise<void>;
  reviewTab: 'advice' | 'evaluation';
  setReviewTab: (tab: 'advice' | 'evaluation') => void;
  updateProjectField: (p: ProjectState, field: string, value: any, logMessage: string) => Promise<void>;
  handleAppError: (e: any, op?: any, path?: string) => void;
}

export function QuestionnaireView({
  currentProject,
  setCurrentProject,
  profile,
  setView,
  currentStep,
  setCurrentStep,
  activePartIndex,
  setActivePartIndex,
  isReviewing,
  setIsReviewing,
  isGeneratingAdvice,
  isGeneratingDraft,
  isAssistantThinking,
  isSubmitting,
  saveProject,
  toggleLock,
  toggleVerdictVisibility,
  setGlobalSuccess,
  updateDoc,
  doc,
  db,
  logChange,
  fetchProjects,
  generateExternalAdvice,
  generateEvaluatorDraft,
  user,
  logout,
  switchMode,
  isAllowedEvaluator,
  isScapeEmployee,
  saveProfile,
  sendMessageToAssistant,
  reviewTab,
  setReviewTab,
  updateProjectField,
  handleAppError
}: QuestionnaireViewProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(true);
  const [isDraftExpanded, setIsDraftExpanded] = useState(true);
  const [draftViewMode, setDraftViewMode] = useState<'markdown' | 'raw'>('markdown');
  const [isVerdictExpanded, setIsVerdictExpanded] = useState(true);
  const [verdictViewMode, setVerdictViewMode] = useState<'edit' | 'markdown' | 'raw'>('edit');
  /** ID of the field whose observation popover is currently open, or null */
  const [openObservationId, setOpenObservationId] = useState<string | null>(null);

  // Helper to extract JSON from model message
  const extractJSONFromText = (text: string) => {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Compute if the most recent AI proposal in chat history is still unapplied.
  // We ONLY look at the last AI message with a JSON proposal — older proposals are
  // historical (superseded by newer ones or already applied) and must not count as pending.
  const hasUnappliedProposals = React.useMemo(() => {
    if (!currentProject.chatHistory || currentProject.chatHistory.length === 0) return false;
    
    // Find the LAST model message that contains a JSON proposal
    let lastProposal: any = null;
    for (let i = currentProject.chatHistory.length - 1; i >= 0; i--) {
      const msg = currentProject.chatHistory[i];
      if (msg.role === 'model') {
        const proposal = extractJSONFromText(msg.text);
        if (proposal) {
          lastProposal = proposal;
          break;
        }
      }
    }
    
    if (!lastProposal) return false;
    return !isProposalAlreadyApplied(lastProposal, currentProject, activePartIndex);
  }, [currentProject, activePartIndex]);

  const [expandedParts, setExpandedParts] = useState<Record<number, boolean>>({});
  const [deletePartConfirm, setDeletePartConfirm] = useState<{
    show: boolean;
    partIndex: number;
    partName: string;
  }>({ show: false, partIndex: -1, partName: '' });

  // Helper to determine if a part's steps are expanded in the sidebar
  const isPartExpanded = (partIdx: number) => {
    if (expandedParts[partIdx] !== undefined) {
      return expandedParts[partIdx];
    }
    return activePartIndex === partIdx && !isReviewing;
  };

  const togglePartExpanded = (partIdx: number) => {
    setExpandedParts(prev => ({
      ...prev,
      [partIdx]: !isPartExpanded(partIdx)
    }));
  };

  // Read-only state (locked or submitted/approved/rejected, unless the user is an admin)
  const isReadOnly = (currentProject.isLocked || currentProject.status === 'submitted' || currentProject.status === 'approved' || currentProject.status === 'rejected') && !profile?.isAdmin;


  // Helper to calculate question fill progress for a step
  const getStepProgress = (step: any, responses: Record<string, any>, part?: any) => {
    let filled = 0;
    let total = 0;

    step.questions.forEach((q: any) => {
      if (q.condition && !q.condition(responses)) {
        return;
      }

      total++;
      const val = responses[q.id];
      let isFilled = false;

      if (q.type === 'media') {
        isFilled = !!(part && part.images && part.images.length > 0);
      } else if (q.type === 'boolean') {
        isFilled = typeof val === 'boolean';
      } else if (q.type === 'number') {
        isFilled = val !== undefined && val !== null && val !== '';
      } else {
        isFilled = typeof val === 'string' && val.trim() !== '';
      }

      if (q.id === '2.06' && val === true) {
        total++;
        if (part && part.cadFile) {
          filled++;
        }
      }

      if (isFilled) {
        filled++;
      }
    });

    return { filled, total };
  };

  const renderProgressBadge = (filled: number, total: number) => {
    const isComplete = filled === total && total > 0;
    
    if (isComplete) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-full select-none shrink-0 shadow-3xs animate-fadeIn">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          Done
        </span>
      );
    }
    
    return (
      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/30 px-2 py-0.5 rounded-full select-none shrink-0 transition-all duration-300">
        {filled}/{total}
      </span>
    );
  };

  // Handle ESC key to close fullscreen image viewer or AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenImage(null);
        setIsAIAssistantOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackToDashboard = async () => {
    if (!isReadOnly) {
      setIsSaving(true);
      try {
        await saveProject(currentProject.status || 'draft', currentProject);
      } catch (err) {
        console.error("Auto-save failed on view change:", err);
      } finally {
        setIsSaving(false);
      }
    }
    setView('dashboard');
  };

  const handleAddPart = async () => {
    if (isReadOnly) return;
    const newParts = [...currentProject.parts, { responses: {}, images: [] }];
    const updatedProject = { ...currentProject, parts: newParts };
    setCurrentProject(updatedProject);
    setActivePartIndex(newParts.length - 1);
    setCurrentStep(1);
    setIsReviewing(false);
    // Save updated project directly to avoid stale closures
    saveProject(currentProject.status || 'draft', updatedProject);
  };

  const handleRemovePartClick = (index: number) => {
    if (isReadOnly || currentProject.parts.length <= 1) return;
    const partName = currentProject.parts[index]?.responses?.['2.01'] || `Part #${index + 1}`;
    setDeletePartConfirm({
      show: true,
      partIndex: index,
      partName
    });
  };

  const handleConfirmDeletePart = () => {
    const { partIndex } = deletePartConfirm;
    if (partIndex === -1) return;

    const newParts = currentProject.parts.filter((_, i) => i !== partIndex);
    const newActiveIndex = Math.max(0, activePartIndex - 1);
    const updatedProject = { ...currentProject, parts: newParts };

    setCurrentProject(updatedProject);
    setActivePartIndex(newActiveIndex);
    setCurrentStep(1);
    setIsReviewing(false);
    saveProject(currentProject.status || 'draft', updatedProject);

    setDeletePartConfirm({ show: false, partIndex: -1, partName: '' });
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const compressedImages: string[] = [];
      setGlobalSuccess(`Optimizing ${files.length} image(s)...`);

      const options: any = {
        maxSizeMB: 0.1, // Max 100 KB per image
        maxWidthOrHeight: 800,
        useWebWorker: false,
        exifOrientation: true
      };

      for (let file of files) {
        try {
          if (file.name.toLowerCase().endsWith('.heic')) {
            alert(`Apple HEIC images are not supported directly. Please convert to JPG/PNG first.`);
            continue;
          }
          // Compress the image
          const compressedFile = await imageCompression(file, options);
          const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
          compressedImages.push(dataUrl);
        } catch (err) {
          console.error("Image optimization failed:", err);
          alert(`Error compressing "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (currentStep === 0) {
        const updatedGeneralImages = [
          ...(currentProject.generalImages || []),
          ...compressedImages
        ];
        setCurrentProject({ ...currentProject, generalImages: updatedGeneralImages });
      } else {
        const updatedParts = [...currentProject.parts];
        updatedParts[activePartIndex].images = [
          ...updatedParts[activePartIndex].images,
          ...compressedImages
        ];
        setCurrentProject({ ...currentProject, parts: updatedParts });
      }
      setTimeout(() => setGlobalSuccess(null), 1500);
    }
  };

  const handleUploadCadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Strict size check: max 200 KB
      if (file.size > 200 * 1024) {
        alert(`CAD file size is ${(file.size / 1024).toFixed(1)} KB, which exceeds the strict 200 KB database limit. 

To prevent errors, please simplify your CAD model, export it as a low-poly binary STL, or take screenshots of the CAD model from multiple angles and upload them in the next tab ("Visual Evidence") instead!`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const updatedParts = [...currentProject.parts];
        updatedParts[activePartIndex].cadFile = {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: dataUrl
        };
        setCurrentProject({ ...currentProject, parts: updatedParts });
        setGlobalSuccess("CAD file uploaded successfully!");
        setTimeout(() => setGlobalSuccess(null), 1500);
      };
      reader.onerror = () => {
        alert("Failed to read CAD file.");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Sidebar on the Left (Desktop-only) */}
      <aside className="hidden md:flex md:w-64 bg-white md:border-r border-slate-200 p-6 flex-col gap-4 overflow-y-auto shrink-0">
        <button 
          onClick={handleBackToDashboard}
          disabled={isSaving}
          className="flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <LayoutDashboard className="w-4 h-4" />
          )}
          <span>Dashboard</span>
        </button>

        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Structure</h2>
        
        {/* Project & Cell Info */}
        <button 
          onClick={() => { setIsReviewing(false); setCurrentStep(0); }}
          className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${currentStep === 0 && !isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-3">
            <Settings2 className="w-4 h-4" />
            <span>Project & Cell Info</span>
            {/* Observation dot for general section */}
            {(() => {
              const generalIds = new Set(GENERAL_STEPS[0].questions.map(q => q.id));
              const obs = Object.entries(currentProject.fieldObservations || {}).filter(([id]) => generalIds.has(id));
              if (!obs.length) return null;
              const hasCritical = obs.some(([, o]) => o.severity === 'critical');
              return (
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasCritical ? 'bg-red-500' : 'bg-amber-400'}`} title={hasCritical ? 'Critical observation' : 'Observation'} />
              );
            })()}
          </div>
          {(() => {
            const { filled, total } = getStepProgress(GENERAL_STEPS[0], currentProject.generalResponses);
            return renderProgressBadge(filled, total);
          })()}
        </button>

        {/* Dynamic Part Tabs */}
        {currentProject.parts.map((part, partIdx) => {
          const isExpanded = isPartExpanded(partIdx);
          const partName = part.responses['2.01'] || 'Unnamed Part';
          // Compute observation severity for this part's fields
          const partObsEntries = Object.entries(currentProject.fieldObservations || {}).filter(([id]) =>
            PART_STEPS.some(s => s.questions.some(q => q.id === id))
          );
          const partHasCritical = partObsEntries.some(([, o]) => o.severity === 'critical');
          const partHasObs = partObsEntries.length > 0;
          return (
            <div key={partIdx} className="space-y-1">
              <button 
                onClick={() => togglePartExpanded(partIdx)}
                className="w-full flex items-center justify-between p-2 mt-4 rounded-xl text-left hover:bg-slate-50 transition-all group select-none cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <ChevronDown 
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? '' : '-rotate-90'}`} 
                  />
                  <span className={`text-xs truncate transition-all ${
                    activePartIndex === partIdx && !isReviewing 
                      ? 'font-black text-slate-900' 
                      : 'font-bold text-slate-500 group-hover:text-slate-800'
                  }`}>
                    Part #{partIdx + 1}: {partName}
                  </span>
                  {/* Observation dot on part header */}
                  {partHasObs && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${partHasCritical ? 'bg-red-500' : 'bg-amber-400'}`}
                      title={partHasCritical ? 'Critical observation in this part' : 'Observation in this part'}
                    />
                  )}
                </div>
                {currentProject.parts.length > 1 && !isReadOnly && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemovePartClick(partIdx); }}
                    className="text-red-400 hover:text-red-600 font-bold text-[9px] uppercase tracking-wider animate-fadeIn shrink-0 cursor-pointer ml-2"
                  >
                    Delete
                  </button>
                )}
              </button>
              
              {isExpanded && (
                <div className="space-y-1 pl-4 border-l border-slate-100 ml-4 animate-fadeIn">
                  {PART_STEPS.map((step, stepIdx) => {
                    const { filled, total } = getStepProgress(step, part.responses, part);
                    // Observation dot for this specific step
                    const stepObsEntries = Object.entries(currentProject.fieldObservations || {}).filter(([id]) =>
                      step.questions.some(q => q.id === id)
                    );
                    const stepHasCritical = stepObsEntries.some(([, o]) => o.severity === 'critical');
                    const stepHasObs = stepObsEntries.length > 0;
                    return (
                      <button 
                        key={step.id}
                        onClick={() => { setIsReviewing(false); setActivePartIndex(partIdx); setCurrentStep(stepIdx + 1); }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${currentStep === stepIdx + 1 && activePartIndex === partIdx && !isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          {React.createElement(step.icon, { className: "w-3.5 h-3.5 shrink-0" })}
                          <span>{step.title}</span>
                          {stepHasObs && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${stepHasCritical ? 'bg-red-500' : 'bg-amber-400'}`}
                              title={stepHasCritical ? 'Critical observation' : 'Observation'}
                            />
                          )}
                        </div>
                        {renderProgressBadge(filled, total)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Part Button */}
        <button 
          disabled={isReadOnly}
          onClick={handleAddPart}
          className={`mt-4 flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl transition-all select-none ${isReadOnly ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50'}`}
        >
          <PlusCircle className="w-4 h-4" /> Add Part
        </button>

        {/* Final Verdict */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button 
            onClick={() => { setIsReviewing(true); if (!currentProject.report && !isGeneratingAdvice && !profile?.isAdmin) generateExternalAdvice(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Sparkles className="w-4 h-4" /> Review / Submit
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-4 pt-0 md:p-12 overflow-y-auto bg-slate-50">
        <div className="max-w-2xl mx-auto w-full">
          
          {/* Mobile-Only Header inside the scrollable container */}
          <div className="md:hidden -mx-4 mt-0 mb-4 select-none">
            <Header 
              user={user}
              profile={profile}
              globalError={null}
              globalSuccess={null}
              setGlobalError={() => {}}
              setGlobalSuccess={() => {}}
              setView={setView}
              logout={logout}
              switchMode={switchMode}
              isAllowedEvaluator={isAllowedEvaluator}
              isScapeEmployee={isScapeEmployee}
              saveProfile={saveProfile}
            />
          </div>

          {/* Sticky Mobile Header Bar (Only visible on screens < md) */}
          <div className="md:hidden sticky top-0 z-30 -mx-4 mb-6 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs select-none">
            <button 
              onClick={handleBackToDashboard}
              disabled={isSaving}
              className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl text-slate-500 transition-all active:scale-95 disabled:opacity-50"
              title="Dashboard"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <LayoutDashboard className="w-5 h-5" />
              )}
            </button>

            <div 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 transition-all active:scale-[0.98] shadow-xs"
            >
              <span className="text-xs font-black text-slate-700">
                {isReviewing 
                  ? 'Review / Submit' 
                  : currentStep === 0 
                    ? 'Project & Cell Info' 
                    : `Part #${activePartIndex + 1}: ${PART_STEPS[currentStep - 1].title}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl text-slate-500 transition-all active:scale-95"
              title="Sektioner"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>


          {/* Locked / Read-Only Banner */}
          {isReadOnly && (
            <div className="mb-8 p-4 bg-amber-50/80 border border-amber-100 rounded-2xl flex items-center gap-3 animate-fadeIn">
              <ShieldCheck className="w-5 h-5 text-amber-600 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-amber-950">
                  {currentProject.status === 'submitted' ? 'Project Submitted (Read-Only)' :
                   currentProject.status === 'approved' ? 'Project Approved (Read-Only)' :
                   currentProject.status === 'rejected' ? 'Project Rejected (Read-Only)' :
                   'Project Locked (Read-Only)'}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {currentProject.status === 'submitted' 
                    ? 'This project has been submitted to Scape. You can cancel submission at the bottom of the Final Review tab if you need to make changes.' 
                    : currentProject.status === 'approved'
                    ? 'This project has been evaluated and approved by Scape Solutions.'
                    : currentProject.status === 'rejected'
                    ? 'This project has been evaluated and marked as rejected / not feasible by Scape Solutions.'
                    : 'This project has been locked by Scape. You cannot edit it in this state.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab Pages rendering */}
          {isReviewing ? (
            /* Final Verdict Review Page */
            <div className="space-y-10 animate-fadeIn">
              {profile?.isAdmin && currentProject.status === 'draft' && (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-[2rem] text-rose-800 text-sm font-medium flex items-start gap-3 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-rose-600 animate-pulse mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Project is in Draft State</p>
                    <p className="text-xs text-rose-700 mt-1">This project has not been submitted by the user. Evaluators cannot perform evaluations, write verdicts, or approve/reject/specify projects until the case is officially submitted.</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end items-center flex-wrap gap-4 border-b border-slate-200 pb-4">
                {((currentProject.generalImages && currentProject.generalImages.length > 0) || currentProject.parts.some(p => p.cadFile || (p.images && p.images.length > 0))) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      let downloadIndex = 0;
                      
                      // 1. General/Environmental images
                      if (currentProject.generalImages) {
                        currentProject.generalImages.forEach((img: string, imgIdx: number) => {
                          setTimeout(() => {
                            const link = document.createElement('a');
                            link.href = img;
                            link.download = `general-image-${imgIdx + 1}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }, downloadIndex * 250);
                          downloadIndex++;
                        });
                      }
                      
                      // 2. Parts files (CAD + Images)
                      currentProject.parts.forEach((part: any, pIdx: number) => {
                        if (part.cadFile) {
                          setTimeout(() => {
                            const link = document.createElement('a');
                            link.href = part.cadFile.dataUrl;
                            link.download = part.cadFile.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }, downloadIndex * 250);
                          downloadIndex++;
                        }
                        if (part.images) {
                          part.images.forEach((img: string, imgIdx: number) => {
                            setTimeout(() => {
                              const link = document.createElement('a');
                              link.href = img;
                              link.download = `part-${pIdx + 1}-image-${imgIdx + 1}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }, downloadIndex * 250);
                            downloadIndex++;
                          });
                        }
                      });
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download All Media Files
                  </button>
                )}
              </div>
              
              {/* AI Advice Box (External) */}
              {!profile?.isAdmin && (
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <Sparkles className="absolute top-0 right-0 w-40 h-40 opacity-10" />
                  
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Zap className="text-blue-400" /> Data Capture Advice
                    </h3>
                    <button 
                      onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}
                      className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 transition-all select-none border border-white/10"
                    >
                      {isAdviceExpanded ? 'Hide Advice' : 'Show Advice'}
                    </button>
                  </div>
                  
                  {isAdviceExpanded && (
                    <div className="relative z-10 space-y-6 animate-fadeIn">
                      {isGeneratingAdvice ? (
                        <div className="flex items-center gap-3 py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Analyzing Data...</span>
                        </div>
                      ) : (
                        <div className="max-h-[55vh] overflow-y-auto pr-4 text-slate-300 leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-white custom-scrollbar">
                          <ReactMarkdown>
                            {cleanMarkdownWrapper(currentProject.report || 'No advice generated yet.')}
                          </ReactMarkdown>
                        </div>
                      )}

                      {!isReadOnly && (
                        <button 
                          onClick={generateExternalAdvice}
                          disabled={isGeneratingAdvice}
                          className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" /> Get Advice on Data
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Evaluator AI Draft Box (Admin Only) */}
              {profile?.isAdmin && (
                <div className="bg-blue-50/50 border border-blue-100 p-10 rounded-[3rem] shadow-sm relative">
                  <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                      <Zap className="text-blue-600" /> Evaluator AI Draft
                    </h3>
                    <div className="flex items-center gap-2">
                      {currentProject.evaluatorDraft && isDraftExpanded && (
                        <button 
                          onClick={() => setDraftViewMode(prev => prev === 'markdown' ? 'raw' : 'markdown')}
                          className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-blue-800 transition-all select-none border border-blue-200 cursor-pointer shadow-3xs"
                        >
                          {draftViewMode === 'markdown' ? 'Show Raw Text' : 'Show Markdown Preview'}
                        </button>
                      )}
                      <button 
                        onClick={() => setIsDraftExpanded(!isDraftExpanded)}
                        className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition-all select-none shadow-sm cursor-pointer"
                      >
                        {isDraftExpanded ? 'Hide Draft' : 'Show Draft'}
                      </button>
                    </div>
                  </div>
                  
                  {isDraftExpanded && (
                    <div className="space-y-6 animate-fadeIn">
                      {isGeneratingDraft ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Drafting Conclusion...</span>
                        </div>
                      ) : (
                        <div>
                          {draftViewMode === 'markdown' ? (
                            <div className="bg-white p-6 rounded-2xl border border-blue-100 text-slate-700 text-sm leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-slate-900 custom-markdown">
                              <ReactMarkdown>
                                {cleanMarkdownWrapper(currentProject.evaluatorDraft || '*No draft generated yet.*')}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <pre className="bg-white p-6 rounded-2xl border border-blue-100 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                              {currentProject.evaluatorDraft || 'No draft generated yet.'}
                            </pre>
                          )}
                        </div>
                      )}

                      <div className="flex gap-4 mt-6">
                        <button 
                          onClick={generateEvaluatorDraft}
                          disabled={isGeneratingDraft}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          <Sparkles className="w-4 h-4" /> Generate Evaluator Draft
                        </button>
                        {currentProject.evaluatorDraft && (
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(currentProject.evaluatorDraft || '');
                              setGlobalSuccess("Draft copied to clipboard!");
                              setTimeout(() => setGlobalSuccess(null), 3000);
                            }}
                            className="px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            Copy Draft
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Final Verdict Box (Visible to Admin, OR to User if NOT draft AND (Published or Approved/Rejected)) */}
              {(profile?.isAdmin || (currentProject.status !== 'draft' && (currentProject.isVerdictVisible || currentProject.status === 'approved' || currentProject.status === 'rejected'))) && (
                <div className="bg-white border-2 border-slate-900 p-10 rounded-[3rem] shadow-xl relative">
                  <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Project Review from Scape Solutions</h3>
                      {!profile?.isAdmin && (
                        <p className="text-sm text-slate-500 font-medium mt-1">Official conclusion from Scape Solutions.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {profile?.isAdmin ? (
                        isVerdictExpanded && (
                          <button 
                            onClick={() => setVerdictViewMode(prev => prev === 'edit' ? 'markdown' : 'edit')}
                            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all select-none border border-slate-300 cursor-pointer shadow-3xs"
                          >
                            {verdictViewMode === 'edit' ? 'Preview Markdown' : 'Edit Verdict'}
                          </button>
                        )
                      ) : (
                        currentProject.finalVerdict && isVerdictExpanded && (
                          <button 
                            onClick={() => setVerdictViewMode(prev => prev === 'raw' ? 'markdown' : 'raw')}
                            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all select-none border border-slate-300 cursor-pointer shadow-3xs"
                          >
                            {verdictViewMode === 'raw' ? 'Show Markdown Preview' : 'Show Raw Text'}
                          </button>
                        )
                      )}
                      <button 
                        onClick={() => setIsVerdictExpanded(!isVerdictExpanded)}
                        className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition-all select-none shadow-sm cursor-pointer"
                      >
                        {isVerdictExpanded ? 'Hide Review' : 'Show Review'}
                      </button>
                    </div>
                  </div>
                  
                  {isVerdictExpanded && (
                    <div className="space-y-6 animate-fadeIn">
                      {profile?.isAdmin ? (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-500 font-medium mb-2">
                            {verdictViewMode === 'edit' 
                              ? 'Edit and paste your project review below. Once published, the user can view it.' 
                              : 'Previewing markdown layout of your review:'}
                          </p>
                          
                          {verdictViewMode === 'edit' ? (
                            <textarea
                              disabled={isReadOnly}
                              className={`w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-mono min-h-[300px] ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              placeholder="Paste AI draft here and edit, or write from scratch..."
                              value={currentProject.finalVerdict || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProject({ ...currentProject, finalVerdict: val });
                              }}
                            />
                          ) : (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-700 text-sm leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-slate-900 custom-markdown min-h-[300px]">
                              <ReactMarkdown>
                                {cleanMarkdownWrapper(currentProject.finalVerdict || '*No review text entered yet.*')}
                              </ReactMarkdown>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-end gap-4 mt-6">
                            <button 
                              onClick={async () => {
                                try {
                                  await updateProjectField(currentProject, 'finalVerdict', currentProject.finalVerdict, "Evaluator updated final verdict");
                                  setGlobalSuccess("Verdict text saved.");
                                  setTimeout(() => setGlobalSuccess(null), 3000);
                                } catch (e) {
                                  handleAppError(e);
                                }
                              }}
                              disabled={isReadOnly}
                              className={`px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Save Draft
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  await updateProjectField(currentProject, 'isVerdictVisible', !currentProject.isVerdictVisible, `Verdict visibility changed to ${!currentProject.isVerdictVisible}`);
                                  if (!currentProject.isVerdictVisible) {
                                    // If turning on, make sure we save the text too
                                    await updateProjectField(currentProject, 'finalVerdict', currentProject.finalVerdict, "Verdict published");
                                  }
                                } catch (e) {
                                  handleAppError(e);
                                }
                              }}
                              disabled={isReadOnly}
                              className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ${currentProject.isVerdictVisible ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'} ${isReadOnly ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
                            >
                              {currentProject.isVerdictVisible ? 'Unpublish Verdict' : 'Publish Verdict to User'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-700 leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-slate-900 custom-markdown">
                          {verdictViewMode === 'raw' ? (
                            <pre className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                              {currentProject.finalVerdict || '*No review text entered yet.*'}
                            </pre>
                          ) : (
                            <ReactMarkdown>
                              {cleanMarkdownWrapper(currentProject.finalVerdict || '*The evaluator did not provide text for the verdict.*')}
                            </ReactMarkdown>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Parts Summary list */}
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Box className="w-4 h-4" /> Parts Summary
                </h3>
                <div className="space-y-2">
                  {currentProject.parts.map((part, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl flex flex-wrap justify-between items-center gap-3 shadow-sm border border-slate-100 hover:border-slate-200 transition-all">
                      <span className="font-bold text-slate-800 text-sm md:text-base">
                        Part #0{index + 1}: {part.responses['2.01'] || 'Unnamed Part'}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {part.cadFile && (
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-100/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 select-none">
                              <UploadCloud className="w-3.5 h-3.5 animate-pulse" /> CAD
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border px-2.5 py-1.5 rounded-lg select-none">
                            {part.images ? part.images.length : 0} Images
                          </span>
                        </div>
                        {((part.images && part.images.length > 0) || part.cadFile) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              let dlIndex = 0;
                              if (part.cadFile) {
                                const link = document.createElement('a');
                                link.href = part.cadFile.dataUrl;
                                link.download = part.cadFile.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                dlIndex++;
                              }
                              if (part.images) {
                                part.images.forEach((img: string, imgIdx: number) => {
                                  setTimeout(() => {
                                    const link = document.createElement('a');
                                    link.href = img;
                                    link.download = `part-${index + 1}-image-${imgIdx + 1}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }, dlIndex * 250);
                                  dlIndex++;
                                });
                              }
                            }}
                            className="px-3 py-1.5 hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-lg text-slate-700 hover:text-slate-900 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-bold shadow-3xs cursor-pointer select-none"
                            title="Download all files for this part"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Files
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Lock / Submit buttons */}
              <div className="flex flex-col gap-4">
                {profile?.isAdmin ? (
                  currentProject.status === 'submitted' ? (
                    currentProject.isLocked ? (
                      <button 
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            const updated = { ...currentProject, isLocked: false };
                            setCurrentProject(updated);
                            if (currentProject.id) {
                              await updateDoc(doc(db, 'projects', currentProject.id), { isLocked: false });
                              await logChange(currentProject.id, "Project unlocked for editing by evaluator");
                              fetchProjects(true);
                            }
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        className="w-full py-5 rounded-2xl font-bold text-slate-700 border-2 border-slate-300 hover:border-slate-800 hover:bg-slate-50 transition-all select-none flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Project (Allow User Changes)"}
                      </button>
                    ) : (
                      <button 
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            const evaluatorName = profile?.name || 'Scape Engineer';
                            const updated = { ...currentProject, isLocked: true, takenBy: profile?.email || 'N/A', takenByName: evaluatorName };
                            setCurrentProject(updated);
                            if (currentProject.id) {
                              await updateDoc(doc(db, 'projects', currentProject.id), { 
                                isLocked: true, 
                                takenBy: profile?.email || 'N/A', 
                                takenByName: evaluatorName 
                              });
                              await logChange(currentProject.id, `Evaluation started by ${evaluatorName}`);
                              fetchProjects(true);
                            }
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        className="w-full py-5 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Begin Evaluation (Lock Project)"}
                      </button>
                    )
                  ) : (
                    <span className="text-xs font-bold text-slate-400 self-center uppercase tracking-wider w-full text-center py-5 bg-slate-50 border border-slate-100 rounded-2xl">
                      Awaiting User Submission (Draft)
                    </span>
                  )
                ) : (
                  currentProject.status === 'submitted' ? (
                    currentProject.isLocked ? (
                      <button 
                        disabled
                        className="w-full py-5 rounded-2xl font-bold text-slate-400 bg-slate-100 shadow-none cursor-not-allowed select-none"
                      >
                        Locked / Under Evaluation
                      </button>
                    ) : (
                      <button 
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            const res = await saveProject('draft', currentProject);
                            if (res) {
                              setGlobalSuccess("Project submission cancelled. You can now edit it again.");
                              setTimeout(() => setGlobalSuccess(null), 5000);
                            }
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        className="w-full py-5 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submitted (Click to Unsubmit)"}
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={async () => {
                        setIsSaving(true);
                        try {
                          const res = await saveProject('submitted', currentProject);
                          if (res) {
                            setView('dashboard');
                            setGlobalSuccess("Project submitted to Scape Solutions successfully!");
                            setTimeout(() => setGlobalSuccess(null), 5000);
                          }
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                      className="w-full py-5 rounded-2xl font-bold text-white bg-blue-600 shadow-lg shadow-blue-200 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit to Scape Solutions"}
                    </button>
                  )
                )}

                {!currentProject.isFullySpecified && (
                  <button 
                    disabled={isReadOnly}
                    onClick={async () => {
                      if (isReadOnly) return;
                      const nextVal = !currentProject.isFullySpecified;
                      setCurrentProject({ ...currentProject, isFullySpecified: nextVal });
                      if (currentProject.id) {
                        await updateDoc(doc(db, 'projects', currentProject.id), { isFullySpecified: nextVal });
                        await logChange(currentProject.id, "Project marked as fully specified by user");
                        fetchProjects(profile?.isAdmin || false);
                      }
                    }}
                    className={`w-full py-4 border-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isReadOnly ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" /> Mark as Fully Specified
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Questionnaire Step Form Editing */
            <div className="space-y-6 animate-fadeIn">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {currentStep === 0 ? 'Project & Cell Info' : PART_STEPS[currentStep - 1].title}
              </h1>
              <div className="space-y-6">
                {(currentStep === 0 ? GENERAL_STEPS[0] : PART_STEPS[currentStep - 1]).questions.map(q => {
                  const responses = currentStep === 0 ? currentProject.generalResponses : currentProject.parts[activePartIndex].responses;
                  
                  // Condition check
                  if (q.condition && !q.condition(responses)) return null;

                  const isFieldFilled = (question: any, res: Record<string, any>, partItem?: any) => {
                    const val = res[question.id];
                    if (question.type === 'media') {
                      return !!(partItem && partItem.images && partItem.images.length > 0);
                    } else if (question.type === 'boolean') {
                      return typeof val === 'boolean';
                    } else if (question.type === 'number') {
                      return val !== undefined && val !== null && val !== '';
                    } else {
                      return typeof val === 'string' && val.trim() !== '';
                    }
                  };

                  let filled = isFieldFilled(q, responses, currentStep === 0 ? undefined : currentProject.parts[activePartIndex]);
                  if (q.id === '2.06' && responses['2.06'] === true) {
                    const part = currentProject.parts[activePartIndex];
                    if (!part.cadFile) {
                      filled = false;
                    }
                  }

                  return (
                    <div 
                      key={q.id} 
                      className={`space-y-2.5 animate-fadeIn border-l-3 pl-4 py-2.5 rounded-r-2xl transition-all duration-300 ${
                        isReadOnly 
                          ? 'border-transparent pl-0' 
                          : filled 
                            ? 'border-slate-200/50 bg-transparent' 
                            : q.important 
                              ? 'border-amber-500 bg-amber-500/5 shadow-3xs animate-fadeIn' 
                              : 'border-slate-300 bg-slate-500/2'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="block text-sm font-bold text-slate-700">[{q.id}] {q.label}</label>
                        {!isReadOnly && !filled && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none shrink-0 ${
                            q.important 
                              ? 'bg-amber-100 text-amber-800 animate-pulse' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {q.important ? 'Important' : 'Optional'}
                          </span>
                        )}
                        {/* Observation indicator from Data Capture Advice */}
                        {currentProject.fieldObservations?.[q.id] && (() => {
                          const obs = currentProject.fieldObservations![q.id];
                          const isCritical = obs.severity === 'critical';
                          return (
                            <div className="relative inline-flex">
                              <button
                                type="button"
                                onClick={() => setOpenObservationId(prev => prev === q.id ? null : q.id)}
                                title={obs.text}
                                className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none shrink-0 cursor-pointer transition-all ${
                                  isCritical
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                }`}
                              >
                                {isCritical ? '🔴 Critical' : '⚠️ Note'}
                              </button>
                              {openObservationId === q.id && (
                                <div className={`absolute z-50 bottom-full mb-2 left-0 w-72 p-3 rounded-xl shadow-xl text-xs font-medium leading-relaxed border animate-fadeIn ${
                                  isCritical
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}>
                                  <p className="font-bold mb-1">{isCritical ? '🔴 Critical Observation' : '⚠️ Observation'}</p>
                                  <p>{obs.text}</p>
                                  <p className="text-[10px] mt-2 opacity-60">From: Data Capture Advice</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {q.description && (
                        <p className="text-xs text-slate-400 mb-1">{q.description}</p>
                      )}

                      {/* Text & Number Inputs */}
                      {(q.type === 'text' || q.type === 'number') && (
                        <input 
                          type={q.type}
                          disabled={isReadOnly}
                          placeholder={q.placeholder}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl disabled:bg-slate-50 disabled:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                          value={(currentStep === 0 ? currentProject.generalResponses[q.id] : currentProject.parts[activePartIndex].responses[q.id]) ?? ''}
                          onChange={e => {
                            const val = q.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value;
                            if (currentStep === 0) {
                              setCurrentProject({
                                ...currentProject,
                                generalResponses: {
                                  ...currentProject.generalResponses,
                                  [q.id]: val
                                }
                              });
                            } else {
                              const parts = [...currentProject.parts];
                              parts[activePartIndex].responses[q.id] = val;
                              setCurrentProject({ ...currentProject, parts });
                            }
                          }}
                        />
                      )}

                      {/* Select Dropdown */}
                      {q.type === 'select' && (
                        <select 
                          disabled={isReadOnly}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl disabled:bg-slate-50 disabled:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-bold text-slate-700"
                          value={(currentStep === 0 ? currentProject.generalResponses[q.id] : currentProject.parts[activePartIndex].responses[q.id]) ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (currentStep === 0) {
                              setCurrentProject({
                                ...currentProject,
                                generalResponses: {
                                  ...currentProject.generalResponses,
                                  [q.id]: val
                                }
                              });
                            } else {
                              const parts = [...currentProject.parts];
                              parts[activePartIndex].responses[q.id] = val;
                              setCurrentProject({ ...currentProject, parts });
                            }
                          }}
                        >
                          <option value="">Select...</option>
                          {q.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Boolean Yes/No Buttons */}
                      {q.type === 'boolean' && (
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            {[true, false].map(boolVal => {
                              const activeVal = currentStep === 0 ? currentProject.generalResponses[q.id] : currentProject.parts[activePartIndex].responses[q.id];
                              const isActive = activeVal === boolVal;
                              return (
                                <button 
                                  key={boolVal.toString()}
                                  disabled={isReadOnly}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (currentStep === 0) {
                                      setCurrentProject({
                                        ...currentProject,
                                        generalResponses: {
                                          ...currentProject.generalResponses,
                                          [q.id]: boolVal
                                        }
                                      });
                                    } else {
                                      const parts = [...currentProject.parts];
                                      parts[activePartIndex].responses[q.id] = boolVal;
                                      setCurrentProject({ ...currentProject, parts });
                                    }
                                  }}
                                  className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all text-sm ${isActive ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {boolVal ? 'Yes' : 'No'}
                                </button>
                              );
                            })}
                          </div>

                          {/* Dynamic CAD file uploader block for question 2.06 */}
                          {q.id === '2.06' && currentProject.parts[activePartIndex].responses['2.06'] === true && (
                            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 animate-fadeIn">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">CAD File Upload</p>
                              
                              {!currentProject.parts[activePartIndex].cadFile ? (
                                <div className="space-y-3 w-full">
                                  <label className={`w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <UploadCloud className="w-8 h-8 text-slate-400 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-500 mt-2">Select CAD file (Max 200 KB)</span>
                                    <span className="text-[10px] text-slate-400 mt-1 font-semibold">Supports STL, STEP, STP, IGES, IGS</span>
                                    <input 
                                      type="file" 
                                      accept=".stl,.step,.stp,.igs,.iges,.dwg,.dxf" 
                                      disabled={isReadOnly}
                                      className="hidden" 
                                      onChange={handleUploadCadFile} 
                                    />
                                  </label>
                                  <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 leading-relaxed font-semibold">
                                    💡 <strong>Is your CAD file too large?</strong> If your file exceeds 200 KB, please take screenshots of the CAD model from different angles and upload them under the next tab (<strong>"Visual Evidence"</strong>) instead!
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                      <Box className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                                        {currentProject.parts[activePartIndex].cadFile.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        {(currentProject.parts[activePartIndex].cadFile.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-4">
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const cadFile = currentProject.parts[activePartIndex].cadFile;
                                        if (cadFile) {
                                          const link = document.createElement('a');
                                          link.href = cadFile.dataUrl;
                                          link.download = cadFile.name;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline cursor-pointer select-none"
                                    >
                                      Download File
                                    </button>
                                    {!isReadOnly && (
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const parts = [...currentProject.parts];
                                          parts[activePartIndex].cadFile = null;
                                          setCurrentProject({ ...currentProject, parts });
                                        }}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold hover:underline cursor-pointer select-none"
                                      >
                                        Remove File
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Textarea Input */}
                      {q.type === 'textarea' && (
                        <textarea 
                          disabled={isReadOnly}
                          placeholder={q.placeholder}
                          className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl disabled:bg-slate-50 disabled:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold resize-none"
                          value={(currentStep === 0 ? currentProject.generalResponses[q.id] : currentProject.parts[activePartIndex].responses[q.id]) ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (currentStep === 0) {
                              setCurrentProject({
                                ...currentProject,
                                generalResponses: {
                                  ...currentProject.generalResponses,
                                  [q.id]: val
                                }
                              });
                            } else {
                              const parts = [...currentProject.parts];
                              parts[activePartIndex].responses[q.id] = val;
                              setCurrentProject({ ...currentProject, parts });
                            }
                          }}
                        />
                      )}

                      {/* Media Image Photo Uploader */}
                      {q.type === 'media' && (() => {
                        const isGeneralImages = q.id === 'generalImages';
                        const imageList = isGeneralImages 
                          ? (currentProject.generalImages || []) 
                          : (currentProject.parts[activePartIndex]?.images || []);

                        return (
                          <div className="space-y-4">
                            <label className={`w-full h-32 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <Camera className="w-8 h-8 text-slate-300" />
                              <span className="text-xs font-bold text-slate-400 mt-2">
                                {isGeneralImages ? "Upload Environmental Photos" : "Upload Part Photos"}
                              </span>
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                disabled={isReadOnly} 
                                className="hidden" 
                                onChange={handleUploadImages} 
                              />
                            </label>

                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs font-bold text-slate-400">
                                Uploaded Photos ({imageList.length})
                              </span>
                              {imageList.length > 0 && !isReadOnly && (
                                <button 
                                  onClick={e => {
                                    e.preventDefault();
                                    if (isGeneralImages) {
                                      setCurrentProject({ ...currentProject, generalImages: [] });
                                    } else {
                                      const parts = [...currentProject.parts];
                                      parts[activePartIndex].images = [];
                                      setCurrentProject({ ...currentProject, parts });
                                    }
                                  }}
                                  className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:underline cursor-pointer"
                                >
                                  Clear All Images
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              {imageList.map((img, imgIdx) => (
                                <div key={imgIdx} className="group relative h-16 w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs">
                                  <img 
                                    src={img} 
                                    onClick={() => setFullscreenImage(img)}
                                    className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                    alt={isGeneralImages ? `Environmental photo ${imgIdx + 1}` : `Part upload ${imgIdx + 1}`}
                                  />
                                  {/* Overlay Controls */}
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const link = document.createElement('a');
                                        link.href = img;
                                        link.download = isGeneralImages 
                                          ? `general-image-${imgIdx + 1}.png`
                                          : `part-${activePartIndex + 1}-image-${imgIdx + 1}.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded-md transition-all active:scale-95 shadow-xs cursor-pointer"
                                      title="Download image"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    {!isReadOnly && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (isGeneralImages) {
                                            const generalImages = [...(currentProject.generalImages || [])];
                                            generalImages.splice(imgIdx, 1);
                                            setCurrentProject({ ...currentProject, generalImages });
                                          } else {
                                            const parts = [...currentProject.parts];
                                            parts[activePartIndex].images.splice(imgIdx, 1);
                                            setCurrentProject({ ...currentProject, parts });
                                          }
                                        }}
                                        className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md transition-all active:scale-95 shadow-xs cursor-pointer"
                                        title="Delete image"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Form Navigation buttons at bottom */}
              <div className="flex justify-between pt-10 pb-16 md:pb-6 border-t mt-8">
                <button 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  className="text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                >
                  Back
                </button>
                <button 
                  disabled={isSaving}
                  onClick={async () => {
                    if (isReadOnly) {
                      // If read-only, do not save database status. Simply proceed with navigation locally.
                      if (currentStep === PART_STEPS.length) {
                        if (activePartIndex < currentProject.parts.length - 1) {
                          setActivePartIndex(activePartIndex + 1);
                          setCurrentStep(1);
                        } else {
                          setIsReviewing(true);
                        }
                      } else {
                        setCurrentStep(currentStep + 1);
                      }
                      return;
                    }

                    setIsSaving(true);
                    try {
                      const res = await saveProject(currentProject.status || 'draft', currentProject);
                      if (res) {
                        if (currentStep === PART_STEPS.length) {
                          // If we are at the last fane of a part
                          if (activePartIndex < res.parts.length - 1) {
                            // Move to next part basics step
                            setActivePartIndex(activePartIndex + 1);
                            setCurrentStep(1);
                          } else {
                            // Go to final review page
                            setIsReviewing(true);
                            if (!currentProject.report && !isGeneratingAdvice && !profile?.isAdmin) generateExternalAdvice();
                          }
                        } else {
                          // Move to next step
                          setCurrentStep(currentStep + 1);
                        }
                      }
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="bg-slate-900 disabled:bg-slate-500 text-white px-10 py-5 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2 select-none"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    isReadOnly ? 'Next' : 'Continue'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer / Bottom Sheet */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-xs transition-all duration-300 animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Bottom Sheet Box */}
          <div 
            className="w-full bg-white rounded-t-[2.5rem] shadow-2xl p-6 pb-10 z-[110] animate-slideUp max-h-[85vh] flex flex-col overflow-hidden border-t border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Grab/Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900">Project Sections</h3>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">JUMP TO A SECTION</p>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full border border-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Navigation Cards Grid */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Project & Cell Info Card */}
              <button 
                onClick={() => { setIsReviewing(false); setCurrentStep(0); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${currentStep === 0 && !isReviewing ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${currentStep === 0 && !isReviewing ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Project & Cell Info</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Bin size, preferred robot...</p>
                  </div>
                </div>
                {(() => {
                  const { filled, total } = getStepProgress(GENERAL_STEPS[0], currentProject.generalResponses);
                  return renderProgressBadge(filled, total);
                })()}
              </button>

              {/* Part Section Cards */}
              <div className="mt-8 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-3">Parts Data</h3>
              </div>

              {currentProject.parts.map((part, partIdx) => (
                <div key={partIdx} className="p-4 bg-slate-50/30 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PART #0{partIdx + 1}</span>
                    {currentProject.parts.length > 1 && !isReadOnly && (
                      <button 
                        onClick={() => { handleRemovePartClick(partIdx); setIsMobileMenuOpen(false); }}
                        className="text-red-400 hover:text-red-600 font-bold text-[9px] uppercase tracking-wider transition-colors"
                      >
                        Delete Part
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {PART_STEPS.map((step, stepIdx) => {
                      const isActive = currentStep === stepIdx + 1 && activePartIndex === partIdx && !isReviewing;
                      const { filled, total } = getStepProgress(step, part.responses, part);
                      return (
                        <button 
                          key={step.id}
                          onClick={() => { setIsReviewing(false); setActivePartIndex(partIdx); setCurrentStep(stepIdx + 1); setIsMobileMenuOpen(false); }}
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${isActive ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            {React.createElement(step.icon, { className: `w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}` })}
                            <span className="text-xs font-bold">{step.title}</span>
                          </div>
                          {renderProgressBadge(filled, total)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Final Verdict Card */}
              <button 
                onClick={() => { setIsReviewing(true); setIsMobileMenuOpen(false); if (!currentProject.report && !isGeneratingAdvice && !profile?.isAdmin) generateExternalAdvice(); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${isReviewing ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isReviewing ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Review / Submit</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Submit & view AI Advisor feasibility</p>
                  </div>
                </div>
                {currentProject.status === 'submitted' && (
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                )}
              </button>
            </div>

            {/* Quick Actions at Bottom of Sheet */}
            {!isReadOnly && (
              <button 
                onClick={() => { handleAddPart(); setIsMobileMenuOpen(false); }}
                className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shrink-0 shadow-lg shadow-slate-900/10 active:scale-[0.99]"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Add Another Part</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Magnifier modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-fadeIn"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900/80 p-3 rounded-full transition-all duration-200 border border-slate-800"
            title="Luk (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
          <div 
            className="relative max-w-5xl max-h-[85vh] p-4 flex flex-col items-center justify-center animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={fullscreenImage} 
              alt="Fuld størrelse visning" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800/50 select-none"
            />
            <div className="mt-4 flex gap-4 select-none">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = fullscreenImage;
                  
                  let filename = "downloaded_image.png";
                  const isGeneral = currentProject.generalImages?.includes(fullscreenImage);
                  if (isGeneral) {
                    const idx = currentProject.generalImages.indexOf(fullscreenImage);
                    filename = `general-image-${idx + 1}.png`;
                  } else {
                    const partIdx = currentProject.parts.findIndex(p => p.images?.includes(fullscreenImage));
                    if (partIdx > -1) {
                      const imgIdx = currentProject.parts[partIdx].images.indexOf(fullscreenImage);
                      filename = `part-${partIdx + 1}-image-${imgIdx + 1}.png`;
                    }
                  }
                  
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-slate-900 text-white border border-slate-800 hover:bg-slate-800 transition-all font-bold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              
              {!isReadOnly && (
                <button 
                  onClick={() => {
                    const isGeneral = currentProject.generalImages?.includes(fullscreenImage);
                    if (isGeneral) {
                      const generalImages = [...(currentProject.generalImages || [])];
                      const idx = generalImages.indexOf(fullscreenImage);
                      if (idx > -1) {
                        generalImages.splice(idx, 1);
                        setCurrentProject({ ...currentProject, generalImages });
                      }
                    } else {
                      const parts = [...currentProject.parts];
                      const partIdx = parts.findIndex(p => p.images?.includes(fullscreenImage));
                      if (partIdx > -1) {
                        const imgIdx = parts[partIdx].images.indexOf(fullscreenImage);
                        if (imgIdx > -1) {
                          parts[partIdx].images.splice(imgIdx, 1);
                          setCurrentProject({ ...currentProject, parts });
                        }
                      }
                    }
                    setFullscreenImage(null);
                  }}
                  className="px-4 py-2 bg-red-950/80 text-red-400 border border-red-900/50 hover:bg-red-900/60 hover:text-red-200 transition-all font-bold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>

            <div className="mt-4 text-xs font-medium text-slate-400 select-none bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
              Click anywhere outside or press ESC to close
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal 
        show={deletePartConfirm.show}
        title="Delete Part"
        message={`Are you sure you want to delete project part "${deletePartConfirm.partName}"? All images and answers for this part will be permanently lost.`}
        confirmText="Delete Part"
        type="danger"
        onConfirm={handleConfirmDeletePart}
        onCancel={() => setDeletePartConfirm({ show: false, partIndex: -1, partName: '' })}
      />

      {/* Floating AI Assistant Toggle Button */}
      <button
        onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        className={`fixed bottom-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 items-center justify-center cursor-pointer ${
          isAIAssistantOpen 
            ? 'bg-slate-900 text-white hover:bg-slate-800 right-6 md:right-[408px] hidden md:flex' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 right-6 flex'
        }`}
        title={
          isAIAssistantOpen 
            ? "Close AI Assistant" 
            : hasUnappliedProposals 
              ? "Open AI Assistant (You have pending updates)" 
              : "Open AI Assistant"
        }
      >
        {isAIAssistantOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <Bot className="w-6 h-6 animate-pulse" />
            {hasUnappliedProposals && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-indigo-600"></span>
              </span>
            )}
          </>
        )}
      </button>

      {/* AI Assistant Drawer Panel */}
      {isAIAssistantOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-3xs z-30 md:hidden"
            onClick={() => setIsAIAssistantOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-35 w-full md:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slideIn select-text">
            <div className="relative flex-1 flex flex-col h-full overflow-hidden">
              <button 
                onClick={() => setIsAIAssistantOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 z-50 transition-all cursor-pointer"
                title="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
              <AIAssistantTab 
                currentProject={currentProject}
                setCurrentProject={setCurrentProject}
                sendMessageToAssistant={sendMessageToAssistant}
                isGeneratingReport={isAssistantThinking}
                updateProjectField={updateProjectField}
                saveProject={saveProject}
                activePartIndex={activePartIndex}
                isReadOnly={isReadOnly}
                hasUnappliedProposals={hasUnappliedProposals}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

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
  Bot,
  Briefcase,
  Factory,
  Clock,
  FileText
} from 'lucide-react';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';
import { ProjectState, UserProfile } from '../types';
import imageCompression from 'browser-image-compression';
import { Header } from '../components/Header';
import { ConfirmationModal } from '../components/ConfirmationModal';
import ReactMarkdown from 'react-markdown';
import { AIAssistantTab, isProposalAlreadyApplied } from '../components/AIAssistantTab';
import { generateProjectPdf } from '../utils/pdfGenerator';

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
  sendMessageToAssistant: (msg: string, images?: string[]) => Promise<void>;
  reviewTab: 'advice' | 'evaluation';
  setReviewTab: (tab: 'advice' | 'evaluation') => void;
  updateProjectField: (p: ProjectState, field: string, value: any, logMessage: string) => Promise<void>;
  handleAppError: (e: any, op?: any, path?: string) => void;
  fetchProjectImages: (p: ProjectState) => Promise<ProjectState>;
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
  handleAppError,
  fetchProjectImages
}: QuestionnaireViewProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCustomSection, setActiveCustomSection] = useState<'business-case' | 'additional-opportunities' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [showRequestUnlockModal, setShowRequestUnlockModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [localIsSplitScreen, setLocalIsSplitScreen] = useState<boolean | null>(null);

  useEffect(() => {
    setLocalIsSplitScreen(null);
  }, [currentProject?.id]);

  // ─── Visual Viewport height tracking for mobile virtual keyboard ──────────────
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      // Only apply dynamic viewport styling on mobile screens (width < 768px)
      if (window.innerWidth < 768) {
        setViewportStyle({
          height: `${vv.height}px`,
          top: `${vv.offsetTop}px`,
          position: 'fixed',
          bottom: 'auto',
        });
      } else {
        setViewportStyle({});
      }
    };

    const vv = window.visualViewport;
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    handleViewportChange();

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, [isAIAssistantOpen]);

  const [isAdviceExpanded, setIsAdviceExpanded] = useState(true);
  const [isDraftExpanded, setIsDraftExpanded] = useState(true);
  const [draftViewMode, setDraftViewMode] = useState<'markdown' | 'raw'>('markdown');
  const [isVerdictExpanded, setIsVerdictExpanded] = useState(true);
  const [verdictViewMode, setVerdictViewMode] = useState<'edit' | 'markdown' | 'raw'>('edit');
  const [mobileSplitView, setMobileSplitView] = useState<'chat' | 'form'>('chat');
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

  const [deleteImageConfirm, setDeleteImageConfirm] = useState<{
    show: boolean;
    type: 'single' | 'all';
    imageType: 'general' | 'part' | 'placement' | 'cad';
    partIndex?: number;
    imgIdx?: number;
  }>({
    show: false,
    type: 'single',
    imageType: 'general'
  });

  const [isDraggingCad, setIsDraggingCad] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingPlacement, setIsDraggingPlacement] = useState(false);

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

  const isSplitScreenMode = localIsSplitScreen !== null
    ? localIsSplitScreen
    : (currentProject?.isSplitScreen === true && !profile?.isAdmin);

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
        if (q.id === 'generalImages') {
          isFilled = !!(currentProject.generalImages && currentProject.generalImages.length > 0);
        } else {
          isFilled = !!(part && part.images && part.images.length > 0);
        }
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

  const handleDeleteImageConfirm = () => {
    const { type, imageType, partIndex, imgIdx } = deleteImageConfirm;
    const targetPartIdx = partIndex !== undefined ? partIndex : activePartIndex;

    if (type === 'all') {
      if (imageType === 'general') {
        const updated = { ...currentProject, generalImages: [] };
        setCurrentProject(updated);
        saveProject(currentProject.status || 'draft', updated);
      } else if (imageType === 'part') {
        const parts = [...currentProject.parts];
        if (parts[targetPartIdx]) {
          parts[targetPartIdx].images = [];
          const updated = { ...currentProject, parts };
          setCurrentProject(updated);
          saveProject(currentProject.status || 'draft', updated);
        }
      } else if (imageType === 'placement') {
        const parts = [...currentProject.parts];
        if (parts[targetPartIdx]) {
          parts[targetPartIdx].placementImages = [];
          const updated = { ...currentProject, parts };
          setCurrentProject(updated);
          saveProject(currentProject.status || 'draft', updated);
        }
      }
    } else {
      // type === 'single'
      if (imageType === 'general') {
        if (imgIdx !== undefined && imgIdx > -1) {
          const generalImages = [...(currentProject.generalImages || [])];
          generalImages.splice(imgIdx, 1);
          const updated = { ...currentProject, generalImages };
          setCurrentProject(updated);
          saveProject(currentProject.status || 'draft', updated);
        }
      } else if (imageType === 'part') {
        if (imgIdx !== undefined && imgIdx > -1) {
          const parts = [...currentProject.parts];
          if (parts[targetPartIdx]) {
            parts[targetPartIdx].images.splice(imgIdx, 1);
            const updated = { ...currentProject, parts };
            setCurrentProject(updated);
            saveProject(currentProject.status || 'draft', updated);
          }
        }
      } else if (imageType === 'placement') {
        if (imgIdx !== undefined && imgIdx > -1) {
          const parts = [...currentProject.parts];
          if (parts[targetPartIdx]) {
            parts[targetPartIdx].placementImages.splice(imgIdx, 1);
            const updated = { ...currentProject, parts };
            setCurrentProject(updated);
            saveProject(currentProject.status || 'draft', updated);
          }
        }
      } else if (imageType === 'cad') {
        const parts = [...currentProject.parts];
        if (parts[targetPartIdx]) {
          parts[targetPartIdx].cadFile = null;
          const updated = { ...currentProject, parts };
          setCurrentProject(updated);
          saveProject(currentProject.status || 'draft', updated);
        }
      }
    }

    setDeleteImageConfirm({ show: false, type: 'single', imageType: 'general' });
  };

  const processUploadedImages = async (files: File[]) => {
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
      const updated = { ...currentProject, generalImages: updatedGeneralImages };
      setCurrentProject(updated);
      saveProject(currentProject.status || 'draft', updated);
    } else {
      const updatedParts = [...currentProject.parts];
      updatedParts[activePartIndex].images = [
        ...updatedParts[activePartIndex].images,
        ...compressedImages
      ];
      const updated = { ...currentProject, parts: updatedParts };
      setCurrentProject(updated);
      saveProject(currentProject.status || 'draft', updated);
    }
    setTimeout(() => setGlobalSuccess(null), 1500);
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedImages(Array.from(e.target.files));
    }
  };

  const processPlacementImages = async (files: File[]) => {
    const compressedImages: string[] = [];
    setGlobalSuccess(`Optimizing ${files.length} placement image(s)...`);

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
        const compressedFile = await imageCompression(file, options);
        const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
        compressedImages.push(dataUrl);
      } catch (err) {
        console.error("Image optimization failed:", err);
        alert(`Error compressing "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const updatedParts = [...currentProject!.parts];
    updatedParts[activePartIndex].placementImages = [
      ...(updatedParts[activePartIndex].placementImages || []),
      ...compressedImages
    ];
    const updated = { ...currentProject!, parts: updatedParts };
    setCurrentProject(updated);
    saveProject(currentProject.status || 'draft', updated);
    setTimeout(() => setGlobalSuccess(null), 1500);
  };

  const handleUploadPlacementImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processPlacementImages(Array.from(e.target.files));
    }
  };

  const processCadFile = async (file: File) => {
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
      const updated = { ...currentProject, parts: updatedParts };
      setCurrentProject(updated);
      saveProject(currentProject.status || 'draft', updated);
      setGlobalSuccess("CAD file uploaded successfully!");
      setTimeout(() => setGlobalSuccess(null), 1500);
    };
    reader.onerror = () => {
      alert("Failed to read CAD file.");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processCadFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className={`flex-1 flex ${isSplitScreenMode ? 'flex-col md:flex-row' : 'flex-col md:flex-row'} h-full overflow-hidden relative`} style={viewportStyle}>

        {/* Split Screen AI Assistant (Left) */}
        {isSplitScreenMode && (
          <aside className={`${mobileSplitView === 'chat' ? 'flex' : 'hidden'} md:flex w-full md:w-[400px] xl:w-[450px] shrink-0 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 bg-white flex-col h-full relative`}>
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
              <button
                onClick={() => setMobileSplitView('form')}
                className="md:hidden bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-indigo-200"
              >
                Go to Form ➔
              </button>
              <span className="hidden md:inline bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">AI Mode</span>
            </div>
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
          </aside>
        )}

        {/* Existing Layout container wrapped for safe flexing */}
        <div className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden relative min-w-0 ${isSplitScreenMode && mobileSplitView === 'chat' ? 'hidden md:flex' : ''}`}>

          {/* Split Screen Mobile Toggle on Form Side */}
          {isSplitScreenMode && (
            <div className="md:hidden bg-white border-b border-slate-200 p-3 flex justify-between items-center shrink-0">
              <span className="text-sm font-bold text-slate-800">Form View</span>
              <button
                onClick={() => setMobileSplitView('chat')}
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-indigo-700 flex items-center gap-2"
              >
                <Bot className="w-3.5 h-3.5" />
                Back to AI Chat
              </button>
            </div>
          )}

          {/* Sidebar on the Left (Desktop-only) */}
          <aside className={`hidden md:flex ${isSplitScreenMode ? 'md:w-64' : 'md:w-64 lg:w-80'} bg-white md:border-r border-slate-200 p-6 flex-col gap-4 overflow-y-auto shrink-0 z-10`}>
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={handleBackToDashboard}
                disabled={isSaving}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <LayoutDashboard className="w-4 h-4" />
                )}
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setLocalIsSplitScreen(!isSplitScreenMode)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${isSplitScreenMode ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                <Bot className="w-4 h-4" />
                <span>Switch to {isSplitScreenMode ? 'Manual Mode' : 'AI Mode'}</span>
              </button>
            </div>

            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Structure</h2>

            {/* Project & Cell Info */}
            <button
              onClick={() => { setIsReviewing(false); setActiveCustomSection(null); setCurrentStep(0); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${currentStep === 0 && !isReviewing && !activeCustomSection ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
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
                      <span className={`text-xs truncate transition-all ${activePartIndex === partIdx && !isReviewing
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
                            onClick={() => { setIsReviewing(false); setActiveCustomSection(null); setActivePartIndex(partIdx); setCurrentStep(stepIdx + 1); }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${currentStep === stepIdx + 1 && activePartIndex === partIdx && !isReviewing && !activeCustomSection ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
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
            <div className="mt-4">
              <button
                onClick={() => { setIsReviewing(true); setActiveCustomSection(null); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${isReviewing && !activeCustomSection ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Sparkles className="w-4 h-4" /> Review / Submit
              </button>
            </div>

            {/* Extended Analysis / Custom Sections */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Extended Analysis</h2>

              <button
                onClick={() => { setIsReviewing(false); setActiveCustomSection('business-case'); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${activeCustomSection === 'business-case' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Business Case</span>
              </button>

              <button
                onClick={() => { setIsReviewing(false); setActiveCustomSection('additional-opportunities'); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${activeCustomSection === 'additional-opportunities' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Factory className="w-4 h-4" />
                <span>Additional Opportunities</span>
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
                  setGlobalError={() => { }}
                  setGlobalSuccess={() => { }}
                  setView={setView}
                  logout={logout}
                  switchMode={switchMode}
                  isAllowedEvaluator={isAllowedEvaluator}
                  isScapeEmployee={isScapeEmployee}
                  saveProfile={saveProfile}
                  projectName={currentProject?.projectName}
                />
              </div>

              {/* Sticky Mobile Header Bar (Only visible on screens < md) */}
              <div className="md:hidden sticky top-0 z-30 -mx-4 mb-6 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs select-none">
                <div className="flex items-center gap-2">
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

                  <button
                    onClick={() => {
                      setLocalIsSplitScreen(!isSplitScreenMode);
                      setMobileSplitView('chat'); // Reset mobile view to chat when switching to AI mode
                    }}
                    className={`p-1.5 rounded-xl border transition-all active:scale-95 ${isSplitScreenMode ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'hover:bg-slate-50 border-transparent hover:border-slate-100 text-slate-500'}`}
                    title={`Switch to ${isSplitScreenMode ? 'Manual Mode' : 'AI Mode'}`}
                  >
                    <Bot className="w-5 h-5" />
                  </button>
                </div>

                <div
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 transition-all active:scale-[0.98] shadow-xs"
                >
                  <span className="text-xs font-black text-slate-700">
                    {isReviewing
                      ? 'Review / Submit'
                      : activeCustomSection === 'business-case'
                        ? 'Business Case'
                        : activeCustomSection === 'additional-opportunities'
                          ? 'Additional Opportunities'
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
                  <div className="flex justify-end items-center flex-wrap gap-3 border-b border-slate-200 pb-4">
                    <button
                      onClick={async () => {
                        try {
                          const full = await fetchProjectImages(currentProject);
                          generateProjectPdf(full, profile);
                        } catch (err) {
                          console.error("PDF Export failed:", err);
                        }
                      }}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all select-none shadow-md shadow-amber-600/10 cursor-pointer flex items-center gap-1.5 active:scale-95 hover:scale-[1.01]"
                    >
                      <FileText className="w-4 h-4" /> Export PDF Report
                    </button>

                    {((currentProject.generalImages && currentProject.generalImages.length > 0) || currentProject.parts.some(p => p.cadFile || (p.images && p.images.length > 0) || (p.placementImages && p.placementImages.length > 0))) && (
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
                            if (part.placementImages) {
                              part.placementImages.forEach((img: string, imgIdx: number) => {
                                setTimeout(() => {
                                  const link = document.createElement('a');
                                  link.href = img;
                                  link.download = `part-${pIdx + 1}-placement-${imgIdx + 1}.png`;
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
                          <Zap className="text-blue-400" /> Project Information Advice
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
                          ) : currentProject.report ? (
                            <>
                              <div className="max-h-[55vh] overflow-y-auto pr-4 text-slate-300 leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-white custom-scrollbar">
                                <ReactMarkdown>
                                  {cleanMarkdownWrapper(currentProject.report)}
                                </ReactMarkdown>
                              </div>
                              {!isReadOnly && (
                                <button
                                  onClick={generateExternalAdvice}
                                  disabled={isGeneratingAdvice}
                                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                  <RotateCcw className="w-4 h-4" /> Re-generate Advice
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto my-4">
                              <Bot className="w-12 h-12 text-indigo-400 animate-pulse" />
                              <h4 className="font-bold text-white text-base">Generate Project Feasibility Advice</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Analyze your cell configuration, part physical parameters, and potential bin-picking challenges using AI.
                              </p>
                              {!isReadOnly && (
                                <button
                                  onClick={generateExternalAdvice}
                                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-950/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                                >
                                  <Sparkles className="w-4 h-4" /> Get Advice Data
                                </button>
                              )}
                            </div>
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
                                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-base md:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-mono min-h-[300px] ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                              {part.placementImages && part.placementImages.length > 0 && (
                                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border px-2.5 py-1.5 rounded-lg select-none">
                                  {part.placementImages.length} Placement
                                </span>
                              )}
                            </div>
                            {((part.images && part.images.length > 0) || (part.placementImages && part.placementImages.length > 0) || part.cadFile) && (
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
                                  if (part.placementImages) {
                                    part.placementImages.forEach((img: string, imgIdx: number) => {
                                      setTimeout(() => {
                                        const link = document.createElement('a');
                                        link.href = img;
                                        link.download = `part-${index + 1}-placement-${imgIdx + 1}.png`;
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
                    {profile?.isAdmin && currentProject.editRequestPending && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-3xs flex flex-col gap-2.5 animate-fadeIn">
                        <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-500 animate-pulse" /> Unlock Request Pending
                        </h4>
                        {currentProject.editRequestReason ? (
                          <p className="text-xs text-slate-700 bg-white/60 p-2.5 rounded-lg border border-amber-100 italic select-all">
                            "{currentProject.editRequestReason}"
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No reason provided.</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              setIsSaving(true);
                              try {
                                const updated = {
                                  ...currentProject,
                                  status: 'draft' as const,
                                  isLocked: false,
                                  editRequestPending: false,
                                  editRequestReason: ''
                                };
                                setCurrentProject(updated);
                                if (currentProject.id) {
                                  await updateDoc(doc(db, 'projects', currentProject.id), {
                                    status: 'draft',
                                    isLocked: false,
                                    editRequestPending: false,
                                    editRequestReason: ''
                                  });
                                  await logChange(currentProject.id, "Unlock request APPROVED. Status reverted to Draft.");
                                  fetchProjects(true);
                                  setGlobalSuccess("Request approved. Project unlocked & reverted to draft.");
                                  setTimeout(() => setGlobalSuccess(null), 5000);
                                }
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={isSaving}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            Approve & Unlock
                          </button>
                          <button
                            onClick={async () => {
                              setIsSaving(true);
                              try {
                                const updated = {
                                  ...currentProject,
                                  editRequestPending: false,
                                  editRequestReason: ''
                                };
                                setCurrentProject(updated);
                                if (currentProject.id) {
                                  await updateDoc(doc(db, 'projects', currentProject.id), {
                                    editRequestPending: false,
                                    editRequestReason: ''
                                  });
                                  await logChange(currentProject.id, "Unlock request REJECTED by evaluator.");
                                  fetchProjects(true);
                                  setGlobalSuccess("Unlock request rejected.");
                                  setTimeout(() => setGlobalSuccess(null), 5000);
                                }
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={isSaving}
                            className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            Reject Request
                          </button>
                        </div>
                      </div>
                    )}
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
                      // User (Customer) Actions
                      currentProject.status === 'draft' ? (
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
                          className="w-full py-5 rounded-2xl font-bold text-white bg-blue-600 shadow-lg shadow-blue-200 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit to Scape Solutions"}
                        </button>
                      ) : (
                        // Project is not draft (it's submitted, approved, or rejected)
                        currentProject.isLocked || currentProject.status === 'approved' || currentProject.status === 'rejected' ? (
                          // Project is LOCKED or has a verdict, so user cannot unsubmit directly. They must request unlock.
                          currentProject.editRequestPending ? (
                            <div className="w-full py-5 px-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-center font-bold text-sm shadow-sm select-none flex flex-col gap-1.5 animate-pulse">
                              <span className="flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                                Edit request pending approval by Scape Solutions
                              </span>
                              {currentProject.editRequestReason && (
                                <p className="text-xs text-slate-500 font-medium italic mt-1 bg-white/60 p-2 rounded-lg border border-amber-100 font-sans select-all">
                                  "{currentProject.editRequestReason}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setRequestReason('');
                                setShowRequestUnlockModal(true);
                              }}
                              disabled={isSaving}
                              className="w-full py-5 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" /> Request Edit Permission
                            </button>
                          )
                        ) : (
                          // Project is submitted but NOT locked. User can unsubmit directly!
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
                            className="w-full py-5 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submitted (Click to Unsubmit)"}
                          </button>
                        )
                      )
                    )}
                  </div>
                </div>
              ) : activeCustomSection === 'business-case' ? (
                /* Business Case Placeholder View */
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Business Case</h1>
                    <p className="text-sm text-slate-500">
                      Estimate the financial feasibility and return on investment (ROI) for this bin-picking installation.
                    </p>
                  </div>

                  {/* Info Card / Explanation */}
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-900 text-sm space-y-2">
                    <p className="font-bold flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      About the Business Case Tool
                    </p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      This section serves as a placeholder for a future interactive ROI calculator. In final production, we will help you make a precise calculation using both already entered project values (such as robot brand, cycles, and parts complexity) and additional operational questions. The goal is to help estimate project cost, payback period, and overall rate of return based on simulated Scape installation prices.
                    </p>
                  </div>

                  {/* Interactive Mock Inputs */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xs space-y-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">ROI Estimation Parameters (Simulation)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Operator Hourly Cost */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 block">Operator Hourly Labor Cost (EUR)</label>
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={currentProject.generalResponses['businessCaseSavedLabor'] ?? 50}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = { ...currentProject.generalResponses, businessCaseSavedLabor: val };
                            setCurrentProject({ ...currentProject, generalResponses: updated });
                          }}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-base md:text-sm"
                          placeholder="e.g. 50"
                        />
                      </div>

                      {/* Number of Shifts */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 block">Operating Shifts per Day</label>
                        <select
                          disabled={isReadOnly}
                          value={currentProject.generalResponses['businessCaseShifts'] ?? 2}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const updated = { ...currentProject.generalResponses, businessCaseShifts: val };
                            setCurrentProject({ ...currentProject, generalResponses: updated });
                          }}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-base md:text-sm bg-white"
                        >
                          <option value={1}>1 Shift</option>
                          <option value={2}>2 Shifts</option>
                          <option value={3}>3 Shifts</option>
                        </select>
                      </div>

                      {/* Workdays per year */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 block">Expected Work Days per Year</label>
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={currentProject.generalResponses['businessCaseWorkDays'] ?? 220}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const updated = { ...currentProject.generalResponses, businessCaseWorkDays: val };
                            setCurrentProject({ ...currentProject, generalResponses: updated });
                          }}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-base md:text-sm"
                          placeholder="e.g. 220"
                        />
                      </div>

                      {/* Installation Cost base */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 block">Est. Scape Installation Price Base (EUR)</label>
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={currentProject.generalResponses['businessCaseInstallCost'] ?? 120000}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = { ...currentProject.generalResponses, businessCaseInstallCost: val };
                            setCurrentProject({ ...currentProject, generalResponses: updated });
                          }}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-base md:text-sm"
                          placeholder="e.g. 120000"
                        />
                      </div>
                    </div>

                    {/* Calculation Output Card */}
                    {(() => {
                      const labor = currentProject.generalResponses['businessCaseSavedLabor'] ?? 50;
                      const sh = currentProject.generalResponses['businessCaseShifts'] ?? 2;
                      const days = currentProject.generalResponses['businessCaseWorkDays'] ?? 220;
                      const cost = currentProject.generalResponses['businessCaseInstallCost'] ?? 120000;

                      const annualHours = sh * 8 * days;
                      const annualSavings = annualHours * labor;
                      const paybackMonths = annualSavings > 0 ? (cost / annualSavings) * 12 : 0;

                      return (
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between gap-6 mt-6 items-center">
                          <div className="space-y-1 text-center md:text-left">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Annual Labor Savings (Est.)</span>
                            <span className="text-xl font-black text-slate-800">
                              {annualSavings.toLocaleString('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="w-px h-10 bg-slate-200 hidden md:block" />
                          <div className="space-y-1 text-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Est. Payback Period</span>
                            <span className="text-xl font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                              {paybackMonths > 0 ? `${paybackMonths.toFixed(1)} Months` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom Custom Navigation buttons */}
                  <div className="flex justify-between pt-10 pb-16 md:pb-6 border-t mt-8">
                    <button
                      onClick={() => {
                        setActiveCustomSection(null);
                        setIsReviewing(false);
                        setActivePartIndex(currentProject.parts.length - 1);
                        setCurrentStep(PART_STEPS.length);
                      }}
                      className="text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      disabled={isSaving}
                      onClick={async () => {
                        if (isReadOnly) {
                          setActiveCustomSection('additional-opportunities');
                          return;
                        }
                        setIsSaving(true);
                        try {
                          await saveProject(currentProject.status || 'draft', currentProject);
                          setActiveCustomSection('additional-opportunities');
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
                        <span>Next</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : activeCustomSection === 'additional-opportunities' ? (
                /* Additional Opportunities Placeholder View */
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Additional Opportunities</h1>
                    <p className="text-sm text-slate-500">
                      Outline other manual tasks in the production line that could potentially be automated.
                    </p>
                  </div>

                  {/* Info Card / Explanation */}
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-900 text-sm space-y-2">
                    <p className="font-bold flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Additional Production Automation
                    </p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      If you have other manual processes in your facility (such as CNC machine tending, part sorting, packaging, or quality control inspection) that you are looking to automate, you can note them down here. A Scape Solution Specialist or local system integrator will review your notes and set up a call to evaluate these opportunities using dedicated, product-specific evaluation templates.
                    </p>
                  </div>

                  {/* Input Textarea */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-3xs space-y-4">
                    <label className="text-xs font-bold text-slate-600 block">Describe other potential automation processes</label>
                    <textarea
                      disabled={isReadOnly}
                      value={currentProject.generalResponses['additionalOpportunitiesText'] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { ...currentProject.generalResponses, additionalOpportunitiesText: val };
                        setCurrentProject({ ...currentProject, generalResponses: updated });
                      }}
                      rows={6}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-base md:text-sm leading-relaxed"
                      placeholder="e.g. We also have manual CNC machine feeding for our cast iron parts after bin picking. Additionally, visual inspection of parts is done manually at the end of the belt conveyor..."
                    />
                  </div>

                  {/* Fake / Inactive Image Upload field */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-3xs space-y-4">
                    <label className="text-xs font-bold text-slate-600 block">Upload Photos of Other Processes (Future Feature)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-slate-50/50 cursor-not-allowed opacity-75">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-500">Image upload placeholder</p>
                        <p className="text-[10px] text-slate-400 mt-1">This field is currently inactive. In a future update, you will be able to attach photos or videos of other automation areas directly here.</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Custom Navigation buttons */}
                  <div className="flex justify-between pt-10 pb-16 md:pb-6 border-t mt-8">
                    <button
                      onClick={() => {
                        setActiveCustomSection('business-case');
                      }}
                      className="text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      disabled={isSaving}
                      onClick={async () => {
                        if (isReadOnly) {
                          setIsReviewing(true);
                          setActiveCustomSection(null);
                          return;
                        }
                        setIsSaving(true);
                        try {
                          await saveProject(currentProject.status || 'draft', currentProject);
                          setIsReviewing(true);
                          setActiveCustomSection(null);
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
                        <span>Next</span>
                      )}
                    </button>
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
                          className={`space-y-2.5 animate-fadeIn border-l-3 pl-4 py-2.5 rounded-r-2xl transition-all duration-300 ${isReadOnly
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
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none shrink-0 ${q.important
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-slate-100 text-slate-500'
                                }`}>
                                {q.important ? 'Important' : 'Optional'}
                              </span>
                            )}
                            {/* Observation indicator from Project Information Advice */}
                            {currentProject.fieldObservations?.[q.id] && (() => {
                              const obs = currentProject.fieldObservations![q.id];
                              const isCritical = obs.severity === 'critical';
                              return (
                                <div className="relative inline-flex">
                                  <button
                                    type="button"
                                    onClick={() => setOpenObservationId(prev => prev === q.id ? null : q.id)}
                                    title={obs.text}
                                    className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none shrink-0 cursor-pointer transition-all ${isCritical
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                      }`}
                                  >
                                    {isCritical ? '🔴 Critical' : '⚠️ Note'}
                                  </button>
                                  {openObservationId === q.id && (
                                    <div className={`absolute z-50 bottom-full mb-2 left-0 w-72 p-3 rounded-xl shadow-xl text-xs font-medium leading-relaxed border animate-fadeIn ${isCritical
                                      ? 'bg-red-50 border-red-200 text-red-800'
                                      : 'bg-amber-50 border-amber-200 text-amber-800'
                                      }`}>
                                      <p className="font-bold mb-1">{isCritical ? '🔴 Critical Observation' : '⚠️ Observation'}</p>
                                      <p>{obs.text}</p>
                                      <p className="text-[10px] mt-2 opacity-60">From: Project Information Advice</p>
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
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl disabled:bg-slate-50 disabled:text-slate-400 text-base md:text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
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
                                          const newResponses = { ...currentProject.generalResponses };
                                          if (isActive) delete newResponses[q.id];
                                          else newResponses[q.id] = boolVal;

                                          setCurrentProject({
                                            ...currentProject,
                                            generalResponses: newResponses
                                          });
                                        } else {
                                          const parts = [...currentProject.parts];
                                          const newResponses = { ...parts[activePartIndex].responses };
                                          if (isActive) delete newResponses[q.id];
                                          else newResponses[q.id] = boolVal;

                                          parts[activePartIndex].responses = newResponses;
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
                                      <label
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          if (!isReadOnly) setIsDraggingCad(true);
                                        }}
                                        onDragLeave={() => setIsDraggingCad(false)}
                                        onDrop={async (e) => {
                                          e.preventDefault();
                                          setIsDraggingCad(false);
                                          if (isReadOnly) return;
                                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                            const file = e.dataTransfer.files[0];
                                            const extension = file.name.split('.').pop()?.toLowerCase();
                                            const allowedExtensions = ['stl', 'step', 'stp', 'igs', 'iges', 'dwg', 'dxf'];
                                            if (extension && allowedExtensions.includes(extension)) {
                                              await processCadFile(file);
                                            } else {
                                              alert("Invalid file format. Please upload a CAD file (.stl, .step, .stp, .igs, .iges, .dwg, .dxf).");
                                            }
                                          }
                                        }}
                                        className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${isReadOnly
                                          ? 'opacity-50 cursor-not-allowed border-slate-300 bg-white'
                                          : isDraggingCad
                                            ? 'border-blue-500 bg-blue-50/50 cursor-pointer scale-[1.01]'
                                            : 'border-slate-300 bg-white hover:bg-slate-50 cursor-pointer'
                                          }`}
                                      >
                                        <UploadCloud className={`w-8 h-8 ${isDraggingCad ? 'text-blue-500 scale-110' : 'text-slate-400'} transition-all animate-pulse`} />
                                        <span className="text-xs font-bold text-slate-500 mt-2">
                                          {isDraggingCad ? "Drop CAD file here!" : "Select or drag CAD file (Max 200 KB)"}
                                        </span>
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
                                              setDeleteImageConfirm({
                                                show: true,
                                                type: 'single',
                                                imageType: 'cad',
                                                partIndex: activePartIndex
                                              });
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
                              className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl disabled:bg-slate-50 disabled:text-slate-400 text-base md:text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold resize-none"
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

                          {/* Custom Placement Images Uploader for 2.12 */}
                          {q.type === 'textarea' && q.id === '2.12' && (() => {
                            const placementImageList = currentProject.parts[activePartIndex]?.placementImages || [];
                            return (
                              <div className="mt-4 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                      <Camera className="w-4 h-4 text-slate-500" />
                                      Placement Requirement Photos (Optional)
                                    </h4>
                                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                      Upload images/photos of the destination fixture, nesting area, or machine.
                                    </p>
                                  </div>
                                  {placementImageList.length > 0 && !isReadOnly && (
                                    <button
                                      onClick={e => {
                                        e.preventDefault();
                                        setDeleteImageConfirm({
                                          show: true,
                                          type: 'all',
                                          imageType: 'placement',
                                          partIndex: activePartIndex
                                        });
                                      }}
                                      className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:underline cursor-pointer"
                                    >
                                      Clear Photos
                                    </button>
                                  )}
                                </div>

                                <div className="flex gap-4">
                                  {!isReadOnly && (
                                    <label
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDraggingPlacement(true);
                                      }}
                                      onDragLeave={() => setIsDraggingPlacement(false)}
                                      onDrop={async (e) => {
                                        e.preventDefault();
                                        setIsDraggingPlacement(false);
                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                          const files = Array.from(e.dataTransfer.files);
                                          const imageFiles = files.filter(f => f.type.startsWith('image/'));
                                          if (imageFiles.length > 0) {
                                            await processPlacementImages(imageFiles);
                                          } else {
                                            alert("Invalid file format. Please drop image files only.");
                                          }
                                        }
                                      }}
                                      className={`w-24 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none shrink-0 ${isDraggingPlacement
                                        ? 'border-blue-500 bg-blue-50/50 scale-[1.03]'
                                        : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                      <Camera className={`w-5 h-5 ${isDraggingPlacement ? 'text-blue-500 scale-110' : 'text-slate-400'} transition-all animate-pulse`} />
                                      <span className="text-[10px] font-bold text-slate-500 mt-1">
                                        {isDraggingPlacement ? "Drop here!" : "Upload"}
                                      </span>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        disabled={isReadOnly}
                                        className="hidden"
                                        onChange={handleUploadPlacementImages}
                                      />
                                    </label>
                                  )}

                                  <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                    {placementImageList.map((img, imgIdx) => (
                                      <div key={imgIdx} className="group relative h-20 w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                                        <img
                                          src={img}
                                          onClick={() => setFullscreenImage(img)}
                                          className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                          alt={`Placement photo ${imgIdx + 1}`}
                                        />
                                        <div
                                          onClick={() => setFullscreenImage(img)}
                                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const link = document.createElement('a');
                                              link.href = img;
                                              link.download = `part-${activePartIndex + 1}-placement-${imgIdx + 1}.png`;
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
                                                setDeleteImageConfirm({
                                                  show: true,
                                                  type: 'single',
                                                  imageType: 'placement',
                                                  partIndex: activePartIndex,
                                                  imgIdx
                                                });
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
                              </div>
                            );
                          })()}

                          {/* Media Image Photo Uploader */}
                          {q.type === 'media' && (() => {
                            const isGeneralImages = q.id === 'generalImages';
                            const imageList = isGeneralImages
                              ? (currentProject.generalImages || [])
                              : (currentProject.parts[activePartIndex]?.images || []);

                            return (
                              <div className="space-y-4">
                                <label
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (!isReadOnly) setIsDraggingImages(true);
                                  }}
                                  onDragLeave={() => setIsDraggingImages(false)}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    setIsDraggingImages(false);
                                    if (isReadOnly) return;
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                      const files = Array.from(e.dataTransfer.files);
                                      const imageFiles = files.filter(f => f.type.startsWith('image/'));
                                      if (imageFiles.length > 0) {
                                        await processUploadedImages(imageFiles);
                                      } else {
                                        alert("Invalid file format. Please drop image files only.");
                                      }
                                    }
                                  }}
                                  className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${isReadOnly
                                    ? 'opacity-50 cursor-not-allowed border-slate-300 bg-white'
                                    : isDraggingImages
                                      ? 'border-blue-500 bg-blue-50/50 cursor-pointer scale-[1.01]'
                                      : 'border-slate-300 bg-white hover:bg-slate-50 cursor-pointer'
                                    }`}
                                >
                                  <Camera className={`w-8 h-8 ${isDraggingImages ? 'text-blue-500 scale-110' : 'text-slate-400'} transition-all animate-pulse`} />
                                  <span className="text-xs font-bold text-slate-500 mt-2">
                                    {isDraggingImages
                                      ? "Drop photos here!"
                                      : (isGeneralImages ? "Select or drag Environmental Photos" : "Select or drag Part Photos")}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Supports JPG, PNG</span>
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
                                        setDeleteImageConfirm({
                                          show: true,
                                          type: 'all',
                                          imageType: isGeneralImages ? 'general' : 'part',
                                          partIndex: isGeneralImages ? -1 : activePartIndex
                                        });
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
                                      <div
                                        onClick={() => setFullscreenImage(img)}
                                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                      >
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
                                              setDeleteImageConfirm({
                                                show: true,
                                                type: 'single',
                                                imageType: isGeneralImages ? 'general' : 'part',
                                                partIndex: isGeneralImages ? -1 : activePartIndex,
                                                imgIdx
                                              });
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
                              setActiveCustomSection('business-case');
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
                                // Go to Business Case section
                                setActiveCustomSection('business-case');
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
                onClick={() => { setIsReviewing(false); setActiveCustomSection(null); setCurrentStep(0); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${currentStep === 0 && !isReviewing && !activeCustomSection ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${currentStep === 0 && !isReviewing && !activeCustomSection ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
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
                      const isActive = currentStep === stepIdx + 1 && activePartIndex === partIdx && !isReviewing && !activeCustomSection;
                      const { filled, total } = getStepProgress(step, part.responses, part);
                      return (
                        <button
                          key={step.id}
                          onClick={() => { setIsReviewing(false); setActiveCustomSection(null); setActivePartIndex(partIdx); setCurrentStep(stepIdx + 1); setIsMobileMenuOpen(false); }}
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
              <div className="mt-8 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-3">Review & Actions</h3>
              </div>

              <button
                onClick={() => { setIsReviewing(true); setActiveCustomSection(null); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${isReviewing && !activeCustomSection ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isReviewing && !activeCustomSection ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
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

              {/* Extended Analysis Sections for Mobile */}
              <div className="mt-8 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-3">Extended Analysis</h3>
              </div>

              {/* Business Case Card */}
              <button
                onClick={() => { setIsReviewing(false); setActiveCustomSection('business-case'); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${activeCustomSection === 'business-case' ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${activeCustomSection === 'business-case' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Business Case</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">ROI & installation cost calculator placeholder</p>
                  </div>
                </div>
              </button>

              {/* Additional Opportunities Card */}
              <button
                onClick={() => { setIsReviewing(false); setActiveCustomSection('additional-opportunities'); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${activeCustomSection === 'additional-opportunities' ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${activeCustomSection === 'additional-opportunities' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Additional Opportunities</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Other potential cell automations</p>
                  </div>
                </div>
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
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-5xl max-h-[85vh] p-4 flex flex-col items-center justify-center animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={fullscreenImage}
              alt="Full size view"
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
                    } else {
                      const placementPartIdx = currentProject.parts.findIndex(p => p.placementImages?.includes(fullscreenImage));
                      if (placementPartIdx > -1) {
                        const imgIdx = currentProject.parts[placementPartIdx].placementImages.indexOf(fullscreenImage);
                        filename = `part-${placementPartIdx + 1}-placement-${imgIdx + 1}.png`;
                      }
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
                      const idx = currentProject.generalImages.indexOf(fullscreenImage);
                      setDeleteImageConfirm({
                        show: true,
                        type: 'single',
                        imageType: 'general',
                        partIndex: -1,
                        imgIdx: idx
                      });
                    } else {
                      const parts = [...currentProject.parts];
                      const partIdx = parts.findIndex(p => p.images?.includes(fullscreenImage));
                      if (partIdx > -1) {
                        const imgIdx = parts[partIdx].images.indexOf(fullscreenImage);
                        setDeleteImageConfirm({
                          show: true,
                          type: 'single',
                          imageType: 'part',
                          partIndex: partIdx,
                          imgIdx: imgIdx
                        });
                      } else {
                        const placementPartIdx = parts.findIndex(p => p.placementImages?.includes(fullscreenImage));
                        if (placementPartIdx > -1) {
                          const imgIdx = parts[placementPartIdx].placementImages.indexOf(fullscreenImage);
                          setDeleteImageConfirm({
                            show: true,
                            type: 'single',
                            imageType: 'placement',
                            partIndex: placementPartIdx,
                            imgIdx: imgIdx
                          });
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

      <ConfirmationModal
        show={deleteImageConfirm.show}
        title={
          deleteImageConfirm.imageType === 'cad'
            ? "Remove CAD File"
            : deleteImageConfirm.type === 'all'
              ? "Clear All Images"
              : "Delete Image"
        }
        message={
          deleteImageConfirm.imageType === 'cad'
            ? "Are you sure you want to remove the CAD file? This action cannot be undone."
            : deleteImageConfirm.type === 'all'
              ? "Are you sure you want to clear all images in this section? This action cannot be undone."
              : "Are you sure you want to delete this image? This action cannot be undone."
        }
        confirmText={
          deleteImageConfirm.imageType === 'cad'
            ? "Remove CAD"
            : deleteImageConfirm.type === 'all'
              ? "Clear All"
              : "Delete"
        }
        type="danger"
        requireTextConfirm="delete"
        onConfirm={handleDeleteImageConfirm}
        onCancel={() => setDeleteImageConfirm({ show: false, type: 'single', imageType: 'general' })}
      />

      {/* Floating AI Assistant Toggle Button */}
      {!isSplitScreenMode && (
        <button
          onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
          className={`fixed bottom-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 items-center justify-center cursor-pointer ${isAIAssistantOpen
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
      )}

      {/* AI Assistant Drawer Panel */}
      {(!isSplitScreenMode && isAIAssistantOpen) && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-3xs z-30 md:hidden"
            onClick={() => setIsAIAssistantOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-35 w-full md:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slideIn select-text"
            style={viewportStyle}
          >
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

      {/* Request Unlock Modal */}
      {showRequestUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-6 animate-scaleUp">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                Request Edit Permission
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                This project is currently locked by Scape Solutions. Please provide a brief reason for requesting to unlock and update it.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Reason for update
              </label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="E.g., We need to update the part dimensions, upload a new CAD file, or change robot brand..."
                className="w-full min-h-[100px] p-3 text-sm border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition-all font-medium placeholder-slate-400 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRequestUnlockModal(false)}
                className="px-4 py-2.5 hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!requestReason.trim()) {
                    alert("Please enter a reason.");
                    return;
                  }
                  setIsSaving(true);
                  try {
                    const updated = {
                      ...currentProject,
                      editRequestPending: true,
                      editRequestReason: requestReason.trim()
                    };
                    setCurrentProject(updated);
                    if (currentProject.id) {
                      console.log("Attempting updateDoc...");
                      try {
                        await updateDoc(doc(db, 'projects', currentProject.id), {
                          editRequestPending: true,
                          editRequestReason: requestReason.trim()
                        });
                        console.log("updateDoc succeeded!");
                      } catch (docErr: any) {
                        throw new Error(`updateDoc failed: ${docErr.message || String(docErr)}`);
                      }

                      console.log("Attempting logChange...");
                      try {
                        await logChange(currentProject.id, `User requested edit access. Reason: "${requestReason.trim()}"`);
                        console.log("logChange succeeded!");
                      } catch (logErr: any) {
                        throw new Error(`logChange failed: ${logErr.message || String(logErr)}`);
                      }

                      setShowRequestUnlockModal(false);
                      setGlobalSuccess("Unlock request submitted successfully!");
                      setTimeout(() => setGlobalSuccess(null), 5000);
                    }
                  } catch (err: any) {
                    console.error("Failed to submit unlock request:", err);
                    alert("Kunne ikke indsende anmodning: " + (err?.message || String(err)));
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || !requestReason.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm shadow-amber-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

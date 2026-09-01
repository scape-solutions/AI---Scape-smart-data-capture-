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
  FileText,
  Send,
  CheckSquare,
  Hash,
  HelpCircle,
  GripVertical
} from 'lucide-react';
import { downloadMarkdownFile } from '../utils/markdownExport';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';
import { ProjectState, UserProfile } from '../types';
import imageCompression from 'browser-image-compression';
import { Header } from '../components/Header';
import { ConfirmationModal } from '../components/ConfirmationModal';
import ReactMarkdown from 'react-markdown';
import { getFieldExplanation } from '../docs/fieldExplanations';
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
  activeCustomSection: 'business-case' | 'additional-opportunities' | 'scape-review' | null;
  setActiveCustomSection: (section: 'business-case' | 'additional-opportunities' | 'scape-review' | null) => void;
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
  onOpenToS?: () => void;
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
  activeCustomSection,
  setActiveCustomSection,
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
  fetchProjectImages,
  onOpenToS
}: QuestionnaireViewProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dismissedPartSyncBanner, setDismissedPartSyncBanner] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [showRequestUnlockModal, setShowRequestUnlockModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [localIsSplitScreen, setLocalIsSplitScreen] = useState<boolean | null>(null);

  const [aiPaneWidth, setAiPaneWidth] = useState<number>(() => {
    try {
      const cached = localStorage.getItem('aiPaneWidth');
      return cached ? parseInt(cached, 10) : 450;
    } catch {
      return 450;
    }
  });

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('aiPaneWidth', String(aiPaneWidth));
    } catch { /* ignore */ }
  }, [aiPaneWidth]);

  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const isMobile = window.innerWidth < 768;
      const minW = 320;
      const maxW = isMobile ? window.innerWidth - 60 : 700;
      let newWidth = e.clientX;
      if (newWidth < minW) newWidth = minW;
      if (newWidth > maxW) newWidth = maxW;
      setAiPaneWidth(newWidth);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const isMobile = window.innerWidth < 768;
      const minW = 320;
      const maxW = isMobile ? window.innerWidth - 60 : 700;
      let newWidth = touch.clientX;
      if (newWidth < minW) newWidth = minW;
      if (newWidth > maxW) newWidth = maxW;
      setAiPaneWidth(newWidth);
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [isResizing]);

  const [isResizingDrawer, setIsResizingDrawer] = useState(false);

  const startResizingDrawer = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizingDrawer(true);
  };

  useEffect(() => {
    if (!isResizingDrawer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minW = 320;
      const maxW = Math.min(850, window.innerWidth - 80);
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < minW) newWidth = minW;
      if (newWidth > maxW) newWidth = maxW;
      setAiPaneWidth(newWidth);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const minW = 320;
      const maxW = Math.min(850, window.innerWidth - 80);
      let newWidth = window.innerWidth - touch.clientX;
      if (newWidth < minW) newWidth = minW;
      if (newWidth > maxW) newWidth = maxW;
      setAiPaneWidth(newWidth);
    };

    const stopResizing = () => {
      setIsResizingDrawer(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [isResizingDrawer]);

  // Luk automatisk AI-panelet hvis AI'en foreslår 'close_chat'
  useEffect(() => {
    const history = currentProject.chatHistory ?? [];
    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === 'model') {
        const jsonMatch = lastMsg.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) {
          try {
            const proposal = JSON.parse(jsonMatch[1]);
            if (proposal.suggestedAction === 'close_chat') {
              setLocalIsSplitScreen(false); // Luk AI-panelet
            }
          } catch { /* ignore */ }
        }
      }
    }
  }, [currentProject.chatHistory]);

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

  // Auto-close floating side drawer when switching to mobile screen (< 768px) in Manual Mode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isAIAssistantOpen) {
        setIsAIAssistantOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAIAssistantOpen]);

  const [isAdviceExpanded, setIsAdviceExpanded] = useState(true);
  const [isDraftExpanded, setIsDraftExpanded] = useState(true);
  const [draftViewMode, setDraftViewMode] = useState<'markdown' | 'raw'>('markdown');
  const [isVerdictExpanded, setIsVerdictExpanded] = useState(true);
  const [verdictViewMode, setVerdictViewMode] = useState<'edit' | 'markdown' | 'raw'>('edit');
  const [mobileSplitView, setMobileSplitView] = useState<'chat' | 'form'>('chat');
  /** ID of the field whose observation popover is currently open, or null */
  const [openObservationId, setOpenObservationId] = useState<string | null>(null);
  const [isAdviceDrawerOpen, setIsAdviceDrawerOpen] = useState(false);
  const [isEvaluatorAdviceExpanded, setIsEvaluatorAdviceExpanded] = useState(false);
  const [showFieldIds, setShowFieldIds] = useState(true);
  const [openInfoModalId, setOpenInfoModalId] = useState<string | null>(null);
  const [infoModalMode, setInfoModalMode] = useState<'short' | 'long'>('short');
  const infoPopupRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (infoPopupRef.current && !infoPopupRef.current.contains(e.target as Node)) {
        setOpenInfoModalId(null);
        setOpenObservationId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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

  const navigateToSection = async (options: {
    step?: number;
    partIndex?: number;
    customSection?: 'business-case' | 'additional-opportunities' | 'scape-review' | null;
    isReviewing?: boolean;
  }) => {
    const nextStep = options.step !== undefined ? options.step : (options.customSection || options.isReviewing ? currentStep : 0);
    const nextPartIdx = options.partIndex !== undefined ? options.partIndex : activePartIndex;
    const nextCustomSection = options.customSection !== undefined ? options.customSection : null;
    const nextIsReviewing = options.isReviewing !== undefined ? options.isReviewing : false;

    setCurrentStep(nextStep);
    setActivePartIndex(nextPartIdx);
    setActiveCustomSection(nextCustomSection);
    setIsReviewing(nextIsReviewing);

    const updated = {
      ...currentProject,
      lastActiveStep: nextStep,
      lastActivePartIndex: nextPartIdx,
      lastActiveCustomSection: nextCustomSection,
      lastIsReviewing: nextIsReviewing,
      isSplitScreen: isSplitScreenMode,
    };
    setCurrentProject(updated);

    if (currentProject.id) {
      try {
        if (!isReadOnly && (currentProject.status || 'draft') === 'draft' && saveProject) {
          await saveProject(currentProject.status || 'draft', updated);
        } else {
          await updateDoc(doc(db, 'projects', currentProject.id), {
            lastActiveCustomSection: nextCustomSection,
            lastActiveStep: nextStep,
            lastActivePartIndex: nextPartIdx,
            lastIsReviewing: nextIsReviewing,
            isSplitScreen: isSplitScreenMode,
          });
        }
      } catch (err) {
        console.warn("Could not persist navigation state:", err);
      }
    }
  };

  // Synchronize current navigation & mode state on currentProject so saveProject persists it automatically
  useEffect(() => {
    if (!currentProject) return;
    if (
      currentProject.lastActiveStep !== currentStep ||
      currentProject.lastActivePartIndex !== activePartIndex ||
      currentProject.lastActiveCustomSection !== activeCustomSection ||
      currentProject.lastIsReviewing !== isReviewing ||
      currentProject.isSplitScreen !== isSplitScreenMode
    ) {
      setCurrentProject({
        ...currentProject,
        lastActiveStep: currentStep,
        lastActivePartIndex: activePartIndex,
        lastActiveCustomSection: activeCustomSection,
        lastIsReviewing: isReviewing,
        isSplitScreen: isSplitScreenMode,
      });
    }
  }, [currentStep, activePartIndex, activeCustomSection, isReviewing, isSplitScreenMode]);

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
        if (q.id === '1.04_image') {
          isFilled = !!(responses['1.04_image'] && responses['1.04_image'].length > 0);
        } else if (q.id === 'generalImages') {
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
    if (currentProject?.id) {
      try {
        await updateDoc(doc(db, 'projects', currentProject.id), {
          lastActiveCustomSection: activeCustomSection,
          lastActiveStep: currentStep,
          lastActivePartIndex: activePartIndex,
          lastIsReviewing: isReviewing,
          isSplitScreen: isSplitScreenMode,
        });
      } catch (err) {
        console.warn("Could not save navigation on dashboard return:", err);
      }
    }

    if (!isReadOnly && currentProject.status === 'draft') {
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

  const processUploadedImages = async (files: File[], targetFieldId?: string) => {
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

    if (targetFieldId === '1.04_image') {
      const currentBinImages = Array.isArray(currentProject.generalResponses['1.04_image'])
        ? currentProject.generalResponses['1.04_image']
        : [];
      const updated = {
        ...currentProject,
        generalResponses: {
          ...currentProject.generalResponses,
          '1.04_image': [...currentBinImages, ...compressedImages]
        }
      };
      setCurrentProject(updated);
      saveProject(currentProject.status || 'draft', updated);
    } else if (currentStep === 0) {
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
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 min-w-0 max-w-full" style={viewportStyle}>
      {/* Single Unified Header */}
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
        onOpenToS={onOpenToS}
        projectName={currentProject.projectName}
        projectId={currentProject.id}
        ownerName={currentProject.ownerName}
        ownerCompany={currentProject.ownerCompany}
        ownerEmail={currentProject.ownerEmail}
        ownerPhone={currentProject.ownerPhone}
        onBackToDashboard={handleBackToDashboard}
        isSplitScreenMode={isSplitScreenMode}
        onToggleSplitScreen={async () => {
          const nextMode = !isSplitScreenMode;
          setLocalIsSplitScreen(nextMode);
          setMobileSplitView('chat');
          const updated = { ...currentProject, isSplitScreen: nextMode };
          setCurrentProject(updated);
          if (currentProject.id) {
            await updateProjectField(updated, 'isSplitScreen', nextMode, `Toggled AI mode to ${nextMode}`);
          }
        }}
        onOpenAIAdviceDrawer={() => {
          setIsAdviceDrawerOpen(true);
          if (!currentProject.report && !isGeneratingAdvice && !isReadOnly) {
            generateExternalAdvice();
          }
        }}
      />

      {/* Main split-screen/sidebar layout area container */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-w-0 max-w-full">

        {/* Split Screen AI Assistant (Left) */}
        {isSplitScreenMode && (
          <>
            <aside
              style={{ width: mobileSplitView === 'chat' ? '100%' : `${aiPaneWidth}px` }}
              className={`${mobileSplitView === 'chat' ? 'flex' : 'hidden'} md:flex shrink-0 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 bg-white flex-col h-full relative`}
            >

              <AIAssistantTab
                currentProject={currentProject}
                setCurrentProject={setCurrentProject}
                sendMessageToAssistant={async (msg, images) => {
                  const normalized = msg.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
                  const closeKeywords = ['done', 'finished', 'jeg er færdig', 'jeg er ferdig', 'færdig', 'ferdig', 'afslut', 'luk'];
                  const isCloseTrigger = closeKeywords.some(phrase =>
                    normalized === phrase || normalized.startsWith(phrase + ' ') || normalized.endsWith(' ' + phrase)
                  );

                  if (isCloseTrigger) {
                    setLocalIsSplitScreen(false); // Close AI panel
                  }
                  await sendMessageToAssistant(msg, images);
                }}
                isGeneratingReport={isAssistantThinking}
                updateProjectField={updateProjectField}
                saveProject={saveProject}
                activePartIndex={activePartIndex}
                isReadOnly={isReadOnly}
                hasUnappliedProposals={hasUnappliedProposals}
              />
            </aside>
            {/* Draggable Vertical Divider Resizer Handle */}
            <div
              onMouseDown={startResizing}
              onTouchStart={startResizing}
              className="hidden md:flex flex-col items-center justify-center w-3 hover:w-4 bg-slate-200 hover:bg-indigo-500 active:bg-indigo-600 cursor-col-resize z-40 transition-all select-none shrink-0 group relative border-x border-slate-300/60"
              title="Drag to resize AI Assistant pane"
            >
              <div className="absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white border-2 border-indigo-500 shadow-lg group-hover:scale-125 text-indigo-600 transition-all">
                <GripVertical className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
          </>
        )}

        {/* Existing Layout container wrapped for safe flexing */}
        <div className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden relative min-w-0 max-w-full ${isSplitScreenMode && mobileSplitView === 'chat' ? 'hidden md:flex' : ''}`}>



          {/* Sidebar on the Left (Desktop-only) */}
          <aside className={`hidden md:flex ${isSplitScreenMode ? 'md:w-64' : 'md:w-64 lg:w-80'} bg-white md:border-r border-slate-200 p-6 flex-col gap-4 overflow-y-auto shrink-0 z-10`}>


            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Structure</h2>

            {/* Project & Cell Info */}
            <button
              onClick={() => navigateToSection({ step: 0, customSection: null, isReviewing: false })}
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
                            onClick={() => navigateToSection({ step: stepIdx + 1, partIndex: partIdx, customSection: null, isReviewing: false })}
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

            {/* Add Part Button resembling a Part Header item */}
            {!isReadOnly && (
              <button
                onClick={handleAddPart}
                className="w-full flex items-center justify-between p-2.5 mt-3 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 text-blue-700 transition-all group select-none cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="p-1 bg-blue-600 text-white rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <PlusCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold tracking-tight text-blue-900 group-hover:text-blue-950">
                    Part #{currentProject.parts.length + 1}: + Add New Part
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 shrink-0">
                  Add
                </span>
              </button>
            )}

            {/* Extended Analysis / Custom Sections */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Extended Analysis</h2>

              <button
                onClick={() => navigateToSection({ customSection: 'business-case', isReviewing: false })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${activeCustomSection === 'business-case' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Business Case</span>
              </button>

              <button
                onClick={() => navigateToSection({ customSection: 'additional-opportunities', isReviewing: false })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${activeCustomSection === 'additional-opportunities' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Factory className="w-4 h-4" />
                <span>Additional Opportunities</span>
              </button>

              {/* Submit Item (User) or Review/approve (Evaluator) */}
              <button
                onClick={() => navigateToSection({ isReviewing: true, customSection: null })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${isReviewing && !activeCustomSection ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {profile?.isAdmin ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span>Review/approve</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-blue-600" />
                    <span>Submit</span>
                  </>
                )}
              </button>

              {/* Scape Review - Placed as the VERY LAST item for User View */}
              {!profile?.isAdmin && (
                <button
                  onClick={() => navigateToSection({ customSection: 'scape-review', isReviewing: false })}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all mt-2 ${activeCustomSection === 'scape-review'
                    ? 'bg-rose-50 text-rose-800 font-black border border-rose-200 shadow-3xs'
                    : 'text-slate-700 hover:bg-rose-50/50 hover:text-rose-800'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center relative">
                      <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
                        <path d="M 22,90 L 50,15 L 62,15 L 34,90 Z" fill="currentColor" />
                        <path d="M 50,15 L 68,55 L 56,55 L 42,23 Z" fill="currentColor" />
                        <path d="M 61,62 L 70,62 L 78,82 L 69,82 Z" fill="#bf1e2e" />
                      </svg>
                    </span>
                    <span>Scape Review</span>
                  </div>
                  {(currentProject.status === 'approved' || currentProject.status === 'rejected' || currentProject.isVerdictVisible) ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Official Verdict Available" />
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded">Official</span>
                  )}
                </button>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-6 pt-0 overflow-y-auto overflow-x-hidden bg-slate-50">
            <div className="max-w-3xl w-full min-w-0 pt-3">


              {/* Sticky Section Navigation Bar (Visible on mobile OR inside Split-Screen Mode) */}
              <div className={`${isSplitScreenMode ? 'flex' : 'md:hidden flex'} flex-col sticky top-0 z-30 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 -mt-3 pt-3 pb-1 mb-6 bg-white border-b border-slate-200/90 shadow-sm select-none min-w-0 transition-all`}>
                {/* Top Row: Active Section Accent Pill & Menu Drawer Button */}
                <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 min-w-0">
                  <div
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex items-center gap-2 cursor-pointer bg-indigo-50/90 border border-indigo-200/80 rounded-2xl px-3.5 py-2 transition-all hover:bg-indigo-100/80 active:scale-[0.98] shadow-2xs min-w-0 group"
                    title="Click to open section menu"
                  >
                    <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-2xs shrink-0">
                      {isReviewing ? (
                        <Send className="w-3.5 h-3.5" />
                      ) : activeCustomSection === 'business-case' ? (
                        <Briefcase className="w-3.5 h-3.5" />
                      ) : activeCustomSection === 'additional-opportunities' ? (
                        <Factory className="w-3.5 h-3.5" />
                      ) : activeCustomSection === 'scape-review' ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : currentStep === 0 ? (
                        <Settings2 className="w-3.5 h-3.5" />
                      ) : currentStep === 1 ? (
                        <Box className="w-3.5 h-3.5" />
                      ) : currentStep === 2 ? (
                        <Zap className="w-3.5 h-3.5" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs md:text-sm font-extrabold text-indigo-950 truncate">
                        {isReviewing
                          ? (profile?.isAdmin ? 'Review / Approve' : 'Submit Evaluation')
                          : activeCustomSection === 'business-case'
                            ? 'Business Case'
                            : activeCustomSection === 'additional-opportunities'
                              ? 'Additional Opportunities'
                              : activeCustomSection === 'scape-review'
                                ? 'Scape Evaluation Review'
                                : currentStep === 0
                                  ? 'Project & Cell Info'
                                  : `Part #${activePartIndex + 1}: ${PART_STEPS[currentStep - 1].title}`}
                      </span>

                      {/* Mini Step Progress Badge */}
                      {currentStep === 0 && !activeCustomSection && !isReviewing && (() => {
                        const { filled, total } = getStepProgress(GENERAL_STEPS[0], currentProject.generalResponses);
                        return (
                          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                            {filled}/{total}
                          </span>
                        );
                      })()}

                      {currentStep > 0 && !activeCustomSection && !isReviewing && (() => {
                        const step = PART_STEPS[currentStep - 1];
                        const part = currentProject.parts[activePartIndex];
                        const { filled, total } = getStepProgress(step, part?.responses, part);
                        return (
                          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                            {filled}/{total}
                          </span>
                        );
                      })()}

                      {/* Read-only / status indicator */}
                      {isReadOnly && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          {currentProject.status === 'submitted' ? 'Submitted' : 'Locked'}
                        </span>
                      )}
                    </div>

                    <ChevronDown className="w-4 h-4 text-indigo-600 group-hover:translate-y-0.5 transition-transform shrink-0 ml-1" />
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 transition-all active:scale-95 shrink-0 shadow-2xs cursor-pointer"
                    title="Open Section Drawer"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Row: Quick Horizontal Swipeable Section Pills */}
                <div className="px-4 sm:px-6 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                  {/* Project Info Pill */}
                  <button
                    type="button"
                    onClick={() => navigateToSection({ step: 0, customSection: null, isReviewing: false })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${currentStep === 0 && !activeCustomSection && !isReviewing
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                      }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Project Info</span>
                  </button>

                  {/* Part Steps Pills */}
                  {currentProject.parts.map((_, partIdx) => {
                    return PART_STEPS.map((step, stepIdx) => {
                      const isCurrent = currentStep === stepIdx + 1 && activePartIndex === partIdx && !activeCustomSection && !isReviewing;
                      return (
                        <button
                          key={`part-${partIdx}-step-${stepIdx}`}
                          type="button"
                          onClick={() => navigateToSection({ step: stepIdx + 1, partIndex: partIdx, customSection: null, isReviewing: false })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${isCurrent
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                            }`}
                        >
                          <span className="opacity-75">P#{partIdx + 1}:</span>
                          <span>{step.title}</span>
                        </button>
                      );
                    });
                  })}

                  {/* Business Case Pill */}
                  <button
                    type="button"
                    onClick={() => navigateToSection({ customSection: 'business-case', isReviewing: false })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeCustomSection === 'business-case'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                      }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Business Case</span>
                  </button>

                  {/* Additional Opportunities Pill */}
                  <button
                    type="button"
                    onClick={() => navigateToSection({ customSection: 'additional-opportunities', isReviewing: false })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeCustomSection === 'additional-opportunities'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                      }`}
                  >
                    <Factory className="w-3.5 h-3.5" />
                    <span>Additional Opportunities</span>
                  </button>

                  {/* Submit Pill */}
                  <button
                    type="button"
                    onClick={() => navigateToSection({ isReviewing: true, customSection: null })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${isReviewing
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                      }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{profile?.isAdmin ? 'Review' : 'Submit'}</span>
                  </button>

                  {/* Scape Review Card (For Admins / Evaluators) */}
                  {profile?.isAdmin && (
                    <button
                      type="button"
                      onClick={() => navigateToSection({ customSection: 'scape-review', isReviewing: false })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeCustomSection === 'scape-review'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                        }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Scape Review</span>
                    </button>
                  )}
                </div>
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

              {/* Part Count Sync Prompt Banner (Field 1.02) */}
              {(() => {
                const targetPartCount = parseInt(String(currentProject.generalResponses?.['1.02'] || ''), 10);
                const currentPartCount = currentProject.parts?.length || 0;
                const diffPartCount = targetPartCount - currentPartCount;
                if (!isReadOnly && !isReviewing && !activeCustomSection && targetPartCount > 0 && diffPartCount > 0 && !dismissedPartSyncBanner) {
                  return (
                    <div className="mb-6 p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-blue-950">
                            You specified {targetPartCount} total part{targetPartCount !== 1 ? 's' : ''} in Project Info (Field 1.02)
                          </h4>
                          <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                            You currently have {currentPartCount} part tab{currentPartCount !== 1 ? 's' : ''}. Would you like to add {diffPartCount} more part tab{diffPartCount !== 1 ? 's' : ''}?
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => setDismissedPartSyncBanner(true)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-blue-100/50 rounded-xl transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={async () => {
                            const newParts = [...currentProject.parts];
                            for (let i = 0; i < diffPartCount; i++) {
                              newParts.push({ responses: {}, images: [] });
                            }
                            const updated = { ...currentProject, parts: newParts };
                            setCurrentProject(updated);
                            if (saveProject) await saveProject(currentProject.status || 'draft', updated);
                            setDismissedPartSyncBanner(true);
                          }}
                          className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          + Add {diffPartCount} Part{diffPartCount !== 1 ? 's' : ''}
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

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
                  {/* User Submit Tab View (Non-admin) */}
                  {!profile?.isAdmin && (
                    <div className="space-y-8 animate-fadeIn">
                      {/* Data Quality & Feasibility Advice Guidance Box */}
                      <div className="p-6 sm:p-8 bg-blue-50/80 border border-blue-200/80 rounded-3xl space-y-4 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
                            <Info className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-blue-950">Data Accuracy & Submission Guidance</h3>
                            <p className="text-xs text-blue-700 mt-0.5">Please review your project parameters before final submission.</p>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 leading-relaxed space-y-2 font-medium">
                          <p>
                            Accurate cell dimensions, physical part parameters, cycle times, and real part photos are essential for Scape Solutions engineers to conduct a reliable bin-picking feasibility study.
                          </p>
                          <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
                            <p className="text-slate-600">
                              💡 <strong>Important:</strong> Check the <span className="font-bold text-amber-800">⚡ AI Advice</span> drawer to verify that no severe data gaps or critical warnings remain.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAdviceDrawerOpen(true);
                                if (!currentProject.report && !isGeneratingAdvice && !isReadOnly) {
                                  generateExternalAdvice();
                                }
                              }}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              {currentProject.report ? 'View AI Advice' : 'Get AI Advice'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Submission Comments & Context Textarea */}
                      <div className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-3xl space-y-3 shadow-xs">
                        <label className="block text-sm font-bold text-slate-800">
                          Additional Submission Notes or Comments (Optional)
                        </label>
                        <p className="text-xs text-slate-500">
                          Provide any extra context for the Scape evaluator (e.g. explanations of complex part geometry, missing CAD files, or specific production constraints).
                        </p>
                        <textarea
                          disabled={isReadOnly}
                          rows={4}
                          value={currentProject.userSubmissionNotes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCurrentProject({ ...currentProject, userSubmissionNotes: val });
                          }}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium disabled:opacity-50"
                          placeholder="e.g. Parts are stacked horizontally in 1200x800 Euro bins. CAD file will be emailed separately."
                        />
                      </div>

                      {/* Primary Submit Button */}
                      {!isReadOnly && currentProject.status === 'draft' && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={async () => {
                              setIsSaving(true);
                              try {
                                const submittedSnapshotProject: ProjectState = {
                                  ...currentProject,
                                  status: 'submitted',
                                  userSubmittedReport: currentProject.userSubmittedReport || currentProject.report || null,
                                  userSubmittedObservations: currentProject.userSubmittedObservations || currentProject.fieldObservations || null,
                                  userSubmittedAdviceTimestamp: currentProject.userSubmittedAdviceTimestamp || currentProject.lastAdviceTimestamp || new Date().toLocaleString()
                                };
                                const res = await saveProject('submitted', submittedSnapshotProject);
                                if (res) {
                                  setCurrentProject(res);
                                  setGlobalSuccess("Project successfully submitted for Scape evaluation!");
                                  setTimeout(() => setGlobalSuccess(null), 4000);
                                }
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={isSaving}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-5 h-5" /> Submit Project
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evaluator Unfoldable AI Advice Accordion */}
                  {profile?.isAdmin && (
                    <div className="bg-slate-900 text-white p-5 sm:p-8 rounded-2xl md:rounded-3xl shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10 flex-wrap gap-2">
                        <div>
                          <h3 className="text-base font-bold flex items-center gap-2">
                            <Zap className="text-amber-400" /> User AI Advice Report (At Submission)
                          </h3>
                          {(currentProject.userSubmittedAdviceTimestamp || currentProject.lastAdviceTimestamp) && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Snapshot taken: {currentProject.userSubmittedAdviceTimestamp || currentProject.lastAdviceTimestamp}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setIsEvaluatorAdviceExpanded(!isEvaluatorAdviceExpanded)}
                          className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 cursor-pointer"
                        >
                          {isEvaluatorAdviceExpanded ? 'Fold Advice' : 'Unfold Advice'}
                        </button>
                      </div>

                      {isEvaluatorAdviceExpanded && (
                        <div className="relative z-10 mt-6 space-y-4 animate-fadeIn border-t border-slate-800 pt-6">
                          {(currentProject.userSubmittedReport || currentProject.report) ? (
                            <div className="max-h-[50vh] overflow-y-auto pr-4 text-slate-300 text-xs leading-relaxed [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-3 [&>strong]:text-white custom-scrollbar">
                              <ReactMarkdown>
                                {cleanMarkdownWrapper((currentProject.userSubmittedReport || currentProject.report)!)}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No AI Advice report was generated by the user prior to submission.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evaluator AI Draft Box (Admin Only) */}
                  {profile?.isAdmin && (
                    <div className="bg-blue-50/50 border border-blue-100 p-5 sm:p-8 md:p-10 rounded-2xl md:rounded-[3rem] shadow-sm relative">
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
                    <div className="bg-white border-2 border-slate-900 p-5 sm:p-8 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl relative min-w-0 overflow-x-hidden">
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
                      currentProject.status === 'draft' ? null : (
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

                  {/* Prominent Draft / Under Development Warning Banner */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 shadow-3xs">
                    <span className="text-2xl shrink-0">🚧</span>
                    <div>
                      <span className="font-black text-xs uppercase tracking-wider block text-amber-900">
                        Draft Feature — Under Development (For Reference Only)
                      </span>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        This ROI simulation tool is a preliminary draft and is not in active use for formal quotation. No prices are fixed or guaranteed.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Inputs */}
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
                        <label className="text-xs font-bold text-slate-600 block">Est. Robot Cell Installation Budget (EUR, Optional)</label>
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={currentProject.generalResponses['businessCaseInstallCost'] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            const updated = { ...currentProject.generalResponses, businessCaseInstallCost: val };
                            setCurrentProject({ ...currentProject, generalResponses: updated });
                          }}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-base md:text-sm"
                          placeholder="Enter estimated budget (e.g. 100000)"
                        />
                      </div>
                    </div>

                    {/* Calculation Output Card */}
                    {(() => {
                      const labor = currentProject.generalResponses['businessCaseSavedLabor'] ?? 50;
                      const sh = currentProject.generalResponses['businessCaseShifts'] ?? 2;
                      const days = currentProject.generalResponses['businessCaseWorkDays'] ?? 220;
                      const cost = currentProject.generalResponses['businessCaseInstallCost'];

                      const annualHours = sh * 8 * days;
                      const annualSavings = annualHours * labor;
                      const paybackMonths = cost && cost > 0 && annualSavings > 0 ? (cost / annualSavings) * 12 : null;

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
                            <span className={`text-xl font-black px-3 py-1 rounded-lg ${paybackMonths !== null ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                              {paybackMonths !== null ? `${paybackMonths.toFixed(1)} Months` : 'Specify Budget Above'}
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
              ) : activeCustomSection === 'scape-review' ? (
                /* Scape Review View for Users */
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Scape Review</h1>
                    <p className="text-sm text-slate-500">
                      Official evaluation conclusion and verdict from Scape Solutions engineering.
                    </p>
                  </div>

                  {currentProject.status !== 'draft' && (currentProject.isVerdictVisible || currentProject.status === 'approved' || currentProject.status === 'rejected') && currentProject.finalVerdict ? (
                    <div className="bg-white border-2 border-slate-900 p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl relative min-w-0 overflow-x-hidden">
                      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-extrabold text-slate-900">Project Review from Scape Solutions</h3>
                            <p className="text-xs text-slate-400 font-medium">Verified technical verdict</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const full = await fetchProjectImages(currentProject);
                              generateProjectPdf(full, profile);
                            } catch (err) {
                              console.error("PDF Export failed:", err);
                            }
                          }}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-600/10 cursor-pointer flex items-center gap-1.5 active:scale-95"
                          title="Download PDF Verdict Report (.pdf)"
                        >
                          <FileText className="w-4 h-4" /> Export PDF Verdict
                        </button>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-slate-700 text-sm leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-slate-900 custom-markdown">
                        <ReactMarkdown>
                          {cleanMarkdownWrapper(currentProject.finalVerdict)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 border border-slate-200/80 shadow-xs max-w-md mx-auto my-8">
                      <Clock className="w-12 h-12 text-slate-400 animate-pulse" />
                      <h4 className="font-bold text-slate-900 text-base">Review Pending</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {currentProject.status === 'draft'
                          ? 'Submit your project in the "Submit" section to request an official evaluation review from Scape Solutions.'
                          : 'Your project has been submitted to Scape Solutions. The engineering team is currently conducting the technical review. Check back soon for your official verdict!'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Questionnaire Step Form Editing */
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                    <h1 className={`${isSplitScreenMode ? 'hidden md:block' : ''} text-2xl font-black text-slate-900 tracking-tight`}>
                      {currentStep === 0 ? 'Project & Cell Info' : `Part #${activePartIndex + 1}: ${PART_STEPS[currentStep - 1].title}`}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setShowFieldIds(prev => !prev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-bold transition-all shadow-2xs cursor-pointer ml-auto"
                      title="Toggle field ID tags ([1.01], [2.01]) in UI"
                    >
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>{showFieldIds ? 'Hide Field IDs' : 'Show Field IDs'}</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Form Filled By - Contact Info Card (Project Info Step) */}
                    {currentStep === 0 && (
                      <div className="p-6 bg-slate-50/80 border border-slate-200/80 rounded-3xl space-y-4 shadow-3xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <span>Form Filled By (Contact Information)</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Specify who completed this evaluation form (pre-filled with your profile, edit if filling on behalf of someone else).
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">Company</label>
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={currentProject.generalResponses['contact_company'] ?? profile?.company ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = { ...currentProject, generalResponses: { ...currentProject.generalResponses, contact_company: val } };
                                setCurrentProject(updated);
                                saveProject(currentProject.status || 'draft', updated);
                              }}
                              placeholder="e.g. Acme Automation ApS"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">Contact Name</label>
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={currentProject.generalResponses['contact_name'] ?? profile?.name ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = { ...currentProject, generalResponses: { ...currentProject.generalResponses, contact_name: val } };
                                setCurrentProject(updated);
                                saveProject(currentProject.status || 'draft', updated);
                              }}
                              placeholder="e.g. John Doe"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">E-mail</label>
                            <input
                              type="email"
                              disabled={isReadOnly}
                              value={currentProject.generalResponses['contact_email'] ?? profile?.email ?? user?.email ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = { ...currentProject, generalResponses: { ...currentProject.generalResponses, contact_email: val } };
                                setCurrentProject(updated);
                                saveProject(currentProject.status || 'draft', updated);
                              }}
                              placeholder="e.g. john@acme.com"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">Telephone</label>
                            <input
                              type="tel"
                              disabled={isReadOnly}
                              value={currentProject.generalResponses['contact_phone'] ?? profile?.phone ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = { ...currentProject, generalResponses: { ...currentProject.generalResponses, contact_phone: val } };
                                setCurrentProject(updated);
                                saveProject(currentProject.status || 'draft', updated);
                              }}
                              placeholder="e.g. +45 12 34 56 78"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {(currentStep === 0 ? GENERAL_STEPS[0] : PART_STEPS[currentStep - 1]).questions.map(q => {
                      const responses = currentStep === 0 ? currentProject.generalResponses : currentProject.parts[activePartIndex].responses;

                      // Condition check
                      if (q.condition && !q.condition(responses)) return null;

                      const isFieldFilled = (question: any, res: Record<string, any>, partItem?: any) => {
                        const val = res[question.id];
                        if (question.type === 'media') {
                          if (question.id === '1.04_image') {
                            return !!(res['1.04_image'] && res['1.04_image'].length > 0);
                          }
                          if (question.id === 'generalImages') {
                            return !!(currentProject.generalImages && currentProject.generalImages.length > 0);
                          }
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
                          className={`p-5 rounded-3xl border transition-all space-y-3 ${isReadOnly
                            ? 'border-transparent px-0'
                            : filled
                              ? 'border-slate-200/50 bg-transparent'
                              : q.important
                                ? 'border-amber-500 bg-amber-500/5 shadow-3xs animate-fadeIn'
                                : 'border-slate-300 bg-slate-500/2'
                            }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <label className="block text-sm md:text-base font-bold text-slate-800 flex items-center gap-2">
                              <span>{q.label}</span>
                              {showFieldIds && (
                                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                  [{q.id}]
                                </span>
                              )}
                            </label>

                            {!isReadOnly && !filled && (
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none shrink-0 ${q.important
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-slate-100 text-slate-500'
                                }`}>
                                {q.important ? 'Important' : 'Optional'}
                              </span>
                            )}

                            {/* Circular Help Info Icon (i) - Rendered for EVERY field */}
                            {(() => {
                              const explanation = getFieldExplanation(q.id, q.label, q.description);
                              const isInfoOpen = openInfoModalId === q.id;

                              return (
                                <div className="relative inline-flex items-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInfoModalMode('short');
                                      setOpenInfoModalId(prev => prev === q.id ? null : q.id);
                                    }}
                                    title={`Field guidance for ${q.label}`}
                                    className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </button>

                                  {isInfoOpen && (
                                    <div
                                      ref={infoPopupRef}
                                      className="absolute z-50 bottom-full mb-2 right-0 sm:right-auto sm:left-0 max-w-[calc(100vw-3rem)] w-72 sm:w-80 md:w-96 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl text-xs text-slate-600 animate-fadeIn"
                                    >
                                      <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-100">
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs md:text-sm">
                                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                          <span>{q.label}</span>
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                          [{q.id}]
                                        </span>
                                      </div>

                                      <div className="space-y-3">
                                        {infoModalMode === 'short' ? (
                                          <p className="leading-relaxed text-slate-700 font-medium text-xs">
                                            {explanation.short}
                                          </p>
                                        ) : (
                                          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5 animate-fadeIn">
                                            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                                              Detailed Technical Guidance
                                            </span>
                                            <p className="leading-relaxed text-slate-700 font-medium text-xs">
                                              {explanation.long}
                                            </p>
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between pt-1 text-[11px]">
                                          <button
                                            type="button"
                                            onClick={() => setInfoModalMode(prev => prev === 'short' ? 'long' : 'short')}
                                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                                          >
                                            {infoModalMode === 'short' ? 'Read Detailed Guidance →' : '← Back to Short Summary'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setOpenInfoModalId(null)}
                                            className="text-slate-400 hover:text-slate-600 font-semibold"
                                          >
                                            Close
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Observation indicator from Project Information Advice */}
                            {currentProject.fieldObservations?.[q.id] && (() => {
                              const obs = currentProject.fieldObservations![q.id];
                              const isCritical = obs.severity === 'critical';

                              // Option B: Detect if field value was modified since last Advice evaluation
                              const isFieldModifiedSinceAdvice = (() => {
                                if (!currentProject.lastAdviceResponsesSnapshot) return false;
                                try {
                                  const raw = currentProject.lastAdviceResponsesSnapshot;
                                  const snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                  if (!snapshot) return false;

                                  if (currentStep === 0) {
                                    const snapGen = snapshot.general || snapshot.generalResponses || {};
                                    const snapVal = snapGen[q.id];
                                    const curVal = responses?.[q.id];
                                    return JSON.stringify(snapVal ?? '') !== JSON.stringify(curVal ?? '');
                                  } else {
                                    const snapParts = snapshot.parts || [];
                                    const snapPart = snapParts[activePartIndex];
                                    const snapPartResp = snapPart?.responses || snapPart || {};
                                    const snapVal = snapPartResp[q.id];
                                    const curVal = responses?.[q.id];
                                    return JSON.stringify(snapVal ?? '') !== JSON.stringify(curVal ?? '');
                                  }
                                } catch (err) {
                                  console.warn("Could not check modified field snapshot:", err);
                                  return false;
                                }
                              })();

                              return (
                                <div className="relative inline-flex">
                                  <button
                                    type="button"
                                    onClick={() => setOpenObservationId(prev => prev === q.id ? null : q.id)}
                                    title={isFieldModifiedSinceAdvice ? "Field modified since last AI evaluation" : obs.text}
                                    className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none shrink-0 cursor-pointer transition-all ${isFieldModifiedSinceAdvice
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 shadow-2xs'
                                        : isCritical
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                      }`}
                                  >
                                    {isFieldModifiedSinceAdvice ? '✏️ Modified (Re-evaluate)' : isCritical ? '🔴 Critical' : '⚠️ Note'}
                                  </button>
                                  {openObservationId === q.id && (
                                    <div
                                      ref={infoPopupRef}
                                      className={`absolute z-50 bottom-full mb-2 right-0 sm:right-auto sm:left-0 max-w-[calc(100vw-3rem)] w-80 p-4 rounded-2xl shadow-xl text-xs font-medium leading-relaxed border animate-fadeIn ${isFieldModifiedSinceAdvice
                                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                                          : isCritical
                                            ? 'bg-red-50 border-red-200 text-red-800'
                                            : 'bg-amber-50 border-amber-200 text-amber-800'
                                        }`}
                                    >
                                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-200/60">
                                        <p className="font-black text-xs flex items-center gap-1.5">
                                          {isFieldModifiedSinceAdvice ? '✏️ Value Modified' : isCritical ? '🔴 Critical Observation' : '⚠️ Observation'}
                                        </p>
                                        <span className="text-[9px] font-semibold opacity-60">From AI Advice</span>
                                      </div>

                                      {isFieldModifiedSinceAdvice ? (
                                        <>
                                          <div className="bg-blue-100/70 border border-blue-200 rounded-xl p-2.5 mb-2.5 text-[11px] leading-relaxed text-blue-950 font-medium">
                                            ⚠️ <strong>Value changed since last evaluation:</strong><br />
                                            This field has been updated since Project Information Advice was generated. The observation text below was based on previous data and may be outdated.
                                          </div>
                                          <p className="text-xs leading-normal opacity-85 italic bg-white/60 p-2 rounded-lg border border-blue-100">
                                            "{obs.text}"
                                          </p>
                                          <div className="mt-3 pt-2 border-t border-blue-200/80 text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                                            <span>💡 Re-generate Advice under <strong>Scape Review</strong> tab to update.</span>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <p className="text-xs leading-normal">{obs.text}</p>
                                          <p className="text-[10px] mt-2 opacity-60">From: Project Information Advice</p>
                                        </>
                                      )}
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
                              onBlur={() => {
                                if (currentProject.id && !isReadOnly && (currentProject.status || 'draft') === 'draft' && saveProject) {
                                  saveProject(currentProject.status || 'draft', currentProject);
                                }
                              }}
                            />
                          )}

                          {/* Approximate / Best Guess Checkbox for Bin Dimensions */}
                          {['1.04_w', '1.04_l', '1.04_h'].includes(q.id) && (
                            <label className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                disabled={isReadOnly}
                                checked={!!(currentProject.generalResponses[`${q.id}_approx`])}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const updated = {
                                    ...currentProject,
                                    generalResponses: {
                                      ...currentProject.generalResponses,
                                      [`${q.id}_approx`]: checked
                                    }
                                  };
                                  setCurrentProject(updated);
                                  if (currentProject.id && !isReadOnly && (currentProject.status || 'draft') === 'draft' && saveProject) {
                                    saveProject(currentProject.status || 'draft', updated);
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>Approximate / Best guess measurement</span>
                            </label>
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
                              onBlur={() => {
                                if (currentProject.id && !isReadOnly && (currentProject.status || 'draft') === 'draft' && saveProject) {
                                  saveProject(currentProject.status || 'draft', currentProject);
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
                                            const allowedExtensions = ['stl', 'step', 'stp', 'igs', 'iges'];
                                            if (extension && allowedExtensions.includes(extension)) {
                                              await processCadFile(file);
                                            } else {
                                              alert("Invalid file format. Please upload a CAD file (.stl, .step, .stp, .igs, .iges).");
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
                                          accept=".stl,.step,.stp,.igs,.iges"
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
                              onBlur={() => {
                                if (currentProject.id && !isReadOnly && (currentProject.status || 'draft') === 'draft' && saveProject) {
                                  saveProject(currentProject.status || 'draft', currentProject);
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
                            const isBinImage = q.id === '1.04_image';
                            const isGeneralImages = q.id === 'generalImages';
                            const imageList: string[] = isBinImage
                              ? (Array.isArray(currentProject.generalResponses['1.04_image']) ? currentProject.generalResponses['1.04_image'] : [])
                              : isGeneralImages
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
                                        await processUploadedImages(imageFiles, q.id);
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
                                      : (isBinImage ? "Select or drag Bin / Container Photo" : isGeneralImages ? "Select or drag Environmental Photos" : "Select or drag Part Photos")}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Supports JPG, PNG</span>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    disabled={isReadOnly}
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        processUploadedImages(Array.from(e.target.files), q.id);
                                      }
                                    }}
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
                                        if (isBinImage) {
                                          const updated = {
                                            ...currentProject,
                                            generalResponses: {
                                              ...currentProject.generalResponses,
                                              '1.04_image': []
                                            }
                                          };
                                          setCurrentProject(updated);
                                          saveProject(currentProject.status || 'draft', updated);
                                        } else {
                                          setDeleteImageConfirm({
                                            show: true,
                                            type: 'all',
                                            imageType: isGeneralImages ? 'general' : 'part',
                                            partIndex: isGeneralImages ? -1 : activePartIndex
                                          });
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
                                        alt={isBinImage ? `Bin photo ${imgIdx + 1}` : isGeneralImages ? `Environmental photo ${imgIdx + 1}` : `Part upload ${imgIdx + 1}`}
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
                                            link.download = isBinImage
                                              ? `bin-photo-${imgIdx + 1}.png`
                                              : isGeneralImages
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
                                              if (isBinImage) {
                                                const updatedImages = (currentProject.generalResponses['1.04_image'] || []).filter((_: any, idx: number) => idx !== imgIdx);
                                                const updated = {
                                                  ...currentProject,
                                                  generalResponses: {
                                                    ...currentProject.generalResponses,
                                                    '1.04_image': updatedImages
                                                  }
                                                };
                                                setCurrentProject(updated);
                                                saveProject(currentProject.status || 'draft', updated);
                                              } else {
                                                setDeleteImageConfirm({
                                                  show: true,
                                                  type: 'single',
                                                  imageType: isGeneralImages ? 'general' : 'part',
                                                  partIndex: isGeneralImages ? -1 : activePartIndex,
                                                  imageIndex: imgIdx
                                                });
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
                onClick={() => { navigateToSection({ step: 0, customSection: null, isReviewing: false }); setIsMobileMenuOpen(false); }}
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
                          onClick={() => { navigateToSection({ step: stepIdx + 1, partIndex: partIdx, customSection: null, isReviewing: false }); setIsMobileMenuOpen(false); }}
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

              {/* Add Part inline inside Parts Data on Mobile */}
              {!isReadOnly && (
                <button
                  onClick={() => { handleAddPart(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between p-3 mt-3 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 text-blue-700 transition-all group select-none cursor-pointer shadow-2xs active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1.5 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition-transform shrink-0">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold tracking-tight text-blue-900 group-hover:text-blue-950">
                      Part #{currentProject.parts.length + 1}: + Add New Part
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 shrink-0">
                    Add
                  </span>
                </button>
              )}

              {/* Extended Analysis Sections for Mobile */}
              <div className="mt-6 mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-3">Extended Analysis</h3>
              </div>

              {/* Business Case Card */}
              <button
                onClick={() => { navigateToSection({ customSection: 'business-case', isReviewing: false }); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${activeCustomSection === 'business-case' ? 'bg-blue-50/50 border-blue-200 text-blue-800 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
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
                onClick={() => { navigateToSection({ customSection: 'additional-opportunities', isReviewing: false }); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${activeCustomSection === 'additional-opportunities' ? 'bg-blue-50/50 border-blue-200 text-blue-800 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
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

              {/* Bottom Section Card: Submit or Review/approve */}
              <button
                onClick={() => { navigateToSection({ isReviewing: true, customSection: null }); setIsMobileMenuOpen(false); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all mt-2 ${isReviewing && !activeCustomSection ? 'bg-blue-50/50 border-blue-200 text-blue-800 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isReviewing && !activeCustomSection ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {profile?.isAdmin ? <CheckSquare className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{profile?.isAdmin ? 'Review/approve' : 'Submit'}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {profile?.isAdmin ? 'Evaluate project data & issue verdict' : 'Final submission & project status'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Scape Review Card - Placed as the VERY LAST item for User View on Mobile */}
              {!profile?.isAdmin && (
                <button
                  onClick={() => { navigateToSection({ customSection: 'scape-review', isReviewing: false }); setIsMobileMenuOpen(false); }}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all mt-2 ${activeCustomSection === 'scape-review'
                    ? 'bg-rose-50 border-rose-200 text-rose-800 font-black shadow-xs'
                    : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-rose-50/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${activeCustomSection === 'scape-review' ? 'bg-rose-600 text-white' : 'bg-rose-100/80 text-rose-700'}`}>
                      <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="currentColor">
                        <path d="M 22,90 L 50,15 L 62,15 L 34,90 Z" fill="currentColor" />
                        <path d="M 50,15 L 68,55 L 56,55 L 42,23 Z" fill="currentColor" />
                        <path d="M 61,62 L 70,62 L 78,82 L 69,82 Z" fill="#bf1e2e" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Scape Review</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Official Scape verdict & status</p>
                    </div>
                  </div>
                  {(currentProject.status === 'approved' || currentProject.status === 'rejected' || currentProject.isVerdictVisible) ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Official Verdict Available" />
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded">Official</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over AI Advice Drawer */}
      {isAdviceDrawerOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-xs transition-all animate-fadeIn"
          onClick={() => setIsAdviceDrawerOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft border-l border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Project Information Advice</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Feasibility & Guidance Report</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentProject.report && (
                  <>
                    <button
                      onClick={() => downloadMarkdownFile(currentProject.report!, `${currentProject.projectName || 'project'}-ai-advice.md`)}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Download Markdown Report (.md)"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">.MD</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const full = await fetchProjectImages(currentProject);
                          generateProjectPdf(full, profile);
                        } catch (err) {
                          console.error("PDF Export failed:", err);
                        }
                      }}
                      className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-xs"
                      title="Download PDF Report (.pdf)"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">.PDF</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setIsAdviceDrawerOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 space-y-6">
              {isGeneratingAdvice ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Analyzing Project Parameters...</p>
                    <p className="text-xs text-slate-500 mt-1">Generating AI Feasibility Advice and detecting data changes.</p>
                  </div>
                </div>
              ) : currentProject.report ? (
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-slate-900">
                    <ReactMarkdown>
                      {cleanMarkdownWrapper(currentProject.report)}
                    </ReactMarkdown>
                  </div>

                  {!isReadOnly && (
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={generateExternalAdvice}
                        disabled={isGeneratingAdvice}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-400" /> Re-generate Advice
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 border border-slate-200/80 shadow-xs max-w-md mx-auto my-8">
                  <Bot className="w-12 h-12 text-amber-500 animate-bounce" />
                  <h4 className="font-bold text-slate-900 text-base">No Advice Generated Yet</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click below to analyze your project data, physical cell dimensions, and part parameters using AI.
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={generateExternalAdvice}
                      disabled={isGeneratingAdvice}
                      className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" /> Get Advice Data
                    </button>
                  )}
                </div>
              )}
            </div>
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
          className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 items-center justify-center cursor-pointer hidden md:flex ${isAIAssistantOpen
            ? 'bg-slate-900 text-white hover:bg-slate-800 md:right-[408px]'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
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
            className="fixed inset-y-0 right-0 z-35 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slideIn select-text"
            style={{ width: `${aiPaneWidth}px`, maxWidth: '90vw', ...viewportStyle }}
          >
            {/* Draggable Vertical Divider Resizer Handle on Floating Drawer */}
            <div
              onMouseDown={startResizingDrawer}
              onTouchStart={startResizingDrawer}
              className="hidden md:flex absolute top-0 bottom-0 -left-3 w-6 flex-col items-center justify-center bg-transparent hover:bg-indigo-500/10 active:bg-indigo-500/20 cursor-col-resize z-50 transition-all select-none group"
              title="Drag left/right to resize AI Assistant"
            >
              <div className="p-1.5 rounded-full bg-white border-2 border-indigo-500 shadow-xl group-hover:scale-125 text-indigo-600 transition-all">
                <GripVertical className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
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
                sendMessageToAssistant={async (msg, images) => {
                  const normalized = msg.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
                  const closeKeywords = ['done', 'finished', 'jeg er færdig', 'jeg er ferdig', 'færdig', 'ferdig', 'afslut', 'luk'];
                  const isCloseTrigger = closeKeywords.some(phrase =>
                    normalized === phrase || normalized.startsWith(phrase + ' ') || normalized.endsWith(' ' + phrase)
                  );

                  if (isCloseTrigger) {
                    setIsAIAssistantOpen(false); // Close drawer
                  }
                  await sendMessageToAssistant(msg, images);
                }}
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
    </div>
  );
}

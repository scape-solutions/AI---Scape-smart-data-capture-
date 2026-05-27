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
  ChevronDown
} from 'lucide-react';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';
import { ProjectState, UserProfile } from '../types';
import imageCompression from 'browser-image-compression';

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
  isGeneratingReport: boolean;
  isSubmitting: boolean;
  saveProject: (status?: ProjectState['status']) => Promise<ProjectState | null>;
  toggleLock: (p: ProjectState) => void;
  toggleVerdictVisibility: (p: ProjectState) => void;
  setGlobalSuccess: (msg: string | null) => void;
  updateDoc: any;
  doc: any;
  db: any;
  logChange: any;
  fetchProjects: any;
  generateReport: any;
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
  isGeneratingReport,
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
  generateReport,
}: QuestionnaireViewProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Read-only state (locked or submitted, unless the user is an admin)
  const isReadOnly = (currentProject.isLocked || currentProject.status === 'submitted') && !profile?.isAdmin;

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

  // Handle ESC key to close fullscreen image viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddPart = async () => {
    if (isReadOnly) return;
    const newParts = [...currentProject.parts, { responses: {}, images: [] }];
    setCurrentProject({ ...currentProject, parts: newParts });
    setActivePartIndex(newParts.length - 1);
    setCurrentStep(1);
    setIsReviewing(false);
    // Auto-save a draft
    setTimeout(() => saveProject('draft'), 50);
  };

  const handleRemovePart = (index: number) => {
    if (isReadOnly || currentProject.parts.length <= 1) return;
    const newParts = currentProject.parts.filter((_, i) => i !== index);
    const newActiveIndex = Math.max(0, activePartIndex - 1);
    setCurrentProject({ ...currentProject, parts: newParts });
    setActivePartIndex(newActiveIndex);
    setCurrentStep(1);
    setIsReviewing(false);
    setTimeout(() => saveProject('draft'), 50);
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

      const updatedParts = [...currentProject.parts];
      updatedParts[activePartIndex].images = [
        ...updatedParts[activePartIndex].images,
        ...compressedImages
      ];
      setCurrentProject({ ...currentProject, parts: updatedParts });
      setTimeout(() => setGlobalSuccess(null), 1500);
    }
  };

  const handleUploadCadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Strict size check: max 200 KB
      if (file.size > 200 * 1024) {
        alert(`CAD file size is ${(file.size / 1024).toFixed(1)} KB, which exceeds the strict 200 KB limit. To prevent database errors, please simplify your CAD model or export it as a low-poly binary STL file.`);
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
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
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
          </div>
          {(() => {
            const { filled, total } = getStepProgress(GENERAL_STEPS[0], currentProject.generalResponses);
            return renderProgressBadge(filled, total);
          })()}
        </button>

        {/* Dynamic Part Tabs */}
        {currentProject.parts.map((part, partIdx) => (
          <div key={partIdx} className="space-y-1">
            <div className="text-[10px] font-bold text-slate-300 px-3 mt-4 flex justify-between items-center">
              <span>PART {partIdx + 1}</span>
              {currentProject.parts.length > 1 && !isReadOnly && (
                <button 
                  onClick={() => handleRemovePart(partIdx)}
                  className="text-red-400 hover:text-red-600 font-bold text-[9px] uppercase tracking-wider animate-fadeIn"
                >
                  Delete
                </button>
              )}
            </div>
            {PART_STEPS.map((step, stepIdx) => {
              const { filled, total } = getStepProgress(step, part.responses, part);
              return (
                <button 
                  key={step.id}
                  onClick={() => { setIsReviewing(false); setActivePartIndex(partIdx); setCurrentStep(stepIdx + 1); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${currentStep === stepIdx + 1 && activePartIndex === partIdx && !isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {React.createElement(step.icon, { className: "w-4 h-4" })}
                    <span>{step.title}</span>
                  </div>
                  {renderProgressBadge(filled, total)}
                </button>
              );
            })}
          </div>
        ))}

        {/* Final Verdict */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button 
            onClick={() => { setIsReviewing(true); if (!currentProject.report && !isGeneratingReport) generateReport(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${isReviewing ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Sparkles className="w-4 h-4" /> Final Verdict
          </button>
        </div>

        {/* Add Part Button */}
        <button 
          disabled={isReadOnly}
          onClick={handleAddPart}
          className={`mt-4 flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl transition-all select-none ${isReadOnly ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50'}`}
        >
          <PlusCircle className="w-4 h-4" /> Add Part
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-12 overflow-y-auto bg-slate-50">
        <div className="max-w-2xl mx-auto w-full">
          
          {/* Sticky Mobile Header Bar (Only visible on screens < md) */}
          <div className="md:hidden sticky top-0 z-30 -mx-4 -mt-4 mb-6 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs select-none">
            <button 
              onClick={() => setView('dashboard')}
              className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl text-slate-500 transition-all active:scale-95"
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 transition-all active:scale-[0.98] shadow-xs"
            >
              <span className="text-xs font-black text-slate-700">
                {isReviewing 
                  ? 'Final Review' 
                  : currentStep === 0 
                    ? 'Project & Cell Info' 
                    : `Part #0${activePartIndex + 1}: ${PART_STEPS[currentStep - 1].title}`}
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
          
          {/* Header Bar */}
          <div className="mb-6 p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="uppercase tracking-wider text-[10px] text-slate-400">Project:</span>
              <span className="text-slate-900 font-black text-xs md:text-sm bg-slate-100 px-3 py-1 rounded-lg">
                {currentProject.projectName || 'Unnamed Project'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="uppercase tracking-wider text-[10px] text-slate-400">Location:</span>
              <span className="text-blue-600 bg-blue-50 border border-blue-100/50 px-3 py-1 rounded-lg font-black text-[10px] md:text-xs">
                {isReviewing ? 'Final Review' : currentStep === 0 ? 'Project & Cell Info' : `Part #0${activePartIndex + 1}: ${currentProject.parts[activePartIndex]?.responses?.['2.01'] || 'Unnamed Part'}`}
              </span>
            </div>
          </div>

          {/* Locked / Read-Only Banner */}
          {isReadOnly && (
            <div className="mb-8 p-4 bg-amber-50/80 border border-amber-100 rounded-2xl flex items-center gap-3 animate-fadeIn">
              <ShieldCheck className="w-5 h-5 text-amber-600 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-amber-950">
                  {currentProject.status === 'submitted' ? 'Project Submitted (Read-Only)' : 'Project Locked (Read-Only)'}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {currentProject.status === 'submitted' 
                    ? 'This project has been submitted to Scape. You can cancel submission at the bottom of the Final Review tab if you need to make changes.' 
                    : 'This project has been locked by Scape. You cannot edit it in this state.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab Pages rendering */}
          {isReviewing ? (
            /* Final Verdict Review Page */
            <div className="space-y-10 animate-fadeIn">
              <h1 className="text-5xl font-black tracking-tighter">Final Review</h1>
              
              {/* Feasibility Verdict Box */}
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <Sparkles className="absolute top-0 right-0 w-40 h-40 opacity-10" />
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="text-blue-400" /> Advisor Verdict
                </h3>

                {profile?.isAdmin || currentProject.isVerdictVisible ? (
                  <>
                    {isGeneratingReport ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Calculating Feasibility...</span>
                      </div>
                    ) : (
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {currentProject.report || 'Awaiting submission data...'}
                      </p>
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

              {/* Parts Summary list */}
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Box className="w-4 h-4" /> Parts Summary
                </h3>
                <div className="space-y-2">
                  {currentProject.parts.map((part, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm border border-slate-100 hover:border-slate-200 transition-all">
                      <span className="font-bold text-slate-800">
                        Part #0{index + 1}: {part.responses['2.01'] || 'Unnamed Part'}
                      </span>
                      <div className="flex items-center gap-2">
                        {part.cadFile && (
                          <span className="text-xs text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <UploadCloud className="w-3 h-3" /> CAD Model
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-bold bg-slate-50 border px-2.5 py-1 rounded-lg">
                          {part.images ? part.images.length : 0} Images
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  disabled={isReadOnly}
                  onClick={handleAddPart}
                  className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-2xl text-slate-500 hover:text-blue-600 font-bold transition-all flex items-center justify-center gap-2 mt-2 bg-white hover:bg-blue-50/20 disabled:opacity-50 disabled:cursor-not-allowed select-none"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Add Another Part to Project</span>
                </button>
              </div>

              {/* Lock / Submit buttons */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsReviewing(false)}
                    disabled={isReadOnly}
                    className={`flex-1 py-5 border-2 rounded-2xl font-bold transition-all ${isReadOnly ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : 'hover:border-slate-900 bg-white'}`}
                  >
                    Edit Details
                  </button>

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
                          className="flex-[2] py-5 rounded-2xl font-bold text-slate-700 border-2 border-slate-300 hover:border-slate-800 hover:bg-slate-50 transition-all select-none flex items-center justify-center gap-2"
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
                          className="flex-[2] py-5 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Begin Evaluation (Lock Project)"}
                        </button>
                      )
                    ) : (
                      <span className="text-xs font-bold text-slate-400 self-center uppercase tracking-wider flex-[2] text-center">
                        Awaiting User Submission (Draft)
                      </span>
                    )
                  ) : (
                    currentProject.status === 'submitted' ? (
                      currentProject.isLocked ? (
                        <button 
                          disabled
                          className="flex-[2] py-5 rounded-2xl font-bold text-slate-400 bg-slate-100 shadow-none cursor-not-allowed select-none"
                        >
                          Locked / Under Evaluation
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            setIsSaving(true);
                            try {
                              const res = await saveProject('draft');
                              if (res) {
                                setGlobalSuccess("Project submission cancelled. You can now edit it again.");
                                setTimeout(() => setGlobalSuccess(null), 5000);
                              }
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                          disabled={isSaving}
                          className="flex-[2] py-5 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submitted (Click to Unsubmit)"}
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            const res = await saveProject('submitted');
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
                        className="flex-[2] py-5 rounded-2xl font-bold text-white bg-blue-600 shadow-lg shadow-blue-200 hover:scale-[1.01] transition-all select-none flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit to Scape Solutions"}
                      </button>
                    )
                  )}
                </div>

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
            <div className="space-y-8 animate-fadeIn">
              <h1 className="text-3xl font-black">
                {currentStep === 0 ? 'Project & Cell Info' : `Part ${activePartIndex + 1}: ${(PART_STEPS[currentStep - 1]).title}`}
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
                        <label className="block text-sm font-bold text-slate-700">{q.label}</label>
                        {!isReadOnly && !filled && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none shrink-0 ${
                            q.important 
                              ? 'bg-amber-100 text-amber-800 animate-pulse' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {q.important ? 'Important' : 'Optional'}
                          </span>
                        )}
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
                                  {!isReadOnly && (
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const parts = [...currentProject.parts];
                                        parts[activePartIndex].cadFile = null;
                                        setCurrentProject({ ...currentProject, parts });
                                      }}
                                      className="text-red-500 hover:text-red-700 text-xs font-bold hover:underline"
                                    >
                                      Remove File
                                    </button>
                                  )}
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
                      {q.type === 'media' && (
                        <div className="space-y-4">
                          <label className={`w-full h-32 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <Camera className="w-8 h-8 text-slate-300" />
                            <span className="text-xs font-bold text-slate-400 mt-2">Upload Part Photos</span>
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
                              Uploaded Photos ({currentProject.parts[activePartIndex].images.length})
                            </span>
                            {currentProject.parts[activePartIndex].images.length > 0 && !isReadOnly && (
                              <button 
                                onClick={e => {
                                  e.preventDefault();
                                  const parts = [...currentProject.parts];
                                  parts[activePartIndex].images = [];
                                  setCurrentProject({ ...currentProject, parts });
                                }}
                                className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:underline"
                              >
                                Clear All Images
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {currentProject.parts[activePartIndex].images.map((img, imgIdx) => (
                              <img 
                                key={imgIdx}
                                src={img} 
                                onClick={() => setFullscreenImage(img)}
                                className="w-full h-16 object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all hover:scale-[1.04] hover:shadow-md"
                                title="Klik for at se i fuld skærm"
                                alt={`Part upload ${imgIdx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
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
                    setIsSaving(true);
                    try {
                      const res = await saveProject('draft');
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
                            generateReport();
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
              {currentProject.parts.map((part, partIdx) => (
                <div key={partIdx} className="p-4 bg-slate-50/30 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PART #0{partIdx + 1}</span>
                    {currentProject.parts.length > 1 && !isReadOnly && (
                      <button 
                        onClick={() => { handleRemovePart(partIdx); setIsMobileMenuOpen(false); }}
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
                onClick={() => { setIsReviewing(true); setIsMobileMenuOpen(false); if (!currentProject.report && !isGeneratingReport) generateReport(); }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${isReviewing ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isReviewing ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Final Verdict</h4>
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
            <div className="mt-4 text-xs font-medium text-slate-400 select-none bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
              Click anywhere outside or press ESC to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

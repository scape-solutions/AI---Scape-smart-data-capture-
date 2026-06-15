import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Save, FileText, Bot, Sparkles, Loader2, RefreshCw } from 'lucide-react';

// Import local filesystem prompt files as defaults/fallbacks using Vite's ?raw import
import defaultExternalAdvice from '../docs/externalAdvicePrompt.md?raw';
import defaultEvaluatorDraft from '../docs/evaluatorDraftPrompt.md?raw';
import defaultAutoFill from '../docs/autoFillPrompt.md?raw';

interface PromptsEditorModalProps {
  show: boolean;
  onClose: () => void;
  setGlobalSuccess: (msg: string | null) => void;
}

type PromptType = 'externalAdvice' | 'evaluatorDraft' | 'autoFill';

export function PromptsEditorModal({ show, onClose, setGlobalSuccess }: PromptsEditorModalProps) {
  const [activeTab, setActiveTab] = useState<PromptType>('externalAdvice');
  const [prompts, setPrompts] = useState<Record<PromptType, string>>({
    externalAdvice: '',
    evaluatorDraft: '',
    autoFill: ''
  });
  const [includeImages, setIncludeImages] = useState<Record<PromptType, boolean>>({
    externalAdvice: true,
    evaluatorDraft: true,
    autoFill: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load prompts from Firestore on open
  useEffect(() => {
    if (show) {
      loadPrompts();
    }
  }, [show]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, 'config', 'prompts');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setPrompts({
          externalAdvice: data.externalAdvicePrompt || '',
          evaluatorDraft: data.evaluatorDraftPrompt || '',
          autoFill: data.autoFillPrompt || ''
        });
        setIncludeImages({
          externalAdvice: data.includeImagesForAdvice !== false,
          evaluatorDraft: data.includeImagesForDraft !== false,
          autoFill: !!data.includeImagesForChat
        });
      } else {
        // Preload default local filesystem values if the database document does not exist yet
        setPrompts({
          externalAdvice: defaultExternalAdvice.trim(),
          evaluatorDraft: defaultEvaluatorDraft.trim(),
          autoFill: defaultAutoFill.trim()
        });
      }
    } catch (e) {
      console.error("Failed to load prompts from Firestore:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'config', 'prompts');
      await setDoc(docRef, {
        externalAdvicePrompt: prompts.externalAdvice,
        evaluatorDraftPrompt: prompts.evaluatorDraft,
        autoFillPrompt: prompts.autoFill,
        includeImagesForAdvice: includeImages.externalAdvice,
        includeImagesForDraft: includeImages.evaluatorDraft,
        includeImagesForChat: includeImages.autoFill,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setGlobalSuccess("AI Prompts updated successfully! The system will apply the updates in real-time.");
      setTimeout(() => setGlobalSuccess(null), 5000);
      onClose();
    } catch (e) {
      console.error("Failed to save prompts to Firestore:", e);
      alert("Failed to save prompts: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("Are you sure you want to reset the current active tab prompt to its local markdown file default values?")) {
      const defaultText = 
        activeTab === 'externalAdvice' ? defaultExternalAdvice.trim() :
        activeTab === 'evaluatorDraft' ? defaultEvaluatorDraft.trim() :
        defaultAutoFill.trim();

      setPrompts(prev => ({
        ...prev,
        [activeTab]: defaultText
      }));
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-xs select-none">
      {/* Modal Box */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/10">
              <Bot className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-800 leading-tight">AI System Prompts Editor</h2>
              <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Dynamically adjust Gemini system prompts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col min-h-0">
          
          {/* Tabs header */}
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 self-start w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('externalAdvice')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'externalAdvice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Data Capture Advice</span>
            </button>
            <button
              onClick={() => setActiveTab('evaluatorDraft')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'evaluatorDraft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Technical Evaluation</span>
            </button>
            <button
              onClick={() => setActiveTab('autoFill')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'autoFill' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Chat Assistant</span>
            </button>
          </div>

          {/* Prompt Description */}
          <p className="text-xs text-slate-500 mb-3 text-left leading-relaxed">
            {activeTab === 'externalAdvice' && "Used to analyze project criteria and generate missing details & recommendations visible to external clients."}
            {activeTab === 'evaluatorDraft' && "Used by Scape Engineers to generate a comprehensive draft technical report in the administrative review page."}
            {activeTab === 'autoFill' && "Instructions for the interactive chat assistant that handles free-text inputs and proposes structured form edits."}
          </p>

          {/* Include Images Toggle Switch */}
          <div className="flex items-center gap-3 mb-4 select-none self-start">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeImages[activeTab]} 
                onChange={(e) => setIncludeImages(prev => ({ ...prev, [activeTab]: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="ml-3 text-xs font-bold text-slate-700">
                Include uploaded project & part images as visual attachments
              </span>
            </label>
          </div>

          {/* Main Textarea Editor */}
          <div className="flex-1 relative flex flex-col min-h-[300px]">
            {isLoading ? (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="text-xs text-slate-400 font-bold">Loading prompts...</span>
                </div>
              </div>
            ) : null}

            <textarea
              value={prompts[activeTab]}
              onChange={(e) => setPrompts(prev => ({ ...prev, [activeTab]: e.target.value }))}
              placeholder={`Write your system prompt instructions here in markdown...`}
              disabled={isLoading || isSaving}
              className="flex-1 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full outline-none focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none custom-scrollbar"
            />
          </div>
          
          {/* Fallback & Reset row */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Stored in: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold select-all">/config/prompts</code>
            </span>
            <button
              onClick={handleResetToDefault}
              disabled={isLoading || isSaving}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              title="Reset prompt tab to filesystem markdown default values"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100 text-slate-600 transition-all select-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-500/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all select-none cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Prompts</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

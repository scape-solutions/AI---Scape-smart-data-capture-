import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { X, Save, FileText, Bot, Sparkles, Loader2, RefreshCw, Download, Upload, History } from 'lucide-react';

// Import local filesystem prompt files as defaults/fallbacks using Vite's ?raw import
import defaultExternalAdvice from '../docs/externalAdvicePrompt.md?raw';
import defaultEvaluatorDraft from '../docs/evaluatorDraftPrompt.md?raw';
import defaultAutoFill from '../docs/autoFillPrompt.md?raw';
import defaultObservationsExtraction from '../docs/observationsExtractionPrompt.md?raw';

interface PromptsEditorModalProps {
  show: boolean;
  onClose: () => void;
  setGlobalSuccess: (msg: string | null) => void;
}

type PromptType = 'externalAdvice' | 'evaluatorDraft' | 'autoFill' | 'observationsExtraction';

export function PromptsEditorModal({ show, onClose, setGlobalSuccess }: PromptsEditorModalProps) {
  const [activeTab, setActiveTab] = useState<PromptType>('externalAdvice');
  const [prompts, setPrompts] = useState<Record<PromptType, string>>({
    externalAdvice: '',
    evaluatorDraft: '',
    autoFill: '',
    observationsExtraction: ''
  });
  const [includeImages, setIncludeImages] = useState<Record<PromptType, boolean>>({
    externalAdvice: true,
    evaluatorDraft: true,
    autoFill: false,
    observationsExtraction: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Revision history state
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load prompts and history on open
  useEffect(() => {
    if (show) {
      loadPrompts();
      loadHistory();
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
          autoFill: data.autoFillPrompt || '',
          observationsExtraction: data.observationsExtractionPrompt || ''
        });
        setIncludeImages({
          externalAdvice: data.includeImagesForAdvice !== false,
          evaluatorDraft: data.includeImagesForDraft !== false,
          autoFill: !!data.includeImagesForChat,
          observationsExtraction: !!data.includeImagesForExtraction
        });
      } else {
        // Preload default local filesystem values if the database document does not exist yet
        setPrompts({
          externalAdvice: defaultExternalAdvice.trim(),
          evaluatorDraft: defaultEvaluatorDraft.trim(),
          autoFill: defaultAutoFill.trim(),
          observationsExtraction: defaultObservationsExtraction.trim()
        });
      }
    } catch (e) {
      console.error("Failed to load prompts from Firestore:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, 'config', 'prompts', 'history'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setHistory(list);
    } catch (e) {
      console.error("Failed to load prompt history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const docRef = doc(db, 'config', 'prompts');
      
      // Update active prompts
      await setDoc(docRef, {
        externalAdvicePrompt: prompts.externalAdvice,
        evaluatorDraftPrompt: prompts.evaluatorDraft,
        autoFillPrompt: prompts.autoFill,
        observationsExtractionPrompt: prompts.observationsExtraction,
        includeImagesForAdvice: includeImages.externalAdvice,
        includeImagesForDraft: includeImages.evaluatorDraft,
        includeImagesForChat: includeImages.autoFill,
        includeImagesForExtraction: includeImages.observationsExtraction,
        updatedAt: timestamp
      }, { merge: true });

      // Save revision history snapshot
      try {
        const historyRef = collection(db, 'config', 'prompts', 'history');
        await addDoc(historyRef, {
          externalAdvicePrompt: prompts.externalAdvice,
          evaluatorDraftPrompt: prompts.evaluatorDraft,
          autoFillPrompt: prompts.autoFill,
          observationsExtractionPrompt: prompts.observationsExtraction,
          includeImagesForAdvice: includeImages.externalAdvice,
          includeImagesForDraft: includeImages.evaluatorDraft,
          includeImagesForChat: includeImages.autoFill,
          includeImagesForExtraction: includeImages.observationsExtraction,
          createdAt: timestamp,
          createdBy: auth.currentUser?.email || 'anonymous'
        });
      } catch (e) {
        console.error("Failed to save history snapshot:", e);
      }

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
        activeTab === 'autoFill' ? defaultAutoFill.trim() :
        defaultObservationsExtraction.trim();

      setPrompts(prev => ({
        ...prev,
        [activeTab]: defaultText
      }));
    }
  };

  const handleDownload = () => {
    const content = prompts[activeTab];
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}Prompt.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPrompts(prev => ({
          ...prev,
          [activeTab]: text
        }));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleRestore = (item: any) => {
    if (confirm(`Are you sure you want to load the revision from ${formatTime(item.createdAt)} by ${formatEmail(item.createdBy)}? You will need to click 'Save Prompts' to apply it.`)) {
      setPrompts({
        externalAdvice: item.externalAdvicePrompt || '',
        evaluatorDraft: item.evaluatorDraftPrompt || '',
        autoFill: item.autoFillPrompt || '',
        observationsExtraction: item.observationsExtractionPrompt || ''
      });
      setIncludeImages({
        externalAdvice: item.includeImagesForAdvice !== false,
        evaluatorDraft: item.includeImagesForDraft !== false,
        autoFill: !!item.includeImagesForChat,
        observationsExtraction: !!item.includeImagesForExtraction
      });
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatEmail = (email: string) => {
    if (!email) return 'System';
    return email.split('@')[0];
  };

  // Version Parsing & Updates
  const parsedHeader = (() => {
    const text = prompts[activeTab] || '';
    const regex = /PROMPT VERSION:\s*(\S+)\s+v?([\d\.]+)\s*\|\s*([^\n-->]+)/i;
    const match = text.match(regex);
    if (match) {
      return {
        name: match[1],
        version: match[2],
        datetime: match[3].trim()
      };
    }
    return null;
  })();

  const currentVersion = parsedHeader?.version || '';
  const currentDatetime = parsedHeader?.datetime || '';

  const updatePromptHeader = (text: string, promptName: string, version: string, datetime: string) => {
    const regex = /PROMPT VERSION:\s*(\S+)\s+v?([\d\.]+)\s*\|\s*([^\n-->]+)/i;
    const newHeader = `PROMPT VERSION: ${promptName} v${version} | ${datetime}`;
    if (regex.test(text)) {
      return text.replace(regex, newHeader);
    } else {
      return `<!--\nPROMPT VERSION: ${promptName} v${version} | ${datetime}\n-->\n\n${text}`;
    }
  };

  const handleVersionChange = (newVersion: string) => {
    const currentText = prompts[activeTab] || '';
    const name = parsedHeader?.name || `${activeTab}Prompt`;
    const datetime = parsedHeader?.datetime || new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated = updatePromptHeader(currentText, name, newVersion, datetime);
    setPrompts(prev => ({ ...prev, [activeTab]: updated }));
  };

  const handleDatetimeChange = (newDatetime: string) => {
    const currentText = prompts[activeTab] || '';
    const name = parsedHeader?.name || `${activeTab}Prompt`;
    const version = parsedHeader?.version || '1.0';
    const updated = updatePromptHeader(currentText, name, version, newDatetime);
    setPrompts(prev => ({ ...prev, [activeTab]: updated }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-xs select-none">
      {/* Modal Box */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-7xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        
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
        <div className="flex-1 overflow-y-auto p-8 flex flex-col md:flex-row gap-8 min-h-0">
          
          {/* Left Column: Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs header */}
            <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 self-start w-full">
              <button
                onClick={() => setActiveTab('externalAdvice')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'externalAdvice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Project Info Advice</span>
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
              <button
                onClick={() => setActiveTab('observationsExtraction')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'observationsExtraction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Observation Extraction</span>
              </button>
            </div>

            {/* Prompt Description */}
            <p className="text-xs text-slate-500 mb-3 text-left leading-relaxed">
              {activeTab === 'externalAdvice' && "Used to analyze project criteria and generate missing details & recommendations visible to external clients."}
              {activeTab === 'evaluatorDraft' && "Used by Scape Engineers to generate a comprehensive draft technical report in the administrative review page."}
              {activeTab === 'autoFill' && "Instructions for the interactive chat assistant that handles free-text inputs and proposes structured form edits."}
              {activeTab === 'observationsExtraction' && "Used to parse generated advice reports and extract structured, field-level warning tooltips."}
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

            {/* Version & Datetime Manager Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl mb-4 text-left">
              <div className="flex-1 flex flex-col gap-1 min-w-[150px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompt Header Name</span>
                <span className="text-xs font-bold text-slate-700 font-mono truncate">
                  {parsedHeader?.name || `${activeTab}Prompt`}
                </span>
              </div>
              
              <div className="w-full sm:w-28 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</label>
                <input
                  type="text"
                  value={currentVersion}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  placeholder="e.g. 3.0"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version Date/Time</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentDatetime}
                    onChange={(e) => handleDatetimeChange(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM"
                    className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    onClick={() => {
                      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
                      handleDatetimeChange(nowStr);
                    }}
                    className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
                    title="Set to current date and time"
                  >
                    Now
                  </button>
                </div>
              </div>
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
            
            {/* Fallback & Import/Export/Reset row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                Stored in: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold select-all">/config/prompts</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isLoading || isSaving}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  title="Download the current prompt as a markdown file (.md)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isSaving}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  title="Upload and load a prompt from a markdown file (.md)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  accept=".md,.txt"
                  className="hidden"
                />
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
          </div>

          {/* Right Column: Revision History */}
          <div className="w-full md:w-72 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-left">
              <History className="w-4 h-4 text-slate-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revision History</h3>
                <p className="text-[10px] text-slate-400">Last 6 saves to cloud</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-[400px] pr-1">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-medium">Loading history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-[11px] text-slate-400 italic bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                  No revisions found
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex flex-col gap-2 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]" title={item.createdBy}>
                        {formatEmail(item.createdBy)}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={isLoading || isSaving}
                      className="w-full text-center text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Load Revision
                    </button>
                  </div>
                ))
              )}
            </div>
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

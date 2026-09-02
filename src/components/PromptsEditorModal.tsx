import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { X, Save, FileText, Bot, Sparkles, Loader2, RefreshCw, Download, Upload, History, BookOpen, QrCode, Plus, Trash2, CheckCircle, Copy, Calendar, Tag, ExternalLink } from 'lucide-react';
import { EventPasscode } from '../types';

// Import local filesystem prompt files as defaults/fallbacks using Vite's ?raw import
import defaultExternalAdvice from '../docs/externalAdvicePrompt.md?raw';
import defaultEvaluatorDraft from '../docs/evaluatorDraftPrompt.md?raw';
import defaultAutoFill from '../docs/autoFillPrompt.md?raw';
import defaultObservationsExtraction from '../docs/observationsExtractionPrompt.md?raw';
import defaultAppSupportGuide from '../docs/appSupportGuide.md?raw';

interface PromptsEditorModalProps {
  show: boolean;
  onClose: () => void;
  setGlobalSuccess: (msg: string | null) => void;
  initialTab?: PromptType;
}

type PromptType = 'externalAdvice' | 'evaluatorDraft' | 'autoFill' | 'observationsExtraction' | 'appSupportGuide' | 'campaignTags';

export function PromptsEditorModal({ show, onClose, setGlobalSuccess, initialTab }: PromptsEditorModalProps) {
  const [activeTab, setActiveTab] = useState<PromptType>(initialTab || 'externalAdvice');
  const [prompts, setPrompts] = useState<Record<string, string>>({
    externalAdvice: '',
    evaluatorDraft: '',
    autoFill: '',
    observationsExtraction: '',
    appSupportGuide: ''
  });
  const [includeImages, setIncludeImages] = useState<Record<string, boolean>>({
    externalAdvice: true,
    evaluatorDraft: true,
    autoFill: false,
    observationsExtraction: false,
    appSupportGuide: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campaign tags state
  const [eventPasscodes, setEventPasscodes] = useState<Record<string, EventPasscode>>({});
  const [newTagCode, setNewTagCode] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagExpiry, setNewTagExpiry] = useState('2026-10-05');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Revision history state
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load prompts and history on open
  useEffect(() => {
    if (show) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      loadPrompts();
      loadHistory();
      loadAccessConfig();
    }
  }, [show, initialTab]);

  const loadAccessConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'access'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.activeEventPasscodes && Object.keys(data.activeEventPasscodes).length > 0) {
          setEventPasscodes(data.activeEventPasscodes);
        } else {
          setEventPasscodes({
            open: {
              code: 'Open',
              name: 'General Public / In-App QR Access',
              active: true,
              expiresAt: '2030-01-01',
              createdAt: '2026-09-01'
            },
            automatik26: {
              code: 'Automatik26',
              name: 'Automatik 2026 Messe',
              active: true,
              expiresAt: '2026-10-05',
              createdAt: '2026-09-01'
            }
          });
        }
      } else {
        setEventPasscodes({
          open: {
            code: 'Open',
            name: 'General Public / In-App QR Access',
            active: true,
            expiresAt: '2030-01-01',
            createdAt: '2026-09-01'
          },
          automatik26: {
            code: 'Automatik26',
            name: 'Automatik 2026 Messe',
            active: true,
            expiresAt: '2026-10-05',
            createdAt: '2026-09-01'
          }
        });
      }
    } catch (e) {
      console.error("Failed to load config/access:", e);
    }
  };

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
          observationsExtraction: data.observationsExtractionPrompt || '',
          appSupportGuide: data.appSupportGuide || data.appHelpGuide || ''
        });
        setIncludeImages({
          externalAdvice: data.includeImagesForAdvice !== false,
          evaluatorDraft: data.includeImagesForDraft !== false,
          autoFill: !!data.includeImagesForChat,
          observationsExtraction: !!data.includeImagesForExtraction,
          appSupportGuide: false
        });
      } else {
        // Preload default local filesystem values if the database document does not exist yet
        setPrompts({
          externalAdvice: defaultExternalAdvice.trim(),
          evaluatorDraft: defaultEvaluatorDraft.trim(),
          autoFill: defaultAutoFill.trim(),
          observationsExtraction: defaultObservationsExtraction.trim(),
          appSupportGuide: defaultAppSupportGuide.trim()
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
        appSupportGuide: prompts.appSupportGuide,
        includeImagesForAdvice: includeImages.externalAdvice,
        includeImagesForDraft: includeImages.evaluatorDraft,
        includeImagesForChat: includeImages.autoFill,
        includeImagesForExtraction: includeImages.observationsExtraction,
        updatedAt: timestamp
      }, { merge: true });

      // Update activeEventPasscodes in config/access
      try {
        await setDoc(doc(db, 'config', 'access'), {
          activeEventPasscodes: eventPasscodes
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to update config/access event tags:", err);
      }

      // Save revision history snapshot
      try {
        const historyRef = collection(db, 'config', 'prompts', 'history');
        await addDoc(historyRef, {
          externalAdvicePrompt: prompts.externalAdvice,
          evaluatorDraftPrompt: prompts.evaluatorDraft,
          autoFillPrompt: prompts.autoFill,
          observationsExtractionPrompt: prompts.observationsExtraction,
          appSupportGuide: prompts.appSupportGuide,
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

      setGlobalSuccess("Prompts, Support Guide & Campaign Tags saved successfully!");
      setTimeout(() => setGlobalSuccess(null), 5000);
      onClose();
    } catch (e) {
      console.error("Failed to save to Firestore:", e);
      alert("Failed to save: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTagActive = (key: string) => {
    setEventPasscodes(prev => {
      const current = prev[key];
      if (!current) return prev;
      return {
        ...prev,
        [key]: {
          ...current,
          active: !current.active
        }
      };
    });
  };

  const handleDeleteTag = (key: string) => {
    if (confirm(`Are you sure you want to delete campaign tag "${key}"?`)) {
      setEventPasscodes(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const handleAddNewTag = () => {
    if (!newTagCode.trim()) {
      alert("Please enter a tag / pass code (e.g. Automatik26).");
      return;
    }
    const key = newTagCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (eventPasscodes[key]) {
      alert("A tag with this key already exists!");
      return;
    }
    setEventPasscodes(prev => ({
      ...prev,
      [key]: {
        code: newTagCode.trim(),
        name: newTagName.trim() || newTagCode.trim(),
        active: true,
        expiresAt: newTagExpiry || '2026-10-05',
        createdAt: new Date().toISOString().split('T')[0]
      }
    }));
    setNewTagCode('');
    setNewTagName('');
  };

  const handleCopyLink = (code: string, key: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://scape-bin-picker-projects.web.app';
    const url = `${origin}/?event=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleResetToDefault = () => {
    if (confirm("Are you sure you want to reset the current active tab prompt to its local markdown file default values?")) {
      const defaultText =
        activeTab === 'externalAdvice' ? defaultExternalAdvice.trim() :
          activeTab === 'evaluatorDraft' ? defaultEvaluatorDraft.trim() :
            activeTab === 'autoFill' ? defaultAutoFill.trim() :
              activeTab === 'observationsExtraction' ? defaultObservationsExtraction.trim() :
                defaultAppHelpGuide.trim();

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
        observationsExtraction: item.observationsExtractionPrompt || '',
        appSupportGuide: item.appSupportGuide || item.appHelpGuide || ''
      });
      setIncludeImages({
        externalAdvice: item.includeImagesForAdvice !== false,
        evaluatorDraft: item.includeImagesForDraft !== false,
        autoFill: !!item.includeImagesForChat,
        observationsExtraction: !!item.includeImagesForExtraction,
        appSupportGuide: false
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs select-none">
      {/* Modal Box */}
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-7xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/10 shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">AI System Prompts & Support Editor</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Dynamically adjust Gemini prompts & support docs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 min-h-0">

          {/* Left Column: Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs header (Scrollable horizontal pill bar for narrow viewports) */}
            <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-2xl mb-4 w-full shrink-0 no-scrollbar">
              <button
                onClick={() => setActiveTab('externalAdvice')}
                className={`shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === 'externalAdvice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Project Info Advice</span>
              </button>
              <button
                onClick={() => setActiveTab('evaluatorDraft')}
                className={`shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === 'evaluatorDraft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Technical Evaluation</span>
              </button>
              <button
                onClick={() => setActiveTab('autoFill')}
                className={`shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === 'autoFill' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Chat Assistant</span>
              </button>
              <button
                onClick={() => setActiveTab('observationsExtraction')}
                className={`shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === 'observationsExtraction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Observation Extraction</span>
              </button>
              <button
                onClick={() => setActiveTab('appSupportGuide')}
                className={`shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === 'appSupportGuide' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>App Support Guide</span>
              </button>
              <button
                onClick={() => setActiveTab('campaignTags')}
                className={`shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === 'campaignTags' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Campaign & QR Tags</span>
              </button>
            </div>

            {/* Campaign Tags View */}
            {activeTab === 'campaignTags' ? (
              <div className="flex-1 flex flex-col min-h-0 text-left">
                {/* Description */}
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Manage active event pass codes and QR campaign tags (e.g. for expos or LinkedIn promotions). Visitors using an active campaign link can register and access the app directly.
                </p>

                {/* Create New Tag Box */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Create New Campaign Passcode / QR Tag</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Tag / Passcode</label>
                      <input
                        type="text"
                        value={newTagCode}
                        onChange={(e) => setNewTagCode(e.target.value)}
                        placeholder="e.g. Automatik26"
                        className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Campaign / Event Name</label>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="e.g. Automatik 2026 Messe"
                        className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Expires On (YYYY-MM-DD)</label>
                      <input
                        type="date"
                        value={newTagExpiry}
                        onChange={(e) => setNewTagExpiry(e.target.value)}
                        className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddNewTag}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Campaign Tag</span>
                  </button>
                </div>

                {/* Active Campaign Tags List */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white p-3 space-y-2.5 max-h-[340px]">
                  {Object.keys(eventPasscodes).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      No campaign tags configured. Add one above!
                    </div>
                  ) : (
                    Object.entries(eventPasscodes).map(([key, item]) => {
                      const isExpired = item.expiresAt && (new Date().toISOString().split('T')[0] > item.expiresAt);
                      const isOnline = item.active !== false && !isExpired;

                      return (
                        <div
                          key={key}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isOnline 
                              ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs' 
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${isOnline ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {item.code || key}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isOnline 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : (isExpired ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600')
                                }`}>
                                  {isExpired ? 'Expired' : (item.active !== false ? 'ACTIVE / OPEN' : 'OFF / PAUSED')}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-700 mt-1">{item.name || key}</p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Expires: {item.expiresAt || 'No expiration'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleCopyLink(item.code || key, key)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Copy URL for QR Code or Link sharing"
                            >
                              {copiedKey === key ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Copy QR Link</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleToggleTagActive(key)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.active !== false 
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                              title={item.active !== false ? 'Click to Pause / Turn OFF' : 'Click to Activate'}
                            >
                              {item.active !== false ? 'Pause (OFF)' : 'Activate (ON)'}
                            </button>

                            <button
                              onClick={() => handleDeleteTag(key)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="Delete tag"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 text-[10px] text-slate-400">
                  Changes to Campaign Tags take effect immediately when clicking <strong>"Save Prompts & Support Docs"</strong> below.
                </div>
              </div>
            ) : (
              <>
                {/* Prompt Description */}
                <p className="text-xs text-slate-500 mb-3 text-left leading-relaxed shrink-0">
                  {activeTab === 'externalAdvice' && "Used to analyze project criteria and generate missing details & recommendations visible to external clients."}
                  {activeTab === 'evaluatorDraft' && "Used by Scape Engineers to generate a comprehensive draft technical report in the administrative review page."}
                  {activeTab === 'autoFill' && "Instructions for the interactive chat assistant that handles free-text inputs and proposes structured form edits."}
                  {activeTab === 'observationsExtraction' && "Used to parse generated advice reports and extract structured, field-level warning tooltips."}
                  {activeTab === 'appSupportGuide' && "Authoritative Scape user manual and knowledge base used by the Support AI (/api/support-chat) to answer app navigation & physics questions."}
                </p>

                {/* Include Images Toggle Switch (Only for prompts that accept images) */}
                {activeTab !== 'appSupportGuide' && (
                  <div className="flex items-center gap-3 mb-4 select-none self-start shrink-0">
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
                )}

                {/* Version & Datetime Manager Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 border border-slate-200/60 p-3.5 sm:p-4 rounded-2xl mb-4 text-left shrink-0">
                  <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document / Prompt Name</span>
                    <span className="text-xs font-bold text-slate-700 font-mono truncate">
                      {parsedHeader?.name || `${activeTab}`}
                    </span>
                  </div>

                  <div className="w-full sm:w-28 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</label>
                    <input
                      type="text"
                      value={currentVersion}
                      onChange={(e) => handleVersionChange(e.target.value)}
                      placeholder="e.g. 1.0"
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 w-full"
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
                        className="flex-1 min-w-0 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        onClick={() => {
                          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
                          handleDatetimeChange(nowStr);
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-slate-200/70 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                        title="Set to current date and time"
                      >
                        Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Textarea Editor */}
                <div className="flex-1 relative flex flex-col min-h-[260px] sm:min-h-[300px]">
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
                    placeholder={`Write your prompt or support document instructions here in markdown...`}
                    disabled={isLoading || isSaving}
                    className="flex-1 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 w-full outline-none focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none custom-scrollbar min-h-[240px]"
                  />
                </div>

                {/* Fallback & Import/Export/Reset row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                    Stored in: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold select-all">/config/prompts.{activeTab}</code>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownload}
                      disabled={isLoading || isSaving}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export .md</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isSaving}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import .md</span>
                    </button>
                    <button
                      onClick={handleResetToDefault}
                      disabled={isLoading || isSaving}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset to local default</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Revision History */}
          <div className="w-full md:w-64 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-6 shrink-0">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-left">
              <History className="w-4 h-4 text-slate-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revision History</h3>
                <p className="text-[10px] text-slate-400">Last 6 saves to cloud</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-[220px] md:max-h-full pr-1">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-medium">Loading history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-slate-400 italic bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                  No revisions found
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex flex-col gap-2 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[130px]" title={item.createdBy}>
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
        <div className="px-4 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100 text-slate-600 transition-all select-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all select-none cursor-pointer disabled:opacity-50 ${
              activeTab === 'campaignTags'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                : activeTab === 'appSupportGuide'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'campaignTags'
                    ? 'Save Campaign Tags to Firebase'
                    : activeTab === 'appSupportGuide'
                    ? 'Save Support Guide'
                    : 'Save Prompts & Settings'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}


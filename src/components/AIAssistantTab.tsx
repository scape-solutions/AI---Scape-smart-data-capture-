import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Check, Edit2, CheckCircle2, HelpCircle, Paperclip, X, FileText, MessageSquare, BookOpen, Volume2, Mic } from 'lucide-react';
import { ProjectState } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';
import ReactMarkdown from 'react-markdown';

/**
 * Renders Markdown text with built-in support for GFM markdown tables without external npm dependencies.
 */
function CustomMarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks: Array<{ type: 'markdown' | 'table'; content: string | { headers: string[]; rows: string[][] } }> = [];

  let currentMarkdownLines: string[] = [];
  let currentTableLines: string[] = [];

  const flushMarkdown = () => {
    if (currentMarkdownLines.length > 0) {
      blocks.push({ type: 'markdown', content: currentMarkdownLines.join('\n') });
      currentMarkdownLines = [];
    }
  };

  const flushTable = () => {
    if (currentTableLines.length >= 2) {
      const cleanLine = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '');
      const parseRow = (line: string) => cleanLine(line).split('|').map(cell => cell.trim());

      const headers = parseRow(currentTableLines[0]);
      const isSeparator = (line: string) => /^[\s|:-]+$/.test(line);
      const startIndex = isSeparator(currentTableLines[1]) ? 2 : 1;
      const rows = currentTableLines.slice(startIndex).map(parseRow).filter(r => r.length > 0 && r.some(c => c !== ''));

      blocks.push({ type: 'table', content: { headers, rows } });
    } else if (currentTableLines.length > 0) {
      currentMarkdownLines.push(...currentTableLines);
    }
    currentTableLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

    if (isTableLine) {
      flushMarkdown();
      currentTableLines.push(line);
    } else {
      flushTable();
      currentMarkdownLines.push(line);
    }
  }
  flushMarkdown();
  flushTable();

  return (
    <div className="space-y-2">
      {blocks.map((block, bIdx) => {
        if (block.type === 'markdown') {
          return <ReactMarkdown key={bIdx}>{block.content as string}</ReactMarkdown>;
        }
        const { headers, rows } = block.content as { headers: string[]; rows: string[][] };
        return (
          <div key={bIdx} className="overflow-x-auto my-3 border border-slate-200/90 rounded-xl shadow-2xs bg-white">
            <table className="min-w-full border-collapse text-xs text-left">
              <thead className="bg-slate-100/90 font-bold text-slate-800 border-b border-slate-200">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/60 last:border-r-0">
                      <ReactMarkdown>{h}</ReactMarkdown>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100 last:border-r-0 leading-relaxed">
                        <ReactMarkdown>{cell}</ReactMarkdown>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─── FELT-LABEL OPSLAGSTABEL ───────────────────────────────────────────────────
// Vi opbygger en ordbog (map) over alle felt-ID'er og deres tilhørende tekst-labels.
// Dette bruges til at vise pæne navne i UI'et (f.eks. "2.01 · Part Name") i stedet for bare rå ID'er.
const FIELD_LABEL_MAP: Record<string, string> = {};
[...GENERAL_STEPS, ...PART_STEPS].forEach(step => {
  step.questions.forEach(q => { FIELD_LABEL_MAP[q.id] = q.label; });
});

// ─── PROPS FOR HOVEDKOMPONENTEN ───────────────────────────────────────────────
interface AIAssistantTabProps {
  currentProject: ProjectState; // Det nuværende projekt-state
  setCurrentProject: (p: ProjectState) => void; // Funktion til at opdatere projekt-state lokalt
  sendMessageToAssistant: (msg: string, images?: string[]) => Promise<void>; // Funktion til at sende en besked til AI-assistenten
  isGeneratingReport: boolean; // Angiver om AI'en er i gang med at generere et svar (viser loading)
  updateProjectField: (p: ProjectState, field: keyof ProjectState, value: any, comment: string) => Promise<void>; // Opdaterer et specifikt felt i Firestore
  saveProject?: (status?: ProjectState['status'], projectToSave?: ProjectState) => Promise<ProjectState | null>; // Gemmer hele projektet i databasen
  activePartIndex: number; // Indekset for det emne (part) brugeren redigerer lige nu (0-baseret)
  isReadOnly?: boolean; // Angiver om siden er låst / skrivebeskyttet
  hasUnappliedProposals?: boolean; // Tjekker om der ligger AI-forslag, som brugeren endnu ikke har godkendt
}

// ─── PARSNING AF AI'ENS SVAR ──────────────────────────────────────────────────
// AI'ens rå svartekst splittes op i strukturerede sektioner baseret på markørerne:
// ---FACTS---, ---QUESTIONS--- og ---END---
interface ParsedAIResponse {
  facts: string[];       // Liste af punkter fra ---FACTS--- sektionen (bekræftede fakta)
  questions: string[];   // Liste af punkter fra ---QUESTIONS--- sektionen (mangler)
  prose: string;         // Eventuel fritekst/introduktion skrevet af AI'en
  jsonProposal: any;     // Det foreslåede JSON-objekt med feltopdateringer
}

function parseAIResponse(text: string): ParsedAIResponse {
  // 1. Ekstraher JSON-blokken (koder inden i ```json ... ```) og pil den ud af teksten
  let jsonProposal: any = null;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch) {
    try { 
      jsonProposal = JSON.parse(jsonMatch[1]);
      
      // Fallback: If AI puts images directly into parts array instead of using suggestedAction
      if (!jsonProposal.suggestedAction && jsonProposal.parts && Array.isArray(jsonProposal.parts)) {
        const partWithImageIdx = jsonProposal.parts.findIndex((p: any) => p.images && p.images.length > 0);
        if (partWithImageIdx !== -1) {
          jsonProposal.suggestedAction = 'assign_image';
          jsonProposal.targetPart = partWithImageIdx;
        }
      }
    } catch { /* ignorer parse-fejl */ }
  }
  // Fjern JSON-blokken fra den tekst, vi skal lede efter headers i
  const stripped = text.replace(/```(?:json)?\s*[\s\S]*?\s*```/i, '').trim();

  // 2. Find FACTS- og QUESTIONS-sektionerne ved hjælp af Regular Expressions (RegEx)
  // De kigger efter tekst mellem f.eks. ---FACTS--- og enten ---QUESTIONS--- eller ---END---
  const factsMatch = stripped.match(/---FACTS---\s*([\s\S]*?)(?=---QUESTIONS---|---END---|$)/i);
  const questionsMatch = stripped.match(/---QUESTIONS---\s*([\s\S]*?)(?=---END---|---FACTS---|$)/i);

  // Hjælpefunktion til at splitte sektionen op i linjer og rense punkttegn (•, -, *, tal) væk
  const parseBullets = (raw: string): string[] =>
    raw
      .split('\n')
      .map(l => l.replace(/^(?:[•\-*]|\d+[.)]\s+|\d+:\s+|q\d+[:.)]\s*)\s*/i, '').trim())
      .filter(l => l.length > 0);

  const facts = factsMatch ? parseBullets(factsMatch[1]) : [];
  const questions = questionsMatch ? parseBullets(questionsMatch[1]) : [];

  // 3. Alt tekst før den første markør betragtes som almindelig prosa (introduktion fra AI'en)
  const prose = stripped.split(/---FACTS---|---QUESTIONS---|---END---/i)[0].trim();

  return { facts, questions, prose, jsonProposal };
}

// ─── SAMMENLIGNING AF VÆRDIER ─────────────────────────────────────────────────
// Sammenligner en nuværende værdi med et AI-forslag. Normaliserer tomme felter og 
// konverterer alt til tekst/trimmer, så f.eks. tallet 5 og strengen "5" betragtes som ens.
export function areValuesEqual(currentVal: any, proposalVal: any): boolean {
  const isCurrentEmpty = currentVal === undefined || currentVal === null || String(currentVal).trim() === '';
  const isProposalEmpty = proposalVal === undefined || proposalVal === null || String(proposalVal).trim() === '';
  if (isCurrentEmpty && isProposalEmpty) return true;
  if (isCurrentEmpty !== isProposalEmpty) return false;
  const normalize = (v: any) => String(v).trim();
  return normalize(currentVal) === normalize(proposalVal);
}

// Tjekker om alle foreslåede felt-opdateringer i et JSON-forslag allerede er skrevet ind i projektet.
// Hvis de er det, behøver vi ikke vise "Apply Changes"-knappen for dette kort.
export function isProposalAlreadyApplied(proposal: any, currentProject: ProjectState, activePartIndex: number): boolean {
  if (!proposal) return false;
  if (proposal.suggestedAction === 'assign_image') return false;
  if (proposal.suggestedAction === 'move_image') return false;
  if (proposal.suggestedAction === 'copy_image') return false;
  if (proposal.suggestedAction === 'delete_image') return false;

  // Tjek generelle stamdata (generalResponses)
  if (proposal.generalResponses) {
    for (const [key, val] of Object.entries(proposal.generalResponses)) {
      const currentVal = currentProject.generalResponses?.[key];
      const match = areValuesEqual(currentVal, val);
      if (!match) return false;
    }
  }
  
  // Tjek emne-specifikke data (parts responses)
  if (proposal.parts && Array.isArray(proposal.parts)) {
    const isSinglePartProposal = proposal.parts.length === 1;
    for (let idx = 0; idx < proposal.parts.length; idx++) {
      const aiPart = proposal.parts[idx];
      // Hvis AI'en kun foreslår ét emne, og vi redigerer et emne med indeks > 0, 
      // så mapper vi AI'ens forslag til det aktive emneindeks.
      const targetIdx = (isSinglePartProposal && activePartIndex > 0) ? activePartIndex : idx;
      const part = currentProject.parts?.[targetIdx];
      if (!part) return false;
      
      if (aiPart.responses) {
        for (const [key, val] of Object.entries(aiPart.responses)) {
          const currentVal = part.responses?.[key];
          const match = areValuesEqual(currentVal, val);
          if (!match) return false;
        }
      }
    }
  }
  
  return true;
}

// ─── HOVEDKOMPONENT: AIAssistantTab ──────────────────────────────────────────
export function AIAssistantTab({
  currentProject,
  setCurrentProject,
  sendMessageToAssistant,
  isGeneratingReport,
  updateProjectField,
  saveProject,
  activePartIndex,
  isReadOnly = false,
  hasUnappliedProposals = false,
}: AIAssistantTabProps) {
  const [input, setInput] = useState(''); // Indtastningsfeltet til chatten
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null); // Reference til chat-vinduet til styring af scrollbar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat'); // Aktiv fane: chat eller rapport
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Juster højden på textarea automatisk baseret på indhold og skærmstørrelse
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset højde for at genberegne scrollHeight korrekt
    textarea.style.height = 'auto';
    
    // Højderestriktioner: max 90px på mobil (under 768px), max 200px på desktop
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile ? 90 : 200;
    
    const scrollHeight = textarea.scrollHeight;
    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  }, [input]);

  // Scroll automatisk til bunden af chatten, hver gang historikken ændrer sig eller fane skiftes
  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentProject.chatHistory, activeTab]);

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          alert("Billedet er for stort / Image is too large. Max 10MB allowed.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          
          // Simple compress before adding
          const img = new Image();
          img.src = result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            const MAX_HEIGHT = 1000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height *= MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width *= MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setPendingImages(prev => [...prev, compressed]);
          };
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        if (file.size > 5 * 1024 * 1024) {
          alert("PDF-filen er for stor / PDF is too large. Max 5MB allowed to prevent API quota/timeout issues.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          setPendingImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('audio/') || file.name.match(/\.(m4a|mp3|wav|ogg|aac|webm|flac|m4v)$/i)) {
        if (file.size > 25 * 1024 * 1024) {
          alert("Lydfilen er for stor / Audio file is too large. Max 25MB allowed.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          let result = ev.target?.result as string;
          // Normalize m4a mime type if needed for Gemini
          if (result.startsWith('data:;') || result.startsWith('data:audio/x-m4a;') || result.startsWith('data:application/octet-stream;')) {
            result = result.replace(/^data:[^;]*;/, 'data:audio/mp4;');
          }
          setPendingImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Håndterer afsendelse af chat-beskeder
  const handleSend = () => {
    if ((!input.trim() && pendingImages.length === 0) || isGeneratingReport) return;
    sendMessageToAssistant(input, pendingImages.length > 0 ? pendingImages : undefined);
    setInput('');
    setPendingImages([]);
  };

  // Live voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
      
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      alert("Microphone access was denied or is not supported. Please check browser microphone permissions.");
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        if (shouldSend && audioChunksRef.current.length > 0) {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            let base64data = reader.result as string;
            // Normalize m4a mime type if needed for Gemini
            if (base64data.startsWith('data:;') || base64data.startsWith('data:audio/x-m4a;') || base64data.startsWith('data:application/octet-stream;')) {
              base64data = base64data.replace(/^data:[^;]*;/, 'data:audio/mp4;');
            }
            sendMessageToAssistant(
              input.trim() ? input.trim() : "🎙️ Voice memo (audio recording)",
              [base64data]
            );
            setInput('');
          };
          reader.readAsDataURL(audioBlob);
        }
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop());
          audioStreamRef.current = null;
        }
        audioChunksRef.current = [];
      };
      recorder.stop();
    } else if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }

    setIsRecording(false);
    setRecordingDuration(0);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Find indekset for det NYESTE AI-svar, som indeholder et JSON-forslag.
  // Vi vil kun tillade brugeren at klikke "Apply Changes" på det nyeste forslag.
  // Ældre forslag markeres som forældede (superseded).
  const lastProposalMsgIdx = React.useMemo(() => {
    const history = currentProject.chatHistory ?? [];
    for (let i = history.length - 1; i >= 0; i--) {
      const m = history[i];
      if (m.role === 'model' && parseAIResponse(m.text).jsonProposal) return i;
    }
    return -1;
  }, [currentProject.chatHistory]);

  return (
    <div 
      className="flex flex-col h-full bg-slate-50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-xs border-2 border-dashed border-indigo-500 z-[100] flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 text-indigo-600">
            <Paperclip className="w-8 h-8 animate-bounce" />
            <span className="text-sm font-bold">Drop images, PDFs, or audio recordings here to attach</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Images, PDFs, and Audio files (.m4a, .mp3, .wav) supported</span>
          </div>
        </div>
      )}

      {/* Top bjælke med titel og ikon og fane-vælger */}
      <div className="p-3 md:p-5 bg-white border-b border-slate-200 shrink-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-500" />
            AI Assistant
          </h2>
          {currentProject.name && (
            <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl truncate max-w-[200px]" title={currentProject.name}>
              📁 {currentProject.name}
            </span>
          )}
        </div>
        
        {/* Double-Tab navigation */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 select-none">
          <button 
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/20' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat Assistant
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'report' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/20' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            AI Advice Report
          </button>
        </div>
      </div>

      {activeTab === 'report' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900 text-slate-300 leading-relaxed custom-scrollbar selection:bg-blue-600 selection:text-white">
          {currentProject.report ? (
            <div className="space-y-4 text-sm font-medium [&>h1]:text-2xl [&>h1]:font-black [&>h1]:text-white [&>h1]:border-b [&>h1]:border-white/10 [&>h1]:pb-2 [&>h1]:mt-6 [&>h1]:mb-4 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-5 [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:mb-4 [&>li]:mb-1 [&>strong]:text-white [&>strong]:font-bold [&>a]:text-blue-400 [&>a]:hover:underline">
              <ReactMarkdown>
                {currentProject.report}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12 px-6">
              <FileText className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
              <p className="font-bold text-sm">No report generated yet.</p>
              <p className="text-xs mt-1 max-w-xs opacity-75">
                Go to the **Review / Submit** tab and generate your feasibility report. Once created, it will display here.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Advarselsbjælke i toppen, hvis der ligger ubehandlede ændringer */}
          {hasUnappliedProposals && !isReadOnly && (
            <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 md:px-5 md:py-2.5 text-xs text-amber-800 font-semibold flex items-center gap-1.5 animate-fadeIn select-none shrink-0">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              You have proposed changes that haven't been applied yet. Scroll to review them.
            </div>
          )}

          {/* Selve chat-beskedlisten */}
          <div 
            className="flex-1 overflow-y-auto p-3.5 md:p-4 space-y-4 md:space-y-5" 
            ref={scrollRef}
            onTouchStart={(e) => {
              // På mobiler lukker vi tastaturet (blur), hvis brugeren scroller på baggrunden
              const active = document.activeElement;
              if (active instanceof HTMLElement && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
                const target = e.target as HTMLElement;
                if (!target.closest('button') && !target.closest('input') && !target.closest('textarea')) {
                  active.blur();
                }
              }
            }}
          >
            {/* Velkomstskærm hvis chatten er tom */}
            {(!currentProject.chatHistory || currentProject.chatHistory.length === 0) && (
              <div className="text-center mt-12 text-slate-400 px-6">
                <Bot className="w-14 h-14 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Start by describing your project.</p>
                <p className="text-sm mt-1 opacity-70">
                  E.g. "We need to pick metal cylinders from a bin using a Kuka robot…"
                </p>
              </div>
            )}

            {currentProject.chatHistory?.map((msg, idx) => {
              const isUser = msg.role === 'user';

              // Hvis beskeden er fra brugeren (User)
              if (isUser) {
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="flex items-start gap-2.5 max-w-[85%] flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {msg.images.map((img, imgIdx) => {
                              const isPdf = img.startsWith('data:application/pdf') || img === 'pdf:placeholder';
                              const isAudio = img.startsWith('data:audio/') || img === 'audio:placeholder';
                              return isPdf ? (
                                <div key={imgIdx} className="w-24 h-24 bg-white/10 rounded-lg border border-indigo-400 flex flex-col items-center justify-center text-white p-2">
                                  <FileText className="w-6 h-6 mb-1 text-red-200" />
                                  <span className="text-[10px] font-black uppercase text-indigo-100">PDF</span>
                                  <span className="text-[8px] opacity-70 mt-1 truncate max-w-full text-center">Document</span>
                                </div>
                              ) : isAudio ? (
                                <div key={imgIdx} className="p-2.5 bg-white/15 rounded-xl border border-indigo-300/40 flex flex-col gap-1.5 text-white max-w-xs">
                                  <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <Volume2 className="w-4 h-4 text-amber-300 shrink-0" />
                                    <span>Audio Recording</span>
                                  </div>
                                  {img.startsWith('data:audio/') ? (
                                    <audio controls className="h-7 w-48 max-w-full rounded-md mt-1" src={img} />
                                  ) : (
                                    <span className="text-[10px] text-indigo-100 italic">Analyzed voice memo</span>
                                  )}
                                </div>
                              ) : img === 'image:placeholder' ? (
                                <div key={imgIdx} className="w-24 h-24 bg-white/10 rounded-lg border border-indigo-400 flex flex-col items-center justify-center text-white p-2 text-center">
                                  <span className="text-[10px] font-bold text-indigo-100">Image</span>
                                </div>
                              ) : (
                                <img key={imgIdx} src={img} alt="User upload" className="w-24 h-24 object-cover rounded-lg border border-indigo-400" />
                              );
                            })}
                          </div>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              }

              // Hvis beskeden er fra Support-AI'en (isSupport)
              if ((msg as any).isSupport) {
                return (
                  <div key={idx} className="flex flex-col items-start gap-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">App & Technical Support</span>
                    </div>

                    <div className="ml-9 w-[90%] bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 text-sm text-slate-800 leading-relaxed shadow-2xs break-words">
                      <CustomMarkdownRenderer content={msg.text} />
                    </div>
                  </div>
                );
              }

              // Hvis beskeden er fra AI-assistenten (Model) -> Split den op og vis kort
              const parsed = parseAIResponse(msg.text);

              return (
                <div key={idx} className="flex flex-col items-start gap-3">
                  {/* AI-avatar */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Assistant</span>
                  </div>

                  <div className="ml-9 space-y-3 w-[90%]">
                    {/* 1. Vis AI'ens indledende tekst/prosa */}
                    {parsed.prose && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 text-sm text-slate-700 leading-relaxed shadow-xs break-words">
                        <CustomMarkdownRenderer content={parsed.prose} />
                      </div>
                    )}

                    {/* 2. Det grønne FAKTA-kort (bekræftede feltværdier) */}
                    {parsed.facts.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 border-b border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">
                            Facts confirmed so far
                          </span>
                        </div>
                        <ul className="px-4 py-3 space-y-1.5">
                          {parsed.facts.map((fact, i) => (
                            <li key={i} className="text-sm text-emerald-900 flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 3. Det lilla SPØRGSMÅLS-kort (mangler, der udestår) */}
                    {parsed.questions.length > 0 && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 border-b border-indigo-200">
                          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-black text-indigo-800 uppercase tracking-widest">
                            Still need to know
                          </span>
                        </div>
                        <ul className="px-4 py-3 space-y-1.5">
                          {parsed.questions.map((q, i) => (
                            <li key={i} className="text-sm text-indigo-900 flex items-start gap-3">
                              <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 select-none">
                                {i + 1}
                              </span>
                              <span className="pt-0.5">{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 4. Det gule FORSLAGS-kort (hvis der er foreslåede feltændringer i JSON) */}
                    {parsed.jsonProposal && (
                      <ProposedChangesCard
                        proposal={parsed.jsonProposal}
                        currentProject={currentProject}
                        setCurrentProject={setCurrentProject}
                        updateProjectField={updateProjectField}
                        saveProject={saveProject}
                        activePartIndex={activePartIndex}
                        isReadOnly={isReadOnly}
                        isLatest={idx === lastProposalMsgIdx}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Skrive-indikator (når AI'en tænker og genererer svar) */}
            {isGeneratingReport && (
              <div className="flex items-start gap-2.5 animate-fadeIn">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            )}
          </div>

          {/* Skrivefelt og send-knap i bunden */}
          <div className="p-2.5 md:p-4 bg-white border-t border-slate-200 shrink-0">
            {isReadOnly ? (
              <div className="text-center py-2.5 px-4 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 select-none">
                This project is submitted or locked and is read-only.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-1">
                    {pendingImages.map((img, i) => {
                      const isPdf = img.startsWith('data:application/pdf');
                      const isAudio = img.startsWith('data:audio/');
                      return (
                        <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-slate-50 p-2">
                          {isPdf ? (
                            <div className="w-14 h-14 flex flex-col items-center justify-center text-red-600 font-bold p-1">
                              <FileText className="w-6 h-6 mb-1" />
                              <span className="text-[9px] uppercase font-black">PDF</span>
                            </div>
                          ) : isAudio ? (
                            <div className="w-28 h-14 flex flex-col items-center justify-center text-indigo-600 font-bold px-2 py-1">
                              <Volume2 className="w-5 h-5 mb-0.5 text-indigo-600 animate-pulse" />
                              <span className="text-[9px] uppercase font-black tracking-wider text-slate-700">Audio Track</span>
                              <audio src={img} className="hidden" />
                            </div>
                          ) : (
                            <img src={img} alt="upload" className="w-14 h-14 object-cover rounded-lg" />
                          )}
                          <button 
                            onClick={() => setPendingImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 bg-slate-900/60 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-end gap-2 relative">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    multiple
                    accept="image/*,application/pdf,audio/*,.m4a,.mp3,.wav,.ogg,.aac,.webm,.flac,.m4v"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRecording}
                    className="p-2.5 md:p-3 bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors shrink-0 cursor-pointer"
                    title="Attach images, PDFs, or audio (.m4a, .mp3, .wav)"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Live in-app Microphone Button */}
                  {!isRecording && (
                    <button
                      onClick={startRecording}
                      disabled={isGeneratingReport}
                      className="p-2.5 md:p-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-40 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs group"
                      title="Record Voice Memo (speak in Danish or English)"
                    >
                      <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                  )}

                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 animate-pulse">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                        <span className="text-red-700 font-mono font-bold text-sm">
                          Recording {formatDuration(recordingDuration)}
                        </span>
                        <span className="text-xs text-red-500 hidden sm:inline">(speak now)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => stopRecording(false)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          title="Cancel recording"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => stopRecording(true)}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Stop and send voice recording to AI"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Voice</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <textarea
                        ref={textareaRef}
                        className="flex-1 border border-slate-300 rounded-xl p-2.5 md:p-3 text-base md:text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed"
                        placeholder="Describe project, speak via mic, or ask questions…"
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          // Return/Enter creates a newline (use the arrow button to send)
                        }}
                        onFocus={() => {
                          // Scroll til bunden efter et kort stykke tid for at gøre plads til tastaturet
                          setTimeout(() => {
                            if (scrollRef.current) {
                              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                            }
                          }, 150);
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={isGeneratingReport || (!input.trim() && pendingImages.length === 0)}
                        className="p-2.5 md:p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── UNDERKOMPONENT: VISNING AF DET GULE FORSLAGSKORT ──────────────────────────
interface ProposedChangesCardProps {
  proposal: any;
  currentProject: ProjectState;
  setCurrentProject: (p: ProjectState) => void;
  updateProjectField: (p: ProjectState, field: keyof ProjectState, value: any, comment: string) => Promise<void>;
  saveProject?: (status?: ProjectState['status'], projectToSave?: ProjectState) => Promise<ProjectState | null>;
  activePartIndex: number;
  isReadOnly?: boolean;
  isLatest?: boolean; // Kun det nyeste forslag kan godkendes.
}

function ProposedChangesCard({ proposal, currentProject, setCurrentProject, updateProjectField, saveProject, activePartIndex, isReadOnly = false, isLatest = false }: ProposedChangesCardProps) {
  const [editedProposal, setEditedProposal] = useState(proposal); // Gør det muligt for brugeren at redigere i AI'ens forslag før lagring
  const [isApplied, setIsApplied] = useState(() => isProposalAlreadyApplied(proposal, currentProject, activePartIndex)); // Tjekker om ændringerne allerede er lagt ind
  const [isSaving, setIsSaving] = useState(false); // Loading state under lagring
  const wasManuallyApplied = useRef(false); // Holder styr på, om brugeren manuelt klikkede på "Apply" i denne session

  // Synkroniserer knap-visningen i realtid, hvis databasen ændrer sig
  useEffect(() => {
    const alreadyApplied = isProposalAlreadyApplied(proposal, currentProject, activePartIndex);
    if (alreadyApplied) {
      setIsApplied(true);
    } else if (!wasManuallyApplied.current) {
      setIsApplied(false);
    }
  }, [currentProject, proposal, activePartIndex]);

  // Håndterer godkendelse og lagring af de foreslåede feltændringer til Firestore
  const handleApply = async () => {
    setIsSaving(true);
    try {
      const updatedProject: ProjectState = { ...currentProject };

      // Læg de foreslåede generalResponses (stamdata) oveni projektet
      if (editedProposal.generalResponses) {
        updatedProject.generalResponses = { ...updatedProject.generalResponses, ...editedProposal.generalResponses };
      }
      // Læg de foreslåede emnedata (parts) oveni projektet
      if (editedProposal.parts && Array.isArray(editedProposal.parts)) {
        const newParts = updatedProject.parts.map(p => ({ ...p, responses: { ...p.responses } }));
        const isSinglePartProposal = editedProposal.parts.length === 1;

        editedProposal.parts.forEach((aiPart: any, idx: number) => {
          const targetIdx = (isSinglePartProposal && activePartIndex > 0) ? activePartIndex : idx;
          if (!newParts[targetIdx]) newParts[targetIdx] = { responses: {}, images: [] };
          newParts[targetIdx].responses = { ...newParts[targetIdx].responses, ...(aiPart.responses || {}) };
        });
        updatedProject.parts = newParts;
      }

      // Opdater den lokale React-tilstand med det samme
      setCurrentProject(updatedProject);

      // Gem ændringerne permanent i Firestore databasen
      if (saveProject) {
        const saved = await saveProject(updatedProject.status || 'draft', updatedProject);
        if (saved && saved.id) updatedProject.id = saved.id;
      } else if (updatedProject.id) {
        if (editedProposal.generalResponses) {
          await updateProjectField(updatedProject, 'generalResponses', updatedProject.generalResponses, 'AI auto-fill: general fields');
        }
        if (editedProposal.parts) {
          const partsToSave = updatedProject.parts.map(p => ({
            responses: p.responses,
            images: p.images ?? [],
            cadFile: p.cadFile ?? null,
          }));
          await updateProjectField(updatedProject, 'parts', partsToSave, 'AI auto-fill: part fields');
        }
      }

      wasManuallyApplied.current = true;
      setIsApplied(true);
    } catch (err) {
      console.error('AI apply failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Hvis forslaget ikke er det nyeste i chatten, skjuler vi knappen og viser "Superseded"
  if (!isLatest) {
    return (
      <div className="text-xs text-slate-400 italic px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-1.5">
        <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        Superseded by a newer suggestion.
      </div>
    );
  }

  // Hvis forslaget allerede er anvendt og gemt
  if (isApplied) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2 shadow-xs text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" />
        Changes applied and saved to database.
      </div>
    );
  }

  // Handle special image assignment proposal
  if (proposal.suggestedAction === 'assign_image') {
    const targetIdx = proposal.targetPart !== undefined ? proposal.targetPart : activePartIndex;
    const userMsgsWithImages = currentProject.chatHistory?.filter(m => m.role === 'user' && m.images && m.images.length > 0);
    const lastImages = (userMsgsWithImages?.[userMsgsWithImages.length - 1]?.images || []).filter(img => !img.startsWith('data:application/pdf'));
    
    if (lastImages.length > 0) {
      const isProjectTarget = proposal.targetPart === 'project';
      
      return (
        <div className={`bg-indigo-50 border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-sm transition-all`}>
           <div className={`flex items-center justify-between px-4 py-3 border-b bg-indigo-100 border-indigo-200`}>
             <h3 className={`font-bold text-sm flex items-center gap-2 text-indigo-900`}>
               <Paperclip className="w-4 h-4" />
               Assign image(s) to {isProjectTarget ? 'Project' : `Part ${targetIdx + 1}`}
             </h3>
             <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const updatedProject = { ...currentProject };
                    
                    if (isProjectTarget) {
                      updatedProject.generalImages = [...(updatedProject.generalImages || []), ...lastImages];
                    } else {
                      const newParts = updatedProject.parts.map(p => ({ ...p, images: [...(p.images || [])] }));
                      if (!newParts[targetIdx]) newParts[targetIdx] = { responses: {}, images: [] };
                      newParts[targetIdx].images.push(...lastImages);
                      updatedProject.parts = newParts;
                    }
                    
                    setCurrentProject(updatedProject);
                    
                    if (saveProject) {
                       const saved = await saveProject(updatedProject.status || 'draft', updatedProject);
                       if (saved) updatedProject.id = saved.id;
                    } else if (updatedProject.id) {
                       if (isProjectTarget) {
                         await updateProjectField(updatedProject, 'generalImages', updatedProject.generalImages, 'AI auto-fill: assign general images');
                       } else {
                         const partsToSave = updatedProject.parts.map(p => ({
                           responses: p.responses,
                           images: p.images ?? [],
                           cadFile: p.cadFile ?? null,
                         }));
                         await updateProjectField(updatedProject, 'parts', partsToSave, 'AI auto-fill: assign images');
                       }
                    }
                    wasManuallyApplied.current = true;
                    setIsApplied(true);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || isReadOnly}
                className="text-xs px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-sm"
             >
                {isSaving ? 'Saving...' : 'Approve'}
             </button>
           </div>
           <div className="p-4 flex gap-2 overflow-x-auto">
             {lastImages.map((img: string, i: number) => (
               <img key={i} src={img} className="h-20 w-20 object-cover rounded-lg border border-slate-200 shadow-sm" alt="pending assignment" />
             ))}
           </div>
        </div>
      );
    }
  }

  if (proposal.suggestedAction === 'copy_image' || proposal.suggestedAction === 'move_image') {
    const fromIdx = proposal.fromPart;
    const toIdx = proposal.toPart;
    const imgIdx = proposal.imageIndex !== undefined ? proposal.imageIndex : 0;
    const isMove = proposal.suggestedAction === 'move_image';
    
    const sourceImages = currentProject.parts?.[fromIdx]?.images || [];
    const imageToHandle = sourceImages[imgIdx];
    
    if (imageToHandle && fromIdx !== undefined && toIdx !== undefined) {
      return (
        <div className={`bg-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden shadow-sm transition-all`}>
           <div className={`flex items-center justify-between px-4 py-3 border-b bg-blue-100 border-blue-200`}>
             <h3 className={`font-bold text-sm flex items-center gap-2 text-blue-900`}>
               <Paperclip className="w-4 h-4" />
               {isMove ? 'Move' : 'Copy'} image from Part {fromIdx + 1} to Part {toIdx + 1}
             </h3>
             <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const updatedProject = { ...currentProject };
                    const newParts = updatedProject.parts.map(p => ({ ...p, images: [...(p.images || [])] }));
                    if (!newParts[toIdx]) newParts[toIdx] = { responses: {}, images: [] };
                    
                    newParts[toIdx].images.push(imageToHandle);
                    if (isMove) {
                      newParts[fromIdx].images.splice(imgIdx, 1);
                    }
                    
                    updatedProject.parts = newParts;
                    setCurrentProject(updatedProject);
                    
                    if (saveProject) {
                       const saved = await saveProject(updatedProject.status || 'draft', updatedProject);
                       if (saved) updatedProject.id = saved.id;
                    } else if (updatedProject.id) {
                       const partsToSave = updatedProject.parts.map(p => ({
                         responses: p.responses,
                         images: p.images ?? [],
                         cadFile: p.cadFile ?? null,
                       }));
                       await updateProjectField(updatedProject, 'parts', partsToSave, `AI auto-fill: ${isMove ? 'move' : 'copy'} image`);
                    }
                    wasManuallyApplied.current = true;
                    setIsApplied(true);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || isReadOnly}
                className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm"
             >
                {isSaving ? 'Saving...' : 'Approve'}
             </button>
           </div>
           <div className="p-4 flex gap-2 overflow-x-auto">
             <img src={imageToHandle} alt="preview" className="h-16 w-16 object-cover rounded shadow-sm border border-black/10" />
           </div>
        </div>
      );
    }
  }

  if (proposal.suggestedAction === 'delete_image') {
    const targetIdx = proposal.targetPart !== undefined ? proposal.targetPart : activePartIndex;
    const imgIdx = proposal.imageIndex !== undefined ? proposal.imageIndex : 0;
    const sourceImages = currentProject.parts?.[targetIdx]?.images || [];
    const imageToDelete = sourceImages[imgIdx];
    
    if (imageToDelete) {
      return (
        <div className={`bg-rose-50 border-2 border-rose-200 rounded-2xl overflow-hidden shadow-sm transition-all`}>
           <div className={`flex items-center justify-between px-4 py-3 border-b bg-rose-100 border-rose-200`}>
             <h3 className={`font-bold text-sm flex items-center gap-2 text-rose-900`}>
               <X className="w-4 h-4" />
               Delete image from Part {targetIdx + 1}
             </h3>
             <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const updatedProject = { ...currentProject };
                    const newParts = updatedProject.parts.map(p => ({ ...p, images: [...(p.images || [])] }));
                    newParts[targetIdx].images.splice(imgIdx, 1);
                    updatedProject.parts = newParts;
                    setCurrentProject(updatedProject);
                    
                    if (saveProject) {
                       const saved = await saveProject(updatedProject.status || 'draft', updatedProject);
                       if (saved) updatedProject.id = saved.id;
                    } else if (updatedProject.id) {
                       const partsToSave = updatedProject.parts.map(p => ({
                         responses: p.responses,
                         images: p.images ?? [],
                         cadFile: p.cadFile ?? null,
                       }));
                       await updateProjectField(updatedProject, 'parts', partsToSave, 'AI auto-fill: delete image');
                    }
                    wasManuallyApplied.current = true;
                    setIsApplied(true);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || isReadOnly}
                className="text-xs px-4 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow-sm"
             >
                {isSaving ? 'Saving...' : 'Approve'}
             </button>
           </div>
           <div className="p-4 flex gap-2 overflow-x-auto">
             <img src={imageToDelete} alt="preview" className="h-16 w-16 object-cover rounded shadow-sm border border-rose-500/50 opacity-50" />
           </div>
        </div>
      );
    }
  }

  // Opbyg rækkerne af forslåede ændringer til den sammenlignende tabel (Før vs. Efter)
  const allRows: { key: string; label: string; old: string; newVal: string; isConflict: boolean; onChange: (v: string) => void }[] = [];

  // Tilføj stamdata-rækker
  if (editedProposal.generalResponses) {
    Object.entries(editedProposal.generalResponses).forEach(([key, value]) => {
      const oldVal = String(currentProject.generalResponses?.[key] ?? '');
      const isConflict = oldVal.trim() !== '' && !areValuesEqual(oldVal, value);
      allRows.push({
        key: `gen-${key}`,
        label: `${key} · ${FIELD_LABEL_MAP[key] || key}`,
        old: oldVal,
        newVal: String(value),
        isConflict,
        onChange: (v) => setEditedProposal({
          ...editedProposal,
          generalResponses: { ...editedProposal.generalResponses, [key]: v }
        }),
      });
    });
  }
  // Tilføj emne-rækker
  if (editedProposal.parts && Array.isArray(editedProposal.parts)) {
    const isSinglePartProposal = editedProposal.parts.length === 1;
    editedProposal.parts.forEach((part: any, pIdx: number) => {
      const targetIdx = (isSinglePartProposal && activePartIndex > 0) ? activePartIndex : pIdx;
      if (part.responses) {
        Object.entries(part.responses).forEach(([key, value]) => {
          const oldVal = String(currentProject.parts?.[targetIdx]?.responses?.[key] ?? '');
          const isConflict = oldVal.trim() !== '' && !areValuesEqual(oldVal, value);
          allRows.push({
            key: `part${targetIdx}-${key}`,
            label: `Part ${targetIdx + 1} – ${key} · ${FIELD_LABEL_MAP[key] || key}`,
            old: oldVal,
            newVal: String(value),
            isConflict,
            onChange: (v) => {
              const nextParts = editedProposal.parts.map((p: any, i: number) =>
                i === pIdx ? { ...p, responses: { ...p.responses, [key]: v } } : p
              );
              setEditedProposal({ ...editedProposal, parts: nextParts });
            },
          });
        });
      }
    });
  }

  // Filtrer rækkerne så vi KUN viser felter, hvor den foreslåede værdi er anderledes end den nuværende
  const rows = allRows.filter(row => !areValuesEqual(row.old, row.newVal));

  return (
    <div className={`bg-amber-50 border-2 rounded-2xl overflow-hidden shadow-sm transition-all ${isReadOnly ? 'border-slate-200 bg-slate-50/50' : 'border-amber-300'}`}>
      {/* Topbjælke for forslagskortet med "Apply Changes" knappen */}
      <div className={`flex items-center justify-between px-4 py-3 border-b transition-all ${isReadOnly ? 'bg-slate-100 border-slate-200' : 'bg-amber-100 border-amber-200'}`}>
        <h3 className={`font-bold text-sm flex items-center gap-2 ${isReadOnly ? 'text-slate-600' : 'text-amber-900'}`}>
          <Edit2 className="w-4 h-4" />
          {isReadOnly 
            ? `Proposed updates for ${rows.length} field${rows.length !== 1 ? 's' : ''} (Read-Only)`
            : `Ready to fill in ${rows.length} field${rows.length !== 1 ? 's' : ''}`
          }
        </h3>
        <button
          onClick={handleApply}
          disabled={isSaving || isReadOnly}
          className={`text-xs px-4 py-1.5 rounded-lg transition-colors font-bold ${
            isReadOnly 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
          }`}
        >
          {isSaving ? 'Saving…' : 'Apply Changes'}
        </button>
      </div>

      {/* Listen af sammenligninger (Før (overstreget og gråt) vs. Efter (gult og redigerbart)) */}
      <div className="p-4 space-y-3">
        {rows.map(row => (
          <div key={row.key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${isReadOnly ? 'text-slate-500' : 'text-amber-700'}`}>
                {row.label}
              </label>
              {row.isConflict && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ⚠️ Overwrites manual value
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Gammel værdi */}
              <div className="bg-white border border-slate-200 text-slate-400 p-2 rounded-lg text-xs line-through opacity-70 min-h-[32px] break-words whitespace-pre-wrap">
                {row.old || <span className="not-italic italic opacity-50">Empty</span>}
              </div>
              {/* Ny foreslået værdi (kan redigeres direkte i chatten inden godkendelse!) */}
              <textarea
                className={`border bg-white p-2 rounded-lg text-base md:text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none min-h-[32px] ${
                  isReadOnly 
                    ? 'border-slate-200 bg-slate-50/50 text-slate-400 cursor-not-allowed' 
                    : row.isConflict 
                      ? 'border-rose-300 bg-rose-50/30 text-slate-800 focus:border-rose-400' 
                      : 'border-amber-300 text-slate-800'
                }`}
                rows={2}
                value={row.newVal}
                onChange={(e) => !isReadOnly && row.onChange(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Check, Edit2, CheckCircle2, HelpCircle } from 'lucide-react';
import { ProjectState } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';

// ─── Field label lookup map ───────────────────────────────────────────────────
const FIELD_LABEL_MAP: Record<string, string> = {};
[...GENERAL_STEPS, ...PART_STEPS].forEach(step => {
  step.questions.forEach(q => { FIELD_LABEL_MAP[q.id] = q.label; });
});

// ─── Props ────────────────────────────────────────────────────────────────────
interface AIAssistantTabProps {
  currentProject: ProjectState;
  setCurrentProject: (p: ProjectState) => void;
  sendMessageToAssistant: (msg: string) => Promise<void>;
  isGeneratingReport: boolean;
  updateProjectField: (p: ProjectState, field: keyof ProjectState, value: any, comment: string) => Promise<void>;
  saveProject?: (status?: ProjectState['status'], projectToSave?: ProjectState) => Promise<ProjectState | null>;
  activePartIndex: number;
}

// ─── Parse structured AI response ────────────────────────────────────────────
interface ParsedAIResponse {
  facts: string[];       // bullet points from ---FACTS--- section
  questions: string[];   // bullet points from ---QUESTIONS--- section
  prose: string;         // any text outside the structured sections (fallback)
  jsonProposal: any;     // parsed JSON block if present
}

function parseAIResponse(text: string): ParsedAIResponse {
  // Extract JSON block first, then strip it
  let jsonProposal: any = null;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch) {
    try { jsonProposal = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
  }
  const stripped = text.replace(/```(?:json)?\s*[\s\S]*?\s*```/i, '').trim();

  // Extract FACTS section
  const factsMatch = stripped.match(/---FACTS---\s*([\s\S]*?)(?=---QUESTIONS---|---END---|$)/i);
  const questionsMatch = stripped.match(/---QUESTIONS---\s*([\s\S]*?)(?=---END---|---FACTS---|$)/i);

  const parseBullets = (raw: string): string[] =>
    raw
      .split('\n')
      .map(l => l.replace(/^(?:[•\-*]|\d+[.)]\s+|\d+:\s+|q\d+[:.)]\s*)\s*/i, '').trim())
      .filter(l => l.length > 0);

  const facts = factsMatch ? parseBullets(factsMatch[1]) : [];
  const questions = questionsMatch ? parseBullets(questionsMatch[1]) : [];

  // Anything before the first marker is treated as prose (rare, but graceful fallback)
  const prose = stripped.split(/---FACTS---|---QUESTIONS---|---END---/i)[0].trim();

  return { facts, questions, prose, jsonProposal };
}

// ─── Main component ──────────────────────────────────────────────────────────
export function AIAssistantTab({
  currentProject,
  setCurrentProject,
  sendMessageToAssistant,
  isGeneratingReport,
  updateProjectField,
  saveProject,
  activePartIndex,
}: AIAssistantTabProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentProject.chatHistory]);

  const handleSend = () => {
    if (!input.trim() || isGeneratingReport) return;
    sendMessageToAssistant(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-5 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          AI Auto-fill Assistant
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Describe your project freely. The AI extracts facts and asks for what's missing.
        </p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5" ref={scrollRef}>
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

          if (isUser) {
            return (
              <div key={idx} className="flex justify-end">
                <div className="flex items-start gap-2.5 max-w-[85%] flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          }

          // AI message — parse structured response
          const parsed = parseAIResponse(msg.text);

          return (
            <div key={idx} className="flex flex-col items-start gap-3">
              {/* Avatar row */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Assistant</span>
              </div>

              <div className="ml-9 space-y-3 w-[90%]">
                {/* Fallback prose (unstructured AI response) */}
                {parsed.prose && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 text-sm text-slate-700 leading-relaxed shadow-xs">
                    {parsed.prose}
                  </div>
                )}

                {/* FACTS card – green */}
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

                {/* QUESTIONS card – indigo */}
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

                {/* Proposed-changes card */}
                {parsed.jsonProposal && (
                  <ProposedChangesCard
                    proposal={parsed.jsonProposal}
                    currentProject={currentProject}
                    setCurrentProject={setCurrentProject}
                    updateProjectField={updateProjectField}
                    saveProject={saveProject}
                    activePartIndex={activePartIndex}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isGeneratingReport && (
          <div className="flex items-start gap-2.5">
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

      {/* Input bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed"
            placeholder="Describe your project… (Enter to send, Shift+Enter for new line)"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isGeneratingReport || !input.trim()}
            className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Proposed-changes card ────────────────────────────────────────────────────
interface ProposedChangesCardProps {
  proposal: any;
  currentProject: ProjectState;
  setCurrentProject: (p: ProjectState) => void;
  updateProjectField: (p: ProjectState, field: keyof ProjectState, value: any, comment: string) => Promise<void>;
  saveProject?: (status?: ProjectState['status'], projectToSave?: ProjectState) => Promise<ProjectState | null>;
  activePartIndex: number;
}

function ProposedChangesCard({ proposal, currentProject, setCurrentProject, updateProjectField, saveProject, activePartIndex }: ProposedChangesCardProps) {
  const [editedProposal, setEditedProposal] = useState(proposal);
  const [isApplied, setIsApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleApply = async () => {
    setIsSaving(true);
    try {
      const updatedProject: ProjectState = { ...currentProject };

      if (editedProposal.generalResponses) {
        updatedProject.generalResponses = { ...updatedProject.generalResponses, ...editedProposal.generalResponses };
      }
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

      setCurrentProject(updatedProject);

      if (updatedProject.id) {
        if (saveProject) {
          await saveProject(updatedProject.status || 'draft', updatedProject);
        } else {
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
      }

      setIsApplied(true);
    } catch (err) {
      console.error('AI apply failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isApplied) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2 shadow-xs text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" />
        Changes applied and saved to database.
      </div>
    );
  }

  // Build rows from proposal
  const rows: { key: string; label: string; old: string; newVal: string; onChange: (v: string) => void }[] = [];

  if (editedProposal.generalResponses) {
    Object.entries(editedProposal.generalResponses).forEach(([key, value]) => {
      rows.push({
        key: `gen-${key}`,
        label: `${key} · ${FIELD_LABEL_MAP[key] || key}`,
        old: String(currentProject.generalResponses[key] ?? ''),
        newVal: String(value),
        onChange: (v) => setEditedProposal({
          ...editedProposal,
          generalResponses: { ...editedProposal.generalResponses, [key]: v }
        }),
      });
    });
  }
  if (editedProposal.parts && Array.isArray(editedProposal.parts)) {
    const isSinglePartProposal = editedProposal.parts.length === 1;
    editedProposal.parts.forEach((part: any, pIdx: number) => {
      const targetIdx = (isSinglePartProposal && activePartIndex > 0) ? activePartIndex : pIdx;
      if (part.responses) {
        Object.entries(part.responses).forEach(([key, value]) => {
          rows.push({
            key: `part${targetIdx}-${key}`,
            label: `Part ${targetIdx + 1} – ${key} · ${FIELD_LABEL_MAP[key] || key}`,
            old: String(currentProject.parts[targetIdx]?.responses[key] ?? ''),
            newVal: String(value),
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

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-100 border-b border-amber-200">
        <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          Ready to fill in {rows.length} field{rows.length !== 1 ? 's' : ''}
        </h3>
        <button
          onClick={handleApply}
          disabled={isSaving}
          className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-bold"
        >
          {isSaving ? 'Saving…' : 'Apply Changes'}
        </button>
      </div>
      <div className="p-4 space-y-3">
        {rows.map(row => (
          <div key={row.key}>
            <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1.5">
              {row.label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-slate-200 text-slate-400 p-2 rounded-lg text-xs line-through opacity-70 min-h-[32px] flex items-center">
                {row.old || <span className="not-italic italic opacity-50">Empty</span>}
              </div>
              <input
                className="border border-amber-300 bg-white p-2 rounded-lg text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                value={row.newVal}
                onChange={(e) => row.onChange(e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

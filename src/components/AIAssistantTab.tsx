import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Check, Edit2, CheckCircle2, HelpCircle } from 'lucide-react';
import { ProjectState } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';

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
  sendMessageToAssistant: (msg: string) => Promise<void>; // Funktion til at sende en besked til AI-assistenten
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
    try { jsonProposal = JSON.parse(jsonMatch[1]); } catch { /* ignorer parse-fejl */ }
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
  const scrollRef = useRef<HTMLDivElement>(null); // Reference til chat-vinduet til styring af scrollbar

  // Scroll automatisk til bunden af chatten, hver gang historikken ændrer sig
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentProject.chatHistory]);

  // Håndterer afsendelse af chat-beskeder
  const handleSend = () => {
    if (!input.trim() || isGeneratingReport) return;
    sendMessageToAssistant(input);
    setInput('');
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
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top bjælke med titel og ikon */}
      <div className="p-3 md:p-5 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          AI Auto-fill Assistant
        </h2>
        <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
          Describe your project freely. The AI extracts facts and asks for what's missing.
        </p>
      </div>

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

        {/* Loop igennem chat-historikken */}
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
                    {msg.text}
                  </div>
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
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 text-sm text-slate-700 leading-relaxed shadow-xs">
                    {parsed.prose}
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

      {/* Skrivefelt og send-knap i bunden */}
      <div className="p-2.5 md:p-4 bg-white border-t border-slate-200 shrink-0 animate-fadeIn">
        {isReadOnly ? (
          <div className="text-center py-2 px-3 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500">
            This project is submitted or locked and is read-only.
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 border border-slate-300 rounded-xl p-2.5 md:p-3 text-base md:text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed"
              placeholder="Describe your project…"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter sender beskeden, mens Shift+Enter laver et linjeskift
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
              disabled={isGeneratingReport || !input.trim()}
              className="p-2.5 md:p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
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

  // Opbyg rækkerne af forslåede ændringer til den sammenlignende tabel (Før vs. Efter)
  const allRows: { key: string; label: string; old: string; newVal: string; onChange: (v: string) => void }[] = [];

  // Tilføj stamdata-rækker
  if (editedProposal.generalResponses) {
    Object.entries(editedProposal.generalResponses).forEach(([key, value]) => {
      allRows.push({
        key: `gen-${key}`,
        label: `${key} · ${FIELD_LABEL_MAP[key] || key}`,
        old: String(currentProject.generalResponses?.[key] ?? ''),
        newVal: String(value),
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
          allRows.push({
            key: `part${targetIdx}-${key}`,
            label: `Part ${targetIdx + 1} – ${key} · ${FIELD_LABEL_MAP[key] || key}`,
            old: String(currentProject.parts?.[targetIdx]?.responses?.[key] ?? ''),
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
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isReadOnly ? 'text-slate-500' : 'text-amber-700'}`}>
              {row.label}
            </label>
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
